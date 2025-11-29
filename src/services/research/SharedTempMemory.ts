// Shared Temporary Memory - SQLite-based ephemeral storage for agent context
// Separate from main cache DB, optimized for short-term agent memory

import * as SQLite from 'expo-sqlite';

interface MemoryEntry {
  key: string;
  value: string;
  type: 'thought' | 'observation' | 'url' | 'data';
  agentId: string;
  timestamp: number;
}

export class SharedTempMemory {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'agent_temp_memory.db';

  /**
   * Initialize temp memory database
   */
  static async init(): Promise<void> {
    if (this.db) return;

    try {
      console.log('🧠 [TempMemory] Initializing...');
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);

      // Simple schema for fast writes
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS memory (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          type TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_agent_id ON memory(agent_id);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON memory(timestamp);
      `);

      console.log('✅ [TempMemory] Initialized');
    } catch (error) {
      console.error('❌ [TempMemory] Init error:', error);
    }
  }

  /**
   * Store memory entry
   */
  static async set(
    agentId: string,
    key: string,
    value: any,
    type: MemoryEntry['type'] = 'data'
  ): Promise<void> {
    if (!this.db) await this.init();

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    
    await this.db!.runAsync(
      'INSERT OR REPLACE INTO memory (key, value, type, agent_id, timestamp) VALUES (?, ?, ?, ?, ?)',
      [key, valueStr, type, agentId, Date.now()]
    );
  }

  /**
   * Get memory entry
   */
  static async get(agentId: string, key: string): Promise<string | null> {
    if (!this.db) await this.init();

    const result = await this.db!.getFirstAsync<{ value: string }>(
      'SELECT value FROM memory WHERE agent_id = ? AND key = ?',
      [agentId, key]
    );

    return result?.value || null;
  }

  /**
   * Get all entries for agent
   */
  static async getAll(agentId: string, type?: MemoryEntry['type']): Promise<MemoryEntry[]> {
    if (!this.db) await this.init();

    const query = type
      ? 'SELECT * FROM memory WHERE agent_id = ? AND type = ? ORDER BY timestamp DESC'
      : 'SELECT * FROM memory WHERE agent_id = ? ORDER BY timestamp DESC';
    
    const params = type ? [agentId, type] : [agentId];
    
    const results = await this.db!.getAllAsync<any>(query, params);
    
    return results.map(r => ({
      key: r.key,
      value: r.value,
      type: r.type,
      agentId: r.agent_id,
      timestamp: r.timestamp
    }));
  }

  /**
   * Get recent context (last N entries)
   */
  static async getRecentContext(agentId: string, limit: number = 10): Promise<string[]> {
    if (!this.db) await this.init();

    const results = await this.db!.getAllAsync<{ value: string; type: string }>(
      'SELECT value, type FROM memory WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?',
      [agentId, limit]
    );

    return results.map(r => `[${r.type}] ${r.value}`);
  }

  /**
   * Clear agent memory
   */
  static async clear(agentId: string): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.runAsync('DELETE FROM memory WHERE agent_id = ?', [agentId]);
    console.log(`🧹 [TempMemory] Cleared memory for agent ${agentId}`);
  }

  /**
   * Clear old entries (older than 1 hour)
   */
  static async cleanup(): Promise<void> {
    if (!this.db) await this.init();

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    const result = await this.db!.runAsync(
      'DELETE FROM memory WHERE timestamp < ?',
      [oneHourAgo]
    );

    console.log(`🧹 [TempMemory] Cleaned up ${result.changes} old entries`);
  }

  /**
   * Get memory stats
   */
  static async getStats(): Promise<{ totalEntries: number; agents: number }> {
    if (!this.db) await this.init();

    const total = await this.db!.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM memory'
    );

    const agents = await this.db!.getFirstAsync<{ count: number }>(
      'SELECT COUNT(DISTINCT agent_id) as count FROM memory'
    );

    return {
      totalEntries: total?.count || 0,
      agents: agents?.count || 0
    };
  }
}

/**
 * Mock version for Node.js testing
 */
export class MockTempMemory {
  private static memory = new Map<string, Map<string, MemoryEntry>>();

  static async init(): Promise<void> {
    console.log('🧠 [MockTempMemory] Using in-memory storage');
  }

  static async set(
    agentId: string,
    key: string,
    value: any,
    type: MemoryEntry['type'] = 'data'
  ): Promise<void> {
    if (!this.memory.has(agentId)) {
      this.memory.set(agentId, new Map());
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    
    this.memory.get(agentId)!.set(key, {
      key,
      value: valueStr,
      type,
      agentId,
      timestamp: Date.now()
    });
  }

  static async get(agentId: string, key: string): Promise<string | null> {
    return this.memory.get(agentId)?.get(key)?.value || null;
  }

  static async getAll(agentId: string, type?: MemoryEntry['type']): Promise<MemoryEntry[]> {
    const agentMemory = this.memory.get(agentId);
    if (!agentMemory) return [];

    const entries = Array.from(agentMemory.values());
    return type ? entries.filter(e => e.type === type) : entries;
  }

  static async getRecentContext(agentId: string, limit: number = 10): Promise<string[]> {
    const entries = await this.getAll(agentId);
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(e => `[${e.type}] ${e.value}`);
  }

  static async clear(agentId: string): Promise<void> {
    this.memory.delete(agentId);
  }

  static async cleanup(): Promise<void> {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [agentId, entries] of this.memory.entries()) {
      for (const [key, entry] of entries.entries()) {
        if (entry.timestamp < oneHourAgo) {
          entries.delete(key);
        }
      }
      if (entries.size === 0) {
        this.memory.delete(agentId);
      }
    }
  }

  static async getStats(): Promise<{ totalEntries: number; agents: number }> {
    let total = 0;
    for (const entries of this.memory.values()) {
      total += entries.size;
    }
    return {
      totalEntries: total,
      agents: this.memory.size
    };
  }
}

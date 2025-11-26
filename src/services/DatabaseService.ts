import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('adaptui.db');

      // Create tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS queries (
          id TEXT PRIMARY KEY,
          query TEXT NOT NULL,
          category TEXT NOT NULL,
          response TEXT,
          timestamp INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          data TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0
        );
      `);

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async saveQuery(query: string, category: string, response: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'INSERT INTO queries (id, query, category, response, timestamp) VALUES (?, ?, ?, ?, ?)',
        [
          `query-${Date.now()}`,
          query,
          category,
          JSON.stringify(response),
          Date.now(),
        ]
      );
    } catch (error) {
      console.error('Failed to save query:', error);
    }
  }

  async getRecentQueries(limit: number = 10): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM queries ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
      return result;
    } catch (error) {
      console.error('Failed to get recent queries:', error);
      return [];
    }
  }

  async getUserPreference(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync(
        'SELECT value FROM preferences WHERE key = ?',
        [key]
      );
      
      if (result && typeof result === 'object' && 'value' in result) {
        try {
          return JSON.parse(result.value as string);
        } catch {
          return result.value;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get user preference:', error);
      return null;
    }
  }

  async setUserPreference(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      await this.db.runAsync(
        'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
        [key, valueStr]
      );
    } catch (error) {
      console.error('Failed to set user preference:', error);
    }
  }

  async saveJob(job: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'INSERT INTO jobs (id, type, status, data, created_at, updated_at, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          job.id,
          job.type,
          job.status,
          JSON.stringify(job.data),
          job.createdAt.getTime(),
          job.updatedAt.getTime(),
          job.retryCount,
        ]
      );
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?',
        [status, Date.now(), jobId]
      );
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  }

  async getActiveJobs(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        "SELECT * FROM jobs WHERE status IN ('pending', 'running') ORDER BY created_at DESC"
      );
      return result;
    } catch (error) {
      console.error('Failed to get active jobs:', error);
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM queries');
      console.log('Query history cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
}

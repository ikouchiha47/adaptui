// Cache Service - Store queries and results using SQLite

import * as SQLite from 'expo-sqlite';

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize database with WAL mode and performance optimizations
   */
  static async init(): Promise<void> {
    try {
      console.log('💾 [CacheService] Initializing SQLite...');
      this.db = await SQLite.openDatabaseAsync('adaptui_cache.db');
      
      // Enable WAL mode for better concurrency and performance
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA cache_size = -64000;
        PRAGMA temp_store = MEMORY;
        PRAGMA mmap_size = 30000000000;
        PRAGMA page_size = 4096;
      `);
      
      // Create tables if not exists
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          namespace TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_namespace ON cache(namespace);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp);
        
        CREATE TABLE IF NOT EXISTS place_summaries (
          place_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          summary TEXT NOT NULL,
          rating REAL,
          user_rating_count INTEGER,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS opening_hours (
          place_id TEXT PRIMARY KEY,
          hours TEXT NOT NULL,
          current_status TEXT,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL
        );
      `);
      
      console.log('✅ [CacheService] SQLite initialized with WAL mode');
    } catch (error) {
      console.error('❌ [CacheService] Init error:', error);
    }
  }

  /**
   * Generate cache key from query
   */
  static generateKey(namespace: string, query: string): string {
    const hash = this.hashString(query);
    return `${namespace}_${hash}`;
  }

  /**
   * Simple hash function
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get from cache
   */
  static async get<T>(namespace: string, query: string): Promise<T | null> {
    try {
      if (!this.db) await this.init();
      
      const key = this.generateKey(namespace, query);
      console.log(`💾 [CacheService] Getting from cache: ${key}`);

      const result = await this.db!.getFirstAsync<any>(
        'SELECT data, timestamp, ttl FROM cache WHERE key = ?',
        [key]
      );

      if (!result) {
        console.log(`⚠️ [CacheService] Cache miss: ${key}`);
        return null;
      }

      const now = Date.now();
      if (now - result.timestamp > result.ttl) {
        console.log(`⏰ [CacheService] Cache expired: ${key}`);
        await this.db!.runAsync('DELETE FROM cache WHERE key = ?', [key]);
        return null;
      }

      console.log(`✅ [CacheService] Cache hit: ${key}`);
      return JSON.parse(result.data);
    } catch (error) {
      console.error(`❌ [CacheService] Get error:`, error);
      return null;
    }
  }

  /**
   * Set in cache
   */
  static async set<T>(
    namespace: string,
    query: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      if (!this.db) await this.init();
      
      const key = this.generateKey(namespace, query);
      console.log(`💾 [CacheService] Setting cache: ${key}`);

      await this.db!.runAsync(
        'INSERT OR REPLACE INTO cache (key, namespace, data, timestamp, ttl) VALUES (?, ?, ?, ?, ?)',
        [key, namespace, JSON.stringify(data), Date.now(), ttl]
      );

      console.log(`✅ [CacheService] Cached: ${key}`);
    } catch (error) {
      console.error(`❌ [CacheService] Set error:`, error);
    }
  }

  /**
   * Clear specific cache
   */
  static async clear(namespace: string, query?: string): Promise<void> {
    try {
      if (!this.db) await this.init();
      
      if (query) {
        const key = this.generateKey(namespace, query);
        await this.db!.runAsync('DELETE FROM cache WHERE key = ?', [key]);
        console.log(`🗑️ [CacheService] Cleared: ${key}`);
      } else {
        await this.db!.runAsync('DELETE FROM cache WHERE namespace = ?', [namespace]);
        console.log(`🗑️ [CacheService] Cleared namespace: ${namespace}`);
      }
    } catch (error) {
      console.error(`❌ [CacheService] Clear error:`, error);
    }
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    try {
      if (!this.db) await this.init();
      
      await this.db!.runAsync('DELETE FROM cache');
      console.log(`🗑️ [CacheService] Cleared all cache`);
    } catch (error) {
      console.error(`❌ [CacheService] Clear all error:`, error);
    }
  }

  /**
   * Get cache stats
   */
  static async getStats(): Promise<{ total: number; namespaces: Record<string, number> }> {
    try {
      if (!this.db) await this.init();
      
      const results = await this.db!.getAllAsync<any>(
        'SELECT namespace, COUNT(*) as count FROM cache GROUP BY namespace'
      );

      const namespaces: Record<string, number> = {};
      let total = 0;

      for (const row of results) {
        namespaces[row.namespace] = row.count;
        total += row.count;
      }

      console.log(`📊 [CacheService] Stats:`, { total, namespaces });
      return { total, namespaces };
    } catch (error) {
      console.error(`❌ [CacheService] Stats error:`, error);
      return { total: 0, namespaces: {} };
    }
  }

  /**
   * Cache place summary
   */
  static async setPlaceSummary(
    placeId: string,
    name: string,
    summary: string,
    rating?: number,
    userRatingCount?: number,
    ttl: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<void> {
    try {
      if (!this.db) await this.init();
      
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO place_summaries (place_id, name, summary, rating, user_rating_count, timestamp, ttl) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [placeId, name, summary, rating || null, userRatingCount || null, Date.now(), ttl]
      );
      
      console.log(`✅ [CacheService] Cached place summary: ${placeId}`);
    } catch (error) {
      console.error(`❌ [CacheService] Set place summary error:`, error);
    }
  }

  /**
   * Get place summary from cache
   */
  static async getPlaceSummary(placeId: string): Promise<{
    name: string;
    summary: string;
    rating?: number;
    userRatingCount?: number;
  } | null> {
    try {
      if (!this.db) await this.init();
      
      const result = await this.db!.getFirstAsync<any>(
        'SELECT name, summary, rating, user_rating_count, timestamp, ttl FROM place_summaries WHERE place_id = ?',
        [placeId]
      );

      if (!result) return null;

      const now = Date.now();
      if (now - result.timestamp > result.ttl) {
        await this.db!.runAsync('DELETE FROM place_summaries WHERE place_id = ?', [placeId]);
        return null;
      }

      return {
        name: result.name,
        summary: result.summary,
        rating: result.rating,
        userRatingCount: result.user_rating_count
      };
    } catch (error) {
      console.error(`❌ [CacheService] Get place summary error:`, error);
      return null;
    }
  }

  /**
   * Cache opening hours
   */
  static async setOpeningHours(
    placeId: string,
    hours: any,
    currentStatus?: string,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<void> {
    try {
      if (!this.db) await this.init();
      
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO opening_hours (place_id, hours, current_status, timestamp, ttl) VALUES (?, ?, ?, ?, ?)',
        [placeId, JSON.stringify(hours), currentStatus || null, Date.now(), ttl]
      );
      
      console.log(`✅ [CacheService] Cached opening hours: ${placeId}`);
    } catch (error) {
      console.error(`❌ [CacheService] Set opening hours error:`, error);
    }
  }

  /**
   * Get opening hours from cache
   */
  static async getOpeningHours(placeId: string): Promise<{
    hours: any;
    currentStatus?: string;
  } | null> {
    try {
      if (!this.db) await this.init();
      
      const result = await this.db!.getFirstAsync<any>(
        'SELECT hours, current_status, timestamp, ttl FROM opening_hours WHERE place_id = ?',
        [placeId]
      );

      if (!result) return null;

      const now = Date.now();
      if (now - result.timestamp > result.ttl) {
        await this.db!.runAsync('DELETE FROM opening_hours WHERE place_id = ?', [placeId]);
        return null;
      }

      return {
        hours: JSON.parse(result.hours),
        currentStatus: result.current_status
      };
    } catch (error) {
      console.error(`❌ [CacheService] Get opening hours error:`, error);
      return null;
    }
  }
}

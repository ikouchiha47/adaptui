import * as SQLite from 'expo-sqlite';
import { BackgroundJob, JobType, JobStatus } from '@/types';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('adaptui.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create background_jobs table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS background_jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3
      );
    `);

    // Create workflows table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_preferences table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create query_history table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS query_history (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        category TEXT,
        response TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Background Jobs Management
  async createJob(job: Omit<BackgroundJob, 'createdAt' | 'updatedAt'>): Promise<BackgroundJob> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const jobWithTimestamps = {
      ...job,
      createdAt: now,
      updatedAt: now
    };

    const statement = await this.db.prepareAsync(
      `INSERT INTO background_jobs (id, type, status, data, created_at, updated_at, retry_count, max_retries)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    try {
      await statement.executeAsync([
        job.id,
        job.type,
        job.status,
        JSON.stringify(job.data),
        now.toISOString(),
        now.toISOString(),
        job.retryCount,
        job.maxRetries
      ]);
    } finally {
      await statement.finalizeAsync();
    }

    return jobWithTimestamps;
  }

  async getJob(id: string): Promise<BackgroundJob | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM background_jobs WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return this.mapDbJobToJob(result);
  }

  async getJobsByStatus(status: JobStatus): Promise<BackgroundJob[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      'SELECT * FROM background_jobs WHERE status = ? ORDER BY created_at DESC',
      [status]
    );

    return results.map(this.mapDbJobToJob);
  }

  async getPendingJobs(): Promise<BackgroundJob[]> {
    return this.getJobsByStatus('pending');
  }

  async updateJobStatus(id: string, status: JobStatus, data?: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    
    if (data) {
      const statement = await this.db.prepareAsync(
        `UPDATE background_jobs 
         SET status = ?, data = ?, updated_at = ? 
         WHERE id = ?`
      );
      try {
        await statement.executeAsync([status, JSON.stringify(data), now.toISOString(), id]);
      } finally {
        await statement.finalizeAsync();
      }
    } else {
      const statement = await this.db.prepareAsync(
        `UPDATE background_jobs 
         SET status = ?, updated_at = ? 
         WHERE id = ?`
      );
      try {
        await statement.executeAsync([status, now.toISOString(), id]);
      } finally {
        await statement.finalizeAsync();
      }
    }
  }

  async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const statement = await this.db.prepareAsync(
      'UPDATE background_jobs SET retry_count = retry_count + 1, updated_at = ? WHERE id = ?'
    );
    try {
      await statement.executeAsync([new Date().toISOString(), id]);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async deleteJob(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const statement = await this.db.prepareAsync('DELETE FROM background_jobs WHERE id = ?');
    try {
      await statement.executeAsync([id]);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async deleteCompletedJobs(olderThanHours: number = 24): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const statement = await this.db.prepareAsync(
      `DELETE FROM background_jobs 
       WHERE status = 'completed' AND updated_at < ?`
    );
    try {
      await statement.executeAsync([cutoffDate.toISOString()]);
    } finally {
      await statement.finalizeAsync();
    }
  }

  // User Preferences
  async setUserPreference(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const statement = await this.db.prepareAsync(
      `INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
       VALUES (?, ?, ?)`
    );
    try {
      await statement.executeAsync([key, JSON.stringify(value), new Date().toISOString()]);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async getUserPreference(key: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT value FROM user_preferences WHERE key = ?',
      [key]
    );

    if (!result) return null;

    try {
      return JSON.parse(result.value);
    } catch (error) {
      return result.value;
    }
  }

  // Query History
  async saveQuery(query: string, category?: string, response?: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const statement = await this.db.prepareAsync(
      `INSERT INTO query_history (id, query, category, response, timestamp)
       VALUES (?, ?, ?, ?, ?)`
    );
    try {
      await statement.executeAsync([
        id, 
        query, 
        category, 
        response ? JSON.stringify(response) : null, 
        new Date().toISOString()
      ]);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async getQueryHistory(limit: number = 50): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      'SELECT * FROM query_history ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );

    return results.map(result => ({
      id: result.id,
      query: result.query,
      category: result.category,
      response: result.response ? JSON.parse(result.response) : null,
      timestamp: result.timestamp
    }));
  }

  // Utility methods
  private mapDbJobToJob(dbResult: any): BackgroundJob {
    return {
      id: dbResult.id,
      type: dbResult.type as JobType,
      status: dbResult.status as JobStatus,
      data: JSON.parse(dbResult.data),
      createdAt: new Date(dbResult.created_at),
      updatedAt: new Date(dbResult.updated_at),
      retryCount: dbResult.retry_count,
      maxRetries: dbResult.max_retries
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  // Database maintenance
  async vacuum(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync('VACUUM');
  }

  async getDatabaseSize(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(
      "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
    );
    
    return result?.size || 0;
  }
}
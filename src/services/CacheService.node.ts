// Mock Cache Service - In-memory implementation for Node.js testing

import { ICacheService } from './ICacheService';

export class MockCacheService implements ICacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async init(): Promise<void> {
    console.log('💾 [MockCacheService] Using in-memory cache (Node.js mode)');
  }

  generateKey(namespace: string, query: string): string {
    const hash = this.hashString(query);
    return `${namespace}_${hash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const fullKey = `${namespace}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(
    namespace: string,
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const fullKey = `${namespace}:${key}`;
    this.cache.set(fullKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async delete(namespace: string, key: string): Promise<void> {
    const fullKey = `${namespace}:${key}`;
    this.cache.delete(fullKey);
  }

  async clearNamespace(namespace: string): Promise<void> {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async clearAll(): Promise<void> {
    this.cache.clear();
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 [MockCacheService] Cleaned up ${keysToDelete.length} expired entries`);
  }

  async getStats(): Promise<{
    totalEntries: number;
    namespaces: Record<string, number>;
  }> {
    const namespaces: Record<string, number> = {};
    
    for (const key of this.cache.keys()) {
      const namespace = key.split(':')[0];
      namespaces[namespace] = (namespaces[namespace] || 0) + 1;
    }
    
    return {
      totalEntries: this.cache.size,
      namespaces
    };
  }
}

// Cache Service Interface - Abstraction for different cache implementations

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ICacheService {
  /**
   * Initialize cache
   */
  init(): Promise<void>;

  /**
   * Generate cache key from query
   */
  generateKey(namespace: string, query: string): string;

  /**
   * Get cached data
   */
  get<T>(namespace: string, key: string): Promise<T | null>;

  /**
   * Set cached data
   */
  set<T>(namespace: string, key: string, data: T, ttl?: number): Promise<void>;

  /**
   * Delete cached data
   */
  delete(namespace: string, key: string): Promise<void>;

  /**
   * Clear all cache in namespace
   */
  clearNamespace(namespace: string): Promise<void>;

  /**
   * Clear all cache
   */
  clearAll(): Promise<void>;

  /**
   * Clean up expired entries
   */
  cleanup(): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<{
    totalEntries: number;
    namespaces: Record<string, number>;
  }>;
}

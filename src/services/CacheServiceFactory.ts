// Cache Service Factory - Provides the appropriate cache implementation
// Note: CacheService uses static methods, so this factory just re-exports it

import { CacheService } from './CacheService';

/**
 * Factory for cache service
 * Since CacheService uses static methods, we just export it directly
 */
export class CacheServiceFactory {
  /**
   * Get the cache service (returns the CacheService class itself)
   */
  static getInstance() {
    return CacheService;
  }
}

// For convenience, also export CacheService directly
export { CacheService };

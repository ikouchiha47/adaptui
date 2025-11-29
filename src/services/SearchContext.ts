// Shared Search Context - In-memory store for search results
// Allows plugins to access search data without prop drilling

interface SearchContextData {
  query: string;
  analysis: any;
  results: any[];
  destination: string;
  destinationAirports: string[]; // Array of validated IATA codes
  selectedAirport?: string; // User-selected airport from UI
  centerLocation: { lat: number; lng: number };
  userLocation?: { latitude: number; longitude: number };
  timestamp: number;
}

interface PluginCache {
  [pluginId: string]: {
    data: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

interface TaskResults {
  [taskId: string]: {
    data: any;
    source: string;
    timestamp: Date;
  };
}

class SearchContextManager {
  private context: SearchContextData | null = null;
  private pluginCache: PluginCache = {};
  private taskResults: TaskResults = {}; // Store task execution results

  /**
   * Store search results in memory
   */
  setContext(data: Omit<SearchContextData, 'timestamp'>) {
    this.context = {
      ...data,
      timestamp: Date.now()
    };
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 [SearchContext] Context Stored');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Query:', data.query);
    console.log('Destination:', data.destination);
    console.log('Results:', data.results.length, 'places');
    console.log('Center Location:', data.centerLocation);
    console.log('User Location:', data.userLocation ? `${data.userLocation.latitude}, ${data.userLocation.longitude}` : 'Not available');
    console.log('Intent:', data.analysis?.intent);
    console.log('Categories:', data.analysis?.categories?.join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Get current search context
   */
  getContext(): SearchContextData | null {
    return this.context;
  }

  /**
   * Get search results
   */
  getResults(): any[] {
    return this.context?.results || [];
  }

  /**
   * Get center location of search results
   */
  getCenterLocation(): { lat: number; lng: number } | null {
    return this.context?.centerLocation || null;
  }

  /**
   * Get destination name
   */
  getDestination(): string | null {
    return this.context?.destination || null;
  }

  /**
   * Get user location
   */
  getUserLocation(): { latitude: number; longitude: number } | null {
    return this.context?.userLocation || null;
  }

  /**
   * Get cached plugin data
   */
  getPluginCache(pluginId: string): any | null {
    const cached = this.pluginCache[pluginId];
    if (!cached) return null;
    
    // Check if cache is expired
    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      console.log(`[SearchContext] Cache expired for ${pluginId} (age: ${Math.round(age / 1000)}s, ttl: ${cached.ttl / 1000}s)`);
      delete this.pluginCache[pluginId];
      return null;
    }
    
    console.log(`[SearchContext] ✅ Cache hit for ${pluginId} (age: ${Math.round(age / 1000)}s)`);
    return cached.data;
  }

  /**
   * Set plugin cache
   */
  setPluginCache(pluginId: string, data: any, ttl: number = 3600000) {
    this.pluginCache[pluginId] = {
      data,
      timestamp: Date.now(),
      ttl
    };
    console.log(`[SearchContext] 💾 Cached data for ${pluginId} (ttl: ${ttl / 1000}s)`);
  }

  /**
   * Invalidate plugin cache (force refresh)
   */
  invalidatePluginCache(pluginId: string) {
    if (this.pluginCache[pluginId]) {
      delete this.pluginCache[pluginId];
      console.log(`[SearchContext] 🗑️ Invalidated cache for ${pluginId}`);
    }
  }

  /**
   * Alias for invalidatePluginCache (for consistency)
   */
  clearPluginCache(pluginId: string) {
    this.invalidatePluginCache(pluginId);
  }

  /**
   * Store task execution result
   */
  setTaskResult(taskId: string, result: { data: any; source: string; timestamp: Date }) {
    this.taskResults[taskId] = result;
    console.log(`📝 [SearchContext] Stored task result: ${taskId} from ${result.source}`);
  }

  /**
   * Get task execution result
   */
  getTaskResult(taskId: string) {
    return this.taskResults[taskId];
  }

  /**
   * Get all task results
   */
  getAllTaskResults() {
    return this.taskResults;
  }

  /**
   * Clear all plugin caches
   */
  clearPluginCaches() {
    const count = Object.keys(this.pluginCache).length;
    this.pluginCache = {};
    console.log(`[SearchContext] 🗑️ Cleared ${count} plugin caches`);
  }

  /**
   * Clear context and all caches
   */
  clear() {
    this.context = null;
    this.clearPluginCaches();
    this.taskResults = {};
    console.log('[SearchContext] Context, caches, and task results cleared');
  }

  /**
   * Check if context is stale (older than 5 minutes)
   */
  isStale(): boolean {
    if (!this.context) return true;
    const age = Date.now() - this.context.timestamp;
    return age > 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    const stats = Object.entries(this.pluginCache).map(([pluginId, cache]) => ({
      pluginId,
      age: Math.round((Date.now() - cache.timestamp) / 1000),
      ttl: cache.ttl / 1000,
      expired: Date.now() - cache.timestamp > cache.ttl
    }));
    return stats;
  }
}

export const searchContext = new SearchContextManager();

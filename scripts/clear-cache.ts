#!/usr/bin/env tsx
/**
 * Clear all caches
 */

import { CacheService } from '../src/services/CacheService';

async function clearAllCaches() {
  console.log('🗑️  Clearing all caches...\n');
  
  try {
    await CacheService.initialize();
    
    // Clear all cache types
    const cacheTypes = [
      'travel_recommendations',
      'query_processing',
      'brave_search',
      'crowd_intel',
      'place_summary',
      'opening_hours'
    ];
    
    for (const type of cacheTypes) {
      await CacheService.clear(type);
      console.log(`✅ Cleared: ${type}`);
    }
    
    console.log('\n✅ All caches cleared!');
    console.log('🔄 Try your search again to see fresh results');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearAllCaches();

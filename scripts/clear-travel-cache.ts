// Clear travel recommendations cache

import { CacheService } from '../src/services/CacheService';

async function clearCache() {
  console.log('🗑️ Clearing travel recommendations cache...');
  
  await CacheService.clear('travel_recommendations');
  
  console.log('✅ Cache cleared!');
  console.log('Now restart your app and search again.');
}

clearCache();

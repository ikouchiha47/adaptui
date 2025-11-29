/**
 * Test Price Data Retrieval from Google Places API
 */

import { configManager } from '../src/config/ConfigManager';
import { MockCacheService } from '../src/services/CacheService.node';
import { PlacesInsightsService } from '../src/services/PlacesInsightsService';

async function testPriceData() {
  console.log('🧪 Testing Price Data Retrieval\n');
  
  const apiKey = configManager.getApiKeyOrNull('googlePlaces');
  if (!apiKey) {
    throw new Error('Google Places API key not found in config');
  }

  // Use mock cache service for testing
  const mockCache = new MockCacheService();
  await mockCache.init();
  
  const service = new PlacesInsightsService(mockCache);

  const testQueries = [
    {
      query: 'bars in Bangkok',
      location: { lat: 13.7563, lng: 100.5018 } // Bangkok
    },
    {
      query: 'restaurants in Paris',
      location: { lat: 48.8566, lng: 2.3522 } // Paris
    },
    {
      query: 'hotels in New York',
      location: { lat: 40.7128, lng: -74.0060 } // New York
    }
  ];

  for (const test of testQueries) {
    console.log('━'.repeat(80));
    console.log(`📍 Query: "${test.query}"`);
    console.log(`📍 Location: ${test.location.lat}, ${test.location.lng}`);
    console.log('━'.repeat(80));

    try {
      const results = await service.getGenerativeSummary(test.query, test.location);
      
      console.log(`\n✅ Found ${results.length} places\n`);

      // Check first 5 places for price data
      results.slice(0, 5).forEach((place: any, idx: number) => {
        console.log(`${idx + 1}. ${place.name}`);
        console.log(`   Place ID: ${place.placeId}`);
        console.log(`   Rating: ${place.rating || 'N/A'} (${place.userRatingCount || 0} reviews)`);
        console.log(`   Price Level: ${place.priceLevel !== undefined ? place.priceLevel : 'NOT PROVIDED'}`);
        
        // Convert price level to dollar signs
        if (place.priceLevel !== undefined && place.priceLevel !== null) {
          const priceDisplay = convertPriceLevel(place.priceLevel);
          console.log(`   Price Display: ${priceDisplay}`);
        } else {
          console.log(`   Price Display: ❌ NO PRICE DATA`);
        }
        
        console.log(`   Types: ${place.types?.slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`   Primary Type: ${place.primaryType || 'N/A'}`);
        
        // Check opening hours
        if (place.currentOpeningHours) {
          console.log(`   Open Now: ${place.currentOpeningHours.openNow ? '✅ Open' : '❌ Closed'}`);
        } else {
          console.log(`   Open Now: ⚠️ No hours data`);
        }
        
        console.log('');
      });

      // Statistics
      const withPrice = results.filter((p: any) => p.priceLevel !== undefined && p.priceLevel !== null);
      const withoutPrice = results.filter((p: any) => p.priceLevel === undefined || p.priceLevel === null);
      
      console.log('📊 STATISTICS:');
      console.log(`   Total places: ${results.length}`);
      console.log(`   With price data: ${withPrice.length} (${Math.round(withPrice.length / results.length * 100)}%)`);
      console.log(`   Without price data: ${withoutPrice.length} (${Math.round(withoutPrice.length / results.length * 100)}%)`);
      
      if (withPrice.length > 0) {
        console.log('\n   Price Level Distribution:');
        const distribution = getPriceLevelDistribution(withPrice);
        Object.entries(distribution).forEach(([level, count]) => {
          const display = convertPriceLevel(level);
          console.log(`     ${display}: ${count} places`);
        });
      }
      
      console.log('\n');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

/**
 * Convert Google's price level to dollar signs
 * PRICE_LEVEL_UNSPECIFIED = 0
 * PRICE_LEVEL_FREE = 1 (Free)
 * PRICE_LEVEL_INEXPENSIVE = 2 ($)
 * PRICE_LEVEL_MODERATE = 3 ($$)
 * PRICE_LEVEL_EXPENSIVE = 4 ($$$)
 * PRICE_LEVEL_VERY_EXPENSIVE = 5 ($$$$)
 */
function convertPriceLevel(priceLevel: string | number): string {
  const level = typeof priceLevel === 'string' ? priceLevel : priceLevel.toString();
  
  const mapping: Record<string, string> = {
    'PRICE_LEVEL_UNSPECIFIED': 'N/A',
    'PRICE_LEVEL_FREE': 'Free',
    'PRICE_LEVEL_INEXPENSIVE': '$',
    'PRICE_LEVEL_MODERATE': '$$',
    'PRICE_LEVEL_EXPENSIVE': '$$$',
    'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
    '0': 'N/A',
    '1': 'Free',
    '2': '$',
    '3': '$$',
    '4': '$$$',
    '5': '$$$$'
  };
  
  return mapping[level] || level;
}

function getPriceLevelDistribution(places: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  places.forEach(place => {
    const level = place.priceLevel?.toString() || 'unknown';
    distribution[level] = (distribution[level] || 0) + 1;
  });
  
  return distribution;
}

testPriceData().catch(console.error);

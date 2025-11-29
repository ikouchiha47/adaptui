// Test script to verify PlacesInsightsService.getPlaceDetails returns coordinates

import { configManager } from '../src/config/ConfigManager';
import { PlacesInsightsService } from '../src/services/PlacesInsightsService';

async function testPlaceDetailsCoordinates() {
  console.log('🧪 Testing PlacesInsightsService.getPlaceDetails for coordinates...\n');

  const apiKey = configManager.getApiKeyOrNull('googlePlaces');
  if (!apiKey) {
    console.error('❌ No Google Places API key found');
    process.exit(1);
  }

  const service = new PlacesInsightsService();

  // Test with a known place ID from the logs
  const testPlaceId = 'places/ChIJp-qLmcCZ4jARYoCSpq8q75M';
  
  console.log(`📍 Fetching details for: ${testPlaceId}\n`);

  try {
    const details = await service.getPlaceDetails(testPlaceId);

    if (!details) {
      console.error('❌ getPlaceDetails returned null');
      process.exit(1);
    }

    console.log('✅ Got place details:');
    console.log('   Name:', details.displayName?.text || 'N/A');
    console.log('   Rating:', details.rating || 'N/A');
    console.log('   Address:', details.formattedAddress || 'N/A');
    console.log('\n📍 COORDINATES CHECK:');
    
    if (details.location) {
      console.log('   ✅ location field exists');
      console.log('   Latitude:', details.location.latitude);
      console.log('   Longitude:', details.location.longitude);
      
      if (details.location.latitude && details.location.longitude) {
        console.log('\n✅ SUCCESS: Coordinates are present!');
        process.exit(0);
      } else {
        console.log('\n❌ FAIL: location exists but latitude/longitude are missing');
        process.exit(1);
      }
    } else {
      console.log('   ❌ location field is MISSING');
      console.log('\n❌ FAIL: No coordinates returned');
      console.log('\nFull response:');
      console.log(JSON.stringify(details, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPlaceDetailsCoordinates();

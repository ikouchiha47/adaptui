#!/usr/bin/env node
/**
 * Test Place Coordinates Flow - CLI Version
 * Tests coordinate extraction from Google Places API
 */

// Mock React Native BEFORE any imports
(global as any).require = new Proxy(require, {
  apply(target, thisArg, args) {
    if (args[0] === 'react-native') {
      return {
        Platform: { OS: 'ios', select: (obj: any) => obj.ios },
        Dimensions: { get: () => ({ width: 375, height: 812 }) }
      };
    }
    return Reflect.apply(target, thisArg, args);
  }
});

import { configManager } from '../src/config/ConfigManager';
import { PlacesPhotoService } from '../src/services/PlacesPhotoService';

async function testPlaceCoordinates() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TESTING PLACE COORDINATES FLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const apiKey = configManager.getApiKeyOrNull('googlePlaces');
  if (!apiKey) {
    console.error('❌ No Google Places API key found');
    console.log('   Set GOOGLE_PLACES_API_KEY in .env');
    return;
  }

  const photosService = new PlacesPhotoService(apiKey);

  // Test places
  const testPlaces = [
    { name: 'Wat Pho', city: 'Bangkok, Thailand' },
    { name: 'Grand Palace', city: 'Bangkok, Thailand' },
    { name: 'Chatuchak Market', city: 'Bangkok, Thailand' }
  ];

  console.log('📋 Testing Google Places API Coordinate Extraction');
  console.log('─────────────────────────────────────────────────────\n');

  let successCount = 0;
  let failCount = 0;

  for (const place of testPlaces) {
    console.log(`🔍 Testing: ${place.name}, ${place.city}`);
    
    try {
      const details = await photosService.getPlaceDetails(
        `${place.name} ${place.city}`,
        3,
        400
      );

      console.log(`   Photos: ${details.photos.length}`);
      console.log(`   Rating: ${details.rating || 'N/A'}`);
      console.log(`   Open: ${details.isOpen !== undefined ? (details.isOpen ? 'Yes' : 'No') : 'Unknown'}`);
      
      if (details.latitude && details.longitude) {
        console.log(`   ✅ Coordinates: (${details.latitude.toFixed(6)}, ${details.longitude.toFixed(6)})`);
        successCount++;
      } else {
        console.log(`   ❌ NO COORDINATES RETURNED`);
        failCount++;
      }
      
      console.log('');
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failCount++;
    }
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nTotal tests: ${testPlaces.length}`);
  console.log(`✅ With coordinates: ${successCount}`);
  console.log(`❌ Without coordinates: ${failCount}`);

  if (successCount === testPlaces.length) {
    console.log('\n🎯 SUCCESS: All places have coordinates!');
    console.log('   Google Places API is working correctly');
    console.log('   PlacesPhotoService extracts coordinates properly');
  } else if (successCount > 0) {
    console.log('\n⚠️  PARTIAL: Some places missing coordinates');
    console.log('   This could be due to:');
    console.log('   - API rate limiting');
    console.log('   - Place not found');
    console.log('   - Network issues');
  } else {
    console.log('\n❌ FAILURE: No coordinates returned');
    console.log('   Check:');
    console.log('   - Google Places API key is valid');
    console.log('   - API quota not exceeded');
    console.log('   - PlacesPhotoService.getPlaceDetails() implementation');
  }

  // Data flow explanation
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DATA FLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n1. Google Places Text Search');
  console.log('   → Returns: place_id, name, formatted_address');
  console.log('\n2. Google Places Details API');
  console.log('   → Returns: photos, rating, geometry.location');
  console.log('   → geometry.location = { lat: number, lng: number }');
  console.log('\n3. PlacesPhotoService.getPlaceDetails()');
  console.log('   → Extracts: details.geometry?.location?.lat');
  console.log('   → Extracts: details.geometry?.location?.lng');
  console.log('   → Returns: { photos, rating, latitude, longitude }');
  console.log('\n4. TravelService');
  console.log('   → Stores on highlight: highlight.latitude/longitude');
  console.log('   → Copies to place: rec.coordinates = { latitude, longitude }');
  console.log('\n5. AdaptUIScreen');
  console.log('   → Uses: place.coordinates for center location');
  console.log('   → Fallback: Extract from first highlight if missing');
  console.log('');
}

testPlaceCoordinates().catch(console.error);

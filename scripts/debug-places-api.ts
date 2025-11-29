// Debug script to test Google Places API and find the issue
import { configManager } from '../src/config/ConfigManager';

async function debugPlacesAPI() {
  console.log('🔍 Debugging Google Places API\n');

  const apiKey = configManager.getApiKeyOrNull('googlePlaces');
  if (!apiKey) {
    console.error('❌ No Google Places API key found in config');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...\n');

  // Test 1: Search for a place
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Text Search for a Place');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    const searchPayload = {
      textQuery: 'Namdroling Monastery Coorg',
      maxResultCount: 1
    };

    console.log('📍 Searching for: Namdroling Monastery Coorg');
    console.log('🔗 URL:', searchUrl);
    console.log('📦 Payload:', JSON.stringify(searchPayload, null, 2));

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName'
      },
      body: JSON.stringify(searchPayload)
    });

    console.log('\n📊 Response Status:', searchResponse.status, searchResponse.statusText);

    const searchText = await searchResponse.text();
    console.log('\n📄 Response Body Length:', searchText.length, 'bytes');
    console.log('📄 Response Body:', searchText.substring(0, 500));

    if (!searchResponse.ok) {
      console.error('\n❌ Search failed!');
      return;
    }

    const searchData = JSON.parse(searchText);
    console.log('\n✅ Search successful!');
    console.log('📍 Places found:', searchData.places?.length || 0);

    if (!searchData.places || searchData.places.length === 0) {
      console.error('❌ No places found');
      return;
    }

    const place = searchData.places[0];
    let placeId = place.id;
    const placeName = place.displayName?.text;

    console.log('\n🏷️  Place ID (raw):', placeId);
    
    // Fix: Add 'places/' prefix if missing
    if (!placeId.startsWith('places/')) {
      placeId = `places/${placeId}`;
      console.log('🔧 Fixed Place ID:', placeId);
    }
    
    console.log('📝 Place Name:', placeName);

    // Test 2: Get Place Details
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Get Place Details');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const detailsUrl = `https://places.googleapis.com/v1/${placeId}`;
    console.log('🔗 URL:', detailsUrl);
    console.log('🔑 Field Mask: id,displayName,rating,userRatingCount,editorialSummary');

    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,editorialSummary,photos,types,priceLevel'
      }
    });

    console.log('\n📊 Response Status:', detailsResponse.status, detailsResponse.statusText);

    const detailsText = await detailsResponse.text();
    console.log('\n📄 Response Body Length:', detailsText.length, 'bytes');
    console.log('📄 Response Body:', detailsText.substring(0, 1000));

    if (!detailsResponse.ok) {
      console.error('\n❌ Details request failed!');
      console.error('💡 This is likely the issue causing empty responses');
      
      if (detailsResponse.status === 403) {
        console.error('\n🚨 ERROR: 403 Forbidden');
        console.error('Possible causes:');
        console.error('  1. API quota exceeded');
        console.error('  2. Billing not enabled');
        console.error('  3. API key restrictions');
        console.error('  4. Places API (New) not enabled');
      } else if (detailsResponse.status === 404) {
        console.error('\n🚨 ERROR: 404 Not Found');
        console.error('Possible causes:');
        console.error('  1. Invalid place ID format');
        console.error('  2. Place ID does not exist');
      }
      return;
    }

    if (detailsText.length === 0) {
      console.error('\n❌ Empty response body!');
      console.error('💡 This is the issue - API returns 200 but empty body');
      return;
    }

    const detailsData = JSON.parse(detailsText);
    console.log('\n✅ Details request successful!');
    console.log('📊 Details:', JSON.stringify(detailsData, null, 2));

    // Test 3: Get Opening Hours
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Get Opening Hours');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const hoursUrl = `https://places.googleapis.com/v1/${placeId}`;
    console.log('🔗 URL:', hoursUrl);
    console.log('🔑 Field Mask: currentOpeningHours,regularOpeningHours');

    const hoursResponse = await fetch(hoursUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'currentOpeningHours,regularOpeningHours,currentSecondaryOpeningHours'
      }
    });

    console.log('\n📊 Response Status:', hoursResponse.status, hoursResponse.statusText);

    const hoursText = await hoursResponse.text();
    console.log('📄 Response Body Length:', hoursText.length, 'bytes');
    console.log('📄 Response Body:', hoursText.substring(0, 1000));

    if (!hoursResponse.ok) {
      console.error('\n❌ Opening hours request failed!');
      return;
    }

    if (hoursText.length === 0) {
      console.error('\n❌ Empty response body!');
      return;
    }

    const hoursData = JSON.parse(hoursText);
    console.log('\n✅ Opening hours request successful!');
    console.log('📊 Hours:', JSON.stringify(hoursData, null, 2));

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ All tests passed!');
    console.log('✅ API is working correctly');
    console.log('✅ Place ID format is correct:', placeId);
    console.log('✅ Details endpoint works');
    console.log('✅ Opening hours endpoint works');
    console.log('\n💡 The issue in the app might be:');
    console.log('   1. Race condition or timing issue');
    console.log('   2. Different place IDs being used');
    console.log('   3. Network issues in React Native');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('\n💡 Stack trace:', (error as Error).stack);
  }
}

// Run the debug script
debugPlacesAPI().catch(console.error);

/**
 * Test Google Places Details API to see what fields are returned
 */

import { configManager } from '../src/config/ConfigManager';

async function testPlaceDetailsAPI() {
  const apiKey = configManager.getApiKeyOrNull('googlePlaces');
  if (!apiKey) {
    console.error('No Google Places API key');
    return;
  }

  // Test with a known bar place ID from the logs
  const placeId = 'ChIJ5178Viqf4jARZKFL40SO2RU'; // The Speakeasy Rooftop Bar Bangkok
  
  console.log('🧪 Testing Place Details API\n');
  console.log(`Place ID: ${placeId}\n`);
  
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  
  // Try with reviewSummary field
  const fieldMask = 'id,displayName,formattedAddress,location,rating,userRatingCount,editorialSummary,generativeSummary,reviewSummary,photos,types,priceLevel,primaryType,businessStatus,internationalPhoneNumber,nationalPhoneNumber,websiteUri';
  
  console.log('📡 Request:');
  console.log(`URL: ${url}`);
  console.log(`FieldMask: ${fieldMask}\n`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask
    }
  });

  console.log(`📥 Response: ${response.status} ${response.statusText}\n`);
  
  const data = await response.json();
  
  console.log('📄 Response Data:');
  console.log(JSON.stringify(data, null, 2));
  
  console.log('\n🔍 Checking for descriptions:');
  console.log(`  editorialSummary: ${data.editorialSummary ? '✅ EXISTS' : '❌ MISSING'}`);
  if (data.editorialSummary) {
    console.log(`    Overview: ${data.editorialSummary.overview}`);
  }
  
  console.log(`  generativeSummary: ${data.generativeSummary ? '✅ EXISTS' : '❌ MISSING'}`);
  if (data.generativeSummary) {
    console.log(`    Overview: ${data.generativeSummary.overview}`);
    console.log(`    Description: ${data.generativeSummary.description}`);
  }
  
  console.log(`  reviewSummary: ${data.reviewSummary ? '✅ EXISTS' : '❌ MISSING'}`);
  if (data.reviewSummary) {
    console.log(`    Text: ${data.reviewSummary.text || data.reviewSummary}`);
  }
  
  console.log(`\n  displayName: ${data.displayName?.text || 'N/A'}`);
  console.log(`  rating: ${data.rating || 'N/A'}`);
  console.log(`  types: ${data.types?.join(', ') || 'N/A'}`);
  console.log(`  primaryType: ${data.primaryType || 'N/A'}`);
  console.log(`  location: ${data.location ? `${data.location.latitude}, ${data.location.longitude}` : 'N/A'}`);
}

testPlaceDetailsAPI().catch(console.error);

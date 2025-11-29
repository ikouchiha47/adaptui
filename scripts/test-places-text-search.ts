// Test Google Places Text Search API (New)
// https://developers.google.com/maps/documentation/places/web-service/text-search

import { configManager } from '../src/config/ConfigManager';

const API_KEY = configManager.getApiKeyOrNull('googlePlaces');

if (!API_KEY) {
  console.error('❌ No Google Places API key found in config');
  process.exit(1);
}

async function testTextSearch() {
  console.log('🧪 Testing Places Text Search API\n');
  
  const query = 'fun bars in Bangkok';
  const url = 'https://places.googleapis.com/v1/places:searchText';
  
  console.log('Query:', query);
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount,places.location,places.photos'
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 10
      })
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('');
    
    if (!response.ok) {
      console.error('❌ Error:', data);
      return;
    }
    
    console.log('✅ Success!');
    console.log('');
    console.log('Results:', data.places?.length || 0);
    console.log('');
    
    if (data.places && data.places.length > 0) {
      console.log('Sample place:');
      console.log(JSON.stringify(data.places[0], null, 2));
      console.log('');
      
      console.log('All places:');
      data.places.forEach((place: any, i: number) => {
        console.log(`${i + 1}. ${place.displayName?.text || 'Unknown'}`);
        console.log(`   Address: ${place.formattedAddress || 'N/A'}`);
        console.log(`   Types: ${place.types?.join(', ') || 'N/A'}`);
        console.log(`   Rating: ${place.rating || 'N/A'} (${place.userRatingCount || 0} reviews)`);
        console.log(`   Location: ${place.location?.latitude}, ${place.location?.longitude}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testTextSearch();

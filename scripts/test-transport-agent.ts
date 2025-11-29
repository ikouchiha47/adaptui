// Test Transport Research Agent
// Run with: npx tsx scripts/test-transport-agent.ts

import * as fs from 'fs';
import * as path from 'path';

async function testTransportAgent() {
  console.log('='.repeat(60));
  console.log('Testing Transport Research Agent');
  console.log('='.repeat(60));
  console.log('');

  // Load config
  const configPath = path.join(__dirname, '..', 'config.json');
  let apiKey: string | null = null;
  
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    apiKey = config.apiKeys?.googlePlaces || null;
  } catch (error) {
    console.error('ERROR: Could not load config.json');
    return;
  }

  if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
    console.error('ERROR: No Google Places API key found in config.json');
    console.log('Please add your API key to config.json');
    return;
  }
  console.log('Google Places API key: Found');
  console.log('');

  // Test Google Places API directly
  console.log('TEST: Google Places API - Nearby Search');
  console.log('-'.repeat(60));
  
  const bangaloreLat = 12.9716;
  const bangaloreLon = 77.5946;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${bangaloreLat},${bangaloreLon}&radius=100000&type=airport&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Status:', data.status);
    console.log('Results count:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      const airport = data.results[0];
      console.log('First airport:', {
        name: airport.name,
        location: airport.geometry.location,
        placeId: airport.place_id
      });
    }
    
    if (data.error_message) {
      console.error('API Error:', data.error_message);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
  console.log('');

  // Test destination search
  console.log('TEST: Google Places API - Text Search');
  console.log('-'.repeat(60));
  
  const destinations = ['Luang Prabang', 'Bangkok', 'Singapore'];
  
  for (const dest of destinations) {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(dest + ' airport')}&type=airport&key=${apiKey}`;
    
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log(`${dest}:`);
      console.log('  Status:', data.status);
      
      if (data.results && data.results.length > 0) {
        console.log('  Airport:', data.results[0].name);
      }
      
      if (data.error_message) {
        console.error('  Error:', data.error_message);
      }
    } catch (error) {
      console.error(`  Fetch error:`, error);
    }
  }



  console.log('');
  console.log('='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

// Run tests
testTransportAgent().catch(console.error);

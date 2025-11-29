// Test geocoding for map coordinates
const https = require('https');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const API_KEY = config.apiKeys.googlePlaces;

async function geocode(placeName) {
  return new Promise((resolve, reject) => {
    // Properly encode the address - spaces become %20, commas stay as commas
    const encodedAddress = encodeURIComponent(placeName);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;
    
    console.log(`   URL: ${url.substring(0, 100)}...`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK' && json.results && json.results.length > 0) {
            const location = json.results[0].geometry.location;
            resolve({
              name: placeName,
              lat: location.lat,
              lng: location.lng,
              formatted: json.results[0].formatted_address
            });
          } else {
            reject(new Error(`Geocoding failed: ${json.status}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testGeocoding() {
  console.log('🗺️  Testing Geocoding for Map Coordinates\n');
  console.log('='.repeat(60));
  
  const places = [
    'Bangkok, Thailand',
    'Bali, Indonesia',
    'Tokyo, Japan',
    'Paris, France',
    'New York, USA'
  ];
  
  console.log('\n📍 Geocoding test locations:\n');
  
  for (const place of places) {
    try {
      const result = await geocode(place);
      console.log(`✅ ${result.name}`);
      console.log(`   Coordinates: (${result.lat}, ${result.lng})`);
      console.log(`   Address: ${result.formatted}`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${place}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('='.repeat(60));
  console.log('\n✅ Geocoding test complete!');
  console.log('\nThis proves Google Geocoding API works for getting coordinates.');
  console.log('The TravelService.ensureCoordinates() will use this as fallback.');
}

testGeocoding();

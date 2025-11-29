// Simple Node.js script to test map coordinates (no React Native imports)
const https = require('https');
const fs = require('fs');

// Read config
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const GOOGLE_PLACES_API_KEY = config.googlePlacesApiKey;

async function fetchPlaceDetails(placeId) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,rating,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK' && json.result) {
            resolve({
              name: json.result.name,
              latitude: json.result.geometry?.location?.lat,
              longitude: json.result.geometry?.location?.lng,
              rating: json.result.rating,
              address: json.result.formatted_address
            });
          } else {
            reject(new Error(`API Error: ${json.status}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function searchPlaces(query, location) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=5000&key=${GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK') {
            resolve(json.results);
          } else {
            reject(new Error(`API Error: ${json.status}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testMapCoordinates() {
  console.log('🗺️  Testing Map Coordinates\n');
  console.log('='.repeat(60));
  
  try {
    // Test query
    const query = 'romantic restaurants in Bali';
    const location = '-8.4095,115.1889'; // Bali coordinates
    
    console.log(`\n📝 Query: ${query}`);
    console.log(`📍 Location: ${location}\n`);
    
    // Search for places
    console.log('🔍 Searching for places...');
    const places = await searchPlaces(query, location);
    console.log(`   Found ${places.length} places\n`);
    
    // Check coordinates for each place
    let withCoords = 0;
    let withoutCoords = 0;
    
    console.log('📊 Checking coordinates:\n');
    
    for (let i = 0; i < Math.min(places.length, 10); i++) {
      const place = places[i];
      const lat = place.geometry?.location?.lat;
      const lng = place.geometry?.location?.lng;
      
      if (lat && lng) {
        withCoords++;
        console.log(`   ${i + 1}. ✅ ${place.name}`);
        console.log(`      Coords: (${lat}, ${lng})`);
        console.log(`      Rating: ${place.rating || 'N/A'}`);
      } else {
        withoutCoords++;
        console.log(`   ${i + 1}. ❌ ${place.name} - NO COORDINATES`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY\n');
    console.log(`Total Places Checked: ${Math.min(places.length, 10)}`);
    console.log(`With Coordinates: ${withCoords} (${Math.round(withCoords/Math.min(places.length, 10)*100)}%)`);
    console.log(`Without Coordinates: ${withoutCoords}`);
    
    if (withCoords === Math.min(places.length, 10)) {
      console.log('\n✅ SUCCESS: All locations have coordinates for map display!');
    } else if (withCoords > 0) {
      console.log('\n⚠️  WARNING: Some locations missing coordinates');
    } else {
      console.log('\n❌ ERROR: No coordinates found!');
    }
    
    // Calculate map region
    if (withCoords > 0) {
      const validPlaces = places
        .slice(0, 10)
        .filter(p => p.geometry?.location?.lat && p.geometry?.location?.lng);
      
      const lats = validPlaces.map(p => p.geometry.location.lat);
      const lngs = validPlaces.map(p => p.geometry.location.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      console.log('\n🗺️  Map Region:');
      console.log(`   Center: (${centerLat.toFixed(4)}, ${centerLng.toFixed(4)})`);
      console.log(`   Bounds: Lat ${minLat.toFixed(4)} to ${maxLat.toFixed(4)}`);
      console.log(`   Bounds: Lng ${minLng.toFixed(4)} to ${maxLng.toFixed(4)}`);
      console.log(`   Markers: ${validPlaces.length}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testMapCoordinates();

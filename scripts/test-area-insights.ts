// Test Google Area Insights API
// https://developers.google.com/maps/documentation/area-insights/overview

import { configManager } from '../src/config/ConfigManager';

const API_KEY = configManager.getApiKeyOrNull('googlePlaces');

if (!API_KEY) {
  console.error('❌ No Google Places API key found in config');
  process.exit(1);
}

async function testAreaInsights() {
  console.log('🧪 Testing Area Insights API\n');
  
  // Bangkok coordinates
  const lat = 13.7563;
  const lng = 100.5018;
  const radius = 1000; // 1km
  
  const url = 'https://areainsights.googleapis.com/v1:computeInsights';
  
  console.log('Location:', lat, lng);
  console.log('Radius:', radius, 'm');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY
      },
      body: JSON.stringify({
        insights: ['INSIGHT_COUNT'],
        filter: {
          locationFilter: {
            circle: {
              latLng: {
                latitude: lat,
                longitude: lng
              },
              radius
            }
          },
          typeFilter: {
            includedTypes: [
              'restaurant',
              'cafe',
              'bar',
              'shopping_mall',
              'store',
              'lodging',
              'bus_station',
              'train_station',
              'taxi_stand'
            ]
          }
        }
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
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (data.count) {
      console.log('Counts by type:');
      Object.entries(data.count).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }
    
    if (data.places) {
      console.log('');
      console.log('Places:', data.places.length);
      data.places.slice(0, 5).forEach((place: any, i: number) => {
        console.log(`${i + 1}. ${place.name || 'Unknown'}`);
        console.log(`   Types: ${place.types?.join(', ') || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testAreaInsights();

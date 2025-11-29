// Test Local Tips Generator
// Run with: npx tsx scripts/test-local-tips.ts

import * as fs from 'fs';
import * as path from 'path';

async function testLocalTips() {
  console.log('Testing Local Tips Generator');
  console.log('='.repeat(60));
  
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
    return;
  }
  
  console.log('Google Places API key: Found');
  console.log('');

  // Test Google Places Summary API
  console.log('TEST 1: Google Places Summary API');
  console.log('-'.repeat(60));
  
  const summaryUrl = 'https://places.googleapis.com/v1/places:searchText';
  const payload = {
    textQuery: 'tanga in lucknow',
    maxResultCount: 3
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName,contextualContents,places.generativeSummary,places.areaSummary'
  };
  
  try {
    const response = await fetch(summaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Places found:', data.places?.length || 0);
    
    if (data.places) {
      data.places.forEach((place: any, idx: number) => {
        console.log(`\n${idx + 1}. ${place.displayName?.text || 'Unknown'}`);
        if (place.generativeSummary) {
          console.log('   Generative:', place.generativeSummary.overview?.text?.substring(0, 100) + '...');
        }
        if (place.areaSummary) {
          console.log('   Area:', place.areaSummary.contentBlocks?.[0]?.content?.text?.substring(0, 100) + '...');
        }
      });
    }
    
    if (data.error) {
      console.error('API Error:', data.error);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test complete');
}

testLocalTips();

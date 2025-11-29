#!/usr/bin/env ts-node
/**
 * Test script to check Google Places API response structure
 * Run: npx ts-node scripts/test-google-places.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Config {
  apiKeys: {
    googlePlaces?: string;
  };
}

async function testGooglePlacesAPI() {
  // Load config
  const configPath = path.join(__dirname, '../config.json');
  const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  const apiKey = config.apiKeys.googlePlaces;
  
  if (!apiKey) {
    console.error('❌ Google Places API key not found in config.json');
    process.exit(1);
  }
  
  console.log('✅ API key loaded');
  console.log('');
  
  // Test 1: Text Search
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Text Search - "fun bars in Bangkok"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const searchQuery = 'fun bars in Bangkok';
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  
  if (searchData.status !== 'OK') {
    console.error('❌ Search failed:', searchData.status);
    console.error('Error:', searchData.error_message);
    process.exit(1);
  }
  
  console.log(`✅ Found ${searchData.results.length} results`);
  console.log('');
  
  if (searchData.results.length === 0) {
    console.log('No results found');
    process.exit(0);
  }
  
  const firstPlace = searchData.results[0];
  console.log('First result:');
  console.log('  Name:', firstPlace.name);
  console.log('  Place ID:', firstPlace.place_id);
  console.log('  Address:', firstPlace.formatted_address);
  console.log('  Rating:', firstPlace.rating);
  console.log('');
  
  // Test 2: Place Details (with all fields)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Place Details - Full Response');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const placeId = firstPlace.place_id;
  const fields = [
    'name',
    'formatted_address',
    'geometry',
    'rating',
    'opening_hours',
    'photos',
    'reviews',
    'user_ratings_total',
    'price_level',
    'types',
    'website',
    'formatted_phone_number',
    'current_opening_hours',
    'business_status'
  ].join(',');
  
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
  
  const detailsResponse = await fetch(detailsUrl);
  const detailsData = await detailsResponse.json();
  
  if (detailsData.status !== 'OK') {
    console.error('❌ Details failed:', detailsData.status);
    console.error('Error:', detailsData.error_message);
    process.exit(1);
  }
  
  console.log('✅ Place details retrieved');
  console.log('');
  console.log('Full response:');
  console.log(JSON.stringify(detailsData.result, null, 2));
  console.log('');
  
  // Check for popular times
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('POPULAR TIMES CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = detailsData.result;
  
  if (result.current_opening_hours) {
    console.log('✅ current_opening_hours found:');
    console.log(JSON.stringify(result.current_opening_hours, null, 2));
  } else {
    console.log('❌ current_opening_hours NOT available');
  }
  console.log('');
  
  if (result.opening_hours) {
    console.log('✅ opening_hours found:');
    console.log(JSON.stringify(result.opening_hours, null, 2));
  } else {
    console.log('❌ opening_hours NOT available');
  }
  console.log('');
  
  // Note about popular times
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('IMPORTANT NOTE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Google Places API does NOT provide popular times data via the official API.');
  console.log('Popular times are only visible in Google Maps UI.');
  console.log('');
  console.log('Alternatives:');
  console.log('1. Use a third-party scraper (against ToS)');
  console.log('2. Use user_ratings_total as a proxy for popularity');
  console.log('3. Use review count and rating to estimate crowd levels');
  console.log('4. Generate mock data based on time of day and place type');
  console.log('');
  console.log('Current approach: Using mock data with randomization');
}

testGooglePlacesAPI().catch(console.error);

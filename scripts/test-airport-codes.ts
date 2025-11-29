#!/usr/bin/env tsx

import { AirportCodeService } from '../src/services/AirportCodeService';

async function testAirportCodes() {
  const service = new AirportCodeService();
  
  console.log('\n=== Testing Airport Code Service ===\n');
  
  // Test 1: Find nearest airport to Bangalore
  console.log('Test 1: Find nearest airport to Bangalore (12.97, 77.59)');
  const blr = await service.findNearestAirport(12.97, 77.59);
  console.log('Result:', blr);
  
  // Test 2: Find nearest airport to Bangkok
  console.log('\nTest 2: Find nearest airport to Bangkok (13.75, 100.50)');
  const bkk = await service.findNearestAirport(13.75, 100.50);
  console.log('Result:', bkk);
  
  // Test 3: Find airport by city name - Luang Prabang
  console.log('\nTest 3: Find airport for "Luang Prabang"');
  const lpq = await service.findAirportByCity('Luang Prabang');
  console.log('Result:', lpq);
  
  // Test 4: Find airport by city name - Singapore
  console.log('\nTest 4: Find airport for "Singapore"');
  const sin = await service.findAirportByCity('Singapore');
  console.log('Result:', sin);
  
  // Test 5: Find airport by city name - Chiang Mai
  console.log('\nTest 5: Find airport for "Chiang Mai"');
  const cnx = await service.findAirportByCity('Chiang Mai');
  console.log('Result:', cnx);
  
  console.log('\n=== Tests Complete ===\n');
}

testAirportCodes().catch(console.error);

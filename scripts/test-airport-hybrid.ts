#!/usr/bin/env tsx
/**
 * Test Hybrid Airport Code Resolution
 * Tests: Database → LLM → Google Places verification
 */

import { AirportCodeService } from '../src/services/AirportCodeService';

async function testHybridAirportResolution() {
  const service = new AirportCodeService();
  
  console.log('\n🧪 Testing Hybrid Airport Code Resolution\n');
  console.log('Flow: Database → LLM Suggestion → Google Places Verification\n');
  
  const testCases = [
    { city: 'Bangkok', expected: 'BKK', source: 'Database' },
    { city: 'Singapore', expected: 'SIN', source: 'Database' },
    { city: 'Luang Prabang', expected: 'LPQ', source: 'Database' },
    { city: 'Chiang Mai', expected: 'CNX', source: 'Database' },
    { city: 'Phuket', expected: 'HKT', source: 'Database' },
    { city: 'Bali', expected: 'DPS', source: 'Database' },
    { city: 'Tokyo', expected: 'NRT or HND', source: 'Database' },
    { city: 'New York', expected: 'JFK or LGA', source: 'Database' },
    { city: 'Some Obscure City', expected: 'LLM + Verification', source: 'Hybrid' },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Testing: ${testCase.city}`);
    console.log(`Expected: ${testCase.expected} (${testCase.source})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    const startTime = Date.now();
    const airport = await service.findAirportByCity(testCase.city);
    const duration = Date.now() - startTime;
    
    if (airport) {
      console.log(`✅ Result: ${airport.iata} - ${airport.name}`);
      console.log(`   City: ${airport.city}, Country: ${airport.country}`);
      console.log(`   Location: ${airport.lat.toFixed(4)}, ${airport.lon.toFixed(4)}`);
      console.log(`   Time: ${duration}ms`);
    } else {
      console.log(`❌ No airport found`);
      console.log(`   Time: ${duration}ms`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Hybrid Resolution Test Complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testHybridAirportResolution().catch(console.error);

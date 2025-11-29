#!/usr/bin/env tsx

import { TransportResearchAgent } from '../src/services/TransportResearchAgent';

async function testTransportCodes() {
  const agent = new TransportResearchAgent();
  
  console.log('\n=== Testing Transport Research Agent Airport Codes ===\n');
  
  // Test 1: Get nearest airport from Bangalore coordinates
  console.log('Test 1: Get nearest airport from Bangalore (12.97, 77.59)');
  const fromCode = await agent.getNearestAirport(12.97, 77.59);
  console.log('Result:', fromCode);
  
  // Test 2: Get destination code for Luang Prabang
  console.log('\nTest 2: Get destination code for "Luang Prabang"');
  const toCode = await agent.getDestinationCode('Luang Prabang');
  console.log('Result:', toCode);
  
  // Test 3: Get destination code for Bangkok
  console.log('\nTest 3: Get destination code for "Bangkok"');
  const bkkCode = await agent.getDestinationCode('Bangkok');
  console.log('Result:', bkkCode);
  
  // Test 4: Get destination code for Singapore
  console.log('\nTest 4: Get destination code for "Singapore"');
  const sinCode = await agent.getDestinationCode('Singapore');
  console.log('Result:', sinCode);
  
  console.log('\n=== Tests Complete ===\n');
  console.log('Summary:');
  console.log(`  From: ${fromCode}`);
  console.log(`  To Luang Prabang: ${toCode}`);
  console.log(`  To Bangkok: ${bkkCode}`);
  console.log(`  To Singapore: ${sinCode}`);
}

testTransportCodes().catch(console.error);

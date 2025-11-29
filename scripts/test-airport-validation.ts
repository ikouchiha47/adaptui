// Test Airport Validation Flow

import { AirportValidator } from '../src/services/AirportValidator';

async function testValidation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Testing Airport Validation with FTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const validator = new AirportValidator();

  // Test 1: Mixed inputs (codes, city names, airport names)
  console.log('TEST 1: Mixed Inputs');
  console.log('─────────────────────────────────────────────────────');
  const test1 = await validator.validateAirports([
    'Bangkok',
    'BKK',
    'Don Mueang',
    'Suvarnabhumi'
  ]);
  console.log('Result:', test1.map(a => `${a.iata} (${a.name})`));
  console.log('');

  // Test 2: IATA codes only
  console.log('TEST 2: IATA Codes Only');
  console.log('─────────────────────────────────────────────────────');
  const test2 = await validator.validateAirports(['JFK', 'LGA', 'EWR']);
  console.log('Result:', test2.map(a => `${a.iata} (${a.name})`));
  console.log('');

  // Test 3: City names only
  console.log('TEST 3: City Names Only');
  console.log('─────────────────────────────────────────────────────');
  const test3 = await validator.validateAirports(['Tokyo', 'Paris', 'Singapore']);
  console.log('Result:', test3.map(a => `${a.iata} (${a.city})`));
  console.log('');

  // Test 4: Invalid inputs
  console.log('TEST 4: Invalid Inputs');
  console.log('─────────────────────────────────────────────────────');
  const test4 = await validator.validateAirports(['XXX', 'InvalidCity', 'ZZZ']);
  console.log('Result:', test4.length === 0 ? 'No valid airports (expected)' : test4);
  console.log('');

  // Test 5: Get all airports for destination
  console.log('TEST 5: Get All Airports for Destination');
  console.log('─────────────────────────────────────────────────────');
  const test5 = await validator.getAirportsForDestination('Bangkok');
  console.log('Result:', test5.map(a => `${a.iata} (${a.name}) - ${a.confidence}`));
  console.log('');

  // Test 6: Duplicate handling
  console.log('TEST 6: Duplicate Handling');
  console.log('─────────────────────────────────────────────────────');
  const test6 = await validator.validateAirports([
    'BKK',
    'Bangkok',
    'BKK',
    'Suvarnabhumi',
    'BKK'
  ]);
  console.log('Result:', test6.map(a => a.iata), '(should have no duplicates)');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All tests complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testValidation().catch(console.error);

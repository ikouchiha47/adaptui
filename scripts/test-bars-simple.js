/**
 * Simple test for the bars fix
 */

console.log('🧪 Testing: Query expansion and ranking fixes\n');

// Test 1: DDG Query Sanitization
console.log('━━━ Test 1: DDG Query Sanitization ━━━\n');

function sanitizeQuery(query) {
  return query
    .replace(/["'()[\]{}]/g, '') // Remove quotes and brackets
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

const testQueries = [
  'Bangkok "underrated" "neighborhood" food blog "where locals eat"',
  'site:reddit.com "Bangkok" "hidden gem" "local favorite" -tour',
  'Bangkok bars (rooftop)',
  'site:tripadvisor.com "Bangkok" "less touristy"',
];

testQueries.forEach(q => {
  const sanitized = sanitizeQuery(q);
  const hasQuotes = sanitized.includes('"');
  const hasBrackets = /[()[\]{}]/.test(sanitized);
  
  console.log(`Original:   ${q}`);
  console.log(`Sanitized:  ${sanitized}`);
  console.log(`Status:     ${!hasQuotes && !hasBrackets ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});

// Test 2: Ranking Score Calculation
console.log('━━━ Test 2: Ranking Priority for "bars" ━━━\n');

function calculateScore(place, originalTerms) {
  let score = 0;
  
  const foundBy = (place.foundBy || '').toLowerCase();
  const placeName = (place.name || '').toLowerCase();
  const placeTypes = (place.types || []).map(t => t.toLowerCase());
  
  // Key place type keywords
  const placeTypeKeywords = ['bar', 'bars', 'restaurant', 'restaurants', 'cafe', 'cafes'];
  const keyPlaceTypes = originalTerms.filter(term => placeTypeKeywords.includes(term));
  
  // Boost places matching the main place type
  keyPlaceTypes.forEach(placeType => {
    if (foundBy.includes(placeType)) score += 20;
    if (placeName.includes(placeType)) score += 15;
    if (placeTypes.some(t => t.includes(placeType) || placeType.includes(t))) score += 12;
  });
  
  // Other terms (adjectives)
  const otherTerms = originalTerms.filter(term => !keyPlaceTypes.includes(term));
  otherTerms.forEach(term => {
    if (foundBy.includes(term)) score += 5;
    if (placeName.includes(term)) score += 3;
  });
  
  // Rating bonus
  if (place.rating) score += place.rating;
  
  return score;
}

const mockPlaces = [
  { 
    name: 'SEA LIFE Bangkok Ocean World', 
    foundBy: 'fun things to do in bangkok', 
    rating: 4.4, 
    types: ['aquarium', 'tourist_attraction'] 
  },
  { 
    name: 'Sky Bar Bangkok', 
    foundBy: 'fun bars in bangkok', 
    rating: 4.5, 
    types: ['bar', 'night_club'] 
  },
  { 
    name: 'Dee Lounge and Beer Garden', 
    foundBy: 'bars in bangkok', 
    rating: 4.4, 
    types: ['bar', 'restaurant'] 
  },
  { 
    name: 'ISKCON Temple', 
    foundBy: 'fun places in bangkok', 
    rating: 4.7, 
    types: ['hindu_temple', 'place_of_worship'] 
  },
];

const originalTerms = 'fun bars in bangkok'.split(' ');

console.log('Query: "fun bars in Bangkok"\n');
console.log('Scoring:');
mockPlaces.forEach(place => {
  const score = calculateScore(place, originalTerms);
  const isBar = place.types.some(t => t.includes('bar'));
  console.log(`  ${place.name}`);
  console.log(`    Score: ${score} ${isBar ? '🍺' : '❌'}`);
  console.log(`    Types: ${place.types.join(', ')}`);
  console.log();
});

// Sort by score
const ranked = [...mockPlaces].sort((a, b) => {
  return calculateScore(b, originalTerms) - calculateScore(a, originalTerms);
});

console.log('🏆 Ranked Results:');
ranked.forEach((place, i) => {
  const score = calculateScore(place, originalTerms);
  const isBar = place.types.some(t => t.includes('bar'));
  console.log(`  ${i + 1}. ${place.name} (score: ${score}) ${isBar ? '🍺' : '❌'}`);
});

console.log('\n✅ Tests complete!');
console.log('\nExpected: Bars should rank higher than aquarium and temple');
console.log('Result:', ranked[0].types.some(t => t.includes('bar')) ? '✅ PASS' : '❌ FAIL');

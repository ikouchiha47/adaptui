/**
 * Test: "fun bars in Bangkok" should return actual bars
 */

import { LLMProviderFactory } from '../src/core/LLMProviderFactory';
import { QueryProcessingService } from '../src/services/QueryProcessingService';

async function testBarsFix() {
  console.log('🧪 Testing: "fun bars in Bangkok" fix\n');
  
  const llm = LLMProviderFactory.getProvider();
  
  // Test 1: Query expansion should preserve "bars"
  console.log('━━━ Test 1: Query Expansion ━━━');
  const processed = await QueryProcessingService.processQuery(
    'fun bars in Bangkok',
    llm,
    {
      userLocation: { city: 'Bangkok' },
      availableDataSources: ['google_places'],
      timestamp: new Date(),
    }
  );
  
  console.log('\n📝 Original:', processed.original);
  console.log('\n🔄 Expanded queries:');
  processed.expansion.expanded.forEach((q, i) => {
    const hasBars = q.toLowerCase().includes('bar');
    console.log(`  ${i + 1}. ${q} ${hasBars ? '✅' : '❌ MISSING "bar"'}`);
  });
  
  // Test 2: Check if "bars" is prioritized in ranking
  console.log('\n━━━ Test 2: Ranking Priority ━━━');
  const { SimpleKeywordRanker } = await import('../src/services/ranking/PlaceRanker');
  const ranker = new SimpleKeywordRanker();
  
  const mockPlaces = [
    { placeId: '1', name: 'SEA LIFE Bangkok Ocean World', foundBy: 'fun things to do', rating: 4.4, types: ['aquarium'] },
    { placeId: '2', name: 'Sky Bar Bangkok', foundBy: 'fun bars in Bangkok', rating: 4.5, types: ['bar', 'night_club'] },
    { placeId: '3', name: 'Dee Lounge and Beer Garden', foundBy: 'bars in Bangkok', rating: 4.4, types: ['bar'] },
    { placeId: '4', name: 'ISKCON Temple', foundBy: 'fun places', rating: 4.7, types: ['hindu_temple'] },
  ];
  
  const ranked = ranker.rank(mockPlaces, { originalQuery: 'fun bars in Bangkok' });
  
  console.log('\n🏆 Ranked results:');
  ranked.forEach((place, i) => {
    const isBar = place.types.some((t: string) => t.includes('bar'));
    console.log(`  ${i + 1}. ${place.name} ${isBar ? '🍺' : '❌'} (rating: ${place.rating})`);
  });
  
  // Test 3: DDG query sanitization
  console.log('\n━━━ Test 3: DDG Query Sanitization ━━━');
  const { DDGScraperService } = await import('../src/services/DDGScraperService');
  const ddg = new DDGScraperService();
  
  const testQueries = [
    'Bangkok "underrated" "neighborhood" food blog',
    'site:reddit.com "Bangkok" "hidden gem"',
    'Bangkok bars (rooftop)',
  ];
  
  console.log('\nSanitization test:');
  testQueries.forEach(q => {
    // Access private method via reflection for testing
    const sanitized = (ddg as any).sanitizeQuery(q);
    console.log(`  Original: ${q}`);
    console.log(`  Sanitized: ${sanitized}`);
    console.log(`  Has quotes: ${sanitized.includes('"') ? '❌ FAIL' : '✅ PASS'}`);
    console.log();
  });
  
  console.log('✅ All tests complete!');
}

testBarsFix().catch(console.error);

/**
 * Test LLM Re-ranker
 */

import { LLMReranker } from '../src/services/ranking/LLMReranker';

async function testLLMReranker() {
  console.log('🧪 Testing LLM Re-ranker\n');
  
  const mockPlaces = [
    {
      placeId: '1',
      name: 'SEA LIFE Bangkok Ocean World',
      types: ['aquarium', 'tourist_attraction'],
      rating: 4.4,
      userRatingsTotal: 15234,
      foundBy: 'fun things to do in bangkok',
      generativeSummary: {
        overview: 'Large aquarium with marine life exhibits'
      }
    },
    {
      placeId: '2',
      name: 'Sky Bar Bangkok',
      types: ['bar', 'night_club'],
      rating: 4.5,
      userRatingsTotal: 8932,
      foundBy: 'fun bars in bangkok',
      generativeSummary: {
        overview: 'Rooftop bar with stunning city views and cocktails'
      }
    },
    {
      placeId: '3',
      name: 'Dee Lounge and Beer Garden',
      types: ['bar', 'restaurant'],
      rating: 4.4,
      userRatingsTotal: 1234,
      foundBy: 'bars in bangkok',
      generativeSummary: {
        overview: 'Casual beer garden with live music'
      }
    },
    {
      placeId: '4',
      name: 'ISKCON Temple',
      types: ['hindu_temple', 'place_of_worship'],
      rating: 4.7,
      userRatingsTotal: 3456,
      foundBy: 'fun places in bangkok',
      generativeSummary: {
        overview: 'Beautiful Hindu temple with peaceful atmosphere'
      }
    },
    {
      placeId: '5',
      name: 'Maggie Choos Bar',
      types: ['bar', 'cocktail_bar'],
      rating: 4.6,
      userRatingsTotal: 2345,
      foundBy: 'hidden gem bars in bangkok',
      generativeSummary: {
        overview: 'Speakeasy-style bar with creative cocktails'
      }
    },
  ];
  
  console.log('📝 Query: "fun bars in Bangkok"\n');
  console.log('Places before re-ranking:');
  mockPlaces.forEach((p, i) => {
    const isBar = p.types.some(t => t.includes('bar'));
    console.log(`  ${i + 1}. ${p.name} ${isBar ? '🍺' : '❌'} (${p.rating}⭐)`);
  });
  
  console.log('\n🤖 Running LLM re-ranker...\n');
  
  const reranker = new LLMReranker({
    enabled: true,
    provider: 'openai',
    model: 'gpt-5-mini',
  });
  
  const reranked = await reranker.rank(mockPlaces, {
    originalQuery: 'fun bars in Bangkok',
    timestamp: new Date(),
  });
  
  console.log('\n🏆 Places after LLM re-ranking:');
  reranked.forEach((p, i) => {
    const isBar = p.types.some((t: string) => t.includes('bar'));
    console.log(`  ${i + 1}. ${p.name} ${isBar ? '🍺' : '❌'} (${p.rating}⭐)`);
  });
  
  // Verify bars are ranked higher
  const top3 = reranked.slice(0, 3);
  const barsInTop3 = top3.filter((p: any) => 
    p.types.some((t: string) => t.includes('bar'))
  ).length;
  
  console.log(`\n✅ Result: ${barsInTop3}/3 bars in top 3 ${barsInTop3 >= 2 ? '✅ PASS' : '❌ FAIL'}`);
}

testLLMReranker().catch(console.error);

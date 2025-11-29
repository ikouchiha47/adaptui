#!/usr/bin/env tsx
/**
 * Test parallel place searches (without full query processing)
 */

import { TaskExecutor } from '../src/services/TaskExecutor';

async function testParallelPlaces() {
  console.log('🧪 Testing Parallel Place Searches\n');

  // Test case: Expand "fun activities" into multiple search terms
  const testCases = [
    {
      name: 'Fun Activities in Bangkok',
      location: 'Bangkok, Thailand',
      searchTerms: [
        'entertainment venues',
        'recreational activities',
        'leisure spots',
        'interactive experiences',
        'amusement parks',
      ],
    },
    {
      name: 'Peaceful Places in Chiang Mai',
      location: 'Chiang Mai, Thailand',
      searchTerms: [
        'quiet temples',
        'serene locations',
        'peaceful gardens',
        'meditation centers',
        'tranquil spots',
      ],
    },
  ];

  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`📍 Location: ${testCase.location}`);
    console.log(`🔍 Search Terms: ${testCase.searchTerms.length}`);
    console.log('='.repeat(80) + '\n');

    try {
      // Execute parallel searches
      const results = await TaskExecutor.executeParallelPlaceSearches(
        testCase.searchTerms,
        testCase.location
      );

      console.log('\n📊 Results Summary:');
      console.log('─'.repeat(80));
      
      let totalPlaces = 0;
      results.forEach((places, term) => {
        totalPlaces += places.length;
        console.log(`\n🔍 "${term}": ${places.length} places`);
        
        // Show top 3 places for each term
        places.slice(0, 3).forEach((place, i) => {
          console.log(`   ${i + 1}. ${place.name}`);
          if (place.generativeSummary?.overview) {
            console.log(`      ${place.generativeSummary.overview}`);
          }
        });
      });

      console.log(`\n✨ Total: ${totalPlaces} places found across ${results.size} searches`);

      // Step 1: Deduplicate (pure deduplication)
      const searchResultsMap = new Map(results);
      const { QueryProcessingService } = await import('../src/services/QueryProcessingService');
      const uniquePlaces = QueryProcessingService.deduplicatePlaces(searchResultsMap);

      console.log(`🎯 Unique places after deduplication: ${uniquePlaces.length}`);
      
      // Step 2: Rank using DI (pluggable ranker)
      const { SimpleKeywordRanker } = await import('../src/services/ranking/PlaceRanker');
      const ranker = new SimpleKeywordRanker();
      const originalQuery = testCase.searchTerms[0]; // Use first term as "original"
      const rankedPlaces = ranker.rank(uniquePlaces, { originalQuery });
      
      console.log(`📊 Ranked by relevance to: "${originalQuery}"`);

      // Show top 10 unique places (now ranked by relevance)
      console.log('\n📍 Top 10 Places (Ranked by Relevance):');
      console.log('─'.repeat(80));
      rankedPlaces.slice(0, 10).forEach((place, i) => {
        console.log(`\n${i + 1}. ${place.name}`);
        console.log(`   Found by: "${place.foundBy}"`);
        console.log(`   Rating: ${place.rating || 'N/A'}`);
        if (place.generativeSummary?.overview) {
          console.log(`   ${place.generativeSummary.overview}`);
        }
      });

    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Wait between test cases
    if (testCase !== testCases[testCases.length - 1]) {
      console.log('\n\n⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n\n✅ All tests complete!');
}

// Run tests
testParallelPlaces().catch(console.error);

#!/usr/bin/env tsx
/**
 * Test expanded place searches using query processing
 */

import { configManager } from '../src/config/ConfigManager';
import { OpenAICore } from '../src/core/OpenAICore';
import { QueryProcessingService } from '../src/services/QueryProcessingService';

async function testExpandedSearch() {
  console.log('🧪 Testing Expanded Place Search\n');

  // Initialize LLM
  const apiKey = configManager.getApiKeyOrNull('openai');
  if (!apiKey) {
    console.error('❌ OpenAI API key required');
    process.exit(1);
  }

  const llm = new OpenAICore(apiKey, 'gpt-4o-mini');

  // Test queries
  const testCases = [
    {
      query: 'fun activities in Bangkok',
      location: 'Bangkok, Thailand',
    },
    {
      query: 'peaceful temples in Chiang Mai',
      location: 'Chiang Mai, Thailand',
    },
    {
      query: 'romantic restaurants in Paris',
      location: { lat: 48.8566, lng: 2.3522 }, // Paris coordinates
    },
  ];

  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 Query: "${testCase.query}"`);
    console.log(`📍 Location: ${typeof testCase.location === 'string' ? testCase.location : `${testCase.location.lat}, ${testCase.location.lng}`}`);
    console.log('='.repeat(80) + '\n');

    try {
      // Step 1: Process query (expansion + decomposition + step-back)
      console.log('🔍 Step 1: Processing query...\n');
      const processed = await QueryProcessingService.processQuery(
        testCase.query,
        llm,
        {
          userLocation: {
            city: typeof testCase.location === 'string' ? testCase.location.split(',')[0] : undefined,
            coordinates: typeof testCase.location === 'object' ? testCase.location : undefined,
          },
          availableDataSources: ['google_places', 'places_insights'],
          timestamp: new Date(),
        }
      );

      console.log('\n📊 Query Processing Results:');
      console.log('─'.repeat(80));
      console.log('\n🔄 Expanded Variations:');
      processed.expansion.expanded.forEach((exp, i) => {
        console.log(`   ${i + 1}. ${exp}`);
      });

      console.log('\n🔗 Related Concepts:');
      processed.expansion.relatedConcepts.forEach((concept, i) => {
        console.log(`   ${i + 1}. ${concept}`);
      });

      console.log('\n🧩 Sub-Queries:');
      processed.decomposition.subQueries.forEach((sq, i) => {
        console.log(`   ${i + 1}. [Priority ${sq.priority}] ${sq.query}`);
        console.log(`      Purpose: ${sq.purpose}`);
      });

      console.log('\n🎯 Step-Back Reasoning:');
      console.log(`   Abstract: ${processed.stepBack.abstractQuestion}`);
      console.log(`   Principles:`);
      processed.stepBack.principles.forEach((p, i) => {
        console.log(`      ${i + 1}. ${p}`);
      });

      // Step 2: Execute expanded place searches
      console.log('\n\n🚀 Step 2: Executing expanded place searches...\n');
      const searchResults = await QueryProcessingService.executeExpandedPlaceSearches(
        processed,
        testCase.location
      );

      console.log('\n📍 Search Results by Term:');
      console.log('─'.repeat(80));
      searchResults.forEach((places, term) => {
        console.log(`\n🔍 "${term}": ${places.length} places`);
        places.slice(0, 3).forEach((place, i) => {
          console.log(`   ${i + 1}. ${place.name}`);
          if (place.generativeSummary?.overview) {
            console.log(`      ${place.generativeSummary.overview}`);
          }
        });
      });

      // Step 3: Deduplicate results
      console.log('\n\n🎯 Step 3: Deduplicating results...\n');
      const uniquePlaces = QueryProcessingService.deduplicatePlaces(searchResults);

      console.log(`\n✨ Final Results: ${uniquePlaces.length} unique places`);
      console.log('─'.repeat(80));
      uniquePlaces.slice(0, 10).forEach((place, i) => {
        console.log(`\n${i + 1}. ${place.name}`);
        console.log(`   Found by: "${place.foundBy}"`);
        if (place.generativeSummary?.overview) {
          console.log(`   ${place.generativeSummary.overview}`);
        }
        if (place.generativeSummary?.description) {
          console.log(`   ${place.generativeSummary.description.substring(0, 150)}...`);
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
testExpandedSearch().catch(console.error);

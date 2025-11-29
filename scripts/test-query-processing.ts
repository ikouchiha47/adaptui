/**
 * Test Query Processing Service
 */

import { configManager } from '../src/config/ConfigManager';
import { OpenAICore } from '../src/core/OpenAICore';
import { QueryProcessingService } from '../src/services/QueryProcessingService';

async function testQueryProcessing() {
  console.log('🧪 Testing Query Processing Service\n');
  
  // Initialize LLM (use gpt-5.1 for Responses API)
  const apiKey = configManager.getApiKeyOrNull('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key not found in config');
  }
  const llm = new OpenAICore(apiKey, 'gpt-5.1');
  
  console.log('='.repeat(60));

  const testQueries = [
    {
      query: 'fun bars in Bangkok',
      context: {
        userLocation: {
          city: 'Bangalore',
          country: 'India',
          coordinates: { lat: 12.9716, lng: 77.5946 }
        },
        availableDataSources: ['google_places', 'airports_db', 'ddg_scraper'],
        timestamp: new Date(),
        domainInstructions: [
          'If the query is about a destination different from user location, ALWAYS include transport/travel sub-queries',
          'For international destinations, include airport codes and flight options in expansions',
          'Use airports_db to find relevant airport codes for both origin and destination cities',
        ]
      }
    },
    {
      query: 'romantic dinner spots in Paris',
      context: {
        userLocation: {
          city: 'London',
          country: 'UK',
          coordinates: { lat: 51.5074, lng: -0.1278 }
        },
        availableDataSources: ['google_places', 'airports_db'],
        timestamp: new Date(),
      }
    },
    {
      query: 'how to get from Delhi to Tokyo',
      context: {
        userLocation: {
          city: 'Delhi',
          country: 'India',
          coordinates: { lat: 28.6139, lng: 77.2090 }
        },
        availableDataSources: ['airports_db', 'google_places', 'flight_search'],
        timestamp: new Date(),
      }
    },
    {
      query: 'best hiking trails near me',
      context: {
        userLocation: {
          city: 'Seattle',
          country: 'USA',
          coordinates: { lat: 47.6062, lng: -122.3321 }
        },
        availableDataSources: ['google_places', 'trail_maps', 'weather_api'],
        timestamp: new Date(),
      }
    },
  ];

  for (const { query, context } of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log(`📍 User Location: ${context.userLocation?.city}, ${context.userLocation?.country}`);
    console.log('-'.repeat(60));

    try {
      const result = await QueryProcessingService.processQuery(query, llm, context);

      console.log('\n🔄 EXPANSION:');
      console.log('  Variations:', result.expansion.expanded.slice(0, 3));
      console.log('  Synonyms:', result.expansion.synonyms);
      console.log('  Related:', result.expansion.relatedConcepts);

      console.log('\n🧩 DECOMPOSITION:');
      result.decomposition.subQueries.forEach((sq, i) => {
        console.log(`  ${i + 1}. [P${sq.priority}] ${sq.query}`);
        console.log(`     → ${sq.purpose}`);
      });

      console.log('\n🎯 STEP-BACK:');
      console.log('  Abstract:', result.stepBack.abstractQuestion);
      console.log('  Principles:', result.stepBack.principles);
      console.log('  Context:', result.stepBack.context.substring(0, 100) + '...');

      console.log('\n✨ ENHANCED QUERY:');
      console.log('  ', result.enhancedQuery);

      console.log('\n🌍 CONTEXT-INJECTED QUERY:');
      console.log('  ', result.contextInjected);

      // Route queries (with available plugins from capability system)
      console.log('\n🚦 QUERY ROUTING:');
      const { QueryRouter } = await import('../src/services/QueryRouter');
      const availablePlugins = ['neighborhood', 'transport']; // From CapabilityDetector
      const routed = QueryRouter.routeQuery(result, availablePlugins);
      
      console.log(`\n📋 Tasks (${routed.tasks.length}):`);
      routed.tasks.forEach(task => {
        console.log(`  [P${task.priority}] ${task.target}: ${task.query.substring(0, 80)}...`);
      });

      console.log(`\n🎯 Main Search Queries (${routed.mainSearch.length}):`);
      routed.mainSearch.slice(0, 3).forEach(q => {
        console.log(`  - ${q.substring(0, 80)}...`);
      });

      console.log(`\n🔌 Plugin Queries:`);
      Object.entries(routed.pluginQueries).forEach(([plugin, queries]) => {
        console.log(`  ${plugin}: ${queries?.length || 0} queries`);
        queries?.slice(0, 2).forEach(q => {
          console.log(`    - ${q.substring(0, 60)}...`);
        });
      });

      console.log(`\n✨ Expansions (${routed.expansions.length}):`);
      routed.expansions.slice(0, 3).forEach(exp => {
        console.log(`  - ${exp}`);
      });

      // Plan enrichment
      console.log('\n📊 ENRICHMENT PLANNING:');
      const { EnrichmentCoordinator } = await import('../src/services/EnrichmentCoordinator');
      const enrichmentPlan = EnrichmentCoordinator.planEnrichment(routed);
      EnrichmentCoordinator.logPlan(enrichmentPlan);
      
      const insightQueries = EnrichmentCoordinator.getInsightQueries(query, routed, enrichmentPlan);
      if (insightQueries.length > 0) {
        console.log(`\n  Insight Queries (${insightQueries.length}):`);
        insightQueries.slice(0, 3).forEach(q => {
          console.log(`    - ${q.substring(0, 60)}...`);
        });
      }

      // Show high-priority tasks (execution would happen in React Native app)
      console.log('\n⚡ HIGH-PRIORITY TASKS (would be executed in app):');
      const highPriorityTasks = routed.tasks.filter(t => t.priority >= 4);
      
      if (highPriorityTasks.length > 0) {
        console.log(`  ${highPriorityTasks.length} tasks ready for execution:`);
        highPriorityTasks.forEach(task => {
          console.log(`\n  ${task.id}:`);
          console.log(`    Target: ${task.target}`);
          console.log(`    Query: ${task.query.substring(0, 80)}...`);
          console.log(`    Purpose: ${task.purpose.substring(0, 80)}...`);
        });
      } else {
        console.log('  No high-priority tasks');
      }

      console.log('\n' + '='.repeat(60));
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

testQueryProcessing().catch(console.error);

#!/usr/bin/env tsx
/**
 * Test TravelService with advanced query processing mode
 */

import { TravelService } from '../src/services/TravelService';

async function testAdvancedMode() {
  console.log('🧪 Testing TravelService Advanced Mode\n');

  const service = new TravelService();
  await service.initializeCapabilities();

  const testQueries = [
    {
      location: 'Bangkok',
      feeling: 'fun activities',
      budget: 'mid' as const,
      advancedMode: true,
    },
    {
      location: 'Chiang Mai',
      feeling: 'peaceful temples',
      budget: 'budget' as const,
      advancedMode: true,
    },
  ];

  for (const query of testQueries) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 Query: ${query.feeling} in ${query.location}`);
    console.log(`💰 Budget: ${query.budget}`);
    console.log(`🚀 Advanced Mode: ${query.advancedMode}`);
    console.log('='.repeat(80) + '\n');

    try {
      const recommendations = await service.generateRecommendations(query);

      console.log(`\n✨ Got ${recommendations.length} recommendations\n`);

      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.destination}`);
        console.log(`   Vibe: ${rec.vibe}`);
        console.log(`   Data Source: ${rec.dataSource}`);
        console.log(`   Highlights: ${rec.highlights.length} places`);
        
        rec.highlights.slice(0, 5).forEach((h, j) => {
          console.log(`      ${j + 1}. ${h.name} (${h.type})`);
          console.log(`         ${h.description.substring(0, 100)}...`);
        });
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Wait between queries
    if (query !== testQueries[testQueries.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n✅ Test complete!');
}

testAdvancedMode().catch(console.error);

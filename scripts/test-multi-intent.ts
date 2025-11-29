#!/usr/bin/env tsx
/**
 * Test Multi-Intent Support
 * 
 * Tests if LLM returns multiple intents for ambiguous queries
 * and how it affects CrowdIntelligence query generation
 */

import { LLMProviderFactory } from '../src/core/LLMProviderFactory';

interface SearchCriteria {
  place: string;
  city: string;
  placeType: string;
  userIntent: string | string[];
  timeOfDay?: string;
}

/**
 * Construct intent-based queries (supports multi-intent)
 */
function constructIntentBasedQueries(criteria: SearchCriteria): string[] {
  const { place, city, userIntent, placeType, timeOfDay } = criteria;
  
  // Handle multi-intent: Use FIRST intent only
  if (Array.isArray(userIntent)) {
    const primaryIntent = userIntent[0];
    const additionalIntents = userIntent.slice(1);
    
    console.log(`   🎯 Multi-intent detected: [${userIntent.join(', ')}]`);
    console.log(`   Using primary: "${primaryIntent}"`);
    if (additionalIntents.length > 0) {
      console.log(`   Reserved for pagination: [${additionalIntents.join(', ')}]`);
    }
    
    // Use only the first intent
    return constructIntentBasedQueries({
      ...criteria,
      userIntent: primaryIntent
    });
  }
  
  const queries: string[] = [];
  
  queries.push(`${place} ${city} crowded busy reviews`);
  
  const intentQueries: Record<string, string[]> = {
    romantic: [
      `${place} ${city} romantic quiet intimate`,
      `${place} ${city} couples date night reviews`
    ],
    peaceful: [
      `${place} ${city} peaceful quiet calm`,
      `${place} ${city} less crowded serene`
    ],
    spiritual: [
      `${place} ${city} spiritual peaceful sacred`,
      `${place} ${city} religious quiet respectful`
    ],
    nature: [
      `${place} ${city} nature outdoor scenic`,
      `${place} ${city} natural beauty peaceful`
    ],
    adventure: [
      `${place} ${city} adventure thrilling exciting`,
      `${place} ${city} unique experience`
    ],
    cultural: [
      `${place} ${city} cultural experience authentic`,
      `${place} ${city} traditional local heritage`
    ]
  };
  
  const intentSpecific = intentQueries[userIntent] || [];
  queries.push(...intentSpecific);
  
  if (timeOfDay) {
    queries.push(`${place} ${city} ${timeOfDay} crowd level`);
  }
  
  queries.push(`site:reddit.com ${place} ${city} crowded worth it`);
  
  return queries.slice(0, 5);
}

async function testMultiIntent() {
  console.log('🧪 Testing Multi-Intent Support\n');
  console.log('='.repeat(60));
  
  const llm = LLMProviderFactory.getProvider();
  
  // Test cases that might have multiple valid intents
  const testCases = [
    {
      query: 'quiet temples in Bangkok',
      expectedIntents: ['spiritual', 'peaceful']
    },
    {
      query: 'hiking trails in Colorado',
      expectedIntents: ['adventure', 'nature']
    },
    {
      query: 'rooftop bars with views',
      expectedIntents: ['party', 'photography']
    },
    {
      query: 'traditional markets',
      expectedIntents: ['cultural', 'shopping', 'local']
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Query: "${testCase.query}"`);
    console.log(`   Expected intents: ${testCase.expectedIntents.join(', ')}`);
    console.log('-'.repeat(60));
    
    try {
      const prompt = `Analyze this travel query:
Location: ${testCase.query}
Feeling: any
Budget: mid

Extract:
1. What type of experience? Choose ONE from this list:
   - romantic, peaceful, party, cultural, fun, adventure, foodie, family,
     luxury, budget, solo, photography, nature, shopping, spiritual, local

Return JSON:
{
  "experienceType": "spiritual",
  "experienceTypes": ["spiritual", "peaceful"],
  "reasoning": "Temples are spiritual, but user wants quiet atmosphere"
}

MULTI-INTENT SUPPORT:
If the query has multiple valid interpretations, return multiple intents in experienceTypes array.
Use 1-3 intents maximum.

CRITICAL: All intents must be from the 16 valid options.`;

      const response = await llm.generateJSON(prompt, 0.3);
      const parsed = JSON.parse(response);
      
      console.log(`\n   LLM Response:`);
      console.log(`   Primary: ${parsed.experienceType}`);
      console.log(`   All: ${JSON.stringify(parsed.experienceTypes || [parsed.experienceType])}`);
      if (parsed.reasoning) {
        console.log(`   Reasoning: ${parsed.reasoning}`);
      }
      
      // Test query generation with multi-intent
      const intents = parsed.experienceTypes || [parsed.experienceType];
      
      console.log(`\n   📊 Query Generation:`);
      
      // Single intent queries
      if (intents.length === 1) {
        console.log(`   Single intent: ${intents[0]}`);
        const queries = constructIntentBasedQueries({
          place: 'Test Place',
          city: 'Bangkok',
          placeType: 'attraction',
          userIntent: intents[0],
          timeOfDay: 'morning'
        });
        console.log(`   Generated ${queries.length} queries:`);
        queries.forEach((q, i) => console.log(`      ${i + 1}. "${q}"`));
      } else {
        // Multi-intent queries
        console.log(`   Multi-intent: ${intents.join(', ')}`);
        const queries = constructIntentBasedQueries({
          place: 'Test Place',
          city: 'Bangkok',
          placeType: 'attraction',
          userIntent: intents,
          timeOfDay: 'morning'
        });
        console.log(`   Generated ${queries.length} unique queries:`);
        queries.forEach((q, i) => console.log(`      ${i + 1}. "${q}"`));
      }
      
      // Show pagination strategy
      console.log(`\n   📄 Pagination Strategy:`);
      console.log(`   Initial load: Use "${intents[0]}" intent`);
      if (intents.length > 1) {
        console.log(`   Page 2: Use "${intents[1]}" intent`);
        if (intents.length > 2) {
          console.log(`   Page 3: Use "${intents[2]}" intent`);
        }
      } else {
        console.log(`   No additional intents for pagination`);
      }
      
      // Show query count per intent
      console.log(`\n   📊 Queries per intent:`);
      intents.forEach((intent, idx) => {
        const queries = constructIntentBasedQueries({
          place: 'Test Place',
          city: 'Bangkok',
          placeType: 'attraction',
          userIntent: intent,
          timeOfDay: 'morning'
        });
        console.log(`   ${idx + 1}. "${intent}": ${queries.length} queries`);
      });
      
    } catch (error) {
      console.error(`   ❌ ERROR:`, error);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Test complete!\n');
}

// Run the test
testMultiIntent().catch(console.error);

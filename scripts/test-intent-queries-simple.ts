#!/usr/bin/env tsx
/**
 * Test Intent-Based Query Construction (Simplified)
 * 
 * Tests the query construction logic without full service initialization
 */

interface SearchCriteria {
  place: string;
  city: string;
  placeType: string;
  userIntent: string;
  timeOfDay?: string;
  dayOfWeek?: string;
}

/**
 * Simplified version of CrowdIntelligenceService.constructIntentBasedQueries()
 */
function constructIntentBasedQueries(criteria: SearchCriteria): string[] {
  const { place, city, userIntent, placeType, timeOfDay } = criteria;
  
  const queries: string[] = [];
  
  // Base query: crowd level mentions
  queries.push(`${place} ${city} crowded busy reviews`);
  
  // Comprehensive intent-specific queries
  const intentQueries: Record<string, string[]> = {
    // Romantic experiences
    romantic: [
      `${place} ${city} romantic quiet intimate`,
      `${place} ${city} couples date night reviews`,
      `${place} ${city} romantic atmosphere ambiance`
    ],
    
    // Peaceful/relaxation
    peaceful: [
      `${place} ${city} peaceful quiet calm`,
      `${place} ${city} less crowded serene`,
      `${place} ${city} relaxing tranquil atmosphere`
    ],
    
    // Party/nightlife
    party: [
      `${place} ${city} busy lively nightlife`,
      `${place} ${city} crowded popular party`,
      `${place} ${city} energetic vibrant scene`
    ],
    
    // Cultural experiences
    cultural: [
      `${place} ${city} cultural experience authentic`,
      `${place} ${city} traditional local heritage`,
      `${place} ${city} historical significance`
    ],
    
    // Fun/entertainment
    fun: [
      `${place} ${city} fun exciting vibrant`,
      `${place} ${city} popular must-visit`,
      `${place} ${city} entertaining lively`
    ],
    
    // Adventure/thrill
    adventure: [
      `${place} ${city} adventure thrilling exciting`,
      `${place} ${city} unique experience`,
      `${place} ${city} adventurous activities`
    ],
    
    // Foodie experiences
    foodie: [
      `${place} ${city} food delicious authentic`,
      `${place} ${city} culinary dining experience`,
      `${place} ${city} restaurant reviews taste`
    ],
    
    // Family-friendly
    family: [
      `${place} ${city} family friendly kids`,
      `${place} ${city} children activities safe`,
      `${place} ${city} family suitable crowd`
    ],
    
    // Luxury/upscale
    luxury: [
      `${place} ${city} luxury upscale premium`,
      `${place} ${city} high-end exclusive`,
      `${place} ${city} sophisticated elegant`
    ],
    
    // Budget/affordable
    budget: [
      `${place} ${city} affordable cheap budget`,
      `${place} ${city} value for money`,
      `${place} ${city} inexpensive worth it`
    ],
    
    // Solo travel
    solo: [
      `${place} ${city} solo traveler safe`,
      `${place} ${city} alone friendly welcoming`,
      `${place} ${city} solo experience crowd`
    ],
    
    // Photography/Instagram
    photography: [
      `${place} ${city} photogenic instagram worthy`,
      `${place} ${city} beautiful scenic views`,
      `${place} ${city} photo spots pictures`
    ],
    
    // Nature/outdoor
    nature: [
      `${place} ${city} nature outdoor scenic`,
      `${place} ${city} natural beauty peaceful`,
      `${place} ${city} outdoor activities crowd`
    ],
    
    // Shopping
    shopping: [
      `${place} ${city} shopping busy crowded`,
      `${place} ${city} stores markets vendors`,
      `${place} ${city} shopping experience crowd`
    ],
    
    // Spiritual/religious
    spiritual: [
      `${place} ${city} spiritual peaceful sacred`,
      `${place} ${city} religious quiet respectful`,
      `${place} ${city} meditation serene crowd`
    ],
    
    // Local/authentic
    local: [
      `${place} ${city} local authentic hidden`,
      `${place} ${city} locals favorite off beaten`,
      `${place} ${city} authentic experience crowd`
    ]
  };
  
  // Add intent-specific queries (fallback to 'fun' if intent not found)
  const intentSpecific = intentQueries[userIntent] || intentQueries.fun;
  queries.push(...intentSpecific);
  
  // Time-specific query if provided
  if (timeOfDay) {
    queries.push(`${place} ${city} ${timeOfDay} crowd level`);
  }
  
  // Place type specific query
  if (placeType) {
    queries.push(`${place} ${city} ${placeType} wait time busy`);
  }
  
  // Reddit-specific query for authentic reviews
  queries.push(`site:reddit.com ${place} ${city} crowded worth it`);
  
  // Limit to top 5 most relevant queries
  return queries.slice(0, 5);
}

async function testIntentBasedQueries() {
  console.log('🧪 Testing Intent-Based Query Construction\n');
  console.log('='.repeat(60));
  
  // Test different intents for the same place
  const testCases: SearchCriteria[] = [
    {
      place: 'Wat Pho',
      city: 'Bangkok',
      placeType: 'temple',
      userIntent: 'peaceful',
      timeOfDay: 'morning'
    },
    {
      place: 'Khao San Road',
      city: 'Bangkok',
      placeType: 'bar',
      userIntent: 'party',
      timeOfDay: 'night'
    },
    {
      place: 'Blue Elephant Restaurant',
      city: 'Bangkok',
      placeType: 'restaurant',
      userIntent: 'romantic',
      timeOfDay: 'evening'
    },
    {
      place: 'Jim Thompson House',
      city: 'Bangkok',
      placeType: 'tourist_attraction',
      userIntent: 'cultural',
      timeOfDay: 'afternoon'
    },
    {
      place: 'Chatuchak Market',
      city: 'Bangkok',
      placeType: 'market',
      userIntent: 'shopping',
      timeOfDay: 'morning'
    },
    {
      place: 'Lumpini Park',
      city: 'Bangkok',
      placeType: 'park',
      userIntent: 'nature',
      timeOfDay: 'morning'
    }
  ];
  
  for (const criteria of testCases) {
    console.log(`\n📍 Place: ${criteria.place}`);
    console.log(`🎯 Intent: ${criteria.userIntent}`);
    console.log(`⏰ Time: ${criteria.timeOfDay}`);
    console.log(`📝 Type: ${criteria.placeType}`);
    
    const queries = constructIntentBasedQueries(criteria);
    
    console.log(`\n✅ Generated Queries (${queries.length}):`);
    queries.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q}"`);
    });
    
    console.log('\n' + '-'.repeat(60));
  }
  
  // Test invalid intent (should fallback to 'fun')
  console.log(`\n⚠️  Testing Invalid Intent (should fallback to 'fun'):\n`);
  
  const invalidCriteria: SearchCriteria = {
    place: 'Test Place',
    city: 'Bangkok',
    placeType: 'restaurant',
    userIntent: 'invalid_intent_xyz', // Not in the list!
    timeOfDay: 'evening'
  };
  
  console.log(`📍 Place: ${invalidCriteria.place}`);
  console.log(`🎯 Intent: ${invalidCriteria.userIntent} (INVALID)`);
  
  const fallbackQueries = constructIntentBasedQueries(invalidCriteria);
  
  console.log(`\n✅ Fallback Queries (using 'fun' intent):`);
  fallbackQueries.forEach((q, i) => {
    console.log(`   ${i + 1}. "${q}"`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test complete!\n');
}

// Run the test
testIntentBasedQueries().catch(console.error);

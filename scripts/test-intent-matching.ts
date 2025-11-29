#!/usr/bin/env tsx
/**
 * Test Intent Matching Between LLM and CrowdIntelligenceService
 * 
 * Validates that LLM outputs intent keys that match CrowdIntelligenceService's hardcoded keys
 */

import { LLMProviderFactory } from '../src/core/LLMProviderFactory';

// Valid intents from CrowdIntelligenceService
const VALID_INTENTS = [
  'romantic', 'peaceful', 'party', 'cultural', 'fun', 'adventure',
  'foodie', 'family', 'luxury', 'budget', 'solo', 'photography',
  'nature', 'shopping', 'spiritual', 'local'
];

async function testIntentMatching() {
  console.log('🧪 Testing Intent Matching\n');
  console.log('='.repeat(60));
  console.log(`\n✅ Valid Intents (${VALID_INTENTS.length} total):`);
  console.log(VALID_INTENTS.join(', '));
  console.log('\n' + '='.repeat(60));
  
  const llm = LLMProviderFactory.getProvider();
  
  // Test cases with different user queries
  const testCases = [
    { query: 'romantic places in Paris', expected: 'romantic' },
    { query: 'quiet temples in Bangkok', expected: 'peaceful' },
    { query: 'nightlife in Berlin', expected: 'party' },
    { query: 'museums in London', expected: 'cultural' },
    { query: 'fun activities in Tokyo', expected: 'fun' },
    { query: 'hiking trails in Colorado', expected: 'adventure' },
    { query: 'best restaurants in Rome', expected: 'foodie' },
    { query: 'kid-friendly attractions in Orlando', expected: 'family' },
    { query: 'luxury hotels in Dubai', expected: 'luxury' },
    { query: 'cheap eats in Bangkok', expected: 'budget' },
    { query: 'solo travel spots in Iceland', expected: 'solo' },
    { query: 'Instagram spots in Santorini', expected: 'photography' },
    { query: 'nature parks in New Zealand', expected: 'nature' },
    { query: 'shopping malls in Singapore', expected: 'shopping' },
    { query: 'meditation retreats in Bali', expected: 'spiritual' },
    { query: 'hidden gems in Barcelona', expected: 'local' }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📝 Query: "${testCase.query}"`);
    console.log(`   Expected: ${testCase.expected}`);
    
    try {
      const prompt = `Analyze this travel query:
Location: ${testCase.query}
Feeling: any
Budget: mid

Extract:
1. What type of experience? Choose ONE from this list:
   - romantic: Intimate, couples, date night, love
   - peaceful: Calm, serene, quiet, relaxation, tranquil
   - party: Nightlife, lively, energetic, clubbing, dancing
   - cultural: Traditional, heritage, authentic, historical, museums
   - fun: Entertaining, exciting, vibrant, general enjoyment
   - adventure: Thrilling, unique, adventurous, extreme, adrenaline
   - foodie: Culinary, dining, food-focused, gastronomic, restaurants
   - family: Kid-friendly, family-oriented, safe for children
   - luxury: Upscale, premium, high-end, exclusive, fancy
   - budget: Affordable, cheap, value, economical, free
   - solo: Solo traveler, independent, alone-friendly, backpacker
   - photography: Photogenic, Instagram-worthy, scenic views, beautiful
   - nature: Outdoor, natural, scenic, wilderness, parks
   - shopping: Markets, stores, retail, souvenirs, malls
   - spiritual: Sacred, religious, meditation, mindfulness, temples
   - local: Authentic, hidden gems, off-beaten-path, locals' favorite

Return JSON:
{
  "experienceType": "romantic"
}

CRITICAL: experienceType MUST be one of the 16 options above`;

      const response = await llm.generateJSON(prompt, 0.3);
      const parsed = JSON.parse(response);
      const intent = parsed.experienceType;
      
      console.log(`   LLM Output: ${intent}`);
      
      // Validate intent is in valid list
      if (VALID_INTENTS.includes(intent)) {
        console.log(`   ✅ VALID - Intent matches CrowdIntelligenceService keys`);
        
        if (intent === testCase.expected) {
          console.log(`   ✅ CORRECT - Matches expected intent`);
          passCount++;
        } else {
          console.log(`   ⚠️  DIFFERENT - Expected "${testCase.expected}" but got "${intent}"`);
          passCount++; // Still valid, just different interpretation
        }
      } else {
        console.log(`   ❌ INVALID - Intent "${intent}" not in valid list!`);
        console.log(`   ⚠️  Will fallback to "fun" in CrowdIntelligenceService`);
        failCount++;
      }
      
    } catch (error) {
      console.error(`   ❌ ERROR:`, error);
      failCount++;
    }
    
    console.log('-'.repeat(60));
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Valid intents: ${passCount}/${testCases.length}`);
  console.log(`   ❌ Invalid intents: ${failCount}/${testCases.length}`);
  console.log(`   Success rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log(`\n🎉 Perfect! All LLM outputs match CrowdIntelligenceService keys!`);
  } else {
    console.log(`\n⚠️  Some intents don't match. These will fallback to "fun" in CrowdIntelligenceService.`);
  }
  
  console.log('\n✅ Test complete!\n');
}

// Run the test
testIntentMatching().catch(console.error);

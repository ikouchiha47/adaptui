// Test script for intelligent ranking system
import { RankingService } from '../src/services/RankingService';

async function testRanking() {
  console.log('🧪 Testing Intelligent Ranking System\n');

  const rankingService = new RankingService();

  // Sample places from Bangkok
  const places = [
    {
      name: 'Vertigo and Moon Bar',
      city: 'Bangkok',
      type: 'restaurant',
      rating: 4.6,
      userRatingCount: 2500,
      llmRelevanceScore: 0.9
    },
    {
      name: 'Khao San Road',
      city: 'Bangkok',
      type: 'bar',
      rating: 4.2,
      userRatingCount: 8000,
      llmRelevanceScore: 0.7
    },
    {
      name: 'Wat Arun',
      city: 'Bangkok',
      type: 'temple',
      rating: 4.7,
      userRatingCount: 15000,
      llmRelevanceScore: 0.85
    },
    {
      name: 'Chatuchak Weekend Market',
      city: 'Bangkok',
      type: 'tourist_attraction',
      rating: 4.5,
      userRatingCount: 12000,
      llmRelevanceScore: 0.8
    },
    {
      name: 'Sra Bua by Kiin Kiin',
      city: 'Bangkok',
      type: 'restaurant',
      rating: 4.8,
      userRatingCount: 450,
      llmRelevanceScore: 0.95
    }
  ];

  // Test 1: Romantic evening
  console.log('📍 Test 1: Romantic Evening Experience');
  console.log('=' .repeat(60));
  const romanticScores = await rankingService.rankPlaces(places, {
    userIntent: 'romantic',
    timeOfDay: 'evening',
    dayOfWeek: 'saturday',
    prioritizeOpen: true
  });

  console.log('\n🏆 Rankings:');
  romanticScores.forEach((score, idx) => {
    console.log(`\n${idx + 1}. ${score.placeName} - ${score.totalScore}/100`);
    console.log(`   Breakdown:`);
    console.log(`   - Sentiment Match: ${score.breakdown.sentimentMatch}/${25}`);
    console.log(`   - Crowd Level: ${score.breakdown.crowdLevel}/${20}`);
    console.log(`   - Opening Hours: ${score.breakdown.openingHours}/${15}`);
    console.log(`   - Rating: ${score.breakdown.rating}/${20}`);
    console.log(`   - LLM Relevance: ${score.breakdown.llmRelevance}/${20}`);
    console.log(`   Reasoning: ${score.reasoning}`);
    if (score.crowdIntel) {
      console.log(`   Crowd: ${score.crowdIntel.level} (confidence: ${score.crowdIntel.confidence.toFixed(2)})`);
      console.log(`   Best Time: ${score.crowdIntel.bestTimeToVisit}`);
    }
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Party night
  console.log('📍 Test 2: Party Night Experience');
  console.log('='.repeat(60));
  const partyScores = await rankingService.rankPlaces(places, {
    userIntent: 'party',
    timeOfDay: 'night',
    dayOfWeek: 'friday',
    prioritizeOpen: true
  });

  console.log('\n🏆 Rankings:');
  partyScores.forEach((score, idx) => {
    console.log(`\n${idx + 1}. ${score.placeName} - ${score.totalScore}/100`);
    console.log(`   Breakdown:`);
    console.log(`   - Sentiment Match: ${score.breakdown.sentimentMatch}/${25}`);
    console.log(`   - Crowd Level: ${score.breakdown.crowdLevel}/${20}`);
    console.log(`   - Opening Hours: ${score.breakdown.openingHours}/${15}`);
    console.log(`   - Rating: ${score.breakdown.rating}/${20}`);
    console.log(`   - LLM Relevance: ${score.breakdown.llmRelevance}/${20}`);
    console.log(`   Reasoning: ${score.reasoning}`);
    if (score.crowdIntel) {
      console.log(`   Crowd: ${score.crowdIntel.level}`);
    }
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Peaceful morning
  console.log('📍 Test 3: Peaceful Morning Experience');
  console.log('='.repeat(60));
  const peacefulScores = await rankingService.rankPlaces(places, {
    userIntent: 'peaceful',
    timeOfDay: 'morning',
    dayOfWeek: 'monday',
    prioritizeOpen: true
  });

  console.log('\n🏆 Rankings:');
  peacefulScores.forEach((score, idx) => {
    console.log(`\n${idx + 1}. ${score.placeName} - ${score.totalScore}/100`);
    console.log(`   Breakdown:`);
    console.log(`   - Sentiment Match: ${score.breakdown.sentimentMatch}/${25}`);
    console.log(`   - Crowd Level: ${score.breakdown.crowdLevel}/${20}`);
    console.log(`   - Opening Hours: ${score.breakdown.openingHours}/${15}`);
    console.log(`   - Rating: ${score.breakdown.rating}/${20}`);
    console.log(`   - LLM Relevance: ${score.breakdown.llmRelevance}/${20}`);
    console.log(`   Reasoning: ${score.reasoning}`);
    if (score.crowdIntel) {
      console.log(`   Crowd: ${score.crowdIntel.level}`);
    }
  });

  console.log('\n✅ All ranking tests completed!');
}

testRanking().catch(console.error);

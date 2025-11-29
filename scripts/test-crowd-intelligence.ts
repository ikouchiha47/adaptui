// Test script for enhanced Crowd Intelligence Service
import { CacheService } from '../src/services/CacheService';
import { CrowdIntelligenceService, SearchCriteria } from '../src/services/CrowdIntelligenceService';

async function testCrowdIntelligence() {
  console.log('🧪 Testing Enhanced Crowd Intelligence Service\n');

  // Initialize cache
  await CacheService.init();

  const service = new CrowdIntelligenceService();

  // Test case 1: Romantic restaurant
  const criteria1: SearchCriteria = {
    place: 'Vertigo and Moon Bar',
    city: 'Bangkok',
    placeType: 'restaurant',
    userIntent: 'romantic',
    timeOfDay: 'evening',
    dayOfWeek: 'saturday'
  };

  console.log('📍 Test 1: Romantic restaurant on Saturday evening');
  console.log('Criteria:', criteria1);
  const result1 = await service.analyzeCrowd(criteria1);
  console.log('\n✅ Result:');
  console.log('- Crowd Level:', result1.level);
  console.log('- Confidence:', result1.confidence.toFixed(2));
  console.log('- Sentiment Match:', result1.sentimentMatch.toFixed(2));
  console.log('- Best Time:', result1.bestTimeToVisit);
  console.log('- Reasoning:', result1.reasoning);
  if (result1.placeSummary) {
    console.log('- Place:', result1.placeSummary.name);
    console.log('- Rating:', result1.placeSummary.rating);
    console.log('- Summary:', result1.placeSummary.summary?.substring(0, 100) + '...');
  }
  if (result1.openingHours) {
    console.log('- Status:', result1.openingHours.currentStatus);
    console.log('- Open Now:', result1.openingHours.isOpen);
  }
  console.log('- Sources:', result1.sources);

  console.log('\n' + '='.repeat(60) + '\n');

  // Test case 2: Party bar
  const criteria2: SearchCriteria = {
    place: 'Khao San Road',
    city: 'Bangkok',
    placeType: 'bar',
    userIntent: 'party',
    timeOfDay: 'night',
    dayOfWeek: 'friday'
  };

  console.log('📍 Test 2: Party bar on Friday night');
  console.log('Criteria:', criteria2);
  const result2 = await service.analyzeCrowd(criteria2);
  console.log('\n✅ Result:');
  console.log('- Crowd Level:', result2.level);
  console.log('- Confidence:', result2.confidence.toFixed(2));
  console.log('- Sentiment Match:', result2.sentimentMatch.toFixed(2));
  console.log('- Best Time:', result2.bestTimeToVisit);
  console.log('- Reasoning:', result2.reasoning);
  if (result2.placeSummary) {
    console.log('- Place:', result2.placeSummary.name);
    console.log('- Rating:', result2.placeSummary.rating);
  }
  if (result2.openingHours) {
    console.log('- Status:', result2.openingHours.currentStatus);
  }
  console.log('- Sources:', result2.sources);

  console.log('\n' + '='.repeat(60) + '\n');

  // Test case 3: Peaceful temple
  const criteria3: SearchCriteria = {
    place: 'Wat Arun',
    city: 'Bangkok',
    placeType: 'temple',
    userIntent: 'peaceful',
    timeOfDay: 'morning',
    dayOfWeek: 'monday'
  };

  console.log('📍 Test 3: Peaceful temple on Monday morning');
  console.log('Criteria:', criteria3);
  const result3 = await service.analyzeCrowd(criteria3);
  console.log('\n✅ Result:');
  console.log('- Crowd Level:', result3.level);
  console.log('- Confidence:', result3.confidence.toFixed(2));
  console.log('- Sentiment Match:', result3.sentimentMatch.toFixed(2));
  console.log('- Best Time:', result3.bestTimeToVisit);
  console.log('- Reasoning:', result3.reasoning);
  if (result3.placeSummary) {
    console.log('- Place:', result3.placeSummary.name);
    console.log('- Rating:', result3.placeSummary.rating);
  }
  if (result3.openingHours) {
    console.log('- Status:', result3.openingHours.currentStatus);
  }
  console.log('- Sources:', result3.sources);

  console.log('\n' + '='.repeat(60) + '\n');

  // Show cache stats
  const stats = await CacheService.getStats();
  console.log('📊 Cache Statistics:');
  console.log('- Total entries:', stats.total);
  console.log('- By namespace:', stats.namespaces);

  console.log('\n✅ All tests completed!');
}

testCrowdIntelligence().catch(console.error);

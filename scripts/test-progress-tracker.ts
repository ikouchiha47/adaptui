/**
 * Test SearchProgressTracker
 */

import { SearchProgressTracker } from '../src/services/SearchProgressTracker';

async function testProgressTracker() {
  console.log('🧪 Testing SearchProgressTracker...\n');

  // Subscribe to updates
  const unsubscribe = SearchProgressTracker.subscribe((progress) => {
    console.log('📊 Progress Update:', {
      step: `${progress.currentStep}/${progress.totalSteps}`,
      task: progress.currentTask,
      status: progress.status,
      results: progress.results,
    });
  });

  // Simulate a search with 5 steps
  SearchProgressTracker.startSearch(5);
  
  for (let i = 1; i <= 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    SearchProgressTracker.updateStep(i, `Searching term ${i}`, i * 3);
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  SearchProgressTracker.completeSearch(15);

  unsubscribe();
  console.log('\n✅ Test complete');
}

testProgressTracker().catch(console.error);

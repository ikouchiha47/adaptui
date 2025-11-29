#!/usr/bin/env tsx
/**
 * Test Sentiment Analysis with Natural NLP
 */

import { sentimentAnalyzer } from '../src/services/SentimentAnalyzer';

async function testSentimentAnalysis() {
  console.log('🧪 Testing Sentiment Analysis with Natural NLP\n');
  console.log('='.repeat(60));
  
  // Test cases with different sentiments
  const testCases = [
    {
      name: 'Very Positive Review',
      text: 'Amazing place! Beautiful atmosphere, delicious food, and excellent service. Highly recommend!'
    },
    {
      name: 'Positive Review',
      text: 'Nice restaurant with good food. The staff was friendly and helpful.'
    },
    {
      name: 'Neutral Review',
      text: 'The place is okay. Nothing special but not bad either. Average experience.'
    },
    {
      name: 'Negative Review',
      text: 'Disappointing experience. The food was cold and the service was slow. Not worth it.'
    },
    {
      name: 'Very Negative Review',
      text: 'Terrible! Awful food, rude staff, dirty place. Complete waste of money. Never going back!'
    },
    {
      name: 'Crowd Analysis - Busy',
      text: 'Very crowded and packed. Long wait times. The place was extremely busy with huge lines.'
    },
    {
      name: 'Crowd Analysis - Quiet',
      text: 'Peaceful and quiet. Empty and serene. Perfect for relaxation with no crowds.'
    },
    {
      name: 'Mixed Sentiment',
      text: 'Great location and beautiful views, but the food was mediocre and overpriced. Service was slow.'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.name}`);
    console.log(`Text: "${testCase.text}"`);
    console.log('-'.repeat(60));
    
    // Basic sentiment analysis
    const sentiment = sentimentAnalyzer.analyze(testCase.text);
    console.log(`\n✅ Sentiment Analysis:`);
    console.log(`   Score: ${sentiment.score.toFixed(3)} (-1 to 1)`);
    console.log(`   Classification: ${sentiment.classification}`);
    console.log(`   Confidence: ${(sentiment.confidence * 100).toFixed(1)}%`);
    
    // Extract sentiment keywords
    const keywords = sentimentAnalyzer.extractSentimentKeywords(testCase.text, 5);
    if (keywords.length > 0) {
      console.log(`\n   Key sentiment words:`);
      keywords.forEach(kw => {
        const emoji = kw.sentiment === 'positive' ? '✅' : '❌';
        console.log(`     ${emoji} ${kw.word} (${kw.sentiment})`);
      });
    }
    
    // Crowd-specific analysis
    const crowdAnalysis = sentimentAnalyzer.analyzeCrowdSentiment(testCase.text);
    console.log(`\n   Crowd Analysis:`);
    console.log(`     Level: ${crowdAnalysis.crowdLevel}`);
    if (crowdAnalysis.crowdKeywords.length > 0) {
      console.log(`     Keywords: ${crowdAnalysis.crowdKeywords.join(', ')}`);
    }
  }
  
  // Test multiple text analysis
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 Multiple Text Analysis\n');
  
  const reviews = [
    'Great place! Loved it.',
    'Amazing experience, highly recommend.',
    'Good but a bit crowded.',
    'Not bad, decent food.'
  ];
  
  console.log('Reviews:');
  reviews.forEach((r, i) => console.log(`  ${i + 1}. "${r}"`));
  
  const multiResult = sentimentAnalyzer.analyzeMultiple(reviews);
  console.log(`\n✅ Combined Sentiment:`);
  console.log(`   Score: ${multiResult.score.toFixed(3)}`);
  console.log(`   Classification: ${multiResult.classification}`);
  console.log(`   Confidence: ${(multiResult.confidence * 100).toFixed(1)}%`);
  
  // Test comparison
  console.log('\n\n' + '='.repeat(60));
  console.log('⚖️  Sentiment Comparison\n');
  
  const text1 = 'Absolutely wonderful! Best experience ever!';
  const text2 = 'Terrible service. Very disappointing.';
  
  console.log(`Text 1: "${text1}"`);
  console.log(`Text 2: "${text2}"`);
  
  const comparison = sentimentAnalyzer.compare(text1, text2);
  console.log(`\n✅ Comparison:`);
  console.log(`   Text 1: ${comparison.text1.classification} (${comparison.text1.score.toFixed(3)})`);
  console.log(`   Text 2: ${comparison.text2.classification} (${comparison.text2.score.toFixed(3)})`);
  console.log(`   Difference: ${comparison.difference.toFixed(3)}`);
  console.log(`   More positive: ${comparison.morePositive}`);
  
  console.log('\n✅ Test complete!\n');
}

// Run the test
testSentimentAnalysis().catch(console.error);

// Test Reddit Scraper
import { RedditScraperService } from '../src/services/RedditScraperService';

async function testRedditScraper() {
  console.log('🧪 Testing Reddit Scraper\n');
  
  const scraper = new RedditScraperService();
  
  // Test cases
  const testCases = [
    {
      name: 'Hidden gems in Sukhumvit',
      query: 'hidden gems near Sukhumvit Bangkok',
    },
    {
      name: 'Underrated restaurants Bangkok',
      query: 'underrated restaurants Bangkok not touristy',
    },
    {
      name: 'Bangkok local favorites',
      query: 'Bangkok local favorites reddit',
    },
  ];
  
  console.log('='.repeat(80));
  console.log('TEST 1: Single Search');
  console.log('='.repeat(80));
  
  for (const testCase of testCases) {
    console.log(`\n📝 Query: "${testCase.query}"`);
    console.log('-'.repeat(80));
    
    const results = await scraper.search(testCase.query);
    
    console.log(`✅ Found ${results.length} posts\n`);
    
    if (results.length > 0) {
      console.log('Top 3 results:');
      results.slice(0, 3).forEach((post, idx) => {
        console.log(`\n${idx + 1}. ${post.title}`);
        console.log(`   Subreddit: r/${post.subreddit || 'unknown'}`);
        console.log(`   URL: ${post.url}`);
        if (post.snippet) {
          console.log(`   Snippet: ${post.snippet.slice(0, 100)}...`);
        }
      });
    } else {
      console.log('⚠️ No results found');
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Parallel Search');
  console.log('='.repeat(80));
  
  const parallelQueries = testCases.map(tc => tc.query);
  console.log(`\n🚀 Searching ${parallelQueries.length} queries in parallel...\n`);
  
  const parallelResults = await scraper.searchParallel(parallelQueries);
  
  console.log('\n📊 Results Summary:');
  parallelResults.forEach((posts, query) => {
    console.log(`  • "${query}": ${posts.length} posts`);
  });
  
  console.log('\n✅ All tests complete!');
}

// Run tests
testRedditScraper().catch(console.error);

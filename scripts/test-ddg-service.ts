// Test DDG Scraper Service
// Run with: npx tsx scripts/test-ddg-service.ts

import { DDGScraperService } from '../src/services/DDGScraperService';

async function test() {
  console.log('Testing DDGScraperService');
  console.log('='.repeat(60));
  
  const scraper = new DDGScraperService();
  const query = 'flights bangalore to bangkok skyscanner';
  
  console.log('Query:', query);
  console.log('');
  
  const results = await scraper.search(query);
  
  console.log('');
  console.log('Results:', results.length);
  console.log('');
  
  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.title}`);
    console.log(`   ${result.url}`);
    console.log('');
  });
  
  // Find Skyscanner URLs
  const skyscannerResults = results.filter(r => 
    r.url.includes('skyscanner') || 
    r.title.toLowerCase().includes('skyscanner')
  );
  
  console.log('='.repeat(60));
  console.log(`Found ${skyscannerResults.length} Skyscanner results`);
  
  if (skyscannerResults.length > 0) {
    console.log('');
    console.log('Skyscanner URLs:');
    skyscannerResults.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.url}`);
    });
  }
}

test();

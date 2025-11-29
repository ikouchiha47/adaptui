#!/usr/bin/env tsx
/**
 * Test DDG HTML structure to understand how to parse it
 */

import * as fs from 'fs';

async function testDDGHTML() {
  console.log('🔍 Testing DDG HTML structure...\n');
  
  const query = 'Wat Pho Bangkok crowded';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  console.log('Fetching:', url);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };
  
  const response = await fetch(url, { headers });
  const html = await response.text();
  
  console.log('Response status:', response.status);
  console.log('HTML length:', html.length);
  console.log('Has CAPTCHA:', html.includes('anomaly-modal'));
  
  // Save HTML to file for inspection
  fs.writeFileSync('ddg-sample.html', html);
  console.log('\n✅ Saved HTML to ddg-sample.html');
  
  // Extract a sample result block
  const resultMatch = html.match(/<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]{0,500}/);
  if (resultMatch) {
    console.log('\n📝 Sample result block:');
    console.log(resultMatch[0]);
  }
  
  // Look for result links
  const linkMatches = html.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>[\s\S]{0,200}/g);
  if (linkMatches) {
    console.log(`\n🔗 Found ${linkMatches.length} result links`);
    console.log('First link:', linkMatches[0]);
  }
}

testDDGHTML().catch(console.error);

// Test DDG Scraper
// Run with: npx tsx scripts/test-ddg-scraper.ts

async function testDDG() {
  console.log('Testing DDG Scraper with Host header');
  console.log('='.repeat(60));
  
  const query = 'flights bangalore to bangkok skyscanner';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const headers = {
    'Host': 'html.duckduckgo.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };
  
  console.log('URL:', url);
  console.log('Headers:', headers);
  console.log('');
  
  try {
    const response = await fetch(url, { headers });
    const html = await response.text();
    
    console.log('Status:', response.status);
    console.log('Response length:', html.length);
    console.log('');
    
    // Check for CAPTCHA
    if (html.includes('anomaly-modal')) {
      console.log('❌ CAPTCHA detected!');
      console.log('');
      
      // Show first 500 chars
      console.log('HTML preview:');
      console.log(html.substring(0, 500));
      return;
    }
    
    console.log('✅ No CAPTCHA detected');
    console.log('');
    
    // Try to find result links
    const patterns = [
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*class="result__url"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/g,
    ];
    
    console.log('Trying to extract links...');
    console.log('');
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = [...html.matchAll(pattern)];
      
      console.log(`Pattern ${i + 1}: Found ${matches.length} matches`);
      
      if (matches.length > 0) {
        console.log('First 3 matches:');
        matches.slice(0, 3).forEach((match, idx) => {
          console.log(`  ${idx + 1}. URL: ${match[1]}`);
          if (match[2]) console.log(`     Title: ${match[2]}`);
        });
        console.log('');
      }
    }
    
    // Look for any links with "skyscanner" in them
    const skyscannerMatches = html.match(/https?:\/\/[^"'\s]*skyscanner[^"'\s]*/gi);
    if (skyscannerMatches) {
      console.log(`Found ${skyscannerMatches.length} Skyscanner URLs:`);
      skyscannerMatches.slice(0, 5).forEach((url, idx) => {
        console.log(`  ${idx + 1}. ${url}`);
      });
    } else {
      console.log('No Skyscanner URLs found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDDG();

// Test Google Basic HTML search
// Old browser UAs that trigger basic HTML mode

const oldBrowserUAs = [
  // IE 6-8 (ancient)
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)',
  'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
  'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)',
  
  // Old Firefox
  'Mozilla/5.0 (Windows NT 6.1; rv:2.0) Gecko/20100101 Firefox/4.0',
  
  // Old Chrome
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.112 Safari/534.30',
  
  // Lynx (text browser)
  'Lynx/2.8.8rel.2 libwww-FM/2.14 SSL-MM/1.4.1 OpenSSL/1.0.1e',
  
  // w3m (text browser)
  'w3m/0.5.3',
  
  // Links (text browser)
  'Links (2.7; Linux 3.10.0-693.el7.x86_64 x86_64; GNU C 4.8.5; text)',
];

async function testGoogleBasic() {
  console.log('🧪 Testing Google Basic HTML Search\n');
  console.log('='.repeat(80));
  
  const query = 'hidden gems Bangkok';
  const urls = [
    `https://www.google.com/search?q=${encodeURIComponent(query)}&gbv=1`,
    `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=14`,
  ];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ua = oldBrowserUAs[i % oldBrowserUAs.length];
    
    console.log(`\n📝 Test ${i + 1}: ${url}`);
    console.log(`🔧 User-Agent: ${ua.slice(0, 60)}...`);
    console.log('-'.repeat(80));
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      const html = await response.text();
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📏 Size: ${html.length} bytes`);
      console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
      
      // Check for common patterns
      const hasResults = html.includes('search') || html.includes('result');
      const hasCaptcha = html.includes('captcha') || html.includes('unusual traffic');
      const hasBasicHTML = html.includes('gbv=1') || !html.includes('<script');
      
      console.log(`\n🔍 Analysis:`);
      console.log(`  Has search results: ${hasResults}`);
      console.log(`  Has CAPTCHA: ${hasCaptcha}`);
      console.log(`  Basic HTML mode: ${hasBasicHTML}`);
      
      // Print first 2000 chars of HTML
      console.log(`\n📄 HTML Preview (first 2000 chars):`);
      console.log('─'.repeat(80));
      console.log(html.slice(0, 2000));
      console.log('─'.repeat(80));
      
      // Look for result divs
      const resultMatches = html.match(/<div[^>]*class="[^"]*g[^"]*"[^>]*>/g);
      if (resultMatches) {
        console.log(`\n✅ Found ${resultMatches.length} potential result divs`);
      }
      
      // Look for links
      const linkMatches = html.match(/<a[^>]*href="[^"]*"[^>]*>/g);
      if (linkMatches) {
        console.log(`✅ Found ${linkMatches.length} links`);
        console.log(`\nFirst 5 links:`);
        linkMatches.slice(0, 5).forEach((link, idx) => {
          console.log(`  ${idx + 1}. ${link.slice(0, 100)}...`);
        });
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Wait between requests
    if (i < urls.length - 1) {
      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!');
}

testGoogleBasic().catch(console.error);

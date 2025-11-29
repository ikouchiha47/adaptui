// Debug Reddit HTML structure

async function debugReddit() {
  const query = 'Bangkok hidden gems';
  const url = `https://old.reddit.com/search?q=${encodeURIComponent(query)}`;
  
  console.log(`Fetching: ${url}\n`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://old.reddit.com/',
  };
  
  const response = await fetch(url, { headers });
  const html = await response.text();
  
  console.log(`Response: ${response.status}, ${html.length} bytes\n`);
  
  // Look for different patterns
  const patterns = [
    { name: 'search-title', regex: /search-title/g },
    { name: 'search-result', regex: /search-result/g },
    { name: 'class="title"', regex: /class="title"/g },
    { name: 'data-subreddit', regex: /data-subreddit/g },
    { name: 'thing id', regex: /thing id/g },
    { name: '<a class="', regex: /<a class="/g },
  ];
  
  console.log('Pattern matches:');
  patterns.forEach(p => {
    const matches = html.match(p.regex);
    console.log(`  ${p.name}: ${matches ? matches.length : 0} matches`);
  });
  
  // Save a sample of HTML
  console.log('\n\nFirst 2000 chars of HTML:');
  console.log('='.repeat(80));
  console.log(html.slice(0, 2000));
  console.log('='.repeat(80));
  
  // Look for any links
  const linkRegex = /<a[^>]*href="([^"]*\/r\/[^"]*)"[^>]*>([^<]*)<\/a>/g;
  let match;
  let count = 0;
  console.log('\n\nFirst 5 Reddit links found:');
  while ((match = linkRegex.exec(html)) !== null && count < 5) {
    console.log(`${count + 1}. ${match[2]}`);
    console.log(`   ${match[1]}`);
    count++;
  }
}

debugReddit().catch(console.error);

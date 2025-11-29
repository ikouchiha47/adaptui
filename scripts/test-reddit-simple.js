// Simple Reddit Scraper Test (no dependencies)

const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function decodeHtml(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseHTML(html) {
  const results = [];
  
  try {
    // Extract post titles
    const titleRegex = /<a[^>]*class="search-title[^>]*>([^<]+)<\/a>/g;
    let match;
    
    while ((match = titleRegex.exec(html)) !== null) {
      const title = decodeHtml(match[1]);
      
      // Skip subreddit names
      if (title.length < 3 || title.startsWith('r/')) continue;
      
      results.push({
        title,
        url: '',
        subreddit: '',
      });
    }
    
    // Extract URLs
    const urlRegex = /<a[^>]*class="search-link"[^>]*href="([^"]+)"/g;
    let urlMatch;
    let urlIdx = 0;
    
    while ((urlMatch = urlRegex.exec(html)) !== null && urlIdx < results.length) {
      const url = urlMatch[1];
      const subredditMatch = url.match(/\/r\/([^\/]+)\//);
      
      if (results[urlIdx]) {
        results[urlIdx].url = url.startsWith('http') ? url : `https://old.reddit.com${url}`;
        results[urlIdx].subreddit = subredditMatch ? subredditMatch[1] : '';
      }
      urlIdx++;
    }
    
    // Filter valid results
    const validResults = results.filter(r => r.url);
    console.log(`[Parser] Found ${validResults.length} posts`);
    return validResults;
    
  } catch (error) {
    console.error('[Parser] Error:', error.message);
    return [];
  }
}

async function searchReddit(query) {
  try {
    const searchQuery = encodeURIComponent(query);
    const url = `https://old.reddit.com/search?q=${searchQuery}`;
    
    console.log(`\n[Reddit] Fetching: ${url}`);
    
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://old.reddit.com/',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    };
    
    const response = await fetch(url, { headers });
    const html = await response.text();

    console.log(`[Reddit] Response: ${response.status}, ${html.length} bytes`);
    
    const results = parseHTML(html);
    return results;
  } catch (error) {
    console.error('[Reddit] Error:', error.message);
    return [];
  }
}

async function main() {
  console.log('🧪 Testing Reddit Scraper\n');
  console.log('='.repeat(80));
  
  const testQueries = [
    'hidden gems near Sukhumvit Bangkok',
    'underrated restaurants Bangkok',
    'Bangkok local favorites',
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(80));
    
    const results = await searchReddit(query);
    
    console.log(`\n✅ Found ${results.length} posts\n`);
    
    if (results.length > 0) {
      console.log('Top 5 results:');
      results.slice(0, 5).forEach((post, idx) => {
        console.log(`\n${idx + 1}. ${post.title}`);
        console.log(`   r/${post.subreddit || 'unknown'}`);
        console.log(`   ${post.url}`);
      });
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!');
}

main().catch(console.error);

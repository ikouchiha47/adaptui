// Test Reddit scraping with cheerio
const cheerio = require('cheerio');

async function test() {
  const url = 'https://old.reddit.com/search?q=Bangkok+hidden+gems';
  
  console.log('Fetching:', url);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
      'Accept': 'text/html',
    }
  });
  
  const html = await response.text();
  console.log('Response:', response.status, html.length, 'bytes\n');
  
  const $ = cheerio.load(html);
  
  // Find all search results
  const results = [];
  $('.contents > div.search-result').each((idx, element) => {
    const $result = $(element);
    
    const title = $result.find('a.search-title').text().trim();
    const url = $result.find('a.search-title').attr('href');
    const subreddit = $result.find('a.search-subreddit-link').text().trim().replace('r/', '');
    const snippet = $result.find('.search-result-body .md').text().trim().slice(0, 150);
    const scoreText = $result.find('.search-score').text().trim();
    const scoreMatch = scoreText.match(/(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    
    if (title && url) {
      results.push({ title, url, subreddit, score, snippet });
    }
  });
  
  console.log(`Found ${results.length} results\n`);
  
  results.slice(0, 5).forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.title}`);
    console.log(`   r/${r.subreddit} | ${r.score} points`);
    console.log(`   ${r.url}`);
    if (r.snippet) {
      console.log(`   ${r.snippet.slice(0, 100)}...`);
    }
    console.log();
  });
}

test().catch(console.error);

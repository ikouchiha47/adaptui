// Reddit Scraper for old.reddit.com with cheerio HTML parsing
import * as cheerio from 'cheerio';
import { CacheService } from './CacheService';

export interface RedditPost {
  title: string;
  url: string;
  snippet: string;
  subreddit?: string;
  score?: number;
}

export class RedditScraperService {
  private userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Search old.reddit.com with proper headers and UA rotation
   */
  async search(query: string): Promise<RedditPost[]> {
    try {
      // Check cache first
      const cacheKey = `reddit_${query}`;
      const cached = await CacheService.get<RedditPost[]>('reddit_search', cacheKey);
      if (cached) {
        console.log('✅ [RedditScraper] Using cached results');
        return cached;
      }

      const searchQuery = encodeURIComponent(query);
      const url = `https://old.reddit.com/search?q=${searchQuery}`;
      
      console.log('[RedditScraper] Fetching:', url);
      
      const headers = {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://old.reddit.com/',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      };
      
      const response = await fetch(url, { headers });
      const html = await response.text();

      console.log('[RedditScraper] Response:', { 
        status: response.status,
        length: html.length,
      });
      
      const results = this.parseHTML(html);
      
      // Cache for 1 hour
      await CacheService.set('reddit_search', cacheKey, results, 60 * 60);
      
      return results;
    } catch (error) {
      console.error('[RedditScraper] Search error:', error);
      return [];
    }
  }

  /**
   * Parse old.reddit.com HTML using cheerio
   * Structure: <div class="contents"> > <div class="search-result ...">
   */
  private parseHTML(html: string): RedditPost[] {
    const results: RedditPost[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      // Find all search result divs inside contents
      $('.contents > div.search-result').each((idx, element) => {
        const $result = $(element);
        
        // Extract title from <a class="search-title">
        const title = $result.find('a.search-title').text().trim();
        
        // Extract URL from <a class="search-title"> (it has the href)
        const titleLink = $result.find('a.search-title').attr('href');
        const url = titleLink ? 
          (titleLink.startsWith('http') ? titleLink : `https://old.reddit.com${titleLink}`) : 
          '';
        
        // Extract subreddit from the link text or URL
        const subredditLink = $result.find('a.search-subreddit-link').text().trim();
        const subreddit = subredditLink.replace('r/', '') || undefined;
        
        // Extract snippet from <div class="search-result-body"> inside <div class="md">
        const snippet = $result.find('.search-result-body .md').text().trim();
        
        // Extract score from <span class="search-score">
        const scoreText = $result.find('.search-score').text().trim();
        const scoreMatch = scoreText.match(/(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : undefined;
        
        // Only add if we have at least a title and URL
        if (title && url && title.length > 3 && !title.startsWith('r/')) {
          results.push({
            title,
            url,
            snippet: snippet.slice(0, 300), // Limit snippet length
            subreddit,
            score,
          });
        }
      });
      
      console.log('[RedditScraper] Parsed results:', results.length);
      
      return results;
      
    } catch (error) {
      console.error('[RedditScraper] Parse error:', error);
      return [];
    }
  }

  /**
   * Search multiple queries in parallel with UA rotation
   */
  async searchParallel(queries: string[]): Promise<Map<string, RedditPost[]>> {
    console.log(`[RedditScraper] Parallel search for ${queries.length} queries...`);
    
    const results = new Map<string, RedditPost[]>();
    
    // Execute searches in parallel with staggered delays
    const searchPromises = queries.map(async (query, idx) => {
      // Stagger requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, idx * 500));
      
      const posts = await this.search(query);
      return { query, posts };
    });
    
    const allResults = await Promise.all(searchPromises);
    
    allResults.forEach(({ query, posts }) => {
      results.set(query, posts);
      console.log(`  ✓ "${query}": ${posts.length} posts`);
    });
    
    return results;
  }
}

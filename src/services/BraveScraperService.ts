// Brave Search scraper with htmlparser2 (React Native compatible)
import { Element } from 'domhandler';
import { findAll, getText } from 'domutils';
import { parseDocument } from 'htmlparser2';
import { ICacheService } from './ICacheService';

export interface BraveSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class BraveScraperService {
  private cacheService: ICacheService;

  constructor(cacheService: ICacheService) {
    this.cacheService = cacheService;
  }
  private userAgents = [
    // Modern browsers (2024-2025) - tested and working
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', // Arc/Chrome 140
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15', // Safari 18.5
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0', // Firefox 145
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Encode query for Brave (use + for spaces)
   */
  private encodeQueryForBrave(query: string): string {
    // Use + for spaces (more traditional URL encoding)
    return encodeURIComponent(query).replace(/%20/g, '+');
  }

  /**
   * Search Brave with proper headers and UA rotation
   */
  async search(query: string): Promise<BraveSearchResult[]> {
    try {
      // Check cache first
      const cacheKey = `brave_${query}`;
      const cached = await this.cacheService.get<BraveSearchResult[]>('brave_search', cacheKey);
      if (cached) {
        console.log('✅ [BraveScraper] Using cached results');
        return cached;
      }

      const searchQuery = this.encodeQueryForBrave(query);
      const url = `https://search.brave.com/search?q=${searchQuery}`;
      
      console.log('[BraveScraper] Fetching:', url);
      
      const headers = {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://search.brave.com/',
        'Cache-Control': 'no-cache',
      };
      
      const response = await fetch(url, { headers });
      const html = await response.text();

      console.log('[BraveScraper] Response:', { 
        status: response.status,
        length: html.length,
      });
      
      const results = this.parseHTML(html);
      
      // Cache only on success (non-empty results, status 200)
      if (results.length > 0 && response.status === 200) {
        await this.cacheService.set('brave_search', cacheKey, results, 60 * 60 * 1000);
        console.log('✅ [BraveScraper] Cached results');
      }
      
      return results;
    } catch (error) {
      console.error('[BraveScraper] Search error:', error);
      return [];
    }
  }

  /**
   * Parse Brave Search HTML using htmlparser2 (React Native compatible)
   */
  private parseHTML(html: string): BraveSearchResult[] {
    const results: BraveSearchResult[] = [];
    
    try {
      // Parse HTML
      const dom = parseDocument(html);
      
      // Find all links that look like search results
      const links = findAll((elem: Element) => {
        return elem.type === 'tag' && 
               elem.name === 'a' && 
               elem.attribs.href?.startsWith('http') &&
               !elem.attribs.href?.includes('brave.com');
      }, dom.children);
      
      for (const link of links) {
        if (link.type !== 'tag') continue;
        
        const url = link.attribs.href || '';
        const title = getText(link).trim();
        
        // Skip if no title or already added
        if (!title || results.some(r => r.url === url)) continue;
        
        // Try to find snippet from parent or sibling elements
        let snippet = '';
        if (link.parent) {
          // Look for description/snippet in parent
          const descElems = findAll((elem: Element) => {
            return elem.type === 'tag' && 
                   (elem.name === 'p' || 
                    elem.attribs.class?.includes('snippet') ||
                    elem.attribs.class?.includes('description'));
          }, [link.parent]);
          
          if (descElems.length > 0) {
            snippet = getText(descElems[0]).trim();
          }
        }
        
        if (title.length > 3 && results.length < 20) {
          results.push({ title, url, snippet });
        }
      }
      
      console.log('[BraveScraper] Parsed results:', results.length);
      
      return results;
      
    } catch (error) {
      console.error('[BraveScraper] Parse error:', error);
      return [];
    }
  }

  /**
   * Search multiple queries in parallel with staggered delays
   */
  async searchParallel(queries: string[]): Promise<Map<string, BraveSearchResult[]>> {
    console.log(`[BraveScraper] Parallel search for ${queries.length} queries...`);
    
    const results = new Map<string, BraveSearchResult[]>();
    
    const searchPromises = queries.map(async (query, idx) => {
      // Stagger requests
      await new Promise(resolve => setTimeout(resolve, idx * 500));
      
      const searchResults = await this.search(query);
      return { query, searchResults };
    });
    
    const allResults = await Promise.all(searchPromises);
    
    allResults.forEach(({ query, searchResults }) => {
      results.set(query, searchResults);
      console.log(`  ✓ "${query}": ${searchResults.length} results`);
    });
    
    return results;
  }
}

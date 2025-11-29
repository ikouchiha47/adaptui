// DuckDuckGo HTML Scraper with htmlparser2 (React Native compatible)
import { Element } from 'domhandler';
import { findAll, findOne, textContent } from 'domutils';
import { parseDocument } from 'htmlparser2';

export interface ScrapedPlaceData {
  crowdMentions: string[];
  timeMentions: string[];
  sentimentScore: number; // -1 to 1
  recentReviews: string[];
  estimatedCrowdLevel?: 'quiet' | 'moderate' | 'busy' | 'very busy';
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class DDGScraperService {
  private baseUrl = 'https://html.duckduckgo.com/html/';
  private webViewHandler: ((url: string, callback: (html: string) => void) => void) | null = null;
  private cacheService: any; // ICacheService
  
  constructor(cacheService?: any) {
    // Lazy load cache service to avoid circular dependencies
    if (cacheService) {
      this.cacheService = cacheService;
    }
  }
  
  private userAgents = [
    // Modern browsers (2024-2025) - tested and working
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', // Arc/Chrome 140
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15', // Safari 18.5
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0', // Firefox 145
  ];
  
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Set WebView handler (called from React Native component)
   */
  setWebViewHandler(handler: (url: string, callback: (html: string) => void) => void) {
    this.webViewHandler = handler;
    console.log('[DDGScraper] WebView handler registered');
  }

  /**
   * Search DuckDuckGo using WebView (bypasses CAPTCHA)
   */
  async searchWithWebView(query: string): Promise<SearchResult[]> {
    if (!this.webViewHandler) {
      console.warn('[DDGScraper] No WebView handler, falling back to fetch');
      return this.search(query);
    }

    return new Promise((resolve) => {
      const sanitized = this.sanitizeQuery(query);
      const searchQuery = this.encodeQueryForDDG(sanitized);
      const url = `${this.baseUrl}?q=${searchQuery}`;
      
      console.log('[DDGScraper] Loading in WebView:', url);
      
      this.webViewHandler!(url, (html) => {
        console.log('[DDGScraper] HTML received from WebView');
        const results = this.parseHTML(html);
        resolve(results);
      });
    });
  }

  /**
   * Sanitize query for DDG (remove special characters except site:)
   */
  private sanitizeQuery(query: string): string {
    // Keep site: operator and basic characters
    // Remove quotes, parentheses, and other special chars that break DDG
    return query
      .replace(/["'()[\]{}]/g, '') // Remove quotes and brackets
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Encode query for DDG (use + for spaces, standard encoding for special chars)
   */
  private encodeQueryForDDG(query: string): string {
    // DDG prefers + for spaces (more traditional URL encoding)
    // encodeURIComponent uses %20 which can trigger more aggressive filtering
    return encodeURIComponent(query).replace(/%20/g, '+');
  }

  /**
   * Search DuckDuckGo with proper headers
   */
  async search(query: string): Promise<SearchResult[]> {
    try {
      // Check cache first
      if (this.cacheService) {
        const cacheKey = `ddg_${query}`;
        const cached = await this.cacheService.get('ddg_search', cacheKey);
        if (cached) {
          console.log('✅ [DDGScraper] Using cached results');
          return cached as SearchResult[];
        }
      }
      
      // Sanitize query before encoding
      const sanitized = this.sanitizeQuery(query);
      const searchQuery = this.encodeQueryForDDG(sanitized);
      const url = `${this.baseUrl}?q=${searchQuery}`;
      
      console.log('[DDGScraper] Original query:', query);
      console.log('[DDGScraper] Sanitized query:', sanitized);
      console.log('[DDGScraper] Fetching:', url);
      
      const headers = {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
      
      const response = await fetch(url, { headers });
      const html = await response.text();

      console.log('[DDGScraper] Response:', { 
        status: response.status,
        length: html.length,
        hasCaptcha: html.includes('anomaly-modal')
      });
      
      const results = this.parseHTML(html);
      
      // Cache only on success (non-empty results, no CAPTCHA)
      if (this.cacheService && results.length > 0 && !html.includes('anomaly-modal')) {
        const cacheKey = `ddg_${query}`;
        await this.cacheService.set('ddg_search', cacheKey, results, 60 * 60 * 1000); // 1 hour
        console.log('✅ [DDGScraper] Cached results');
      }
      
      return results;
    } catch (error) {
      console.error('[DDGScraper] Search error:', error);
      return [];
    }
  }

  /**
   * Parse HTML using htmlparser2 (React Native compatible)
   */
  private parseHTML(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      // Check for CAPTCHA
      if (html.includes('anomaly-modal') || html.includes('challenge-form')) {
        console.warn('[DDGScraper] CAPTCHA detected');
        return [];
      }

      // Parse HTML
      const dom = parseDocument(html);
      
      // Find all result divs (class="result")
      const resultDivs = findAll((elem: Element) => {
        return elem.type === 'tag' && 
               elem.name === 'div' && 
               elem.attribs.class?.includes('result') &&
               !elem.attribs.class?.includes('result--ad'); // Skip ads
      }, dom.children);
      
      for (const resultDiv of resultDivs) {
        try {
          // Find title link (a.result__a)
          const titleLink = findOne((elem: Element) => {
            return elem.type === 'tag' && 
                   elem.name === 'a' && 
                   elem.attribs.class?.includes('result__a');
          }, [resultDiv], true);
          
          if (!titleLink || titleLink.type !== 'tag') continue;
          
          // Extract title
          const title = textContent(titleLink).trim();
          
          // Extract URL
          let url = titleLink.attribs.href || '';
          
          // Decode DDG redirect URL (format: //duckduckgo.com/l/?uddg=https%3A%2F%2F...)
          if (url.includes('uddg=')) {
            const uddgMatch = url.match(/uddg=([^&]+)/);
            if (uddgMatch) {
              url = decodeURIComponent(uddgMatch[1]);
            }
          }
          
          // Skip DDG internal links
          if (url.includes('duckduckgo.com') && !url.includes('uddg=')) {
            continue;
          }
          
          // Find snippet (div.result__snippet)
          const snippetDiv = findOne((elem: Element) => {
            return elem.type === 'tag' && 
                   elem.name === 'div' && 
                   elem.attribs.class?.includes('result__snippet');
          }, [resultDiv], true);
          
          const snippet = snippetDiv ? textContent(snippetDiv).trim() : '';
          
          // Only add if we have title and URL
          if (title && url && title.length > 3) {
            // Normalize URL for deduplication
            const normalizedUrl = this.normalizeUrl(url);
            
            // Skip if already added
            if (!results.some(r => this.normalizeUrl(r.url) === normalizedUrl)) {
              results.push({ title, url, snippet });
            }
          }
        } catch (blockError) {
          // Skip this block if parsing fails
          continue;
        }
      }
      
      console.log('[DDGScraper] Parsed results:', results.length);
      
      return results;
      
    } catch (error) {
      console.error('[DDGScraper] Parse error:', error);
      return [];
    }
  }

  /**
   * Normalize URL for deduplication (remove country-specific TLDs)
   */
  private normalizeUrl(url: string): string {
    try {
      return url
        .replace(/\.(co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})\//, '.com/')
        .replace(/\.(net|org)\//, '.com/');
    } catch (error) {
      return url;
    }
  }

  /**
   * Scrape DuckDuckGo for place information
   * Caller should provide search queries (from QueryAnalysis/QueryProcessing)
   */
  async scrapePlaceData(searchQueries: string[]): Promise<ScrapedPlaceData> {
    console.log(`🔍 [DDGScraper] Scraping ${searchQueries.length} queries...`);
    
    const results: ScrapedPlaceData = {
      crowdMentions: [],
      timeMentions: [],
      sentimentScore: 0,
      recentReviews: []
    };

    try {
      // Search first 2 queries only
      const searchResults = await Promise.all(
        searchQueries.slice(0, 2).map(q => this.search(q))
      );
      
      // Collect all text from snippets
      const allText = searchResults.flat().map(r => r.snippet).join(' ');
      
      // Extract crowd mentions
      const crowdKeywords = ['busy', 'crowded', 'packed', 'quiet', 'empty', 'moderate', 'wait'];
      crowdKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b[^.]{0,50}`, 'gi');
        const matches = allText.match(regex);
        if (matches) {
          results.crowdMentions.push(...matches.slice(0, 3));
        }
      });

      // Extract time mentions
      const timeKeywords = ['morning', 'afternoon', 'evening', 'night', 'weekday', 'weekend'];
      timeKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b[^.]{0,50}`, 'gi');
        const matches = allText.match(regex);
        if (matches) {
          results.timeMentions.push(...matches.slice(0, 2));
        }
      });

      // Estimate crowd level
      results.estimatedCrowdLevel = this.estimateCrowdFromMentions(results.crowdMentions);

      // Calculate sentiment using Wink NLP
      if (allText.length > 0) {
        const { sentimentAnalyzer } = await import('./SentimentAnalyzer');
        const sentiment = sentimentAnalyzer.analyze(allText);
        results.sentimentScore = sentiment.score;
        
        console.log(`📊 [DDGScraper] Sentiment: ${sentiment.classification} (${sentiment.score.toFixed(2)})`);
      }

      console.log(`✅ [DDGScraper] Found ${results.crowdMentions.length} crowd mentions`);

      return results;
    } catch (error) {
      console.error('❌ [DDGScraper] Error:', error);
      return results;
    }
  }

  /**
   * Estimate crowd level from text mentions
   */
  private estimateCrowdFromMentions(mentions: string[]): 'quiet' | 'moderate' | 'busy' | 'very busy' {
    const text = mentions.join(' ').toLowerCase();
    
    const busyScore = 
      (text.match(/busy|crowded|packed|wait/g) || []).length * 2 +
      (text.match(/very busy|extremely crowded/g) || []).length * 3;
    
    const quietScore = 
      (text.match(/quiet|empty|peaceful|calm/g) || []).length * 2;

    const netScore = busyScore - quietScore;

    if (netScore > 5) return 'very busy';
    if (netScore > 2) return 'busy';
    if (netScore < -2) return 'quiet';
    return 'moderate';
  }

  /**
   * Search multiple queries in parallel with staggered delays
   */
  async searchParallel(queries: string[]): Promise<Map<string, SearchResult[]>> {
    console.log(`[DDGScraper] Parallel search for ${queries.length} queries...`);
    
    const results = new Map<string, SearchResult[]>();
    
    const searchPromises = queries.map(async (query, idx) => {
      // Stagger requests to avoid rate limiting
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

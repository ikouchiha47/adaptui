// Base Research Agent - Interface for all research agents

export interface ResearchStep {
  site: string;
  status: 'pending' | 'searching' | 'complete' | 'error';
  url?: string;
  data?: any;
  error?: string;
  timestamp?: number;
}

export interface ResearchResult {
  query: string;
  steps: ResearchStep[];
  summary: any;
  needsMoreResearch: boolean;
  confidence: number;
}

export interface TrustedSite {
  name: string;
  domain: string;
  types: string[];
  priority: number; // 1-10, higher = more reliable
}

/**
 * Base interface for all research agents
 */
export abstract class BaseResearchAgent {
  protected maxIterations: number = 3;
  protected currentIteration: number = 0;
  protected webViewScraper: any = null; // WebViewScraperService instance
  
  constructor() {
    // Lazy load WebViewScraperService to avoid circular dependencies
    try {
      const { webViewScraperService } = require('../WebViewScraperService');
      this.webViewScraper = webViewScraperService;
    } catch (error) {
      console.warn('[BaseResearchAgent] WebViewScraperService not available');
    }
  }
  
  abstract getTrustedSites(): TrustedSite[];
  abstract generateSearchUrl(site: TrustedSite, query: string, params?: any): string | Promise<string>;
  abstract extractData(html: string, site: TrustedSite): any;
  abstract aggregateResults(steps: ResearchStep[]): any;
  
  /**
   * Main research method
   */
  async research(
    query: string,
    params?: any,
    onProgress?: (step: ResearchStep) => void
  ): Promise<ResearchResult> {
    console.log(`[${this.constructor.name}] Starting research:`, { query });
    
    const steps: ResearchStep[] = [];
    const sites = this.getTrustedSites();
    
    // Initialize steps
    for (const site of sites) {
      steps.push({
        site: site.name,
        status: 'pending',
        timestamp: Date.now()
      });
    }
    
    // Batch scraping (parallel for speed)
    await this.batchScrape(steps, sites, query, params, onProgress);
    
    // Aggregate results
    const summary = this.aggregateResults(steps);
    
    // Determine if more research is needed
    const needsMoreResearch = this.shouldContinueResearch(steps, summary);
    const confidence = this.calculateConfidence(steps);
    
    return {
      query,
      steps,
      summary,
      needsMoreResearch,
      confidence
    };
  }
  
  /**
   * Batch scrape multiple sites in parallel
   */
  protected async batchScrape(
    steps: ResearchStep[],
    sites: TrustedSite[],
    query: string,
    params: any,
    onProgress?: (step: ResearchStep) => void
  ): Promise<void> {
    // Scrape in batches of 3 to avoid overwhelming
    const batchSize = 3;
    
    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize);
      const batchSteps = steps.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (site, index) => {
          const step = batchSteps[index];
          step.status = 'searching';
          onProgress?.(step);
          
          try {
            const url = await this.generateSearchUrl(site, query, params);
            step.url = url;
            
            const html = await this.fetchPage(url);
            const data = this.extractData(html, site);
            
            step.data = data;
            step.status = 'complete';
            
            console.log(`[${this.constructor.name}] ${site.name}: Success`);
          } catch (error: any) {
            step.status = 'error';
            step.error = error.message;
            console.error(`[${this.constructor.name}] ${site.name} error:`, error.message);
          }
          
          onProgress?.(step);
        })
      );
      
      // Small delay between batches
      if (i + batchSize < sites.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  /**
   * Fetch a page (using DDG as proxy to avoid CORS)
   */
  protected async fetchPage(url: string): Promise<string> {
    try {
      // Try direct fetch first
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      // If fetch fails, try WebView scraper
      console.log(`[${this.constructor.name}] Fetch failed, trying WebView for:`, url);
      return await this.fetchPageWithWebView(url);
    } catch (error) {
      console.log(`[${this.constructor.name}] Fetch error, trying WebView:`, error);
      return await this.fetchPageWithWebView(url);
    }
  }

  /**
   * Fetch page content using WebView (for complex sites)
   */
  protected async fetchPageWithWebView(url: string): Promise<string> {
    if (!this.webViewScraper) {
      console.warn(`[${this.constructor.name}] WebView scraper not available`);
      throw new Error(`Failed to fetch ${url} - WebView not available`);
    }

    console.log(`[${this.constructor.name}] Fetching with WebView:`, url);
    
    const content = await this.webViewScraper.scrapeUrl(url);
    
    if (!content) {
      throw new Error(`Failed to fetch ${url} - WebView scraping failed`);
    }

    console.log(`[${this.constructor.name}] WebView content:`, {
      title: content.title,
      bodyTextLength: content.bodyText.length
    });

    // Return clean body text for parsing
    return content.bodyText;
  }
  
  /**
   * Determine if more research is needed
   */
  protected shouldContinueResearch(steps: ResearchStep[], summary: any): boolean {
    const successfulSteps = steps.filter(s => s.status === 'complete');
    const hasData = successfulSteps.some(s => s.data && Object.keys(s.data).length > 0);
    
    // Continue if we have less than 2 successful results
    return successfulSteps.length < 2 || !hasData;
  }
  
  /**
   * Calculate confidence score (0-1)
   */
  protected calculateConfidence(steps: ResearchStep[]): number {
    const total = steps.length;
    const successful = steps.filter(s => s.status === 'complete').length;
    const withData = steps.filter(s => s.status === 'complete' && s.data).length;
    
    return (successful / total) * 0.5 + (withData / total) * 0.5;
  }
  
  /**
   * Extract common patterns
   */
  protected extractPrices(html: string): number[] {
    const prices: number[] = [];
    const pricePatterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    ];
    
    for (const pattern of pricePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (price > 10 && price < 50000) {
          prices.push(price);
        }
      }
    }
    
    return prices;
  }
  
  protected extractDurations(html: string): string[] {
    const durations: string[] = [];
    const patterns = [
      /(\d+h\s*\d+m)/g,
      /(\d+\s*hours?\s*\d*\s*min)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        durations.push(match[1]);
      }
    }
    
    return durations;
  }
}

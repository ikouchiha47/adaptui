// Search proxy with weighted round-robin (60% DDG, 40% Brave) and CAPTCHA fallback
import { BraveScraperService } from './BraveScraperService';
import { DDGScraperService } from './DDGScraperService';
import { ICacheService } from './ICacheService';

// Rate limiting constants
const RATE_LIMIT_DELAY_MS = 2000; // 2 second delay between requests
const MAX_FAILS = 3; // Max consecutive fails before switching provider
const DDG_WEIGHT = 6; // Out of 10 requests, how many go to DDG (60% default)

export interface ProxySearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'brave' | 'ddg';
}

export class SearchProxyService {
  private braveService: BraveScraperService;
  private ddgService: DDGScraperService;
  private requestCount = 0;
  private braveFailCount = 0;
  private ddgFailCount = 0;
  private readonly MAX_FAILS = MAX_FAILS;
  private requestLock: Promise<void> = Promise.resolve();
  private lastRequestTime = 0;

  constructor(cacheService: ICacheService) {
    this.braveService = new BraveScraperService(cacheService);
    this.ddgService = new DDGScraperService(cacheService);
  }

  /**
   * Weighted round-robin: configurable DDG vs Brave distribution
   */
  private selectProvider(): 'brave' | 'ddg' {
    this.requestCount++;
    // Use modulo for weighted distribution based on DDG_WEIGHT constant
    return (this.requestCount % 10) < DDG_WEIGHT ? 'ddg' : 'brave';
  }

  /**
   * Check if response indicates CAPTCHA or rate limiting
   */
  private isCaptchaOrRateLimit(results: any[]): boolean {
    // If we get very few results (1 or less), likely CAPTCHA or rate limit
    return results.length <= 1;
  }

  /**
   * Search using weighted provider selection with automatic fallback
   */
  async search(query: string): Promise<ProxySearchResult[]> {
    // Acquire lock to ensure sequential requests with delay
    await this.requestLock;
    
    // Create new lock for next request
    let releaseLock: () => void;
    this.requestLock = new Promise(resolve => {
      releaseLock = resolve;
    });
    
    try {
      // Enforce rate limit delay
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
        const waitTime = RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
        console.log(`[SearchProxy] Rate limit: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.lastRequestTime = Date.now();
      
      const primaryProvider = this.selectProvider();
      console.log(`[SearchProxy] Using ${primaryProvider} for: "${query}"`);
      
      return await this.executeSearch(query, primaryProvider);
    } finally {
      // Release lock after delay
      releaseLock!();
    }
  }

  /**
   * Execute search with provider
   */
  private async executeSearch(query: string, primaryProvider: 'brave' | 'ddg'): Promise<ProxySearchResult[]> {
    try {
      if (primaryProvider === 'ddg') {
        const results = await this.ddgService.search(query);
        
        // Check for CAPTCHA or rate limiting
        if (this.isCaptchaOrRateLimit(results)) {
          console.warn(`[SearchProxy] DDG returned suspicious results (${results.length}), trying Brave...`);
          this.ddgFailCount++;
          return this.fallbackToBrave(query);
        }
        
        if (results.length === 0) {
          this.ddgFailCount++;
          console.warn(`[SearchProxy] DDG failed ${this.ddgFailCount} times, trying Brave`);
          return this.fallbackToBrave(query);
        }
        
        this.ddgFailCount = 0; // Reset on success
        return results.map(r => ({ ...r, source: 'ddg' as const }));
      } else {
        // Primary is Brave
        const results = await this.braveService.search(query);
        
        // Check for CAPTCHA or rate limiting
        if (this.isCaptchaOrRateLimit(results)) {
          console.warn(`[SearchProxy] Brave returned suspicious results (${results.length}), trying DDG...`);
          this.braveFailCount++;
          return this.fallbackToDDG(query);
        }
        
        if (results.length === 0) {
          this.braveFailCount++;
          console.warn(`[SearchProxy] Brave failed ${this.braveFailCount} times, trying DDG`);
          return this.fallbackToDDG(query);
        }
        
        this.braveFailCount = 0; // Reset on success
        return results.map(r => ({ ...r, source: 'brave' as const }));
      }
    } catch (error) {
      console.error(`[SearchProxy] ${primaryProvider} error:`, error);
      
      // Fallback to alternate provider
      if (primaryProvider === 'brave') {
        this.braveFailCount++;
        if (this.braveFailCount < this.MAX_FAILS) {
          return this.fallbackToDDG(query);
        }
      } else {
        this.ddgFailCount++;
        if (this.ddgFailCount < this.MAX_FAILS) {
          return this.fallbackToBrave(query);
        }
      }
      
      return [];
    }
  }

  private async fallbackToBrave(query: string): Promise<ProxySearchResult[]> {
    try {
      const results = await this.braveService.search(query);
      return results.map(r => ({ ...r, source: 'brave' as const }));
    } catch (error) {
      console.error('[SearchProxy] Brave fallback failed:', error);
      return [];
    }
  }

  private async fallbackToDDG(query: string): Promise<ProxySearchResult[]> {
    try {
      const results = await this.ddgService.search(query);
      return results.map(r => ({ ...r, source: 'ddg' as const }));
    } catch (error) {
      console.error('[SearchProxy] DDG fallback failed:', error);
      return [];
    }
  }
}

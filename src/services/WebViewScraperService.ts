// WebView Scraper Service - Deep content extraction from any URL

export interface ScrapedContent {
  url: string;
  title: string;
  bodyText: string;
  bodyHTML: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  timestamp: number;
}

export class WebViewScraperService {
  private webViewHandler: ((url: string, callback: (content: ScrapedContent) => void) => void) | null = null;
  private pendingRequests: Map<string, (content: ScrapedContent) => void> = new Map();

  /**
   * Set WebView handler (called from React Native component)
   */
  setWebViewHandler(handler: (url: string, callback: (content: ScrapedContent) => void) => void) {
    this.webViewHandler = handler;
    console.log('[WebViewScraper] Handler registered');
  }

  /**
   * Check if URL exists (HEAD request)
   */
  async checkUrlExists(url: string): Promise<boolean> {
    try {
      console.log('[WebViewScraper] Checking URL:', url);
      const response = await fetch(url, { method: 'HEAD' });
      const exists = response.ok;
      console.log('[WebViewScraper] URL check:', { url, exists, status: response.status });
      return exists;
    } catch (error) {
      console.error('[WebViewScraper] URL check failed:', error);
      return false;
    }
  }

  /**
   * Scrape content from URL using WebView
   */
  async scrapeUrl(url: string): Promise<ScrapedContent | null> {
    // Check if URL exists first
    const exists = await this.checkUrlExists(url);
    if (!exists) {
      console.warn('[WebViewScraper] URL does not exist:', url);
      return null;
    }

    // Check if WebView handler is available
    if (!this.webViewHandler) {
      console.error('[WebViewScraper] No WebView handler available');
      return null;
    }

    return new Promise((resolve) => {
      console.log('[WebViewScraper] Loading URL in WebView:', url);
      
      this.webViewHandler!(url, (content) => {
        console.log('[WebViewScraper] Content received:', {
          url: content.url,
          titleLength: content.title.length,
          bodyTextLength: content.bodyText.length,
          bodyHTMLLength: content.bodyHTML.length
        });
        resolve(content);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        console.warn('[WebViewScraper] Timeout for URL:', url);
        resolve(null);
      }, 30000);
    });
  }

  /**
   * Scrape multiple URLs in sequence
   */
  async scrapeUrls(urls: string[]): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    for (const url of urls) {
      const content = await this.scrapeUrl(url);
      if (content) {
        results.push(content);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Parse content with LLM (optional)
   */
  async parseWithLLM(content: ScrapedContent, prompt: string): Promise<any> {
    // This will be implemented to send content to LLM for parsing
    console.log('[WebViewScraper] Parsing content with LLM:', {
      url: content.url,
      promptLength: prompt.length
    });
    
    // TODO: Integrate with OpenAI/Gemini
    return {
      parsed: true,
      content: content.bodyText.substring(0, 1000)
    };
  }
}

// Singleton instance
export const webViewScraperService = new WebViewScraperService();

// Place Details Capability - Lazy-loaded ReAct agent for deep place research
// Only invoked when user taps on a place card for details

import { LLMProvider } from '@/core/LLMProvider';
import { ICacheService } from '../ICacheService';
import { AgentContext, ReActAgent, Tool } from './ReActAgent';
import { SharedTempMemory } from './SharedTempMemory';
import { TaskManager } from './TaskManager';
import { LookupTool, ReflexionTool } from './tools';

/**
 * Tool: Web Search
 */
class WebSearchTool implements Tool {
  name = 'web_search';
  description = 'Search the web for information. Input: search query';

  constructor(private searchService: any) {}

  async execute(input: string, context: AgentContext): Promise<string> {
    try {
      const results = await this.searchService.search(input);
      
      if (results.length === 0) {
        return 'No results found';
      }

      // Store URLs in context for agent to choose from
      context.availableUrls = results.map((r: any) => r.url);

      // Return top 3 results with snippets
      return results.slice(0, 3)
        .map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.snippet}\nURL: ${r.url}`)
        .join('\n\n');
    } catch (error: any) {
      return `Search error: ${error.message}`;
    }
  }
}

/**
 * Tool: URL Content Scraper
 */
class URLScraperTool implements Tool {
  name = 'scrape_url';
  description = 'Scrape content from a URL. Input: URL to scrape';

  constructor(private webViewScraper: any) {}

  async execute(input: string, context: AgentContext): Promise<string> {
    // Validate URL is from available list
    if (context.availableUrls.length > 0 && !context.availableUrls.includes(input)) {
      return `Error: URL not in available list. Choose from: ${context.availableUrls.slice(0, 3).join(', ')}`;
    }

    try {
      const content = await this.webViewScraper.scrapeUrl(input);
      
      if (!content || !content.bodyText) {
        return 'Failed to scrape URL';
      }

      // Store scraped content in memory
      await context.memory.set(context.agentId, `scraped_${input}`, content.bodyText, 'data');

      // Return first 2000 chars of body text
      return content.bodyText.substring(0, 2000);
    } catch (error: any) {
      return `Scraping error: ${error.message}`;
    }
  }
}

/**
 * Tool: Extract Structured Data
 */
class DataExtractorTool implements Tool {
  name = 'extract_data';
  description = 'Extract structured data (price, rating, hours) from text. Input: text content';

  constructor(private llm: LLMProvider) {}

  async execute(input: string, context: AgentContext): Promise<string> {
    const prompt = `Extract structured information from this text about a place/restaurant:

TEXT:
${input.substring(0, 1500)}

Extract and return JSON with:
{
  "priceRange": "$ or $$ or $$$ or $$$$",
  "priceMin": number or null,
  "priceMax": number or null,
  "rating": number (1-5) or null,
  "reviewCount": number or null,
  "hours": "opening hours" or null,
  "phone": "phone number" or null,
  "description": "brief description"
}

Only include fields you can confidently extract. Return valid JSON.`;

    try {
      const response = await this.llm.generateJSON(prompt, 0.3);
      
      // Store extracted data in memory
      await context.memory.set(context.agentId, 'extracted_data', response, 'data');
      
      return response;
    } catch (error: any) {
      return `{"error": "${error.message}"}`;
    }
  }
}

/**
 * Place Details Capability - Lazy-loaded deep research
 */
export class PlaceDetailsCapability {
  private agent: ReActAgent | null = null;
  private llm: LLMProvider;
  private cacheService: ICacheService;
  private searchService: any;
  private webViewScraper: any;
  private taskManager: TaskManager;
  private memory: typeof SharedTempMemory;

  constructor(
    llm: LLMProvider,
    cacheService: ICacheService,
    searchService: any,
    webViewScraper: any
  ) {
    this.llm = llm;
    this.cacheService = cacheService;
    this.searchService = searchService;
    this.webViewScraper = webViewScraper;
    this.taskManager = new TaskManager(2, 1000); // max 2 concurrent, 1s throttle
    this.memory = SharedTempMemory;
  }

  /**
   * Lazy initialization of ReAct agent
   */
  private initializeAgent(): ReActAgent {
    if (this.agent) {
      return this.agent;
    }

    console.log('🚀 [PlaceDetailsCapability] Initializing ReAct agent...');

    const tools: Tool[] = [
      new WebSearchTool(this.searchService),
      new URLScraperTool(this.webViewScraper),
      new LookupTool(), // Search within scraped content
      new DataExtractorTool(this.llm),
      new ReflexionTool(this.llm) // Self-critique
    ];

    this.agent = new ReActAgent(
      this.llm,
      tools,
      this.taskManager,
      this.memory,
      5 // max 5 iterations
    );
    return this.agent;
  }

  /**
   * Research place details using ReAct agent
   * Called when user taps on a place card
   */
  async researchPlaceDetails(placeName: string, placeType?: string): Promise<any> {
    console.log('🔍 [PlaceDetailsCapability] Researching:', placeName);

    // Check cache first
    const cacheKey = `place_details_${placeName}`;
    const cached = await this.cacheService.get('place_details', cacheKey);
    if (cached) {
      console.log('✅ [PlaceDetailsCapability] Using cached details');
      return cached;
    }

    // Initialize agent lazily
    const agent = this.initializeAgent();

    // Define the research task
    const task = `Find detailed information about "${placeName}" ${placeType ? `(a ${placeType})` : ''}.

Your goal is to find:
1. Price range ($ to $$$$) or specific prices
2. Rating and number of reviews
3. Opening hours
4. Phone number
5. Brief description

Steps you should take:
1. Search for "${placeName} ${placeType || 'restaurant'} listing tripadvisor OR yelp OR zomato"
2. Find the most relevant listing URL from search results
3. Scrape that URL to get the full page content
4. Extract structured data from the scraped content

When you have gathered enough information, call FINISH with a JSON summary.`;

    try {
      // Run the ReAct agent
      const result = await agent.run(task);

      // Parse the final answer
      let details;
      try {
        details = JSON.parse(result.finalAnswer);
      } catch {
        // If not JSON, wrap it
        details = {
          description: result.finalAnswer,
          confidence: result.confidence
        };
      }

      // Add metadata
      details.researchSteps = result.steps.length;
      details.confidence = result.confidence;
      details.timestamp = Date.now();

      // Cache the result (1 week TTL)
      await this.cacheService.set('place_details', cacheKey, details, 7 * 24 * 60 * 60 * 1000);

      console.log('✅ [PlaceDetailsCapability] Research complete:', {
        steps: result.steps.length,
        confidence: result.confidence
      });

      return details;
    } catch (error: any) {
      console.error('❌ [PlaceDetailsCapability] Research failed:', error);
      return {
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Batch research multiple places (for cluster view)
   */
  async researchMultiplePlaces(places: Array<{ name: string; type?: string }>): Promise<any[]> {
    console.log(`🔍 [PlaceDetailsCapability] Batch researching ${places.length} places...`);

    // Research in parallel with limit
    const batchSize = 3;
    const results: any[] = [];

    for (let i = 0; i < places.length; i += batchSize) {
      const batch = places.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(p => this.researchPlaceDetails(p.name, p.type))
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < places.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Clear agent memory (for new research session)
   */
  async reset(): Promise<void> {
    if (this.agent) {
      await this.agent.clearMemory();
    }
  }
}

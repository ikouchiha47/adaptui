/**
 * Advanced Query Processing Service
 * 
 * Implements:
 * 1. Query Expansion - Generate related queries
 * 2. Question Decomposition - Break complex queries into sub-queries
 * 3. Step-Back Reasoning - Abstract to higher-level concepts
 */

import { LLMProvider } from "@/core/LLMProvider";





export interface QueryExpansion {
  original: string;
  expanded: string[];
  synonyms: string[];
  relatedConcepts: string[];
}

export interface QueryDecomposition {
  original: string;
  subQueries: Array<{
    query: string;
    purpose: string;
    priority: number;
  }>;
  dependencies: Array<{
    from: number;
    to: number;
  }>;
}

export interface StepBackReasoning {
  original: string;
  abstractQuestion: string;
  principles: string[];
  context: string;
}

export interface ProcessedQuery {
  original: string;
  expansion: QueryExpansion;
  decomposition: QueryDecomposition;
  stepBack: StepBackReasoning;
  enhancedQuery: string;
  contextInjected: string; // Query with grounded context
}

export interface QueryContext {
  userLocation?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  availableDataSources?: string[]; // e.g., ['google_places', 'airports_db', 'weather_api']
  userPreferences?: Record<string, any>;
  timestamp?: Date;
  domainInstructions?: string[]; // Domain-specific expansion hints
  enabledCapabilities?: string[]; // e.g., ['maps', 'location', 'camera']
  enabledPlugins?: Array<{ id: string; name: string; description: string }>; // Active plugins
}

export class QueryProcessingService {
  /**
   * Full query processing pipeline with context injection
   */
  static async processQuery(
    query: string, 
    llm: LLMProvider,
    context?: QueryContext
  ): Promise<ProcessedQuery> {
    // Check cache first
    const { CacheService } = await import('./CacheService');
    const cacheKey = `${query}_${context?.userLocation?.city || 'any'}`;
    const cached = await CacheService.get<ProcessedQuery>('query_processing', cacheKey);
    
    if (cached) {
      console.log('✅ [QueryProcessing] Using cached processed query');
      return cached;
    }
    
    console.log('🔍 [QueryProcessing] Starting advanced query processing...');
    console.log('📝 Original query:', query);

    // Yield to UI thread before heavy work
    await new Promise(resolve => setImmediate(resolve));
    
    // Run all three techniques in parallel for speed
    const [expansion, decomposition, stepBack] = await Promise.all([
      this.expandQuery(query, llm, context),
      this.decomposeQuery(query, llm, context),
      this.stepBackReasoning(query, llm, context),
    ]);
    
    // Yield again after heavy LLM calls
    await new Promise(resolve => setImmediate(resolve));

    // Synthesize enhanced query
    const enhancedQuery = this.synthesizeEnhancedQuery(query, expansion, decomposition, stepBack);
    
    // Inject grounded context
    const contextInjected = this.injectContext(enhancedQuery, context);

    console.log('✅ [QueryProcessing] Processing complete');
    console.log('🎯 Enhanced query:', enhancedQuery);
    console.log('🌍 Context-injected query:', contextInjected);

    const result: ProcessedQuery = {
      original: query,
      expansion,
      decomposition,
      stepBack,
      enhancedQuery,
      contextInjected,
    };
    
    // Cache the result
    await CacheService.set('query_processing', cacheKey, result, 60 * 60 * 1000); // 1 hour TTL
    console.log('💾 [QueryProcessing] Cached processed query');
    
    return result;
  }

  /**
   * Format context for LLM prompts
   */
  private static formatContextForPrompt(context: QueryContext): string {
    const parts: string[] = [];

    if (context.userLocation) {
      const { city, country, coordinates } = context.userLocation;
      if (city && country) {
        parts.push(`User is currently in: ${city}, ${country}`);
      }
      if (coordinates) {
        parts.push(`User coordinates: ${coordinates.lat}, ${coordinates.lng}`);
      }
    }

    if (context.availableDataSources && context.availableDataSources.length > 0) {
      parts.push(`Available data sources: ${context.availableDataSources.join(', ')}`);
    }

    if (context.enabledCapabilities && context.enabledCapabilities.length > 0) {
      parts.push(`Enabled capabilities: ${context.enabledCapabilities.join(', ')}`);
    }

    if (context.enabledPlugins && context.enabledPlugins.length > 0) {
      parts.push(`\nActive plugins:`);
      context.enabledPlugins.forEach(plugin => {
        parts.push(`  - ${plugin.name}: ${plugin.description}`);
      });
    }

    if (context.timestamp) {
      parts.push(`Current time: ${context.timestamp.toISOString()}`);
    }

    if (context.domainInstructions && context.domainInstructions.length > 0) {
      parts.push(`\nIMPORTANT INSTRUCTIONS:`);
      context.domainInstructions.forEach((instruction, i) => {
        parts.push(`${i + 1}. ${instruction}`);
      });
    }

    return parts.length > 0 ? `\n\nContext:\n${parts.join('\n')}` : '';
  }

  /**
   * Inject grounded context into the enhanced query
   */
  private static injectContext(enhancedQuery: string, context?: QueryContext): string {
    if (!context) return enhancedQuery;

    const contextParts: string[] = [enhancedQuery];

    // Add user location context
    if (context.userLocation) {
      const { city, country, coordinates } = context.userLocation;
      if (city && country) {
        contextParts.push(`[USER_LOCATION: ${city}, ${country}]`);
      }
      if (coordinates) {
        contextParts.push(`[USER_COORDS: ${coordinates.lat}, ${coordinates.lng}]`);
      }
    }

    // Add available data sources
    if (context.availableDataSources && context.availableDataSources.length > 0) {
      contextParts.push(`[DATA_SOURCES: ${context.availableDataSources.join(', ')}]`);
    }

    // Add timestamp for time-sensitive queries
    if (context.timestamp) {
      contextParts.push(`[TIMESTAMP: ${context.timestamp.toISOString()}]`);
    }

    // Add user preferences
    if (context.userPreferences && Object.keys(context.userPreferences).length > 0) {
      const prefs = Object.entries(context.userPreferences)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      contextParts.push(`[USER_PREFS: ${prefs}]`);
    }

    return contextParts.join(' ');
  }

  /**
   * Query Expansion - Generate related queries and synonyms
   */
  private static async expandQuery(query: string, llm: LLMProvider, context?: QueryContext): Promise<QueryExpansion> {
    console.log('🔄 [QueryExpansion] Expanding query...');

    const contextInfo = context ? this.formatContextForPrompt(context) : '';
    const prompt = `You are a query expansion expert for travel and places. Given a search query, generate:
1. Expanded variations including BOTH popular AND hidden gems
2. Synonyms for key terms
3. Related concepts

CRITICAL RULES:
- PRESERVE the main search term (e.g., "bars", "restaurants", "temples") in ALL variations
- If query is "fun bars in Bangkok", ALL variations must include "bars"
- If query is "quiet temples in Tokyo", ALL variations must include "temples"
- DO NOT replace specific place types with generic words like "fun", "places", "things to do"

IMPORTANT: Always include variations for:
- Hidden gems and local favorites (but keep the place type!)
- Off-the-beaten-path alternatives (but keep the place type!)
- Less touristy options (but keep the place type!)
- Local secrets and insider spots (but keep the place type!)

Query: "${query}"
${contextInfo}

Return JSON with 8-10 expanded variations:
{
  "expanded": [
    "original query variation",
    "hidden gems version WITH place type",
    "local favorites version WITH place type", 
    "offbeat alternative WITH place type",
    "less touristy option WITH place type",
    "insider spots WITH place type",
    "popular attractions WITH place type",
    "must-see places WITH place type"
  ],
  "synonyms": ["synonym1", "synonym2"],
  "relatedConcepts": ["concept1", "concept2"]
}

Example for "fun bars in Bangkok":
{
  "expanded": [
    "fun bars in Bangkok at night",
    "hidden gem bars in Bangkok",
    "local favorite bars in Bangkok",
    "off-the-beaten-path bars in Bangkok",
    "less touristy bars in Bangkok",
    "insider-only bars in Bangkok",
    "popular bars in Bangkok",
    "must-visit bars in Bangkok"
  ],
  "synonyms": ["nightlife", "pubs", "drinking spots"],
  "relatedConcepts": ["rooftop bars", "speakeasies", "cocktail bars"]
}`;

    const response = await llm.generateJSON(prompt, 0.5);
    const result = JSON.parse(response);
    
    console.log('✅ [QueryExpansion] Generated', result.expanded?.length || 0, 'variations');

    return {
      original: query,
      expanded: result.expanded || [],
      synonyms: result.synonyms || [],
      relatedConcepts: result.relatedConcepts || [],
    };
  }

  /**
   * Question Decomposition - Break complex queries into sub-queries
   */
  private static async decomposeQuery(query: string, llm: LLMProvider, context?: QueryContext): Promise<QueryDecomposition> {
    console.log('🧩 [QueryDecomposition] Decomposing query...');

    const contextInfo = context ? this.formatContextForPrompt(context) : '';
    const prompt = `You are a query decomposition expert. Break down this query into logical sub-queries.

Query: "${query}"
${contextInfo}

Return JSON:
{
  "subQueries": [
    {
      "query": "sub-query text",
      "purpose": "what this sub-query answers",
      "priority": 1-5 (5 = highest)
    }
  ],
  "dependencies": [
    {"from": 0, "to": 1}  // sub-query 0 must be answered before 1
  ]
}`;

    const response = await llm.generateJSON(prompt, 0.5);
    const result = JSON.parse(response);
    
    console.log('✅ [QueryDecomposition] Generated', result.subQueries?.length || 0, 'sub-queries');

    return {
      original: query,
      subQueries: result.subQueries || [],
      dependencies: result.dependencies || [],
    };
  }

  /**
   * Step-Back Reasoning - Abstract to higher-level concepts
   */
  private static async stepBackReasoning(query: string, llm: LLMProvider, context?: QueryContext): Promise<StepBackReasoning> {
    console.log('🎯 [StepBack] Performing step-back reasoning...');

    const contextInfo = context ? this.formatContextForPrompt(context) : '';
    const prompt = `You are a reasoning expert. Given a specific query, step back to identify:
1. A more abstract, general question
2. Key principles that apply
3. Broader context

Query: "${query}"
${contextInfo}

Return JSON:
{
  "abstractQuestion": "higher-level question",
  "principles": ["principle1", "principle2"],
  "context": "broader context explanation"
}`;

    const response = await llm.generateJSON(prompt, 0.5);
    const result = JSON.parse(response);
    
    console.log('✅ [StepBack] Abstract question:', result.abstractQuestion);

    return {
      original: query,
      abstractQuestion: result.abstractQuestion || query,
      principles: result.principles || [],
      context: result.context || '',
    };
  }

  /**
   * Synthesize enhanced query from all techniques
   */
  private static synthesizeEnhancedQuery(
    original: string,
    expansion: QueryExpansion,
    decomposition: QueryDecomposition,
    stepBack: StepBackReasoning
  ): string {
    // Combine insights into a richer query
    const parts = [original];

    // Add high-priority sub-queries
    const highPriority = decomposition.subQueries
      .filter(sq => sq.priority >= 4)
      .map(sq => sq.query);
    parts.push(...highPriority);

    // Add abstract context
    if (stepBack.abstractQuestion !== original) {
      parts.push(stepBack.abstractQuestion);
    }

    // Add top related concepts
    parts.push(...expansion.relatedConcepts.slice(0, 2));

    return parts.join(' | ');
  }

  /**
   * Execute expanded place searches in parallel
   * Uses query expansion + step-back reasoning to search multiple related terms
   * 
   * Example: "fun activities" → ["entertainment venues", "recreational activities", "leisure spots"]
   * Example: "peaceful temples" → ["quiet temples", "serene locations", "low-crowd attractions"]
   */
  static async executeExpandedPlaceSearches(
    processed: ProcessedQuery,
    location: { lat: number; lng: number } | string
  ): Promise<Map<string, any[]>> {
    console.log('🔍 [QueryProcessing] Executing expanded place searches...');

    const { TaskExecutor } = await import('./TaskExecutor');

    // Collect all search terms from expansion
    const searchTerms = new Set<string>();

    // 1. Add expanded variations
    processed.expansion.expanded.forEach(term => searchTerms.add(term));

    // 2. Add related concepts
    processed.expansion.relatedConcepts.forEach(concept => searchTerms.add(concept));

    // 3. Add high-priority sub-queries that look like place searches
    processed.decomposition.subQueries
      .filter(sq => sq.priority >= 4)
      .filter(sq => 
        sq.query.includes('find') || 
        sq.query.includes('search') ||
        sq.query.includes('look for')
      )
      .forEach(sq => {
        // Extract just the search term, not the full query
        const match = sq.query.match(/find (.+?) (near|in|within)/i);
        if (match) {
          searchTerms.add(match[1].trim());
        }
      });

    // 4. Add step-back principles as search terms
    processed.stepBack.principles
      .filter(p => p.length < 50) // Only short, searchable principles
      .forEach(principle => searchTerms.add(principle));

    const termsArray = Array.from(searchTerms).slice(0, 10); // Limit to 10 parallel searches
    console.log(`🚀 [QueryProcessing] Searching ${termsArray.length} expanded terms:`, termsArray);

    // Execute all searches in parallel
    const results = await TaskExecutor.executeParallelPlaceSearches(termsArray, location);

    console.log(`✅ [QueryProcessing] Completed expanded searches`);
    return results;
  }

  /**
   * Deduplicate places by place ID
   * Pure deduplication - no ranking
   */
  static deduplicatePlaces(searchResults: Map<string, any[]>): any[] {
    const uniquePlaces = new Map<string, any>();

    searchResults.forEach((places, searchTerm) => {
      places.forEach(place => {
        if (place.placeId && !uniquePlaces.has(place.placeId)) {
          uniquePlaces.set(place.placeId, {
            ...place,
            foundBy: searchTerm, // Track which search term found this place
          });
        }
      });
    });

    console.log(`🎯 [QueryProcessing] Deduplicated to ${uniquePlaces.size} unique places`);
    return Array.from(uniquePlaces.values());
  }
}

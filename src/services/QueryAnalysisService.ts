// Query Analysis Service - Phase 1: Extract structured parameters from natural language

import { LLMProvider } from '@/core/LLMProvider';
import { LLMProviderFactory } from '../core/LLMProviderFactory';
import { QueryAnalysisSchema } from '../types/query-analysis.zod';
import { buildQueryAnalysisPrompt } from '../ui-engine/prompts';


export interface QueryAnalysis {
  intent: 'search' | 'browse' | 'compare' | 'book' | 'navigate' | 'plan';
  categories: Array<'dining' | 'accommodation' | 'activities' | 'transport' | 'shopping' | 'entertainment'>;
  
  sentiment: {
    emotion: 'romantic' | 'fun' | 'adventurous' | 'relaxing' | 'cultural' | 'energetic' | 'peaceful' | 'luxurious';
    intensity: 'low' | 'medium' | 'high';
    vibe: string[];
  };
  
  temporal: {
    timeOfDay?: string;
    suggestedTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';
    timeReasoning: string;
    duration?: number;
    bestTimes: Array<{
      time: string;
      reason: string;
      suitability: number;
    }>;
  };
  
  parameters: {
    userLocation?: string | { lat: number; lng: number };
    destination: string;
    destinationAirports: string[]; // Array of IATA codes sorted by relevance
    radius?: number;
    establishments: string[];
    keywords: string[];
    natureOfTravel?: 'romantic' | 'family' | 'business' | 'solo' | 'adventure' | 'luxury' | 'budget';
    travelDates?: { start: string; end: string };
    partySize?: number;
    filters: {
      priceRange?: '$' | '$$' | '$$$' | '$$$$';
      rating?: number;
      cuisine?: string[];
      amenities?: string[];
      openNow?: boolean;
      hasPhotos?: boolean;
    };
    sortBy?: 'rating' | 'price' | 'distance' | 'popularity';
    limit?: number;
  };
  
  missingFields: string[];
  suggestedQuestions: string[];
  confidence: number;
  
  suggestedUIType: 'list' | 'grid' | 'map' | 'comparison' | 'detail';
  suggestedComponents: string[];
}

export class QueryAnalysisService {
  private llm: LLMProvider;

  constructor() {
    this.llm = LLMProviderFactory.getProvider();
  }

  async analyzeQuery(query: string, userContext?: any, capabilities?: any, useAdvancedProcessing: boolean = true): Promise<QueryAnalysis> {
    console.log('🔍 [QueryAnalysis] Analyzing:', query);
    
    // Step 1: Advanced query processing (optional)
    let enhancedQuery = query;
    if (useAdvancedProcessing) {
      // Use setImmediate to avoid blocking UI
      await new Promise(resolve => setImmediate(resolve));
      
      try {
        const { QueryProcessingService } = await import('./QueryProcessingService');
        
        // Build context from userContext
        const processingContext = userContext ? {
          userLocation: userContext.location ? {
            city: userContext.location.city,
            country: userContext.location.country,
            coordinates: userContext.location.coordinates,
          } : undefined,
          availableDataSources: ['google_places', 'airports_db', 'ddg_scraper', 'weather_api'],
          timestamp: new Date(),
        } : undefined;
        
        const processed = await QueryProcessingService.processQuery(query, this.llm, processingContext);
        enhancedQuery = processed.contextInjected; // Use context-injected version
        console.log('🎯 [QueryAnalysis] Enhanced query:', enhancedQuery);
      } catch (error) {
        console.warn('⚠️ [QueryAnalysis] Query processing failed, using original:', error);
      }
    }
    
    const prompt = buildQueryAnalysisPrompt(enhancedQuery, userContext, capabilities);
    
    // Log the prompt for debugging
    console.log('📝 [QueryAnalysis] Prompt preview:', prompt.substring(0, 300) + '...');
    
    try {
      let text = await this.llm.generateContent(
        prompt,
        QueryAnalysisSchema,
      );

      console.log('📄 [QueryAnalysis] Raw response:', text?.substring(0, 200));

      const analysis = JSON.parse(text);
      
      console.log('📊 [QueryAnalysis] Parsed analysis:', JSON.stringify(analysis, null, 2));
      
      // Log and ground airport codes
      console.log('✈️ [QueryAnalysis] Airport codes from LLM:', analysis.parameters?.destinationAirports);
      
      if (analysis.parameters?.destinationAirports && analysis.parameters.destinationAirports.length > 0) {
        console.log('🛂 [QueryAnalysis] Grounding airports:', analysis.parameters.destinationAirports);
        analysis.parameters.destinationAirports = await this.groundAirportCodes(
          analysis.parameters.destinationAirports,
          analysis.parameters.destination
        );
        console.log('✅ [QueryAnalysis] Grounded airports:', analysis.parameters.destinationAirports);
      } else {
        console.error('❌ [QueryAnalysis] LLM did not return destinationAirports array!');
      }
      
      // Ensure sentiment exists with fallback
      if (!analysis.sentiment) {
        console.warn('⚠️ [QueryAnalysis] Missing sentiment, using fallback');
        analysis.sentiment = {
          emotion: 'relaxing',
          intensity: 'medium',
          vibe: ['casual']
        };
      }
      
      // Ensure temporal exists with fallback
      if (!analysis.temporal) {
        console.warn('⚠️ [QueryAnalysis] Missing temporal, using fallback');
        analysis.temporal = {
          suggestedTimeOfDay: 'afternoon',
          timeReasoning: 'General afternoon activities',
          duration: 2,
          bestTimes: []
        };
      }
      
      console.log('✅ [QueryAnalysis] Complete:', {
        intent: analysis.intent,
        categories: analysis.categories,
        emotion: analysis.sentiment?.emotion || 'unknown',
        time: analysis.temporal?.suggestedTimeOfDay || 'unknown'
      });
      
      // CATEGORIZATION ANALYSIS LOGGING
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 [QueryAnalysis] CATEGORIZATION BREAKDOWN');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 Query Categories (Domain):', analysis.categories);
      console.log('🎭 Nature of Travel:', analysis.parameters.natureOfTravel);
      console.log('😊 Sentiment Emotion:', analysis.sentiment.emotion);
      console.log('💪 Sentiment Intensity:', analysis.sentiment.intensity);
      console.log('✨ Sentiment Vibe:', analysis.sentiment.vibe);
      console.log('💰 Price Filter:', analysis.parameters.filters.priceRange);
      console.log('⭐ Rating Filter:', analysis.parameters.filters.rating);
      console.log('🏷️  Amenities Filter:', analysis.parameters.filters.amenities);
      console.log('🔑 Keywords:', analysis.parameters.keywords);
      console.log('🏢 Establishments:', analysis.parameters.establishments);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return analysis;
    } catch (error) {
      console.error('❌ [QueryAnalysis] Error:', error);
      console.error('❌ [QueryAnalysis] Error details:', JSON.stringify(error, null, 2));
      console.log('⚠️ [QueryAnalysis] Returning fallback analysis');
      return this.getFallbackAnalysis(query);
    }
  }



  /**
   * Ground airport codes against database
   * Validates LLM output and replaces invalid codes with database lookups
   */
  private async groundAirportCodes(llmCodes: string[], destination: string): Promise<string[]> {
    console.log('🛂 [QueryAnalysis] Grounding airport codes:', llmCodes);
    
    try {
      const { AirportValidator } = await import('./AirportValidator');
      const validator = new AirportValidator();
      
      // Validate LLM codes using FTS
      const validated = await validator.validateAirports(llmCodes);
      
      if (validated.length > 0) {
        const codes = validated.map(a => a.iata);
        console.log('✅ [QueryAnalysis] Validated airports:', codes);
        return codes;
      }
      
      // Fallback: search by destination if LLM codes were invalid
      console.log('🔄 [QueryAnalysis] No valid codes, searching by destination:', destination);
      const fallback = await validator.getAirportsForDestination(destination);
      const codes = fallback.map(a => a.iata);
      
      console.log('✅ [QueryAnalysis] Fallback airports:', codes);
      return codes;
    } catch (error) {
      console.error('❌ [QueryAnalysis] Grounding failed:', error);
      return llmCodes; // Fallback to LLM codes
    }
  }

  private getFallbackAnalysis(query: string): QueryAnalysis {
    return {
      intent: 'search',
      categories: ['activities'],
      sentiment: {
        emotion: 'relaxing',
        intensity: 'medium',
        vibe: ['casual', 'comfortable']
      },
      temporal: {
        suggestedTimeOfDay: 'afternoon',
        timeReasoning: 'General afternoon activities',
        duration: 2,
        bestTimes: [
          {
            time: '2:00 PM - 5:00 PM',
            reason: 'Comfortable afternoon time',
            suitability: 0.7
          }
        ]
      },
      parameters: {
        destination: query,
        destinationAirports: [],
        establishments: ['attraction'],
        keywords: [],
        filters: {},
        sortBy: 'rating',
        limit: 10
      },
      missingFields: [],
      suggestedQuestions: [],
      confidence: 0.5,
      suggestedUIType: 'list',
      suggestedComponents: ['card-basic', 'list-basic']
    };
  }
}

// Query Analysis Service - Phase 1: Extract structured parameters from natural language

import { LLMProvider } from '@/core/LLMProvider';
import { configManager } from '../config/ConfigManager';
import { GeminiCore } from '../core/GeminiCore';
import { OpenAICore } from '../core/OpenAICore';
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
    const openaiKey = configManager.getApiKeyOrNull('openai');
    const openaiModel = configManager.getOpenAIModel();
    
    if (openaiKey) {
      console.log('🤖 [QueryAnalysis] Using OpenAI');
      this.llm = new OpenAICore(openaiKey, openaiModel);
    } else {
      const geminiKey = configManager.getApiKeyOrNull('gemini');
      const modelName = configManager.getModelName();
      if (!geminiKey) {
        throw new Error('API key required for query analysis');
      }
      console.log('🤖 [QueryAnalysis] Using Gemini');
      this.llm = new GeminiCore(geminiKey, modelName);
    }
  }

  async analyzeQuery(query: string, userContext?: any): Promise<QueryAnalysis> {
    console.log('🔍 [QueryAnalysis] Analyzing:', query);
    
    const prompt = buildQueryAnalysisPrompt(query, userContext);
    
    try {
      let text = await this.llm.generateContent(
        prompt,
        QueryAnalysisSchema,
      );

      console.log('📄 [QueryAnalysis] Raw response:', text?.substring(0, 200));

      const analysis = JSON.parse(text);
      
      console.log('📊 [QueryAnalysis] Parsed analysis:', JSON.stringify(analysis, null, 2));
      
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
      
      return analysis;
    } catch (error) {
      console.error('❌ [QueryAnalysis] Error:', error);
      console.error('❌ [QueryAnalysis] Error details:', JSON.stringify(error, null, 2));
      console.log('⚠️ [QueryAnalysis] Returning fallback analysis');
      return this.getFallbackAnalysis(query);
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

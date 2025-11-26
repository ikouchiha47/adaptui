// Crowd Intelligence Service - Multi-source data fusion with sentiment understanding
import { configManager } from '../config/ConfigManager';
import { GeminiCore } from '../core/GeminiCore';
import { LLMProvider } from '../core/LLMProvider';
import { OpenAICore } from '../core/OpenAICore';
import { CacheService } from './CacheService';
import { DDGScraperService } from './DDGScraperService';
import { PlacesInsightsService } from './PlacesInsightsService';

export interface CrowdScore {
  level: 'quiet' | 'moderate' | 'busy' | 'very busy';
  confidence: number; // 0-1
  bestTimeToVisit: string;
  reasoning: string;
  sources: {
    googleInsights?: number; // 0-1 score
    ddgScraper?: number; // 0-1 score
    llmInference?: number; // 0-1 score
    heuristics?: number; // 0-1 score
  };
  sentimentMatch: number; // How well it matches user's desired sentiment (0-1)
  placeSummary?: {
    name: string;
    summary: string;
    rating?: number;
    userRatingCount?: number;
  };
  openingHours?: {
    isOpen?: boolean;
    currentStatus?: string;
    hours?: any;
  };
}

export interface SearchCriteria {
  place: string;
  city: string;
  placeType: string; // restaurant, bar, temple, etc.
  userIntent: string; // romantic, party, peaceful, cultural
  timeOfDay?: string; // morning, afternoon, evening, night
  dayOfWeek?: string; // monday-sunday
  desiredCrowdLevel?: 'quiet' | 'moderate' | 'busy' | 'very busy';
}

export class CrowdIntelligenceService {
  private insightsService: PlacesInsightsService;
  private scraperService: DDGScraperService;
  private llm: LLMProvider | null;

  constructor() {
    this.insightsService = new PlacesInsightsService();
    this.scraperService = new DDGScraperService();

    // Initialize LLM provider (prefer OpenAI, fallback to Gemini)
    const openaiKey = configManager.getApiKeyOrNull('openai');
    const openaiModel = configManager.getOpenAIModel();

    if (openaiKey) {
      this.llm = new OpenAICore(openaiKey, openaiModel);
    } else {
      const geminiKey = configManager.getApiKeyOrNull('gemini');
      const modelName = configManager.getModelName();
      if (geminiKey) {
        this.llm = new GeminiCore(geminiKey, modelName);
      } else {
        this.llm = null;
      }
    }
  }

  /**
   * Main method: Get comprehensive crowd intelligence with place data
   */
  async analyzeCrowd(criteria: SearchCriteria): Promise<CrowdScore> {
    console.log('🧠 [CrowdIntel] Analyzing:', criteria.place);

    const cacheKey = `${criteria.place}_${criteria.city}_${criteria.userIntent}`;
    const cached = await CacheService.get<CrowdScore>('crowd_intel', cacheKey);
    
    if (cached) {
      console.log('✅ [CrowdIntel] Using cached intelligence');
      return cached;
    }

    // Parallel data fetching - crowd scores AND place data
    const [googleScore, ddgScore, llmScore, heuristicScore, placeData] = await Promise.all([
      this.getGoogleInsightsScore(criteria),
      this.getDDGScraperScore(criteria),
      this.getLLMInferenceScore(criteria),
      this.getHeuristicScore(criteria),
      this.getPlaceData(criteria)
    ]);

    // Weighted combination (adjust weights based on data availability)
    const weights = {
      google: googleScore !== null ? 0.35 : 0,
      ddg: ddgScore !== null ? 0.25 : 0,
      llm: llmScore !== null ? 0.25 : 0,
      heuristic: 0.15
    };

    // Normalize weights if some sources are missing
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] /= totalWeight;
    });

    // Calculate combined score
    const combinedScore = 
      (googleScore || 0) * weights.google +
      (ddgScore || 0) * weights.ddg +
      (llmScore || 0) * weights.llm +
      heuristicScore * weights.heuristic;

    // Convert score to crowd level
    const level = this.scoreToLevel(combinedScore);

    // Calculate sentiment match
    const sentimentMatch = this.calculateSentimentMatch(level, criteria.userIntent);

    // Calculate confidence based on source availability
    const confidence = this.calculateConfidence([
      googleScore !== null,
      ddgScore !== null,
      llmScore !== null
    ]);

    // Determine best time to visit
    const bestTime = await this.determineBestTime(criteria, level);

    const result: CrowdScore = {
      level,
      confidence,
      bestTimeToVisit: bestTime,
      reasoning: this.generateReasoning(criteria, level, sentimentMatch, placeData),
      sources: {
        googleInsights: googleScore || undefined,
        ddgScraper: ddgScore || undefined,
        llmInference: llmScore || undefined,
        heuristics: heuristicScore
      },
      sentimentMatch,
      placeSummary: placeData?.summary,
      openingHours: placeData?.openingHours
    };

    // Cache for 4 hours
    await CacheService.set('crowd_intel', cacheKey, result, 4 * 60 * 60 * 1000);

    console.log(`✅ [CrowdIntel] Result: ${level} (confidence: ${confidence.toFixed(2)})`);
    return result;
  }

  /**
   * Get place data (summary + opening hours) in parallel
   */
  private async getPlaceData(criteria: SearchCriteria): Promise<{
    summary?: {
      name: string;
      summary: string;
      rating?: number;
      userRatingCount?: number;
    };
    openingHours?: {
      isOpen?: boolean;
      currentStatus?: string;
      hours?: any;
    };
  } | null> {
    try {
      // First, get place ID from generative summary
      const summaries = await this.insightsService.getGenerativeSummary(
        `${criteria.place} ${criteria.city}`
      );

      if (!summaries || summaries.length === 0) {
        console.warn(`⚠️ [CrowdIntel] No place found for: ${criteria.place}`);
        return null;
      }

      const placeId = summaries[0].placeId;
      console.log(`🔍 [CrowdIntel] Using place ID: ${placeId}`);

      // Check cache first
      const [cachedSummary, cachedHours] = await Promise.all([
        CacheService.getPlaceSummary(placeId),
        CacheService.getOpeningHours(placeId)
      ]);

      if (cachedSummary && cachedHours) {
        console.log('✅ [CrowdIntel] Using cached place data');
        return {
          summary: cachedSummary,
          openingHours: cachedHours
        };
      }

      // Fetch fresh data if not cached
      const [detailsResult, hoursResult] = await Promise.all([
        cachedSummary ? Promise.resolve(null) : this.insightsService.getPlaceDetails(placeId),
        cachedHours ? Promise.resolve(null) : this.insightsService.getOpeningHours(placeId)
      ]);

      // Cache the results
      if (detailsResult && !cachedSummary) {
        await CacheService.setPlaceSummary(
          placeId,
          detailsResult.displayName?.text || criteria.place,
          detailsResult.editorialSummary?.text || '',
          detailsResult.rating,
          detailsResult.userRatingCount
        );
      }

      if (hoursResult && !cachedHours) {
        await CacheService.setOpeningHours(
          placeId,
          hoursResult,
          hoursResult.openNow ? 'Open now' : 'Closed'
        );
      }

      return {
        summary: cachedSummary || (detailsResult ? {
          name: detailsResult.displayName?.text || criteria.place,
          summary: detailsResult.editorialSummary?.text || '',
          rating: detailsResult.rating,
          userRatingCount: detailsResult.userRatingCount
        } : undefined),
        openingHours: cachedHours || (hoursResult ? {
          isOpen: hoursResult.openNow,
          currentStatus: hoursResult.openNow ? 'Open now' : 'Closed',
          hours: hoursResult
        } : undefined)
      };
    } catch (error) {
      console.warn('⚠️ [CrowdIntel] Place data fetch failed:', error);
      return null;
    }
  }

  /**
   * Source 1: Google Area Insights (aggregate data)
   */
  private async getGoogleInsightsScore(criteria: SearchCriteria): Promise<number | null> {
    try {
      // First, get generative summary which includes placeId
      const summaries = await this.insightsService.getGenerativeSummary(
        `${criteria.place} ${criteria.city}`
      );

      if (!summaries || summaries.length === 0) return null;

      const placeId = summaries[0].placeId;

      // Get area insights
      const insights = await this.insightsService.getAreaInsights(placeId, {
        types: [criteria.placeType],
        minRating: 3.5
      });

      if (!insights) return null;

      // Convert count to score (0-1)
      const crowdLevel = this.insightsService.estimateCrowdLevel(
        insights.count,
        criteria.placeType
      );

      return this.levelToScore(crowdLevel);
    } catch (error) {
      console.warn('⚠️ [CrowdIntel] Google Insights failed:', error);
      return null;
    }
  }

  /**
   * Source 2: DuckDuckGo Scraper (real-time mentions)
   */
  private async getDDGScraperScore(criteria: SearchCriteria): Promise<number | null> {
    try {
      const scrapedData = await this.scraperService.scrapePlaceData(
        criteria.place,
        criteria.city,
        criteria.userIntent
      );

      if (!scrapedData.estimatedCrowdLevel) return null;

      return this.levelToScore(scrapedData.estimatedCrowdLevel);
    } catch (error) {
      console.warn('⚠️ [CrowdIntel] DDG Scraper failed:', error);
      return null;
    }
  }

  /**
   * Source 3: LLM Inference (semantic understanding)
   */
  private async getLLMInferenceScore(criteria: SearchCriteria): Promise<number | null> {
    if (!this.llm) return null;

    try {
      const prompt = `You are a travel expert. Estimate the crowd level for this place.

Place: ${criteria.place}
City: ${criteria.city}
Type: ${criteria.placeType}
Time: ${criteria.timeOfDay || 'general'}
Day: ${criteria.dayOfWeek || 'weekday'}

Based on your knowledge of typical patterns for this type of place, estimate:
1. Crowd level: quiet, moderate, busy, or very busy
2. Best time to visit to ${criteria.userIntent === 'peaceful' || criteria.userIntent === 'romantic' ? 'avoid crowds' : 'experience the energy'}
3. Reasoning

Return JSON:
{
  "crowdLevel": "quiet|moderate|busy|very busy",
  "bestTime": "time of day",
  "reasoning": "brief explanation"
}`;

      const response = await this.llm.generateContent(prompt);
      const parsed = JSON.parse(response);

      return this.levelToScore(parsed.crowdLevel);
    } catch (error) {
      console.warn('⚠️ [CrowdIntel] LLM Inference failed:', error);
      return null;
    }
  }

  /**
   * Source 4: Heuristic Rules (time-based patterns)
   */
  private getHeuristicScore(criteria: SearchCriteria): number {
    const now = new Date();
    const hour = criteria.timeOfDay ? this.timeToHour(criteria.timeOfDay) : now.getHours();
    const isWeekend = criteria.dayOfWeek ? 
      ['saturday', 'sunday'].includes(criteria.dayOfWeek.toLowerCase()) :
      [0, 6].includes(now.getDay());

    // Heuristic rules by place type
    const rules: Record<string, (h: number, weekend: boolean) => number> = {
      restaurant: (h, w) => {
        if (h >= 12 && h <= 14) return 0.8; // Lunch rush
        if (h >= 18 && h <= 21) return 0.9; // Dinner rush
        if (w && h >= 11 && h <= 22) return 0.7; // Weekend busy
        return 0.3;
      },
      bar: (h, w) => {
        if (h >= 21 && h <= 2) return 0.9; // Night peak
        if (w && h >= 18) return 0.8; // Weekend evening
        if (h < 18) return 0.2; // Daytime quiet
        return 0.5;
      },
      tourist_attraction: (h, w) => {
        if (h >= 10 && h <= 16) return 0.8; // Midday busy
        if (w) return 0.9; // Weekend very busy
        if (h < 9 || h > 17) return 0.2; // Early/late quiet
        return 0.6;
      },
      temple: (h, w) => {
        if (h >= 6 && h <= 8) return 0.3; // Morning quiet
        if (h >= 10 && h <= 15) return 0.7; // Midday moderate
        if (w) return 0.8; // Weekend busy
        return 0.4;
      },
      default: (h, w) => w ? 0.7 : 0.5
    };

    const rule = rules[criteria.placeType] || rules.default;
    return rule(hour, isWeekend);
  }

  /**
   * Calculate how well the crowd level matches user's sentiment
   */
  private calculateSentimentMatch(
    crowdLevel: string,
    userIntent: string
  ): number {
    const preferences: Record<string, string[]> = {
      romantic: ['quiet', 'moderate'],
      peaceful: ['quiet'],
      party: ['busy', 'very busy'],
      cultural: ['quiet', 'moderate'],
      fun: ['moderate', 'busy'],
      adventure: ['moderate', 'busy']
    };

    const preferred = preferences[userIntent] || ['moderate'];
    return preferred.includes(crowdLevel) ? 1.0 : 0.5;
  }

  /**
   * Calculate confidence based on source availability
   */
  private calculateConfidence(sourcesAvailable: boolean[]): number {
    const availableCount = sourcesAvailable.filter(Boolean).length;
    const confidenceMap = [0.3, 0.6, 0.8, 0.95]; // 0, 1, 2, 3 sources
    return confidenceMap[availableCount] || 0.3;
  }

  /**
   * Determine best time to visit based on crowd patterns
   */
  private async determineBestTime(
    criteria: SearchCriteria,
    currentLevel: string
  ): Promise<string> {
    // If user wants quiet and it's currently busy, suggest alternative
    if (criteria.userIntent === 'peaceful' || criteria.userIntent === 'romantic') {
      if (currentLevel === 'busy' || currentLevel === 'very busy') {
        return criteria.placeType === 'bar' ? 'Early evening (6-8 PM)' :
               criteria.placeType === 'restaurant' ? 'Early lunch (11 AM) or late dinner (9 PM)' :
               'Early morning (7-9 AM)';
      }
    }

    return 'Current time is good';
  }

  /**
   * Generate human-readable reasoning with place context
   */
  private generateReasoning(
    criteria: SearchCriteria,
    level: string,
    sentimentMatch: number,
    placeData?: any
  ): string {
    const match = sentimentMatch > 0.8 ? 'perfect' : 'acceptable';
    let reasoning = `Based on ${criteria.placeType} patterns and ${criteria.userIntent} preferences, ` +
           `${criteria.place} is typically ${level}. This is ${match} for your needs.`;
    
    // Add opening hours context if available
    if (placeData?.openingHours?.isOpen !== undefined) {
      const status = placeData.openingHours.isOpen ? 'currently open' : 'currently closed';
      reasoning += ` The place is ${status}.`;
    }
    
    // Add rating context if available
    if (placeData?.summary?.rating) {
      reasoning += ` Rated ${placeData.summary.rating.toFixed(1)}/5`;
      if (placeData.summary.userRatingCount) {
        reasoning += ` (${placeData.summary.userRatingCount} reviews)`;
      }
      reasoning += '.';
    }
    
    return reasoning;
  }

  // Helper conversions
  private levelToScore(level: string): number {
    const map: Record<string, number> = {
      'quiet': 0.2,
      'moderate': 0.5,
      'busy': 0.75,
      'very busy': 0.95
    };
    return map[level] || 0.5;
  }

  private scoreToLevel(score: number): 'quiet' | 'moderate' | 'busy' | 'very busy' {
    if (score < 0.35) return 'quiet';
    if (score < 0.65) return 'moderate';
    if (score < 0.85) return 'busy';
    return 'very busy';
  }

  private timeToHour(time: string): number {
    const map: Record<string, number> = {
      'morning': 9,
      'afternoon': 14,
      'evening': 19,
      'night': 22,
      'late-night': 1
    };
    return map[time.toLowerCase()] || 12;
  }
}

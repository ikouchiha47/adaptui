// Ranking Service - Intelligent place ranking with weighted scoring
import { CrowdIntelligenceService, CrowdScore } from './CrowdIntelligenceService';
import { QueryAnalysis } from './QueryAnalysisService';

export interface RankingCriteria {
  userIntent: string; // romantic, party, peaceful, cultural
  timeOfDay?: string;
  dayOfWeek?: string;
  budget?: 'budget' | 'mid' | 'luxury';
  prioritizeOpen?: boolean;
}

export interface PlaceScore {
  placeId: string;
  placeName: string;
  totalScore: number; // 0-100
  breakdown: {
    sentimentMatch: number; // 0-25 points
    crowdLevel: number; // 0-20 points
    openingHours: number; // 0-15 points
    rating: number; // 0-20 points
    llmRelevance: number; // 0-20 points
  };
  crowdIntel?: CrowdScore;
  reasoning: string;
}

export class RankingService {
  private crowdService: CrowdIntelligenceService;

  // Scoring weights (total = 100)
  private readonly WEIGHTS = {
    sentimentMatch: 25, // How well it matches user's emotional intent
    crowdLevel: 20, // Crowd level appropriateness
    openingHours: 15, // Is it open now / at desired time
    rating: 20, // Google rating and review count
    llmRelevance: 20 // LLM's assessment of relevance
  };

  constructor() {
    this.crowdService = new CrowdIntelligenceService();
  }

  /**
   * Rank places based on multiple weighted signals
   */
  async rankPlaces(
    places: Array<{
      name: string;
      city: string;
      type: string;
      rating?: number;
      userRatingCount?: number;
      llmRelevanceScore?: number; // 0-1 from LLM
      isOpen?: boolean;
    }>,
    criteria: RankingCriteria
  ): Promise<PlaceScore[]> {
    console.log(`🎯 [Ranking] Ranking ${places.length} places...`);

    // Get crowd intelligence for all places in parallel
    const crowdScores = await Promise.all(
      places.map(place =>
        this.crowdService.analyzeCrowd({
          place: place.name,
          city: place.city,
          placeType: place.type,
          userIntent: criteria.userIntent,
          timeOfDay: criteria.timeOfDay,
          dayOfWeek: criteria.dayOfWeek
        }).catch(err => {
          console.warn(`⚠️ [Ranking] Crowd intel failed for ${place.name}:`, err);
          return null;
        })
      )
    );

    // Calculate scores for each place
    const scores: PlaceScore[] = places.map((place, idx) => {
      const crowdIntel = crowdScores[idx];

      // 1. Sentiment Match Score (0-25 points)
      const sentimentScore = crowdIntel
        ? crowdIntel.sentimentMatch * this.WEIGHTS.sentimentMatch
        : this.WEIGHTS.sentimentMatch * 0.5; // Default to 50% if no data

      // 2. Crowd Level Score (0-20 points)
      const crowdScore = this.calculateCrowdScore(
        crowdIntel?.level,
        criteria.userIntent
      );

      // 3. Opening Hours Score (0-15 points)
      const hoursScore = this.calculateHoursScore(
        crowdIntel?.openingHours?.isOpen ?? place.isOpen,
        criteria.prioritizeOpen
      );

      // 4. Rating Score (0-20 points)
      const ratingScore = this.calculateRatingScore(
        place.rating,
        place.userRatingCount
      );

      // 5. LLM Relevance Score (0-20 points)
      const llmScore = place.llmRelevanceScore
        ? place.llmRelevanceScore * this.WEIGHTS.llmRelevance
        : this.WEIGHTS.llmRelevance * 0.7; // Default to 70% if no explicit score

      const totalScore = sentimentScore + crowdScore + hoursScore + ratingScore + llmScore;

      // Log the calculation breakdown
      console.log(`📊 [Ranking] ${place.name}:`);
      console.log(`   Sentiment: ${Math.round(sentimentScore * 10) / 10}/${this.WEIGHTS.sentimentMatch}`);
      console.log(`   Crowd: ${Math.round(crowdScore * 10) / 10}/${this.WEIGHTS.crowdLevel}`);
      console.log(`   Hours: ${Math.round(hoursScore * 10) / 10}/${this.WEIGHTS.openingHours}`);
      console.log(`   Rating: ${Math.round(ratingScore * 10) / 10}/${this.WEIGHTS.rating}`);
      console.log(`   LLM: ${Math.round(llmScore * 10) / 10}/${this.WEIGHTS.llmRelevance}`);
      console.log(`   = TOTAL: ${Math.round(totalScore * 10) / 10}/100`);

      return {
        placeId: `${place.name}_${place.city}`,
        placeName: place.name,
        totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
        breakdown: {
          sentimentMatch: Math.round(sentimentScore * 10) / 10,
          crowdLevel: Math.round(crowdScore * 10) / 10,
          openingHours: Math.round(hoursScore * 10) / 10,
          rating: Math.round(ratingScore * 10) / 10,
          llmRelevance: Math.round(llmScore * 10) / 10
        },
        crowdIntel: crowdIntel || undefined,
        reasoning: this.generateReasoning(place, crowdIntel, criteria)
      };
    });

    // Sort by total score (descending)
    scores.sort((a, b) => b.totalScore - a.totalScore);

    console.log(`✅ [Ranking] Ranked ${scores.length} places`);
    console.log(`🏆 [Ranking] Top place: ${scores[0]?.placeName} (${scores[0]?.totalScore}/100)`);

    return scores;
  }

  /**
   * Calculate crowd level score based on user intent
   */
  private calculateCrowdScore(
    crowdLevel?: string,
    userIntent?: string
  ): number {
    if (!crowdLevel) return this.WEIGHTS.crowdLevel * 0.5;

    // Map user intent to preferred crowd levels
    const preferences: Record<string, Record<string, number>> = {
      romantic: { quiet: 1.0, moderate: 0.8, busy: 0.3, 'very busy': 0.1 },
      peaceful: { quiet: 1.0, moderate: 0.6, busy: 0.2, 'very busy': 0.0 },
      party: { quiet: 0.2, moderate: 0.5, busy: 0.9, 'very busy': 1.0 },
      cultural: { quiet: 0.9, moderate: 0.8, busy: 0.5, 'very busy': 0.3 },
      fun: { quiet: 0.4, moderate: 0.8, busy: 0.9, 'very busy': 0.7 },
      adventure: { quiet: 0.5, moderate: 0.9, busy: 0.8, 'very busy': 0.6 },
      relaxing: { quiet: 1.0, moderate: 0.7, busy: 0.3, 'very busy': 0.1 },
      energetic: { quiet: 0.2, moderate: 0.6, busy: 0.9, 'very busy': 1.0 }
    };

    const intentPrefs = preferences[userIntent || 'fun'] || preferences.fun;
    const multiplier = intentPrefs[crowdLevel] || 0.5;

    return multiplier * this.WEIGHTS.crowdLevel;
  }

  /**
   * Calculate opening hours score
   */
  private calculateHoursScore(
    isOpen?: boolean,
    prioritizeOpen?: boolean
  ): number {
    if (isOpen === undefined) return this.WEIGHTS.openingHours * 0.5;

    if (prioritizeOpen) {
      return isOpen ? this.WEIGHTS.openingHours : 0;
    }

    return isOpen
      ? this.WEIGHTS.openingHours
      : this.WEIGHTS.openingHours * 0.3;
  }

  /**
   * Calculate rating score with review count consideration
   */
  private calculateRatingScore(
    rating?: number,
    reviewCount?: number
  ): number {
    if (!rating) return this.WEIGHTS.rating * 0.5;

    // Base score from rating (0-5 scale)
    const ratingScore = (rating / 5) * 0.8; // 80% weight

    // Confidence boost from review count (20% weight)
    let confidenceBoost = 0;
    if (reviewCount) {
      if (reviewCount >= 1000) confidenceBoost = 0.2;
      else if (reviewCount >= 500) confidenceBoost = 0.15;
      else if (reviewCount >= 100) confidenceBoost = 0.1;
      else if (reviewCount >= 50) confidenceBoost = 0.05;
    }

    return (ratingScore + confidenceBoost) * this.WEIGHTS.rating;
  }

  /**
   * Generate human-readable reasoning for the score
   */
  private generateReasoning(
    place: any,
    crowdIntel: CrowdScore | null,
    criteria: RankingCriteria
  ): string {
    const reasons: string[] = [];

    // Sentiment match
    if (crowdIntel && crowdIntel.sentimentMatch > 0.8) {
      reasons.push(`Perfect match for ${criteria.userIntent} vibe`);
    } else if (crowdIntel && crowdIntel.sentimentMatch > 0.5) {
      reasons.push(`Good fit for ${criteria.userIntent} experience`);
    }

    // Crowd level
    if (crowdIntel?.level) {
      const crowdDesc = {
        quiet: 'peaceful atmosphere',
        moderate: 'comfortable crowd',
        busy: 'lively energy',
        'very busy': 'vibrant scene'
      }[crowdIntel.level];
      reasons.push(crowdDesc);
    }

    // Opening status
    if (crowdIntel?.openingHours?.isOpen) {
      reasons.push('Open now');
    } else if (crowdIntel?.openingHours?.isOpen === false) {
      reasons.push('Currently closed');
    }

    // Rating
    if (place.rating && place.rating >= 4.5) {
      reasons.push(`Highly rated (${place.rating}/5)`);
    } else if (place.rating && place.rating >= 4.0) {
      reasons.push(`Well rated (${place.rating}/5)`);
    }

    // Review count
    if (place.userRatingCount && place.userRatingCount >= 1000) {
      reasons.push('Very popular');
    }

    return reasons.join(' • ') || 'Recommended based on your preferences';
  }

  /**
   * Create ranking criteria from query analysis
   */
  static fromQueryAnalysis(analysis: QueryAnalysis): RankingCriteria {
    return {
      userIntent: analysis.sentiment.emotion,
      timeOfDay: analysis.temporal.suggestedTimeOfDay,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      prioritizeOpen: analysis.parameters.filters.openNow
    };
  }
}

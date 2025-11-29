/**
 * Place Ranker Interface - Dependency Injection for ranking strategies
 */

export interface PlaceRanker {
  /**
   * Rank places by relevance
   * @param places - Places to rank
   * @param context - Ranking context (original query, user prefs, etc.)
   * @returns Ranked places (highest relevance first) - can be async for LLM-based rankers
   */
  rank(places: any[], context: RankingContext): any[] | Promise<any[]>;
}

export interface RankingContext {
  originalQuery?: string;
  keywords?: string[]; // From QueryAnalysis: ["fun bars", "nightlife", "rooftop bars"]
  establishments?: string[]; // From QueryAnalysis: ["bar", "nightlife district"]
  userLocation?: { lat: number; lng: number };
  userPreferences?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Simple keyword-based ranker
 * Ranks by term overlap with original query
 */
export class SimpleKeywordRanker implements PlaceRanker {
  rank(places: any[], context: RankingContext): any[] {
    if (!context.originalQuery && !context.keywords) {
      return places; // No ranking without query or keywords
    }

    // Use keywords from QueryAnalysis if available, otherwise parse originalQuery
    const terms = context.keywords || context.originalQuery?.toLowerCase().split(' ') || [];
    const establishments = context.establishments || [];

    return places.sort((a, b) => {
      const scoreA = this.calculateScore(a, terms, establishments);
      const scoreB = this.calculateScore(b, terms, establishments);
      return scoreB - scoreA; // Higher score first
    });
  }

  private calculateScore(place: any, terms: string[], establishments: string[]): number {
    let score = 0;

    const foundBy = (place.foundBy || '').toLowerCase();
    const placeName = (place.name || '').toLowerCase();
    const placeTypes = (place.types || []).map((t: string) => t.toLowerCase());
    const primaryType = (place.primaryType || '').toLowerCase();

    // CRITICAL: Boost for establishment type matches (e.g., "bar", "restaurant")
    establishments.forEach(establishment => {
      const estLower = establishment.toLowerCase();
      
      // Check in place types (HIGHEST priority)
      if (placeTypes.some((t: string) => t.includes(estLower) || estLower.includes(t))) {
        score += 25; // HIGHEST weight for establishment type match
      }
      if (primaryType.includes(estLower) || estLower.includes(primaryType)) {
        score += 25;
      }
      
      // Check in foundBy query
      if (foundBy.includes(estLower)) {
        score += 15;
      }
      
      // Check in place name
      if (placeName.includes(estLower)) {
        score += 10;
      }
    });

    // Score for matching keywords (e.g., "fun bars", "rooftop bars")
    terms.forEach(term => {
      const termLower = typeof term === 'string' ? term.toLowerCase() : '';
      
      // Check in foundBy query
      if (foundBy.includes(termLower)) {
        score += 8;
      }
      
      // Check in place name
      if (placeName.includes(termLower)) {
        score += 5;
      }
      
      // Check in place types
      if (placeTypes.some((t: string) => t.includes(termLower) || termLower.includes(t))) {
        score += 6;
      }
    });

    // Bonus for high ratings
    if (place.rating) {
      score += place.rating; // 0-5 bonus
    }

    // Bonus for places with more data
    if (place.generativeSummary?.overview) score += 2;
    if (place.generativeSummary?.description) score += 1;
    if (place.photoUrl || place.photoUrls) score += 1;

    return score;
  }
}

/**
 * Distance-based ranker
 * Ranks by proximity to user location
 */
export class DistanceRanker implements PlaceRanker {
  rank(places: any[], context: RankingContext): any[] {
    if (!context.userLocation) {
      return places; // No ranking without location
    }

    return places.sort((a, b) => {
      const distA = this.calculateDistance(a, context.userLocation!);
      const distB = this.calculateDistance(b, context.userLocation!);
      return distA - distB; // Closer first
    });
  }

  private calculateDistance(place: any, userLoc: { lat: number; lng: number }): number {
    if (!place.latitude || !place.longitude) {
      return Infinity; // Places without coords go last
    }

    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(place.latitude - userLoc.lat);
    const dLon = this.toRad(place.longitude - userLoc.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(userLoc.lat)) *
        Math.cos(this.toRad(place.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

/**
 * Hybrid ranker - Combines multiple ranking strategies
 */
export class HybridRanker implements PlaceRanker {
  constructor(
    private keywordWeight: number = 0.6,
    private distanceWeight: number = 0.2,
    private ratingWeight: number = 0.2
  ) {}

  rank(places: any[], context: RankingContext): any[] {
    const keywordRanker = new SimpleKeywordRanker();
    const distanceRanker = new DistanceRanker();

    // Get scores from each ranker
    const keywordScores = this.getScores(places, keywordRanker, context);
    const distanceScores = context.userLocation
      ? this.getDistanceScores(places, distanceRanker, context)
      : new Map();

    // Combine scores
    return places.sort((a, b) => {
      const scoreA = this.combineScores(a, keywordScores, distanceScores);
      const scoreB = this.combineScores(b, keywordScores, distanceScores);
      return scoreB - scoreA;
    });
  }

  private getScores(places: any[], ranker: PlaceRanker, context: RankingContext): Map<string, number> {
    const ranked = ranker.rank([...places], context);
    const scores = new Map<string, number>();
    // Handle both sync and async results
    const rankedArray = Array.isArray(ranked) ? ranked : [];
    rankedArray.forEach((place: any, index: number) => {
      scores.set(place.placeId, places.length - index); // Higher rank = higher score
    });
    return scores;
  }

  private getDistanceScores(
    places: any[],
    ranker: DistanceRanker,
    context: RankingContext
  ): Map<string, number> {
    const ranked = ranker.rank([...places], context);
    const scores = new Map<string, number>();
    // Handle both sync and async results
    const rankedArray = Array.isArray(ranked) ? ranked : [];
    rankedArray.forEach((place: any, index: number) => {
      scores.set(place.placeId, places.length - index);
    });
    return scores;
  }

  private combineScores(
    place: any,
    keywordScores: Map<string, number>,
    distanceScores: Map<string, number>
  ): number {
    const keywordScore = keywordScores.get(place.placeId) || 0;
    const distanceScore = distanceScores.get(place.placeId) || 0;
    const ratingScore = (place.rating || 0) * 10; // Normalize to 0-50

    return (
      keywordScore * this.keywordWeight +
      distanceScore * this.distanceWeight +
      ratingScore * this.ratingWeight
    );
  }
}

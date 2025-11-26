// DuckDuckGo HTML Scraper for Real-Time Place Data
import { CacheService } from './CacheService';

export interface ScrapedPlaceData {
  crowdMentions: string[];
  timeMentions: string[];
  sentimentScore: number; // -1 to 1
  recentReviews: string[];
  estimatedCrowdLevel?: 'quiet' | 'moderate' | 'busy' | 'very busy';
}

export class DDGScraperService {
  private baseUrl = 'https://html.duckduckgo.com/html/';

  /**
   * Build search terms based on intent
   */
  buildSearchTerms(place: string, city: string, intent: string): string[] {
    const baseTerms = [
      `"${place}" ${city} busy hours`,
      `"${place}" ${city} best time to visit`,
      `"${place}" ${city} crowd level`,
    ];

    const intentTerms: Record<string, string[]> = {
      romantic: [
        `"${place}" ${city} romantic quiet`,
        `"${place}" ${city} intimate atmosphere`,
        `"${place}" ${city} date night`
      ],
      party: [
        `"${place}" ${city} nightlife busy`,
        `"${place}" ${city} crowd energy`,
        `"${place}" ${city} party atmosphere`
      ],
      peaceful: [
        `"${place}" ${city} quiet peaceful`,
        `"${place}" ${city} avoid crowds`,
        `"${place}" ${city} serene calm`
      ],
      cultural: [
        `"${place}" ${city} cultural experience`,
        `"${place}" ${city} historical significance`,
        `"${place}" ${city} best time visit museum`
      ]
    };

    return [...baseTerms, ...(intentTerms[intent] || [])];
  }

  /**
   * Scrape DuckDuckGo for place information
   */
  async scrapePlaceData(place: string, city: string, intent: string): Promise<ScrapedPlaceData> {
    // Check cache first
    const cacheKey = `${place}_${city}_${intent}`;
    const cached = await CacheService.get<ScrapedPlaceData>('ddg_scrape', cacheKey);
    
    if (cached) {
      console.log('✅ [DDGScraper] Using cached data');
      return cached;
    }

    console.log(`🔍 [DDGScraper] Scraping data for: ${place}, ${city}`);

    const searchTerms = this.buildSearchTerms(place, city, intent);
    const results: ScrapedPlaceData = {
      crowdMentions: [],
      timeMentions: [],
      sentimentScore: 0,
      recentReviews: []
    };

    try {
      // Search first term only (to avoid rate limiting)
      const searchQuery = encodeURIComponent(searchTerms[0]);
      const response = await fetch(`${this.baseUrl}?q=${searchQuery}`);
      const html = await response.text();

      // Extract crowd-related mentions
      const crowdKeywords = ['busy', 'crowded', 'packed', 'quiet', 'empty', 'moderate', 'wait time'];
      crowdKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b[^.]{0,50}`, 'gi');
        const matches = html.match(regex);
        if (matches) {
          results.crowdMentions.push(...matches.slice(0, 3));
        }
      });

      // Extract time mentions
      const timeKeywords = ['morning', 'afternoon', 'evening', 'night', 'weekday', 'weekend', 'peak hours'];
      timeKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b[^.]{0,50}`, 'gi');
        const matches = html.match(regex);
        if (matches) {
          results.timeMentions.push(...matches.slice(0, 2));
        }
      });

      // Estimate crowd level from mentions
      results.estimatedCrowdLevel = this.estimateCrowdFromMentions(results.crowdMentions);

      // Calculate sentiment
      results.sentimentScore = this.calculateSentiment(html);

      console.log(`✅ [DDGScraper] Found ${results.crowdMentions.length} crowd mentions`);

      // Cache for 6 hours
      await CacheService.set('ddg_scrape', cacheKey, results, 6 * 60 * 60);

      return results;
    } catch (error) {
      console.error('❌ [DDGScraper] Error:', error);
      return results;
    }
  }

  /**
   * Estimate crowd level from text mentions
   */
  private estimateCrowdFromMentions(mentions: string[]): 'quiet' | 'moderate' | 'busy' | 'very busy' {
    const text = mentions.join(' ').toLowerCase();
    
    const busyScore = 
      (text.match(/busy|crowded|packed|wait/g) || []).length * 2 +
      (text.match(/very busy|extremely crowded/g) || []).length * 3;
    
    const quietScore = 
      (text.match(/quiet|empty|peaceful|calm/g) || []).length * 2;

    const netScore = busyScore - quietScore;

    if (netScore > 5) return 'very busy';
    if (netScore > 2) return 'busy';
    if (netScore < -2) return 'quiet';
    return 'moderate';
  }

  /**
   * Calculate sentiment score from text
   */
  private calculateSentiment(text: string): number {
    const positive = ['great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'best'];
    const negative = ['bad', 'terrible', 'awful', 'worst', 'disappointing', 'avoid'];

    const lowerText = text.toLowerCase();
    const positiveCount = positive.reduce((sum, word) => 
      sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
    );
    const negativeCount = negative.reduce((sum, word) => 
      sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
    );

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }
}

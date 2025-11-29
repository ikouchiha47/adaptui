// Place Details Research Agent - Scrapes listing sites for structured data
// Inspired by CrewAI's task-based approach with reasoning and planning

import { BaseResearchAgent, ResearchStep, TrustedSite } from './BaseResearchAgent';

interface PlaceDetails {
  name: string;
  priceRange?: string; // "$", "$$", "$$$", "$$$$"
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  reviewCount?: number;
  hours?: {
    isOpen?: boolean;
    schedule?: string[];
  };
  phone?: string;
  website?: string;
  description?: string;
  amenities?: string[];
  source: string;
}

export class PlaceDetailsAgent extends BaseResearchAgent {
  /**
   * Trusted listing sites for place details
   * Priority: 1-10 (higher = more reliable)
   */
  getTrustedSites(): TrustedSite[] {
    return [
      {
        name: 'TripAdvisor',
        domain: 'tripadvisor.com',
        types: ['restaurant', 'bar', 'hotel', 'attraction'],
        priority: 9
      },
      {
        name: 'Yelp',
        domain: 'yelp.com',
        types: ['restaurant', 'bar', 'cafe', 'nightlife'],
        priority: 8
      },
      {
        name: 'Google Maps',
        domain: 'google.com/maps',
        types: ['all'],
        priority: 10
      },
      {
        name: 'Zomato',
        domain: 'zomato.com',
        types: ['restaurant', 'bar', 'cafe'],
        priority: 7
      },
      {
        name: 'OpenTable',
        domain: 'opentable.com',
        types: ['restaurant'],
        priority: 6
      }
    ];
  }

  /**
   * Generate search URL for each listing site
   * Task: Find the place's listing page
   */
  async generateSearchUrl(site: TrustedSite, query: string, params?: any): Promise<string> {
    const placeName = encodeURIComponent(query);
    const location = params?.location || '';
    
    switch (site.name) {
      case 'TripAdvisor':
        return `https://www.tripadvisor.com/Search?q=${placeName}`;
      
      case 'Yelp':
        return `https://www.yelp.com/search?find_desc=${placeName}&find_loc=${location}`;
      
      case 'Google Maps':
        return `https://www.google.com/maps/search/${placeName}+${location}`;
      
      case 'Zomato':
        return `https://www.zomato.com/search?q=${placeName}`;
      
      case 'OpenTable':
        return `https://www.opentable.com/s?term=${placeName}`;
      
      default:
        return `https://www.google.com/search?q=${placeName}+${site.domain}`;
    }
  }

  /**
   * Extract structured data from listing page
   * Task: Parse price range, hours, rating, reviews
   * Reasoning: Different sites have different HTML structures
   */
  extractData(html: string, site: TrustedSite): PlaceDetails | null {
    console.log(`[PlaceDetailsAgent] Extracting data from ${site.name}...`);
    
    try {
      switch (site.name) {
        case 'TripAdvisor':
          return this.extractTripAdvisorData(html);
        
        case 'Yelp':
          return this.extractYelpData(html);
        
        case 'Google Maps':
          return this.extractGoogleMapsData(html);
        
        case 'Zomato':
          return this.extractZomatoData(html);
        
        case 'OpenTable':
          return this.extractOpenTableData(html);
        
        default:
          return this.extractGenericData(html, site);
      }
    } catch (error) {
      console.error(`[PlaceDetailsAgent] Extraction error for ${site.name}:`, error);
      return null;
    }
  }

  /**
   * TripAdvisor extraction
   */
  private extractTripAdvisorData(html: string): PlaceDetails | null {
    const details: PlaceDetails = {
      name: '',
      source: 'TripAdvisor'
    };

    // Extract price range ($ to $$$$)
    const priceMatch = html.match(/price_level["\s:]+(["\$]{1,4})/i);
    if (priceMatch) {
      details.priceRange = priceMatch[1].replace(/"/g, '');
    }

    // Extract rating
    const ratingMatch = html.match(/rating["\s:]+(\d+\.?\d*)/i);
    if (ratingMatch) {
      details.rating = parseFloat(ratingMatch[1]);
    }

    // Extract review count
    const reviewMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*reviews?/i);
    if (reviewMatch) {
      details.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
    }

    // Extract phone
    const phoneMatch = html.match(/tel:([+\d\s()-]+)/i);
    if (phoneMatch) {
      details.phone = phoneMatch[1].trim();
    }

    return Object.keys(details).length > 2 ? details : null;
  }

  /**
   * Yelp extraction
   */
  private extractYelpData(html: string): PlaceDetails | null {
    const details: PlaceDetails = {
      name: '',
      source: 'Yelp'
    };

    // Yelp uses specific CSS classes
    const priceMatch = html.match(/priceRange["\s:]+(["\$]{1,4})/i) || 
                      html.match(/\$\$\$\$|\$\$\$|\$\$/);
    if (priceMatch) {
      details.priceRange = priceMatch[1]?.replace(/"/g, '') || priceMatch[0];
    }

    // Extract rating (Yelp uses 1-5 stars)
    const ratingMatch = html.match(/rating["\s:]+(\d+\.?\d*)/i);
    if (ratingMatch) {
      details.rating = parseFloat(ratingMatch[1]);
    }

    // Extract review count
    const reviewMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*reviews?/i);
    if (reviewMatch) {
      details.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
    }

    // Extract hours
    const hoursMatch = html.match(/Open\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (hoursMatch) {
      details.hours = {
        isOpen: true,
        schedule: [hoursMatch[1]]
      };
    }

    return Object.keys(details).length > 2 ? details : null;
  }

  /**
   * Google Maps extraction
   */
  private extractGoogleMapsData(html: string): PlaceDetails | null {
    const details: PlaceDetails = {
      name: '',
      source: 'Google Maps'
    };

    // Google Maps price level
    const priceMatch = html.match(/price_level["\s:]+(\d)/i);
    if (priceMatch) {
      const level = parseInt(priceMatch[1]);
      details.priceRange = '$'.repeat(Math.min(level, 4));
    }

    // Rating
    const ratingMatch = html.match(/(\d+\.?\d*)\s*stars?/i);
    if (ratingMatch) {
      details.rating = parseFloat(ratingMatch[1]);
    }

    // Review count
    const reviewMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*reviews?/i);
    if (reviewMatch) {
      details.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
    }

    return Object.keys(details).length > 2 ? details : null;
  }

  /**
   * Zomato extraction
   */
  private extractZomatoData(html: string): PlaceDetails | null {
    const details: PlaceDetails = {
      name: '',
      source: 'Zomato'
    };

    // Zomato shows "₹₹" or "$$ for two"
    const priceMatch = html.match(/₹{1,4}|for two[:\s]+\$(\d+)/i);
    if (priceMatch) {
      if (priceMatch[0].includes('₹')) {
        details.priceRange = '$'.repeat(priceMatch[0].length);
      } else if (priceMatch[1]) {
        const amount = parseInt(priceMatch[1]);
        details.priceMin = amount / 2;
        details.priceMax = amount;
      }
    }

    // Rating
    const ratingMatch = html.match(/rating["\s:]+(\d+\.?\d*)/i);
    if (ratingMatch) {
      details.rating = parseFloat(ratingMatch[1]);
    }

    return Object.keys(details).length > 2 ? details : null;
  }

  /**
   * OpenTable extraction
   */
  private extractOpenTableData(html: string): PlaceDetails | null {
    const details: PlaceDetails = {
      name: '',
      source: 'OpenTable'
    };

    // OpenTable price range
    const priceMatch = html.match(/\$\$\$\$|\$\$\$|\$\$/);
    if (priceMatch) {
      details.priceRange = priceMatch[0];
    }

    // Rating
    const ratingMatch = html.match(/(\d+\.?\d*)\s*\/\s*5/i);
    if (ratingMatch) {
      details.rating = parseFloat(ratingMatch[1]);
    }

    return Object.keys(details).length > 2 ? details : null;
  }

  /**
   * Generic extraction for unknown sites
   */
  private extractGenericData(html: string, site: TrustedSite): PlaceDetails | null {
    const details: PlaceDetails = {
      name: '',
      source: site.name
    };

    // Try to find any price indicators
    const prices = this.extractPrices(html);
    if (prices.length > 0) {
      details.priceMin = Math.min(...prices);
      details.priceMax = Math.max(...prices);
    }

    // Try to find rating
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:stars?|\/\s*5)/i);
    if (ratingMatch) {
      details.rating = parseFloat(ratingMatch[1]);
    }

    return Object.keys(details).length > 2 ? details : null;
  }

  /**
   * Aggregate results from multiple sources
   * Task: Combine data from different sites with confidence weighting
   * Reasoning: Higher priority sites get more weight
   */
  aggregateResults(steps: ResearchStep[]): PlaceDetails {
    const allDetails = steps
      .filter(s => s.status === 'complete' && s.data)
      .map(s => ({ ...s.data, priority: this.getSitePriority(s.site) }));

    if (allDetails.length === 0) {
      return { name: '', source: 'none' };
    }

    // Weighted aggregation
    const aggregated: PlaceDetails = {
      name: '',
      source: 'aggregated'
    };

    // Price range - use most common or highest priority
    const priceRanges = allDetails
      .filter(d => d.priceRange)
      .sort((a, b) => b.priority - a.priority);
    if (priceRanges.length > 0) {
      aggregated.priceRange = priceRanges[0].priceRange;
    }

    // Rating - weighted average
    const ratings = allDetails.filter(d => d.rating);
    if (ratings.length > 0) {
      const totalWeight = ratings.reduce((sum, d) => sum + d.priority, 0);
      const weightedSum = ratings.reduce((sum, d) => sum + (d.rating * d.priority), 0);
      aggregated.rating = weightedSum / totalWeight;
    }

    // Review count - sum from all sources
    const reviews = allDetails.filter(d => d.reviewCount);
    if (reviews.length > 0) {
      aggregated.reviewCount = reviews.reduce((sum, d) => sum + d.reviewCount, 0);
    }

    // Hours - use highest priority source
    const withHours = allDetails
      .filter(d => d.hours)
      .sort((a, b) => b.priority - a.priority);
    if (withHours.length > 0) {
      aggregated.hours = withHours[0].hours;
    }

    return aggregated;
  }

  private getSitePriority(siteName: string): number {
    const site = this.getTrustedSites().find(s => s.name === siteName);
    return site?.priority || 1;
  }
}

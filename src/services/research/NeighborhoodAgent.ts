// Neighborhood Agent - Uses PlacesInsights + LocalTips for deep neighborhood analysis

import { LocalTip, LocalTipsGenerator } from '../LocalTipsGenerator';
import { PlacesInsightsService } from '../PlacesInsightsService';
import { BaseResearchAgent, ResearchStep, TrustedSite } from './BaseResearchAgent';

export interface NeighborhoodInsight {
  vibe: string;
  safety: string;
  foodCulture: {
    vegFriendly: boolean;
    nonVegOptions: boolean;
    localCuisine: string[];
    takeoutVsWalkin: 'takeout' | 'walkin' | 'both';
  };
  transport: {
    busStops?: number;
    metroStations?: number;
    trainStations?: number;
    taxiAvailability?: 'high' | 'medium' | 'low';
    walkability?: number; // 0-10
  };
  establishments: {
    restaurants: number;
    cafes: number;
    shops: number;
    hotels: number;
  };
  priceNegotiation: {
    common: boolean;
    categories: string[];
    tips: string[];
  };
  popularity: {
    touristy: boolean;
    local: boolean;
    crowdLevel: 'quiet' | 'moderate' | 'busy' | 'very busy';
  };
  localTips?: LocalTip[]; // Local tips from Google Places AI + DDG
}

export class NeighborhoodAgent extends BaseResearchAgent {
  private placesInsights: PlacesInsightsService;
  private localTipsGenerator: LocalTipsGenerator;
  
  constructor() {
    super();
    this.placesInsights = new PlacesInsightsService();
    this.localTipsGenerator = new LocalTipsGenerator();
  }
  
  getTrustedSites(): TrustedSite[] {
    // This agent primarily uses PlacesInsights API, not web scraping
    return [
      { name: 'Google Places Insights', domain: 'places-api', types: ['neighborhood'], priority: 10 },
      { name: 'Neighborhood Scout', domain: 'neighborhoodscout.com', types: ['safety', 'demographics'], priority: 7 },
    ];
  }

  generateSearchUrl(site: TrustedSite, query: string, params?: any): string {
    const { lat, lng, radius } = params || {};
    
    if (site.domain === 'places-api') {
      // This is handled by PlacesInsights API, not a URL
      return `places-api://nearby?lat=${lat}&lng=${lng}&radius=${radius || 1000}`;
    }
    
    return `https://www.${site.domain}/search?lat=${lat}&lng=${lng}`;
  }
  
  extractData(html: string, site: TrustedSite): any {
    // For PlacesInsights, we don't scrape HTML
    return { source: site.name };
  }
  
  aggregateResults(steps: ResearchStep[]): NeighborhoodInsight {
    // Aggregate from PlacesInsights data
    const placesData = steps.find(s => s.site === 'Google Places Insights')?.data;
    
    return {
      vibe: placesData?.vibe || 'Unknown',
      safety: placesData?.safety || 'Unknown',
      foodCulture: placesData?.foodCulture || {
        vegFriendly: false,
        nonVegOptions: true,
        localCuisine: [],
        takeoutVsWalkin: 'both'
      },
      transport: placesData?.transport || {
        busStops: 0,
        trainStations: 0,
        taxiAvailability: 'medium',
        walkability: 5
      },
      establishments: placesData?.establishments || {
        restaurants: 0,
        cafes: 0,
        shops: 0,
        hotels: 0
      },
      priceNegotiation: placesData?.priceNegotiation || {
        common: false,
        categories: [],
        tips: []
      },
      popularity: placesData?.popularity || {
        touristy: false,
        local: true,
        crowdLevel: 'moderate'
      }
    };
  }
  
  /**
   * Analyze neighborhood using existing search results + LocalTips
   */
  async analyzeNeighborhood(lat: number, lng: number, city: string, places: any[] = []): Promise<NeighborhoodInsight> {
    console.log('[NeighborhoodAgent] Analyzing area:', { lat, lng, city, placesCount: places.length });
    
    try {
      // Use the places from search results
      console.log('[NeighborhoodAgent] Using search results places:', places.length);
      
      // Get local tips (Google Places AI + DDG)
      console.log('[NeighborhoodAgent] Fetching local tips...');
      const localTips = await this.localTipsGenerator.generateTips(city, { lat, lon: lng });
      
      console.log('[NeighborhoodAgent] Local tips received:', {
        count: localTips.length,
        categories: localTips.map((t: LocalTip) => t.category)
      });
      
      // Analyze the search results
      const insights = {
        places,
        country: city.split(',').pop()?.trim() || 'Unknown',
        localTips
      };
      
      const analysis = this.analyzeInsights(insights);
      analysis.localTips = localTips;
      
      return analysis;
    } catch (error) {
      console.error('[NeighborhoodAgent] Analysis error:', error);
      throw error;
    }
  }
  
  /**
   * Analyze insights data to extract neighborhood characteristics
   */
  private analyzeInsights(insights: any): NeighborhoodInsight {
    const places = insights.places || [];
    
    console.log('[NeighborhoodAgent] Analyzing', places.length, 'places');
    
    // Count establishments by type
    const establishments = {
      restaurants: places.filter((p: any) => p.type === 'restaurant' || p.type === 'food').length,
      cafes: places.filter((p: any) => p.type === 'cafe').length,
      shops: places.filter((p: any) => p.type === 'shopping' || p.type === 'store').length,
      hotels: places.filter((p: any) => p.type === 'lodging' || p.type === 'hotel').length,
    };
    
    console.log('[NeighborhoodAgent] Establishments:', establishments);
    
    // For transport, we'll estimate based on the area
    // Search results don't include transport infrastructure
    const transport = {
      busStops: Math.floor(places.length / 10), // Estimate
      trainStations: Math.floor(places.length / 20), // Estimate
      taxiAvailability: places.length > 20 ? 'high' : places.length > 10 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
      walkability: this.calculateWalkability(establishments)
    };
    
    // Analyze food culture from the places
    const foodCulture = this.analyzeFoodCulture(places);
    
    // Determine vibe based on what's in the area
    const vibe = this.determineVibe(establishments, transport);
    
    // Assess popularity from ratings
    const popularity = this.assessPopularity(places);
    
    return {
      vibe,
      safety: 'Moderate', // Would need crime data API
      foodCulture,
      transport,
      establishments,
      priceNegotiation: this.assessNegotiationCulture(insights.country),
      popularity
    };
  }
  
  private assessTaxiAvailability(places: any[]): 'high' | 'medium' | 'low' {
    const taxiStands = places.filter(p => p.types?.includes('taxi_stand')).length;
    if (taxiStands > 5) return 'high';
    if (taxiStands > 2) return 'medium';
    return 'low';
  }
  
  private calculateWalkability(establishments: any): number {
    // More establishments = more walkable
    const total = Object.values(establishments).reduce((a, b) => (a as number) + (b as number), 0) as number;
    return Math.min(10, Math.floor(total / 5));
  }
  
  private analyzeFoodCulture(places: any[]): NeighborhoodInsight['foodCulture'] {
    const restaurants = places.filter(p => p.types?.includes('restaurant'));
    
    return {
      vegFriendly: restaurants.some(r => r.name?.toLowerCase().includes('veg')),
      nonVegOptions: restaurants.length > 0,
      localCuisine: ['Local'], // Would need cuisine classification
      takeoutVsWalkin: restaurants.length > 10 ? 'both' : 'walkin'
    };
  }
  
  private determineVibe(establishments: any, transport: any): string {
    if (establishments.cafes > 10 && establishments.restaurants > 20) {
      return 'Vibrant & Trendy';
    }
    if (transport.trainStations > 2) {
      return 'Well-connected & Busy';
    }
    if (establishments.restaurants < 5) {
      return 'Quiet & Residential';
    }
    return 'Mixed & Diverse';
  }
  
  private assessPopularity(places: any[]): NeighborhoodInsight['popularity'] {
    const avgRating = places.reduce((sum, p) => sum + (p.rating || 0), 0) / places.length;
    const totalReviews = places.reduce((sum, p) => sum + (p.user_ratings_total || 0), 0);
    
    return {
      touristy: avgRating > 4.2 && totalReviews > 1000,
      local: avgRating < 4.0 || totalReviews < 500,
      crowdLevel: totalReviews > 2000 ? 'very busy' : totalReviews > 1000 ? 'busy' : totalReviews > 500 ? 'moderate' : 'quiet'
    };
  }
  
  private assessNegotiationCulture(country?: string): NeighborhoodInsight['priceNegotiation'] {
    // Country-specific negotiation culture
    const negotiationCountries = ['india', 'thailand', 'vietnam', 'indonesia', 'morocco', 'turkey', 'egypt'];
    const countryLower = (country || '').toLowerCase();
    
    const common = negotiationCountries.some(c => countryLower.includes(c));
    
    return {
      common,
      categories: common ? ['taxis', 'markets', 'street vendors', 'tours'] : [],
      tips: common ? [
        'Start at 50-60% of asking price',
        'Be polite and smile',
        'Walk away if price too high',
        'Use local currency'
      ] : ['Prices usually fixed']
    };
  }
}

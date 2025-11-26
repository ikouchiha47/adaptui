// Google Places Insights & Generative Summary Service
import { configManager } from '../config/ConfigManager';

export interface GenerativeSummary {
  overview?: string; // ~100 chars
  description?: string; // ~400 chars
  references?: any[];
}

export interface AreaInsight {
  count: number;
  avgRating?: number;
  priceLevel?: string;
}

export interface EnrichedPlaceData {
  placeId: string;
  name: string;
  generativeSummary?: GenerativeSummary;
  areaSummary?: string;
  insights?: AreaInsight;
  crowdLevel?: 'quiet' | 'moderate' | 'busy' | 'very busy';
  bestTimeToVisit?: string;
}

export class PlacesInsightsService {
  private apiKey: string;
  private insightsUrl = 'https://areainsights.googleapis.com/v1:computeInsights';
  private placesUrl = 'https://places.googleapis.com/v1/places:searchText';

  constructor() {
    const key = configManager.getApiKeyOrNull('googlePlaces');
    if (!key) throw new Error('Google Places API key required');
    this.apiKey = key;
  }

  /**
   * Get generative summary for a place (Gemini-powered)
   */
  async getGenerativeSummary(query: string, location?: { lat: number; lng: number }): Promise<any> {
    try {
      const payload: any = {
        textQuery: query,
        maxResultCount: 5
      };

      if (location) {
        payload.locationBias = {
          circle: {
            center: { latitude: location.lat, longitude: location.lng },
            radius: 5000 // 5km radius
          }
        };
      }

      const response = await fetch(this.placesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,contextualContents,places.generativeSummary,places.areaSummary'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!data.places) {
        console.warn('⚠️ [PlacesInsights] No places found');
        return [];
      }

      // Zip places with contextual contents
      const results = data.places.map((place: any, idx: number) => {
        // Ensure place ID has 'places/' prefix for API v1
        let placeId = place.id;
        if (!placeId.startsWith('places/')) {
          placeId = `places/${placeId}`;
        }
        
        return {
          placeId,
          name: place.displayName?.text,
          generativeSummary: place.generativeSummary,
          areaSummary: place.areaSummary,
          context: data.contextualContents?.[idx]
        };
      });

      console.log(`✅ [PlacesInsights] Got ${results.length} places with summaries`);
      return results;
    } catch (error) {
      console.error('❌ [PlacesInsights] Error:', error);
      return [];
    }
  }

  /**
   * Get area insights (aggregate data for crowd estimation)
   */
  async getAreaInsights(
    placeId: string,
    filters: {
      types?: string[];
      priceLevel?: string;
      minRating?: number;
    }
  ): Promise<AreaInsight | null> {
    try {
      const payload: any = {
        insights: ['INSIGHT_COUNT'],
        filter: {
          locationFilter: {
            region: { place: placeId }
          },
          operatingStatus: ['OPERATING_STATUS_OPERATIONAL']
        }
      };

      if (filters.types) {
        payload.filter.typeFilter = { includedTypes: filters.types };
      }

      if (filters.priceLevel) {
        payload.filter.priceLevels = [filters.priceLevel];
      }

      if (filters.minRating) {
        payload.filter.ratingFilter = {
          minRating: filters.minRating,
          maxRating: 5.0
        };
      }

      const response = await fetch(this.insightsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.count !== undefined) {
        console.log(`✅ [PlacesInsights] Area has ${data.count} matching places`);
        return {
          count: data.count,
          avgRating: data.avgRating,
          priceLevel: filters.priceLevel
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [PlacesInsights] Error:', error);
      return null;
    }
  }

  /**
   * Estimate crowd level based on area insights
   */
  estimateCrowdLevel(count: number, placeType: string): 'quiet' | 'moderate' | 'busy' | 'very busy' {
    // Heuristic based on place density
    const thresholds: Record<string, { quiet: number; moderate: number; busy: number }> = {
      restaurant: { quiet: 10, moderate: 30, busy: 50 },
      bar: { quiet: 5, moderate: 15, busy: 30 },
      tourist_attraction: { quiet: 3, moderate: 10, busy: 20 },
      default: { quiet: 10, moderate: 25, busy: 40 }
    };

    const threshold = thresholds[placeType] || thresholds.default;

    if (count < threshold.quiet) return 'quiet';
    if (count < threshold.moderate) return 'moderate';
    if (count < threshold.busy) return 'busy';
    return 'very busy';
  }

  /**
   * Get detailed place information
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const url = `https://places.googleapis.com/v1/${placeId}`;
      console.log(`🔍 [PlacesInsights] Fetching details: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,editorialSummary,photos,types,priceLevel'
        }
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ [PlacesInsights] Place details failed (${response.status}): ${errorText.substring(0, 200)}`);
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn(`⚠️ [PlacesInsights] Empty response for ${placeId}`);
        return null;
      }

      const data = JSON.parse(text);
      console.log(`✅ [PlacesInsights] Got place details for ${placeId}`);
      return data;
    } catch (error) {
      console.error(`❌ [PlacesInsights] Place details error for ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Get opening hours for a place
   */
  async getOpeningHours(placeId: string): Promise<any> {
    try {
      const url = `https://places.googleapis.com/v1/${placeId}`;
      console.log(`🔍 [PlacesInsights] Fetching hours: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'currentOpeningHours,regularOpeningHours,currentSecondaryOpeningHours'
        }
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ [PlacesInsights] Opening hours failed (${response.status}): ${errorText.substring(0, 200)}`);
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn(`⚠️ [PlacesInsights] Empty response for ${placeId}`);
        return null;
      }

      const data = JSON.parse(text);
      
      // Extract opening hours info
      const hours = data.currentOpeningHours || data.regularOpeningHours;
      const result = {
        openNow: hours?.openNow,
        weekdayDescriptions: hours?.weekdayDescriptions,
        periods: hours?.periods,
        secondaryHours: data.currentSecondaryOpeningHours
      };

      console.log(`✅ [PlacesInsights] Got opening hours for ${placeId}`);
      return result;
    } catch (error) {
      console.error(`❌ [PlacesInsights] Opening hours error for ${placeId}:`, error);
      return null;
    }
  }
}

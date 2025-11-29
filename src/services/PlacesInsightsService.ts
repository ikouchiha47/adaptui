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

import { CacheServiceFactory } from './CacheServiceFactory';
import { ICacheService } from './ICacheService';

export class PlacesInsightsService {
  private apiKey: string;
  private insightsUrl = 'https://areainsights.googleapis.com/v1:computeInsights';
  private placesUrl = 'https://places.googleapis.com/v1/places:searchText';
  private cacheService: ICacheService;

  constructor(cacheService?: ICacheService) {
    const key = configManager.getApiKeyOrNull('googlePlaces');
    if (!key) throw new Error('Google Places API key required');
    this.apiKey = key;
    // Use provided cache service or get from factory
    this.cacheService = cacheService || CacheServiceFactory.getInstance();
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
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.primaryType,places.priceLevel,places.currentOpeningHours,contextualContents,places.generativeSummary,places.areaSummary'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!data.places) {
        console.warn('⚠️ [PlacesInsights] No places found');
        return [];
      }

      console.log(`✅ [PlacesInsights] Got ${data.places.length} places from API`);
      
      // Log first place to see structure
      if (data.places.length > 0) {
        const firstPlace = data.places[0];
        console.log(`📸 [PlacesInsights] First place photo data:`, {
          name: firstPlace.displayName?.text,
          hasPhotos: !!firstPlace.photos,
          photoCount: firstPlace.photos?.length || 0,
          firstPhotoName: firstPlace.photos?.[0]?.name
        });
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
          formattedAddress: place.formattedAddress,
          location: place.location,
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          photos: place.photos,
          types: place.types,
          primaryType: place.primaryType,
          priceLevel: place.priceLevel,
          currentOpeningHours: place.currentOpeningHours,
          generativeSummary: place.generativeSummary,
          areaSummary: place.areaSummary,
          context: data.contextualContents?.[idx]
        };
      });

      console.log(`✅ [PlacesInsights] Got ${results.length} places with summaries`);
      
      // Enrich places without generativeSummary with web descriptions
      try {
        const enrichedResults = await this.enrichWithWebDescriptions(results, location);
        return enrichedResults || results;
      } catch (error) {
        console.warn('⚠️ [PlacesInsights] Web enrichment failed, returning original results:', error);
        return results;
      }
    } catch (error) {
      console.error('❌ [PlacesInsights] Error:', error);
      return [];
    }
  }

  /**
   * Enrich places with web descriptions if Google doesn't provide them
   * Uses TaskManager to throttle requests (max 2 concurrent)
   */
  private async enrichWithWebDescriptions(places: any[], location?: { lat: number; lng: number }): Promise<any[] | undefined> {
    // Only enrich places missing generativeSummary
    const placesToEnrich = places.filter(p => !p.generativeSummary);
    
    if (placesToEnrich.length === 0) {
      console.log('✅ [PlacesInsights] All places have generativeSummary');
      return places;
    }
    
    // Skip enrichment if too many places (would be too slow)
    if (placesToEnrich.length > 10) {
      console.log(`⚠️ [PlacesInsights] Too many places to enrich (${placesToEnrich.length}), skipping web enrichment`);
      return places;
    }
    
    try {
      const { SearchProxyService } = await import('./SearchProxyService');
      const { OpenAICore } = await import('../core/OpenAICore');
      const { configManager } = await import('../config/ConfigManager');
      const { TaskManager } = await import('./research/TaskManager');
      
      const openaiKey = configManager.getApiKeyOrNull('openai');
      if (!openaiKey) {
        console.warn('⚠️ [PlacesInsights] No OpenAI key, skipping web enrichment');
        return places;
      }
      
      const searchProxy = new SearchProxyService(this.cacheService);
      const llm = new OpenAICore(openaiKey, 'gpt-4o-mini');
      
      console.log(`🌐 [PlacesInsights] Enriching ${placesToEnrich.length} places with web descriptions (throttled)...`);
    
      // Use TaskManager to throttle enrichment (2 concurrent, 1 sec between)
      const taskManager = new TaskManager(2, 1000);
      
      // Add all enrichment tasks to queue
      const taskIds: string[] = [];
      for (const place of placesToEnrich) {
        const placeType = place.primaryType || place.types?.[0] || 'place';
        const query = `${place.name} ${placeType} price range atmosphere reviews`;
        const taskId = taskManager.addTask('scrape', query, 5);
        taskIds.push(taskId);
      }
      
      // Execute tasks with throttling
      const enrichedPlaces: any[] = [];
      let completedCount = 0;
      
      for (let i = 0; i < taskIds.length; i++) {
        const place = placesToEnrich[i];
        
        const task = await taskManager.executeNext(async (t) => {
          completedCount++;
          console.log(`  [${completedCount}/${placesToEnrich.length}] Enriching: ${place.name}`);
          
          try {
            const results = await searchProxy.search(t.input);
            
            if (results.length === 0) {
              return place; // No enrichment
            }
            
            // Combine top 3 snippets
            const snippets = results.slice(0, 3)
              .map(r => r.snippet)
              .filter(s => s && s.length > 20)
              .join(' ');
            
            if (!snippets) {
              return place;
            }
            
            // Extract description with LLM
            const extractPrompt = `Based on these web snippets about "${place.name}", write ONE concise sentence (max 120 chars) describing what makes this place special.

Snippets:
${snippets}

Rules:
- ONE short sentence only (under 120 characters)
- Focus on unique features, atmosphere, or what it's known for
- Be specific, not generic
- No quotes around the output

Description:`;
            
            const description = await llm.generateText(extractPrompt);
            const cleaned = description.replace(/^["']|["']$/g, '').trim();
            
            if (cleaned.length > 20 && cleaned.length < 150) {
              console.log(`    ✅ "${cleaned}"`);
              
              // Add as webEnrichedSummary
              return {
                ...place,
                webEnrichedSummary: {
                  overview: cleaned,
                  source: 'web_search'
                }
              };
            }
            
            return place;
          } catch (error) {
            console.warn(`    ⚠️ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return place;
          }
        });
        
        if (task && task.status === 'complete' && task.result) {
          enrichedPlaces.push(task.result);
        } else {
          enrichedPlaces.push(place); // Keep original on error
        }
      }
      
      // Merge enriched places back with original places
      const enrichedMap = new Map(enrichedPlaces.map(p => [p.placeId, p]));
      return places.map(p => enrichedMap.get(p.placeId) || p);
      
    } catch (error) {
      console.error('❌ [PlacesInsights] Web enrichment error:', error);
      return places; // Return original on error
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
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,editorialSummary,photos,types,priceLevel,primaryType'
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

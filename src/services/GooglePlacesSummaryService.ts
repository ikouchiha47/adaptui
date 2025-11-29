// Google Places Summary Service - Get generative summaries and area summaries

import { configManager } from '../config/ConfigManager';

export interface PlaceSummary {
  placeId: string;
  displayName: string;
  generativeSummary?: string;
  areaSummary?: string;
  contextualContent?: any;
}

export class GooglePlacesSummaryService {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1/places:searchText';

  constructor() {
    const key = configManager.getApiKeyOrNull('googlePlaces');
    if (!key) throw new Error('Google Places API key required');
    this.apiKey = key;
  }

  /**
   * Get place summaries with generative content
   */
  async getPlaceSummaries(query: string, location?: { lat: number; lon: number }): Promise<PlaceSummary[]> {
    console.log('[GooglePlacesSummary] Fetching summaries for:', query);

    const payload: any = {
      textQuery: query,
      maxResultCount: 5
    };

    // Add location bias if provided
    if (location) {
      const delta = 0.01; // ~1km radius
      payload.locationBias = {
        rectangle: {
          low: {
            latitude: location.lat - delta,
            longitude: location.lon - delta
          },
          high: {
            latitude: location.lat + delta,
            longitude: location.lon + delta
          }
        }
      };
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,contextualContents,places.generativeSummary,places.areaSummary'
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log('[GooglePlacesSummary] Response:', {
        status: response.status,
        placesCount: data.places?.length || 0,
        contextCount: data.contextualContents?.length || 0
      });

      if (!data.places) {
        return [];
      }

      // Zip places with contextual contents
      const results: PlaceSummary[] = data.places.map((place: any, index: number) => ({
        placeId: place.id,
        displayName: place.displayName?.text || '',
        generativeSummary: place.generativeSummary?.overview?.text || undefined,
        areaSummary: place.areaSummary?.contentBlocks?.[0]?.content?.text || undefined,
        contextualContent: data.contextualContents?.[index] || undefined
      }));

      console.log('[GooglePlacesSummary] Processed summaries:', {
        count: results.length,
        withGenerative: results.filter(r => r.generativeSummary).length,
        withArea: results.filter(r => r.areaSummary).length
      });

      return results;
    } catch (error) {
      console.error('[GooglePlacesSummary] Error:', error);
      return [];
    }
  }

  /**
   * Batch get summaries for multiple queries
   */
  async batchGetSummaries(queries: string[], location?: { lat: number; lon: number }): Promise<Map<string, PlaceSummary[]>> {
    console.log('[GooglePlacesSummary] Batch fetching:', { count: queries.length });

    const results = new Map<string, PlaceSummary[]>();

    for (const query of queries) {
      const summaries = await this.getPlaceSummaries(query, location);
      results.set(query, summaries);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }
}

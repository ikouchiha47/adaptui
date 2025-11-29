// Google Places API Client using REST endpoints
// No JS client library needed - using fetch for React Native compatibility

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
  rating?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
}

export interface PlaceDetailsResult extends PlaceSearchResult {
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export class GooglePlacesClient {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Text Search - Find places by query
   */
  async textSearch(query: string, location?: string): Promise<PlaceSearchResult[]> {
    try {
      console.log(`🔍 [GooglePlacesClient] Text search: ${query}`);
      
      const params = new URLSearchParams({
        query: query,
        key: this.apiKey,
      });

      if (location) {
        params.append('location', location);
      }

      const url = `${this.baseUrl}/textsearch/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn(`⚠️ [GooglePlacesClient] Search failed: ${data.status}`);
        return [];
      }

      console.log(`✅ [GooglePlacesClient] Found ${data.results.length} results`);
      return data.results;
    } catch (error) {
      console.error(`❌ [GooglePlacesClient] Error:`, error);
      return [];
    }
  }

  /**
   * Nearby Search - Find places near a location
   */
  async nearbySearch(
    latitude: number,
    longitude: number,
    radius: number = 1500,
    type?: string
  ): Promise<PlaceSearchResult[]> {
    try {
      console.log(`🔍 [GooglePlacesClient] Nearby search at ${latitude},${longitude}`);
      
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: radius.toString(),
        key: this.apiKey,
      });

      if (type) {
        params.append('type', type);
      }

      const url = `${this.baseUrl}/nearbysearch/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn(`⚠️ [GooglePlacesClient] Search failed: ${data.status}`);
        return [];
      }

      console.log(`✅ [GooglePlacesClient] Found ${data.results.length} nearby places`);
      return data.results;
    } catch (error) {
      console.error(`❌ [GooglePlacesClient] Error:`, error);
      return [];
    }
  }

  /**
   * Place Details - Get detailed info about a place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    try {
      console.log(`📋 [GooglePlacesClient] Getting details for: ${placeId}`);
      
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'formatted_address,geometry,photos,rating,opening_hours,formatted_phone_number,website,url,reviews',
        key: this.apiKey,
      });

      const url = `${this.baseUrl}/details/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn(`⚠️ [GooglePlacesClient] Details failed: ${data.status}`);
        return null;
      }

      console.log(`✅ [GooglePlacesClient] Got details for: ${data.result.name}`);
      return data.result;
    } catch (error) {
      console.error(`❌ [GooglePlacesClient] Error:`, error);
      return null;
    }
  }

  /**
   * Get Photo URL from photo reference
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Autocomplete - Get place suggestions as user types
   */
  async autocomplete(input: string, sessionToken?: string): Promise<Array<{ place_id: string; description: string }>> {
    try {
      console.log(`🔍 [GooglePlacesClient] Autocomplete: ${input}`);
      
      const params = new URLSearchParams({
        input: input,
        key: this.apiKey,
      });

      if (sessionToken) {
        params.append('sessiontoken', sessionToken);
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`⚠️ [GooglePlacesClient] Autocomplete failed: ${data.status}`);
        return [];
      }

      console.log(`✅ [GooglePlacesClient] Got ${data.predictions.length} suggestions`);
      return data.predictions;
    } catch (error) {
      console.error(`❌ [GooglePlacesClient] Error:`, error);
      return [];
    }
  }

  /**
   * Get Place ID from autocomplete prediction
   */
  async getPlaceIdFromPrediction(placeId: string, sessionToken?: string): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'place_id',
        key: this.apiKey,
      });

      if (sessionToken) {
        params.append('sessiontoken', sessionToken);
      }

      const url = `${this.baseUrl}/details/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      return data.result?.place_id || null;
    } catch (error) {
      console.error(`❌ [GooglePlacesClient] Error:`, error);
      return null;
    }
  }

  /**
   * Geocode a city name to get lat/lng coordinates
   */
  async geocodeCity(cityName: string): Promise<{ lat: number; lng: number } | null> {
    try {
      console.log(`🌍 [GooglePlacesClient] Geocoding city: ${cityName}`);
      
      const params = new URLSearchParams({
        address: cityName,
        key: this.apiKey,
      });

      const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn(`⚠️ [GooglePlacesClient] Geocoding failed: ${data.status}`);
        return null;
      }

      const location = data.results[0].geometry.location;
      console.log(`✅ [GooglePlacesClient] Geocoded ${cityName}:`, location);
      return location;
    } catch (error) {
      console.error(`❌ [GooglePlacesClient] Geocoding error:`, error);
      return null;
    }
  }
}

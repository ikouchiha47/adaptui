// Google Places API integration
// Free tier: 28,000 requests/month
// Get your API key: https://console.cloud.google.com/apis/credentials

export interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number; // 0-4 ($ to $$$$)
  types: string[];
  location: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  isOpen?: boolean;
}

export class PlacesAPIService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey?: string) {
    // For POC, you can use mock data if no API key
    this.apiKey = apiKey || 'YOUR_API_KEY_HERE';
  }

  async searchPlaces(query: string, location?: string): Promise<PlaceResult[]> {
    if (this.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Using mock data - add Google Places API key for real data');
      return this.getMockPlaces(query);
    }

    try {
      const searchQuery = location ? `${query} in ${location}` : query;
      const url = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map((place: any) => ({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        photoUrl: place.photos?.[0]?.photo_reference 
          ? `${this.baseUrl}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${this.apiKey}`
          : undefined,
        isOpen: place.opening_hours?.open_now,
      }));
    } catch (error) {
      console.error('Places API error:', error);
      return this.getMockPlaces(query);
    }
  }

  async getNearbyPlaces(
    lat: number, 
    lng: number, 
    type: string = 'tourist_attraction',
    radius: number = 5000
  ): Promise<PlaceResult[]> {
    if (this.apiKey === 'YOUR_API_KEY_HERE') {
      return this.getMockPlaces('nearby places');
    }

    try {
      const url = `${this.baseUrl}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map((place: any) => ({
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        isOpen: place.opening_hours?.open_now,
      }));
    } catch (error) {
      console.error('Places API error:', error);
      return this.getMockPlaces('nearby');
    }
  }

  private getMockPlaces(query: string): PlaceResult[] {
    // Mock data for POC testing
    return [
      {
        name: 'Hidden Garden Café',
        address: '123 Secret Lane',
        rating: 4.7,
        priceLevel: 2,
        types: ['cafe', 'restaurant'],
        location: { lat: 48.8566, lng: 2.3522 },
        isOpen: true,
      },
      {
        name: 'Local Art Gallery',
        address: '456 Artist Street',
        rating: 4.5,
        priceLevel: 1,
        types: ['art_gallery', 'museum'],
        location: { lat: 48.8606, lng: 2.3376 },
        isOpen: true,
      },
      {
        name: 'Rooftop Bar with Views',
        address: '789 Sky Avenue',
        rating: 4.8,
        priceLevel: 3,
        types: ['bar', 'night_club'],
        location: { lat: 48.8584, lng: 2.2945 },
        isOpen: false,
      },
    ];
  }
}

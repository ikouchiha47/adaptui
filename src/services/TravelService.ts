import * as ExpoCrypto from 'expo-crypto';
import { configManager } from '../config/ConfigManager';
import { LLMProvider } from '../core/LLMProvider';
import { LLMProviderFactory } from '../core/LLMProviderFactory';
import { CacheService } from './CacheService';
import { CapabilityContext, CapabilityDetector } from './CapabilityDetector';
import { DeviceLocation, LocationService } from './LocationService';
import { PlaceResult, PlacesAPIService } from './PlacesAPIService';
import { PlacesPhotoService } from './PlacesPhotoService';
import { PlaceScore, RankingService } from './RankingService';
import { TransportService, TransportTicket } from './TransportService';

export interface TravelQuery {
  originalQuery?: string; // The actual user query: "fun bars in Bangkok"
  location?: string;
  feeling?: string; // Deprecated: use originalQuery instead
  budget?: 'budget' | 'mid' | 'luxury';
  duration?: string;
  useRealData?: boolean; // Toggle between LLM-only and hybrid
  advancedMode?: boolean; // Use QueryProcessingService with expanded parallel search
  // From QueryAnalysis
  keywords?: string[]; // e.g., ["fun bars", "nightlife", "rooftop bars"]
  establishments?: string[]; // e.g., ["bar", "nightlife district"]
}

export interface TravelHighlight {
  name: string;
  type: 'offbeat' | 'touristy' | 'luxury' | 'budget' | 'hidden-gem';
  description: string;
  estimatedCost?: string; // e.g., "$50/person" or "$100/day"
  rating?: number;
  isOpen?: boolean;
  realPlace?: PlaceResult; // Real data from API
  photoUrl?: string; // First photo from Google Places
  photoUrls?: string[]; // Multiple photos from Google Places
  latitude?: number;
  longitude?: number;
  rankingScore?: PlaceScore; // Intelligent ranking data
  crowdLevel?: string; // quiet, moderate, busy, very busy
  bestTimeToVisit?: string;
}

export interface TravelRecommendation {
  destination: string;
  vibe: string;
  highlights: TravelHighlight[];
  bestTime?: string;
  localTip?: string;
  dataSource: 'llm-only' | 'hybrid' | 'api-only';
  transportTickets?: TransportTicket[];
  distance?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TravelContext {
  recommendations: TravelRecommendation[];
  capabilities: CapabilityContext;
  userLocation?: DeviceLocation;
}

export class TravelService {
  private llm: LLMProvider;
  private placesAPI: PlacesAPIService;
  private photosService: PlacesPhotoService | null;
  private transportService: TransportService;
  private rankingService: RankingService;
  private capabilities: CapabilityContext | null = null;

  constructor() {
    this.llm = LLMProviderFactory.getProvider();
    
    const googlePlacesKey = configManager.getApiKeyOrNull('googlePlaces');
    this.placesAPI = new PlacesAPIService(googlePlacesKey || undefined);
    this.photosService = googlePlacesKey ? new PlacesPhotoService(googlePlacesKey) : null;
    this.transportService = new TransportService(googlePlacesKey || undefined);
    this.rankingService = new RankingService();
  }

  /**
   * Initialize capabilities
   */
  async initializeCapabilities(): Promise<CapabilityContext> {
    console.log('🔧 [TravelService] Initializing capabilities...');
    this.capabilities = await CapabilityDetector.detectCapabilities();
    console.log('✅ [TravelService] Capabilities initialized');
    return this.capabilities;
  }

  /**
   * Generate SHA-256 hash for cache key using expo-crypto
   */
  private async generateCacheKey(input: string): Promise<string> {
    const hash = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      input
    );
    return hash.substring(0, 10); // Trim to 10 characters
  }

  async generateRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    console.log('🌍 [TravelService] Starting recommendation generation...');
    console.log('📍 Location:', query.location);
    console.log('💰 Budget:', query.budget);
    console.log('🔄 Use real data:', query.useRealData);
    console.log('🚀 Advanced mode:', query.advancedMode);
    
    // Generate hash-based cache key
    const cacheKeyString = `${query.location || 'any'}_${query.feeling || 'any'}_${query.budget || 'mid'}${query.advancedMode ? '_advanced' : ''}`;
    const cacheKey = await this.generateCacheKey(cacheKeyString);
    const cached = await CacheService.get<TravelRecommendation[]>('travel_recommendations', cacheKey);
    
    if (cached) {
      console.log('✅ [TravelService] Found cached recommendations, validating...');
      
      // Validate: Check if cached data has coordinates
      const hasValidCoordinates = cached.every(rec => {
        if (!rec.coordinates) return false;
        // Also check if highlights have coordinates
        const highlightsWithCoords = rec.highlights.filter((h: any) => h.latitude && h.longitude);
        return highlightsWithCoords.length > 0;
      });
      
      if (!hasValidCoordinates) {
        console.warn('⚠️ [TravelService] Cached data missing coordinates - busting cache and regenerating');
        await CacheService.clear('travel_recommendations', cacheKey);
        // Fall through to regenerate
      } else {
        console.log('✅ [TravelService] Using cached recommendations');
        return await this.ensureCoordinates(cached);
      }
    }
    
    console.log('📝 [TravelService] Cache miss, generating new recommendations...');
    
    // Initialize capabilities if not done
    if (!this.capabilities) {
      await this.initializeCapabilities();
    }
    
    // Step 1: Understand user intent
    console.log('🔍 [TravelService] Step 1: Analyzing intent...');
    const intent = await this.analyzeIntent(query);
    console.log('✅ [TravelService] Intent:', intent.experienceType);
    
    // Step 2: Get initial recommendations
    console.log('🏗️ [TravelService] Step 2: Generating recommendations...');
    let recommendations: TravelRecommendation[];
    
    if (query.advancedMode) {
      console.log('🚀 [TravelService] Using advanced query processing mode');
      recommendations = await this.generateAdvancedRecommendations(query);
    } else {
      recommendations = await this.generateLLMOnlyRecommendations(query);
    }
    
    console.log(`✅ [TravelService] Generated ${recommendations.length} recommendations`);
    
    // Step 3: Add transport tickets if location available
    // Only add transport once for the destination city, not for each cluster
    if (this.capabilities?.capabilities.transport && this.capabilities?.userLocation && recommendations.length > 0) {
      console.log('🚀 [TravelService] Step 3: Adding transport options to destination city...');
      await this.addTransportOptionsToCity(recommendations, query.location || '');
    }
    
    // Step 4: Validate with web search (if needed)
    let finalRecommendations = recommendations;
    if (query.useRealData) {
      console.log('🔎 [TravelService] Step 4: Validating with web search...');
      finalRecommendations = await this.validateWithSearch(recommendations, intent);
    }
    
    // Step 5: Intelligent ranking with crowd intelligence
    console.log('🎯 [TravelService] Step 5: Ranking with crowd intelligence...');
    finalRecommendations = await this.rankRecommendations(finalRecommendations, query);
    
    console.log('✅ [TravelService] Recommendations complete');
    
    // Cache the results
    await CacheService.set('travel_recommendations', cacheKey, finalRecommendations);
    
    return finalRecommendations;
    
  }

  /**
   * Add transport options to destination city (shared across all clusters)
   */
  private async addTransportOptionsToCity(recommendations: TravelRecommendation[], destinationCity: string): Promise<void> {
    try {
      if (!this.capabilities?.userLocation || recommendations.length === 0) {
        console.log('⚠️ [TravelService] No user location or recommendations for transport');
        return;
      }

      const userLocation = this.capabilities.userLocation;
      const userCity = await this.getCityFromCoords(userLocation.latitude, userLocation.longitude);
      
      // Use first recommendation's coordinates as city center
      const firstRec = recommendations[0];
      const destLat = firstRec.highlights[0]?.latitude || 0;
      const destLng = firstRec.highlights[0]?.longitude || 0;
      
      if (!destLat || !destLng) {
        console.log(`⚠️ [TravelService] No coordinates for ${destinationCity}`);
        return;
      }
      
      // Calculate distance to city
      const distance = LocationService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        destLat,
        destLng
      );

      console.log(`📊 [TransportService] Recommending transport for ${distance.toFixed(0)}km`);

      // Get recommended transport based on distance
      const recommendedTypes = this.transportService.getRecommendedTransport(distance);

      // Search for tickets to the CITY (not individual clusters)
      const tickets: TransportTicket[] = [];
      
      for (const type of recommendedTypes) {
        if (type === 'flight') {
          const flights = await this.transportService.searchFlights({
            from: userCity,
            to: destinationCity,
            date: new Date().toISOString().split('T')[0],
            passengers: 1,
            fromCoords: { lat: userLocation.latitude, lng: userLocation.longitude },
            toCoords: { lat: destLat, lng: destLng }
          });
          tickets.push(...flights.slice(0, 3));
        } else if (type === 'bus') {
          const buses = await this.transportService.searchBuses({
            from: userCity,
            to: destinationCity,
            date: new Date().toISOString().split('T')[0],
            passengers: 1,
            fromCoords: { lat: userLocation.latitude, lng: userLocation.longitude },
            toCoords: { lat: destLat, lng: destLng }
          });
          tickets.push(...buses.slice(0, 2));
        } else if (type === 'train') {
          const trains = await this.transportService.searchTrains({
            from: userCity,
            to: destinationCity,
            date: new Date().toISOString().split('T')[0],
            passengers: 1,
            fromCoords: { lat: userLocation.latitude, lng: userLocation.longitude },
            toCoords: { lat: destLat, lng: destLng }
          });
          tickets.push(...trains.slice(0, 2));
        }
      }

      // Add same transport options to ALL recommendations (they're all in the same city)
      const sortedTickets = tickets.sort((a, b) => a.price - b.price);
      for (const rec of recommendations) {
        rec.distance = distance;
        rec.transportTickets = sortedTickets;
      }
      
      console.log(`✅ [TravelService] ${tickets.length} transport options: ${userCity} → ${destinationCity} (${distance.toFixed(0)}km)`);
    } catch (error) {
      console.error('❌ [TravelService] Error adding transport options:', error);
    }
  }

  /**
   * Ensure all recommendations have coordinates (copy from first highlight if missing)
   */
  private async ensureCoordinates(recommendations: TravelRecommendation[]): Promise<TravelRecommendation[]> {
    for (const rec of recommendations) {
      if (!rec.coordinates && rec.highlights.length > 0) {
        const firstHighlightWithCoords = rec.highlights.find((h: any) => h.latitude && h.longitude);
        if (firstHighlightWithCoords) {
          (rec as any).coordinates = {
            latitude: firstHighlightWithCoords.latitude,
            longitude: firstHighlightWithCoords.longitude
          };
          console.log(`✅ [TravelService] Copied coordinates to place: ${rec.destination} (${firstHighlightWithCoords.latitude}, ${firstHighlightWithCoords.longitude})`);
        } else {
          console.warn(`⚠️ [TravelService] No highlights with coordinates for ${rec.destination}, trying geocoding...`);
          
          // Fallback: Geocode the destination city itself
          const coords = await this.geocodePlaceName(rec.destination);
          if (coords) {
            (rec as any).coordinates = {
              latitude: coords.lat,
              longitude: coords.lng
            };
            console.log(`✅ [TravelService] Geocoded destination: ${rec.destination} (${coords.lat}, ${coords.lng})`);
          } else {
            console.error(`❌ [TravelService] Failed to geocode destination: ${rec.destination}`);
          }
        }
      } else if (!rec.coordinates) {
        // No highlights at all - geocode the destination
        console.warn(`⚠️ [TravelService] No highlights for ${rec.destination}, geocoding destination...`);
        const coords = await this.geocodePlaceName(rec.destination);
        if (coords) {
          (rec as any).coordinates = {
            latitude: coords.lat,
            longitude: coords.lng
          };
          console.log(`✅ [TravelService] Geocoded destination: ${rec.destination} (${coords.lat}, ${coords.lng})`);
        }
      }
    }
    return recommendations;
  }

  /**
   * Get city name from coordinates using Google Geocoding API
   */
  private async getCityFromCoords(lat: number, lng: number): Promise<string> {
    try {
      const apiKey = configManager.getApiKeyOrNull('googlePlaces');
      if (!apiKey) {
        return `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
      }
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Try to find city name from address components
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // Look for locality (city) or administrative_area_level_2
        const city = addressComponents.find((c: any) => 
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        );
        
        const country = addressComponents.find((c: any) => 
          c.types.includes('country')
        );
        
        if (city && country) {
          return `${city.long_name}, ${country.long_name}`;
        } else if (city) {
          return city.long_name;
        }
        
        // Fallback to formatted address
        return result.formatted_address.split(',')[0];
      }
      
      return `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
    } catch (error) {
      console.error('❌ [TravelService] Geocoding error:', error);
      return `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
    }
  }

  /**
   * Geocode place name to coordinates (fallback when Google Places doesn't return coords)
   */
  private async geocodePlaceName(placeName: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const apiKey = configManager.getApiKeyOrNull('googlePlaces');
      if (!apiKey) {
        console.warn('[TravelService] No Google Places API key for geocoding');
        return null;
      }
      
      console.log(`🌍 [TravelService] Geocoding: ${placeName}`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeName)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log(`✅ [TravelService] Geocoded to: (${location.lat}, ${location.lng})`);
        return { lat: location.lat, lng: location.lng };
      }
      
      console.warn(`⚠️ [TravelService] Geocoding failed: ${data.status}`);
      return null;
    } catch (error) {
      console.error('❌ [TravelService] Geocoding error:', error);
      return null;
    }
  }

  private async analyzeIntent(query: TravelQuery): Promise<any> {
    const prompt = `Analyze this travel query:
Location: ${query.location || 'any'}
Feeling: ${query.feeling || 'any'}
Budget: ${query.budget || 'mid'}

Extract:
1. What type of experience? Choose ONE from this list:
   - romantic: Intimate, couples, date night, love, romantic atmosphere
   - peaceful: Calm, serene, quiet, relaxation, tranquil (use for "quiet places" even if temples)
   - party: Nightlife, lively, energetic, clubbing, dancing, bars
   - cultural: Traditional, heritage, authentic, historical, museums
   - fun: Entertaining, exciting, vibrant, general enjoyment, activities
   - adventure: Thrilling, unique, adventurous, extreme, adrenaline, hiking, climbing
   - foodie: Culinary, dining, food-focused, gastronomic, restaurants
   - family: Kid-friendly, family-oriented, safe for children
   - luxury: Upscale, premium, high-end, exclusive, fancy
   - budget: Affordable, cheap, value, economical, free
   - solo: Solo traveler, independent, alone-friendly, backpacker
   - photography: Photogenic, Instagram-worthy, scenic views, beautiful
   - nature: Outdoor, natural, scenic, wilderness, parks (NOT hiking - use adventure for hiking)
   - shopping: Markets, stores, retail, souvenirs, malls
   - spiritual: Sacred, religious, meditation, mindfulness (ONLY if focus is worship/meditation)
   - local: Authentic, hidden gems, off-beaten-path, locals' favorite

2. What to validate? (restaurant hours, current status, reviews, pricing)
3. Search queries for validation (specific place names to verify)

IMPORTANT DISTINCTIONS:
- "quiet temples" → peaceful (focus is on quiet atmosphere, not worship)
- "meditation retreat" → spiritual (focus is on spiritual practice)
- "hiking trails" → adventure (focus is on physical activity)
- "nature parks" → nature (focus is on scenery, not activity)
- "temples tour" → cultural (focus is on learning/history)

Return JSON:
{
  "experienceType": "romantic",
  "experienceTypes": ["romantic"],
  "validationNeeds": ["hours", "status", "reviews", "pricing"],
  "searchQueries": ["specific place 1", "specific place 2"]
}

MULTI-INTENT SUPPORT:
If the query has multiple valid interpretations, you can return multiple intents:
{
  "experienceType": "spiritual",
  "experienceTypes": ["spiritual", "peaceful"],
  "reasoning": "Temples are spiritual, but user wants quiet atmosphere"
}

CRITICAL: 
- experienceType (primary) MUST be one of the 16 options
- experienceTypes (array) can contain 1-3 intents from the 16 options
- Use multi-intent when query has multiple valid interpretations`;

    try {
      const text = await this.llm.generateJSON(prompt, 0.3);
      const parsed = JSON.parse(text);
      
      // Store all intents but use first one as primary
      const allIntents = parsed.experienceTypes && parsed.experienceTypes.length > 0 
        ? parsed.experienceTypes 
        : [parsed.experienceType];
      
      console.log(`🎯 [TravelService] Intent analysis: ${allIntents.join(', ')}`);
      if (allIntents.length > 1) {
        console.log(`   Primary: ${allIntents[0]}`);
        console.log(`   Additional (for pagination): ${allIntents.slice(1).join(', ')}`);
      }
      
      return {
        ...parsed,
        experienceType: allIntents[0], // Use first intent only
        experienceTypes: allIntents,   // Store all for pagination
      };
    } catch (error) {
      console.error('Intent analysis error:', error);
      return { experienceType: 'fun', experienceTypes: ['fun'], validationNeeds: [], searchQueries: [] };
    }
  }

  private async validateWithSearch(recommendations: TravelRecommendation[], intent: any): Promise<TravelRecommendation[]> {
    const { SearchService } = await import('./SearchService');
    const searchService = new SearchService();
    
    // For each recommendation, validate key places and get photos
    for (const rec of recommendations) {
      // Only process first 2 highlights to reduce API calls
      const highlightsToProcess = rec.highlights.slice(0, 2);
      
      for (const highlight of highlightsToProcess) {
        // Check if we already have photos (from cache)
        if ((highlight as any).photoUrls && (highlight as any).photoUrls.length > 0) {
          console.log(`✅ [TravelService] Using cached photos for: ${highlight.name}`);
          continue;
        }
        
        const searchQuery = `${highlight.name} ${rec.destination} hours reviews`;
        
        // Search DDG and Reddit
        const [ddgResults, redditResults] = await Promise.all([
          searchService.searchDDG(searchQuery),
          searchService.searchReddit(searchQuery)
        ]);
        
        // Add validation data
        (highlight as any).validated = ddgResults.length > 0;
        (highlight as any).searchResults = ddgResults.slice(0, 2);
        (highlight as any).redditFeedback = redditResults.slice(0, 1);

        // Get photos from Google Places
        if (this.photosService) {
          console.log(`📸 [TravelService] Fetching photos for: ${highlight.name}`);
          const photos = await this.photosService.getPlacePhotos(
            `${highlight.name} ${rec.destination}`,
            5, // Get up to 5 photos
            400
          );
          if (photos.length > 0) {
            (highlight as any).photoUrls = photos.map(p => p.url);
            (highlight as any).photoUrl = photos[0].url; // Keep first for backward compatibility
            console.log(`✅ [TravelService] Got ${photos.length} photos for: ${highlight.name}`);
          }
        }
      }
    }
    
    return recommendations;
  }

  // LLM-only approach (for POC)
  private async generateLLMOnlyRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    const prompt = this.buildPrompt(query);
    
    try {
      console.log('⏳ [TravelService] Calling LLM...');
      console.log('📋 [TravelService] Prompt length:', prompt.length, 'chars');
      const startTime = Date.now();
      
      const text = await this.llm.generateJSON(prompt, 0.3);
      const duration = Date.now() - startTime;
      
      console.log(`✅ [TravelService] LLM response received (${duration}ms)`);
      console.log('📄 [TravelService] Response length:', text.length, 'chars');
      
      const recommendations = this.parseResponse(text);
      console.log(`✅ [TravelService] Parsed ${recommendations.length} recommendations`);
      
      // Fetch photos and details for each recommendation
      console.log('📸 [TravelService] Fetching details for recommendations...');
      for (const rec of recommendations) {
        for (const highlight of rec.highlights) {
          if (this.photosService) {
            try {
              const details = await this.photosService.getPlaceDetails(
                `${highlight.name} ${rec.destination}`,
                3, // Only fetch 3 photos per place
                400
              );
              if (details.photos.length > 0) {
                (highlight as any).photoUrls = details.photos.map(p => p.url);
                (highlight as any).photoUrl = details.photos[0].url;
                (highlight as any).rating = details.rating;
                (highlight as any).isOpen = details.isOpen;
                
                // CRITICAL: Extract coordinates from Google Places
                if (details.latitude && details.longitude) {
                  (highlight as any).latitude = details.latitude;
                  (highlight as any).longitude = details.longitude;
                  console.log(`✅ [TravelService] Got ${details.photos.length} photos, rating: ${details.rating}, coords: (${details.latitude}, ${details.longitude}) for ${highlight.name}`);
                } else {
                  console.warn(`⚠️ [TravelService] No coordinates from Google Places for ${highlight.name}, trying fallback...`);
                  
                  // Fallback: Try geocoding the place name
                  try {
                    const coords = await this.geocodePlaceName(`${highlight.name}, ${rec.destination}`);
                    if (coords) {
                      (highlight as any).latitude = coords.lat;
                      (highlight as any).longitude = coords.lng;
                      console.log(`✅ [TravelService] Got coordinates from geocoding: (${coords.lat}, ${coords.lng}) for ${highlight.name}`);
                    } else {
                      console.error(`❌ [TravelService] Geocoding failed for ${highlight.name}`);
                    }
                  } catch (geocodeError) {
                    console.error(`❌ [TravelService] Geocoding error for ${highlight.name}:`, geocodeError);
                  }
                  
                  console.log(`✅ [TravelService] Got ${details.photos.length} photos, rating: ${details.rating} for ${highlight.name}`);
                }
              }
            } catch (error) {
              console.warn(`⚠️ [TravelService] Failed to fetch details for ${highlight.name}:`, error);
            }
          }
        }
      }
      
      // Ensure all recommendations have coordinates
      const withCoords = await this.ensureCoordinates(recommendations);
      return withCoords.map(r => ({ ...r, dataSource: 'llm-only' as const }));
    } catch (error) {
      console.error('❌ [TravelService] Error:', error);
      console.log('🔄 [TravelService] Falling back to mock data');
      return this.getMockData(query);
    }
  }

  // Hybrid approach (LLM + Real APIs)
  private async generateHybridRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    try {
      // Step 1: LLM understands intent
      const intentPrompt = `User query: "${query.location || ''} ${query.feeling || ''}"
      Extract and return JSON:
      {
        "location": "city name",
        "searchQueries": ["query1", "query2", "query3"],
        "vibe": "description"
      }
      
      searchQueries should be specific place types like "hidden cafes", "rooftop bars", "local markets"`;
      
      const intentText = await this.llm.generateJSON(intentPrompt);
      const intent = JSON.parse(intentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      // Step 2: Get real places from API
      const allPlaces: PlaceResult[] = [];
      for (const searchQuery of intent.searchQueries.slice(0, 3)) {
        const places = await this.placesAPI.searchPlaces(searchQuery, intent.location);
        allPlaces.push(...places.slice(0, 3));
      }

      // Step 3: LLM curates and categorizes real places
      const curationPrompt = `Here are real places: ${JSON.stringify(allPlaces)}
      
      User wants: ${query.feeling || 'interesting experiences'}
      Budget: ${query.budget || 'mid-range'}
      
      Curate these into a travel recommendation. Categorize each as:
      - "offbeat" (unique, less crowded)
      - "touristy" (popular, must-see)
      - "luxury" (high-end, expensive)
      - "budget" (affordable, free)
      - "hidden-gem" (locals love it)
      
      Return JSON matching TravelRecommendation format.`;

      const curationText = await this.llm.generateJSON(curationPrompt);
      const recommendations = this.parseResponse(curationText);
      
      // Ensure all recommendations have coordinates
      const withCoords = await this.ensureCoordinates(recommendations);
      return withCoords.map(r => ({ ...r, dataSource: 'hybrid' as const }));
    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      // Fallback to LLM-only
      return this.generateLLMOnlyRecommendations(query);
    }
  }

  /**
   * Advanced hybrid approach using QueryProcessingService
   * This uses query expansion + parallel place searches
   */
  private async generateAdvancedRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    try {
      console.log('🚀 [TravelService] Using advanced query processing...');
      
      // Step 1: Process query with expansion + decomposition + step-back
      const { QueryProcessingService } = await import('./QueryProcessingService');
      const llm = LLMProviderFactory.getProvider();
      
      // Get enabled plugins info
      const { pluginRegistry } = await import('../plugins/PluginSystem');
      const enabledPlugins = pluginRegistry.getAllPlugins().map(p => ({
        id: p.capability.id,
        name: p.capability.label,
        description: p.capability.tabLabel || p.capability.label,
      }));
      
      // Use the actual user query if available, otherwise fallback to feeling + location
      const originalQuery = query.originalQuery || `${query.feeling || 'interesting places'} in ${query.location || 'the area'}`;
      
      const processed = await QueryProcessingService.processQuery(
        originalQuery,
        llm,
        {
          userLocation: {
            city: query.location,
          },
          availableDataSources: ['google_places', 'places_insights', 'airports_db'],
          enabledCapabilities: this.capabilities ? Object.keys(this.capabilities.capabilities).filter(k => this.capabilities!.capabilities[k]) : [],
          enabledPlugins,
          timestamp: new Date(),
          domainInstructions: [
            'Focus on places that match user intent, not just literal keywords',
            'Consider crowd levels and accessibility',
            'Prioritize places with good ratings and reviews',
          ],
        }
      );
      
      // Step 2: Execute expanded place searches in parallel
      const expandedPlaces = await QueryProcessingService.executeExpandedPlaceSearches(
        processed,
        query.location || '',
      );
      
      // Step 3: Deduplicate (pure deduplication, no ranking)
      const uniquePlaces = QueryProcessingService.deduplicatePlaces(expandedPlaces);
      
      // Step 4: Rank using hybrid approach (keyword + LLM re-ranking)
      const { SimpleKeywordRanker } = await import('./ranking/PlaceRanker');
      const { HybridLLMRanker } = await import('./ranking/LLMReranker');
      
      const keywordRanker = new SimpleKeywordRanker();
      const hybridRanker = new HybridLLMRanker(keywordRanker);
      
      // Rank with LLM re-ranker (pass keywords and establishments from QueryAnalysis)
      const rankedPlaces = await hybridRanker.rank(uniquePlaces, {
        originalQuery,
        keywords: query.keywords, // From QueryAnalysis
        establishments: query.establishments, // From QueryAnalysis
        timestamp: new Date(),
      });
      
      // Use ranked places directly (no hidden gem boosting here - will be handled by tagging service)
      const boostedPlaces = rankedPlaces;
      
      console.log(`✅ [TravelService] Found ${boostedPlaces.length} unique places via advanced search`);
      console.log(`🎯 [TravelService] Ranked by relevance to: "${originalQuery}"`);
      
      // Step 6: Enrich top places with photos and descriptions
      const topPlaces = boostedPlaces.slice(0, 15);
      const googlePlacesKey = configManager.getApiKeyOrNull('googlePlaces');
      
      console.log(`📍 [TravelService] Enriching ${topPlaces.length} places with photos and descriptions...`);
      const placesWithDetails = await Promise.all(
        topPlaces.map(async (place: any) => {
          try {
            console.log(`🔍 [TravelService] Enriching place: ${place.name}`, {
              hasPhotos: !!place.photos,
              photoCount: place.photos?.length || 0,
              placeId: place.placeId
            });
            
            // Convert photo resource names to URLs (data already from searchText API)
            const photoUrls: string[] = [];
            if (place.photos && Array.isArray(place.photos) && place.photos.length > 0 && googlePlacesKey) {
              console.log(`📸 [TravelService] Processing ${place.photos.length} photos for: ${place.name}`);
              
              for (const photo of place.photos.slice(0, 5)) {
                let url: string | null = null;
                
                // Use photoUri if available (direct Google Photos URL)
                if (photo.photoUri) {
                  url = photo.photoUri;
                  console.log(`   ✅ Photo URL (photoUri): ${url}`);
                }
                // Check if this is old API format with photo_reference
                else if (photo.photo_reference) {
                  url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${googlePlacesKey}`;
                  console.log(`   ✅ Photo URL (old API): ${url.substring(0, 120)}...`);
                }
                // New API format with resource name - MUST include /media endpoint
                else if (photo.name) {
                  url = `https://places.googleapis.com/v1/${photo.name}/media?key=${googlePlacesKey}&maxHeightPx=400&maxWidthPx=400`;
                  console.log(`   ✅ Photo URL (v1 API): ${url.substring(0, 120)}...`);
                }
                
                if (url) {
                  photoUrls.push(url);
                }
              }
              console.log(`✅ [TravelService] Generated ${photoUrls.length} photo URLs for: ${place.name}`);
            } else {
              console.warn(`⚠️ [TravelService] No photos available for: ${place.name}`, {
                hasPhotos: !!place.photos,
                isArray: Array.isArray(place.photos),
                length: place.photos?.length,
                hasKey: !!googlePlacesKey
              });
            }
            
            // Use description from multiple sources (priority order)
            let description = place.generativeSummary?.overview || 
                            place.generativeSummary?.description ||
                            place.webEnrichedSummary?.overview || // Web-enriched from PlacesInsightsService
                            place.description;
            
            // Final fallback: LLM generation (only if all else fails)
            if (!description || description === 'A great place to visit') {
              try {
                const descPrompt = `Generate a brief, engaging 1-sentence description for this place:
Name: ${place.name}
Type: ${place.primaryType || place.types?.[0] || 'place'}
Location: ${query.location || 'Bangkok'}
Rating: ${place.rating || 'N/A'}

Make it specific and interesting, not generic. Focus on what makes this place unique.
Return ONLY the description, no quotes or extra text.`;
                
                description = await this.llm.generateText(descPrompt);
                description = description.replace(/^["']|["']$/g, '').trim();
              } catch (error) {
                description = `${place.primaryType || 'Place'} in ${query.location || 'Bangkok'}`;
              }
            }
            
            return {
              ...place,
              photoUrl: photoUrls[0] || place.photoUrl,
              photoUrls,
              description,
              isOpen: place.currentOpeningHours?.openNow,
            };
          } catch (error) {
            console.warn(`⚠️ [TravelService] Failed to enrich ${place.name}:`, error);
            return place;
          }
        })
      );
      
      // Filter out places without coordinates
      const validPlaces = placesWithDetails.filter(p => p.location?.latitude && p.location?.longitude);
      console.log(`✅ [TravelService] ${validPlaces.length} places with valid coordinates`);
      
      // Step 7: Skip categorization - LLM will handle it during UI generation
      console.log(`✅ [TravelService] Skipping categorization (LLM handles it in UI generation)`);
      const categorizedPlaces = validPlaces;
      
      // Step 8: Cluster places by geographical proximity (dynamic number of clusters)
      const targetClusters = Math.min(Math.ceil(categorizedPlaces.length / 4), 5); // 4-5 places per cluster, max 5 clusters
      const clusters = this.clusterPlacesByProximity(categorizedPlaces, targetClusters);
      
      console.log(`📍 [TravelService] Clustered into ${clusters.length} geographical areas`);
      
      // Log cluster sizes
      clusters.forEach((cluster, idx) => {
        console.log(`  📍 Cluster ${idx + 1}: ${cluster.places.length} places`);
      });
      
      // Step 9: Use LLM to name each cluster and create vibe description
      const recommendations: TravelRecommendation[] = await Promise.all(
        clusters.map(async (cluster) => {
          const placeNames = cluster.places.map((p: any) => p.name).join(', ');
          
          // Ask LLM to name this cluster
          const namingPrompt = `Given these places in ${query.location}: ${placeNames}

What is a catchy, descriptive name for this area/cluster? And a short vibe description?

Return JSON:
{
  "name": "Area name (e.g., 'Sukhumvit Nightlife', 'Old Town Heritage', 'Riverside Dining')",
  "vibe": "One sentence describing the vibe"
}`;

          let areaName = 'Area';
          let vibe = 'Great places to explore';
          
          try {
            const nameResponse = await llm.generateJSON(namingPrompt, 0.5);
            const parsed = JSON.parse(nameResponse);
            areaName = parsed.name || areaName;
            vibe = parsed.vibe || vibe;
          } catch (error) {
            console.warn('⚠️ [TravelService] Failed to generate area name, using fallback');
            // Fallback: use first place name
            areaName = cluster.places[0]?.name || 'Area';
          }
          
          return {
            destination: areaName,
            vibe,
            highlights: cluster.places.map((place: any) => ({
              name: place.name,
              type: place.category || 'touristy', // Set by categorization service
              description: place.description,
              rating: place.rating,
              photoUrl: place.photoUrl,
              photoUrls: place.photoUrls,
              latitude: place.location?.latitude,
              longitude: place.location?.longitude,
              isOpen: place.isOpen,
            })),
            dataSource: 'hybrid' as const,
            coordinates: {
              latitude: cluster.center.lat,
              longitude: cluster.center.lng,
            },
          };
        })
      );
      
      return recommendations;
    } catch (error) {
      console.error('❌ [TravelService] Advanced processing error:', error);
      // Fallback to regular hybrid
      return this.generateHybridRecommendations(query);
    }
  }
  
  /**
   * Cluster places by geographical proximity using simple k-means
   */
  private clusterPlacesByProximity(places: any[], targetClusters: number): Array<{ center: { lat: number; lng: number }; places: any[] }> {
    if (places.length === 0) return [];
    if (places.length <= targetClusters) {
      // If we have fewer places than target clusters, each place is its own cluster
      return places.map(p => ({
        center: { lat: p.location.latitude, lng: p.location.longitude },
        places: [p],
      }));
    }
    
    // Initialize k-means with first k places as centers
    const k = Math.min(targetClusters, places.length);
    let centers = places.slice(0, k).map(p => ({
      lat: p.location.latitude,
      lng: p.location.longitude,
    }));
    
    // Run k-means for 5 iterations
    for (let iter = 0; iter < 5; iter++) {
      // Assign each place to nearest center
      const clusters: any[][] = Array(k).fill(null).map(() => []);
      
      for (const place of places) {
        const lat = place.location.latitude;
        const lng = place.location.longitude;
        
        // Find nearest center
        let minDist = Infinity;
        let nearestIdx = 0;
        
        for (let i = 0; i < centers.length; i++) {
          const dist = this.getDistance(lat, lng, centers[i].lat, centers[i].lng);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }
        
        clusters[nearestIdx].push(place);
      }
      
      // Recalculate centers
      centers = clusters.map(cluster => {
        if (cluster.length === 0) return centers[0]; // Keep old center if empty
        const avgLat = cluster.reduce((sum: number, p: any) => sum + p.location.latitude, 0) / cluster.length;
        const avgLng = cluster.reduce((sum: number, p: any) => sum + p.location.longitude, 0) / cluster.length;
        return { lat: avgLat, lng: avgLng };
      });
    }
    
    // Final assignment
    const finalClusters: any[][] = Array(k).fill(null).map(() => []);
    for (const place of places) {
      const lat = place.location.latitude;
      const lng = place.location.longitude;
      
      let minDist = Infinity;
      let nearestIdx = 0;
      
      for (let i = 0; i < centers.length; i++) {
        const dist = this.getDistance(lat, lng, centers[i].lat, centers[i].lng);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      
      finalClusters[nearestIdx].push(place);
    }
    
    // Filter out empty clusters and return
    return finalClusters
      .map((places, idx) => ({ center: centers[idx], places }))
      .filter(c => c.places.length > 0);
  }
  
  /**
   * Calculate distance between two coordinates in km
   */
  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Get area name from cluster of places
   */
  private getAreaName(places: any[]): string {
    // Use the most popular place name or extract common area
    if (places.length === 0) return 'Area';
    
    // Simple heuristic: use first place's name
    const firstName = places[0].name;
    
    // Try to extract neighborhood/area from address if available
    // For now, just use a generic label
    return `Area ${places.length} places`;
  }
  
  /**
   * Discover hidden gems from web sources using DDG snippets + LLM intelligence
   */
  private async discoverHiddenGemsFromWeb(location: string, llm: LLMProvider): Promise<Array<{ name: string; reason: string }>> {
    try {
      // DISABLED: Web scraping is unreliable (CAPTCHAs, rate limits)
      // Relying on Places API filtering instead (4.3+ rating, 50-1500 reviews)
      console.log('⚠️ [TravelService] Web-based hidden gem discovery disabled (scraping unreliable)');
      console.log('   Using Places API filtering: 4.3+ rating, 50-1500 reviews');
      return [];
      
      /* ORIGINAL IMPLEMENTATION - DISABLED DUE TO SCRAPING ISSUES
      // Step 1: Ask LLM to generate search queries for hidden gems
      const queryPrompt = `Generate 3 search queries to find hidden gems and local favorites in ${location}.

Focus on finding actual place names from Reddit, blogs, and travel sites.

CRITICAL RULES FOR SEARCH QUERIES:
- Use ONLY alphanumeric characters, spaces, and "site:" operator
- NO special characters like quotes, dashes, parentheses
- NO boolean operators like AND, OR, NOT
- Keep queries simple and natural

Return JSON:
{
  "queries": ["query1", "query2", "query3"]
}

Example for Bangkok:
{
  "queries": [
    "site:reddit.com Bangkok hidden gem local favorite",
    "Bangkok underrated neighborhood food blog where locals eat",
    "site:tripadvisor.com Bangkok less touristy local spot restaurant bar"
  ]
}`;

      const queryResponse = await llm.generateJSON(queryPrompt, 0.5);
      const { queries } = JSON.parse(queryResponse);
      
      console.log('🔍 [TravelService] Search queries:', queries);
      
      // Step 2: Search using SearchProxy (alternates Brave/DDG)
      const { SearchProxyService } = await import('./SearchProxyService');
      const { CacheService } = await import('./CacheService');
      const searchProxy = new SearchProxyService(CacheService as any);
      
      const allResults: any[] = [];
      for (const query of queries) {
        try {
          const results = await searchProxy.search(query);
          allResults.push(...results.slice(0, 5));
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`⚠️ [TravelService] Search failed for: ${query}`);
        }
      }
      
      console.log(`📄 [TravelService] Found ${allResults.length} search results`);
      
      if (allResults.length === 0) {
        return [];
      }
      
      // Step 3: LLM extracts place names from snippets
      const snippetsText = allResults
        .map((r, idx) => `[${idx + 1}] ${r.title}\n${r.snippet}`)
        .join('\n\n');
      
      const extractPrompt = `Read these search results about ${location} and extract specific place names mentioned as hidden gems or local favorites.

Look for: restaurants, cafes, bars, attractions, shops, markets - any actual places with names.

Search Results:
${snippetsText}

Return JSON with place names found:
{
  "places": [
    {
      "name": "Exact Place Name",
      "reason": "Brief reason from snippet"
    }
  ]
}`;

      const extractResponse = await llm.generateJSON(extractPrompt, 0.3);
      const { places } = JSON.parse(extractResponse);
      
      console.log(`💎 [TravelService] Extracted ${places.length} hidden gem names`);
      
      if (places.length > 0) {
        console.log('  Examples:', places.slice(0, 3).map((p: any) => p.name).join(', '));
      }
      
      return places || [];
      */
    } catch (error) {
      console.error('❌ [TravelService] Error discovering hidden gems:', error);
      return [];
    }
  }

  /**
   * Categorize a place based on Google Places API data
   * Data comes from: place.rating, place.userRatingsTotal, place.priceLevel
   */
  private categorizePlace(place: any): 'offbeat' | 'touristy' | 'luxury' | 'budget' | 'hidden-gem' {
    const rating = place.rating || 0;
    const reviewCount = place.userRatingCount || place.userRatingsTotal || place.user_ratings_total || 0;
    const priceLevel = place.priceLevel || place.price_level || 0;
    
    // Log the actual data we receive from Google Places API
    console.log(`🏷️  [TravelService] Categorizing: ${place.name}`);
    console.log(`   📊 Google Places Data: rating=${rating}, reviews=${reviewCount}, price=${priceLevel}`);
    console.log(`   📦 Full place object keys:`, Object.keys(place).join(', '));
    
    let category: 'offbeat' | 'touristy' | 'luxury' | 'budget' | 'hidden-gem';
    let reason = '';
    
    // Use ONLY the data from Google Places API
    // Priority order based on what's most reliable:
    
    // 1. Price level (most reliable indicator)
    if (priceLevel >= 4) {
      category = 'luxury';
      reason = `price level ${priceLevel} (expensive)`;
    }
    else if (priceLevel === 1) {
      category = 'budget';
      reason = `price level ${priceLevel} (cheap)`;
    }
    // 2. Review count (popularity indicator)
    else if (reviewCount >= 5000) {
      category = 'touristy';
      reason = `${reviewCount} reviews (very popular)`;
    }
    else if (reviewCount >= 1500) {
      category = 'touristy';
      reason = `${reviewCount} reviews (popular)`;
    }
    // 3. Hidden gems (good rating, moderate popularity) - ALIGNED WITH FILTERING
    else if (reviewCount >= 50 && reviewCount < 1500 && rating >= 4.3) {
      category = 'hidden-gem';
      reason = `${reviewCount} reviews, ${rating}★ (quality but not crowded)`;
    }
    // 4. Offbeat (low reviews)
    else if (reviewCount < 50 && rating >= 4.0) {
      category = 'offbeat';
      reason = `${reviewCount} reviews (lesser known)`;
    }
    // 5. Default fallback
    else {
      category = 'touristy';
      reason = `default (${reviewCount} reviews, ${rating}★)`;
    }
    
    console.log(`   ✅ Category: ${category.toUpperCase()} - ${reason}`);
    return category;
  }

  /**
   * Get human-readable label for category
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'hidden-gem': 'Hidden Gems',
      'luxury': 'Luxury Experiences',
      'budget': 'Budget-Friendly',
      'touristy': 'Popular Attractions',
      'offbeat': 'Off the Beaten Path',
    };
    return labels[category] || category;
  }

  /**
   * Get description for category
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'hidden-gem': 'Highly-rated local favorites',
      'luxury': 'Premium experiences and venues',
      'budget': 'Great value for money',
      'touristy': 'Must-see popular spots',
      'offbeat': 'Unique and less crowded',
    };
    return descriptions[category] || 'Interesting places';
  }

  private buildPrompt(query: TravelQuery): string {
    const location = query.location || 'anywhere in the world';
    const feeling = query.feeling || 'any vibe';
    const budget = query.budget || 'mid-range';
    const duration = query.duration || 'a weekend';

    return `You are a travel expert. Generate 3 travel recommendations.

Query:
- Location: ${location}
- Vibe/Feeling: ${feeling}
- Budget: ${budget}
- Duration: ${duration}

For each destination, provide:
1. Destination name (City, Country)
2. Why it matches the vibe
3. 4-5 highlights with mix of:
   - Offbeat/hidden gems
   - Must-see touristy spots
   - Luxury experiences
   - Budget-friendly activities

Return ONLY valid JSON in this exact format:
[
  {
    "destination": "City, Country",
    "vibe": "Brief description of the vibe",
    "highlights": [
      {
        "name": "Place/Activity name",
        "type": "offbeat|touristy|luxury|budget|hidden-gem",
        "description": "Why visit (1 sentence, NO times or schedules)",
        "estimatedCost": "SHORT format only (max 25 chars)"
      }
    ],
    "bestTime": "Time of day ONLY: morning|afternoon|evening|night",
    "localTip": "One insider tip (NO specific times)"
  }
]

CRITICAL TIME RULES:
- bestTime must be ONLY: "morning", "afternoon", "evening", or "night"
- DO NOT include specific times like "3:00 AM" or "6-9 AM" anywhere
- DO NOT include time ranges or schedules
- Keep descriptions focused on WHAT to do, not WHEN

Make it specific and actionable. 

CRITICAL: For estimatedCost, use ONLY these formats (max 25 chars with spaces):
- "$50/person" - per person cost
- "$100/couple" - per couple cost
- "$25/day" - daily cost
- "$15/hour" - hourly cost
- "Free" - completely free
- "Free to browse" - free to look around
- "$50 min" - minimum spend

NEVER use long descriptions. Replace "per" with "/" only.
Examples of WRONG formats to AVOID:
- "$100 minimum spend for a day bed" ❌
- "$50 per person per night" ❌
- "Free to browse around" ❌

No markdown, just JSON.`;
  }

  private parseResponse(response: string): TravelRecommendation[] {
    try {
      // Clean up response - remove markdown code blocks if present
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      throw new Error('Invalid response format');
    }
  }

  private getMockData(query: TravelQuery): TravelRecommendation[] {
    // Fallback mock data for POC testing
    const location = query.location || 'Paris';
    
    return [
      {
        destination: location,
        vibe: 'Perfect blend of culture, romance, and adventure',
        highlights: [
          {
            name: 'Hidden Rooftop Café in Le Marais',
            type: 'hidden-gem',
            description: 'Secret spot locals love, amazing sunset views',
            estimatedCost: '$15',
          },
          {
            name: 'Eiffel Tower at Dawn',
            type: 'touristy',
            description: 'Skip the crowds, magical morning light',
            estimatedCost: '$30',
          },
          {
            name: 'Private Seine River Dinner Cruise',
            type: 'luxury',
            description: 'Gourmet meal with champagne and live music',
            estimatedCost: '$200',
          },
          {
            name: 'Free Walking Tour of Montmartre',
            type: 'budget',
            description: 'Artist quarter, street performers, stunning views',
            estimatedCost: 'Free (tip guide)',
          },
        ],
        bestTime: 'April-June or September-October',
        localTip: 'Buy a carnet (10 metro tickets) to save 40% on transport',
        dataSource: 'llm-only',
      },
    ];
  }

  /**
   * Rank recommendations using crowd intelligence and multiple signals
   */
  private async rankRecommendations(
    recommendations: TravelRecommendation[],
    query: TravelQuery
  ): Promise<TravelRecommendation[]> {
    try {
      for (const rec of recommendations) {
        // Prepare places for ranking
        const places = rec.highlights.map(h => ({
          name: h.name,
          city: rec.destination.split(',')[0].trim(),
          type: this.mapHighlightTypeToPlaceType(h.type),
          rating: (h as any).rating,
          userRatingCount: (h as any).userRatingCount,
          isOpen: (h as any).isOpen,
          llmRelevanceScore: 0.8 // LLM already selected these, so high base relevance
        }));

        // Rank places
        const rankings = await this.rankingService.rankPlaces(places, {
          userIntent: query.feeling || 'fun',
          timeOfDay: this.getCurrentTimeOfDay(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          prioritizeOpen: true
        });

        // Apply rankings to highlights
        rec.highlights = rec.highlights.map((highlight, idx) => {
          const ranking = rankings.find(r => r.placeName === highlight.name);
          if (ranking) {
            return {
              ...highlight,
              rankingScore: ranking,
              crowdLevel: ranking.crowdIntel?.level,
              bestTimeToVisit: ranking.crowdIntel?.bestTimeToVisit
            };
          }
          return highlight;
        });

        // Re-order highlights by ranking score
        rec.highlights.sort((a, b) => {
          const scoreA = a.rankingScore?.totalScore || 50;
          const scoreB = b.rankingScore?.totalScore || 50;
          return scoreB - scoreA;
        });

        console.log(`✅ [TravelService] Ranked ${rec.highlights.length} highlights for ${rec.destination}`);
      }

      // Ensure all recommendations have coordinates before returning
      return await this.ensureCoordinates(recommendations);
    } catch (error) {
      console.error('❌ [TravelService] Ranking error:', error);
      return await this.ensureCoordinates(recommendations); // Return unranked if ranking fails
    }
  }

  /**
   * Map highlight type to place type for crowd intelligence
   */
  private mapHighlightTypeToPlaceType(type: string): string {
    const mapping: Record<string, string> = {
      'offbeat': 'tourist_attraction',
      'touristy': 'tourist_attraction',
      'luxury': 'restaurant',
      'budget': 'tourist_attraction',
      'hidden-gem': 'restaurant'
    };
    return mapping[type] || 'tourist_attraction';
  }

  /**
   * Get current time of day
   */
  private getCurrentTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

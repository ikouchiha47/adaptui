import { configManager } from '../config/ConfigManager';
import { GeminiCore } from '../core/GeminiCore';
import { CacheService } from './CacheService';
import { CapabilityContext, CapabilityDetector } from './CapabilityDetector';
import { DeviceLocation, LocationService } from './LocationService';
import { PlaceResult, PlacesAPIService } from './PlacesAPIService';
import { PlacesPhotoService } from './PlacesPhotoService';
import { PlaceScore, RankingService } from './RankingService';
import { TransportService, TransportTicket } from './TransportService';

export interface TravelQuery {
  location?: string;
  feeling?: string;
  budget?: 'budget' | 'mid' | 'luxury';
  duration?: string;
  useRealData?: boolean; // Toggle between LLM-only and hybrid
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
}

export interface TravelContext {
  recommendations: TravelRecommendation[];
  capabilities: CapabilityContext;
  userLocation?: DeviceLocation;
}

export class TravelService {
  private llm: GeminiCore;
  private placesAPI: PlacesAPIService;
  private photosService: PlacesPhotoService | null;
  private transportService: TransportService;
  private rankingService: RankingService;
  private capabilities: CapabilityContext | null = null;

  constructor() {
    // Get API keys from config
    const geminiKey = configManager.getApiKeyOrNull('gemini');
    const googlePlacesKey = configManager.getApiKeyOrNull('googlePlaces');
    const modelName = configManager.getModelName();

    if (!geminiKey) {
      throw new Error('Gemini API key required. Please add it to config.json');
    }

    this.llm = new GeminiCore(geminiKey, modelName);
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

  async generateRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    console.log('🌍 [TravelService] Starting recommendation generation...');
    console.log('📍 Location:', query.location);
    console.log('💰 Budget:', query.budget);
    console.log('🔄 Use real data:', query.useRealData);
    
    // Check cache first
    const cacheKey = `${query.location || 'any'}_${query.feeling || 'any'}_${query.budget || 'mid'}`;
    const cached = await CacheService.get<TravelRecommendation[]>('travel_recommendations', cacheKey);
    
    if (cached) {
      console.log('✅ [TravelService] Using cached recommendations');
      return cached;
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
    const recommendations = await this.generateLLMOnlyRecommendations(query);
    console.log(`✅ [TravelService] Generated ${recommendations.length} recommendations`);
    
    // Step 3: Add transport tickets if location available
    if (this.capabilities?.capabilities.transport && this.capabilities?.userLocation) {
      console.log('🚀 [TravelService] Step 3: Adding transport options...');
      await this.addTransportOptions(recommendations, query.location || '');
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
   * Add transport options to recommendations
   */
  private async addTransportOptions(recommendations: TravelRecommendation[], destination: string): Promise<void> {
    try {
      if (!this.capabilities?.userLocation) return;

      const userLocation = this.capabilities.userLocation;
      
      for (const rec of recommendations) {
        // Calculate distance
        const distance = LocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          rec.highlights[0]?.latitude || 0,
          rec.highlights[0]?.longitude || 0
        );

        rec.distance = distance;

        // Get recommended transport based on distance
        const recommendedTypes = this.transportService.getRecommendedTransport(distance);

        // Search for tickets
        const tickets: TransportTicket[] = [];
        
        for (const type of recommendedTypes) {
          if (type === 'flight') {
            const flights = await this.transportService.searchFlights({
              from: 'Current Location',
              to: rec.destination,
              date: new Date().toISOString().split('T')[0],
              passengers: 1
            });
            tickets.push(...flights.slice(0, 2));
          } else if (type === 'bus') {
            const buses = await this.transportService.searchBuses({
              from: 'Current Location',
              to: rec.destination,
              date: new Date().toISOString().split('T')[0],
              passengers: 1
            });
            tickets.push(...buses.slice(0, 2));
          } else if (type === 'train') {
            const trains = await this.transportService.searchTrains({
              from: 'Current Location',
              to: rec.destination,
              date: new Date().toISOString().split('T')[0],
              passengers: 1
            });
            tickets.push(...trains.slice(0, 2));
          }
        }

        rec.transportTickets = tickets.sort((a, b) => a.price - b.price);
        console.log(`✅ [TravelService] Added ${tickets.length} transport options for ${rec.destination}`);
      }
    } catch (error) {
      console.error('❌ [TravelService] Error adding transport options:', error);
    }
  }

  private async analyzeIntent(query: TravelQuery): Promise<any> {
    const prompt = `Analyze this travel query:
Location: ${query.location || 'any'}
Feeling: ${query.feeling || 'any'}
Budget: ${query.budget || 'mid'}

Extract:
1. What type of experience? (romantic, adventure, cultural, relaxation, foodie, nightlife)
2. What to validate? (restaurant hours, current status, reviews, pricing)
3. Search queries for validation (specific place names to verify)

Return JSON:
{
  "experienceType": "romantic|adventure|cultural|relaxation|foodie|nightlife",
  "validationNeeds": ["hours", "status", "reviews", "pricing"],
  "searchQueries": ["specific place 1", "specific place 2"]
}`;

    try {
      const result = await this.llm.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Intent analysis error:', error);
      return { experienceType: 'general', validationNeeds: [], searchQueries: [] };
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
      
      const result = await this.llm.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3, // Lower temperature for more consistent results
        }
      });
      const response = await result.response;
      const text = response.text();
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
                console.log(`✅ [TravelService] Got ${details.photos.length} photos, rating: ${details.rating} for ${highlight.name}`);
              }
            } catch (error) {
              console.warn(`⚠️ [TravelService] Failed to fetch details for ${highlight.name}:`, error);
            }
          }
        }
      }
      
      return recommendations.map(r => ({ ...r, dataSource: 'llm-only' as const }));
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
      
      const intentResult = await this.llm.model.generateContent(intentPrompt);
      const intentResponse = await intentResult.response;
      const intentText = intentResponse.text();
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

      const curationResult = await this.llm.model.generateContent(curationPrompt);
      const curationResponse = await curationResult.response;
      const curationText = curationResponse.text();
      const recommendations = this.parseResponse(curationText);
      
      return recommendations.map(r => ({ ...r, dataSource: 'hybrid' as const }));
    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      // Fallback to LLM-only
      return this.generateLLMOnlyRecommendations(query);
    }
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

      return recommendations;
    } catch (error) {
      console.error('❌ [TravelService] Ranking error:', error);
      return recommendations; // Return unranked if ranking fails
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

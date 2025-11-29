// Airport Code Service - Wrapper around AirportDatabaseService
// Provides simple interface for getting IATA codes

import OpenAI from 'openai';
import { configManager } from '../config/ConfigManager';
import { Airport, AirportDatabaseService } from './AirportDatabaseService';

export { Airport };

export class AirportCodeService {
  private dbService = new AirportDatabaseService();
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = configManager.getApiKeyOrNull('openai');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }



  /**
   * Find nearest airport to given coordinates
   */
  async findNearestAirport(lat: number, lon: number, maxDistanceKm: number = 200): Promise<Airport | null> {
    return await this.dbService.findNearestAirport(lat, lon, maxDistanceKm);
  }

  /**
   * Find airport by city name (hybrid: Database + LLM + Google Places verification)
   */
  async findAirportByCity(cityName: string): Promise<Airport | null> {
    // Step 1: Try database lookup first
    const airport = await this.dbService.findAirportByCity(cityName);
    
    if (airport) {
      console.log('[AirportCode] Found in database:', airport.iata);
      return airport;
    }
    
    // Step 2: LLM provides educated guess
    console.log('[AirportCode] Database lookup failed, asking LLM for:', cityName);
    const llmCode = await this.askLLMForAirportCode(cityName);
    
    if (llmCode) {
      // Step 3: Verify LLM suggestion against database
      const airportByCode = await this.dbService.searchByCity(llmCode);
      if (airportByCode.length > 0) {
        console.log('[AirportCode] LLM suggestion verified in database:', llmCode);
        return airportByCode[0];
      }
      
      // Step 4: LLM suggested a code not in our database - try Google Places to verify
      console.log('[AirportCode] LLM suggested', llmCode, 'but not in database, verifying with Google Places...');
      const verifiedAirport = await this.verifyAirportWithGooglePlaces(cityName, llmCode);
      if (verifiedAirport) {
        return verifiedAirport;
      }
    }
    
    return null;
  }

  /**
   * Verify airport exists using Google Places API
   */
  private async verifyAirportWithGooglePlaces(cityName: string, suggestedCode: string): Promise<Airport | null> {
    const googleApiKey = configManager.getApiKeyOrNull('googlePlaces');
    if (!googleApiKey) {
      console.warn('[AirportCode] No Google API key for verification');
      return null;
    }

    try {
      // Search for airport in the city
      const searchQuery = `${cityName} ${suggestedCode} airport`;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&type=airport&key=${googleApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        console.log('[AirportCode] Google Places verified:', {
          name: place.name,
          suggestedCode,
          location: place.geometry.location
        });
        
        // Return a constructed Airport object
        return {
          id: 0, // Temporary ID
          iata: suggestedCode,
          icao: '',
          name: place.name,
          city: cityName,
          country: place.formatted_address?.split(',').pop()?.trim() || '',
          lat: place.geometry.location.lat,
          lon: place.geometry.location.lng
        };
      }

      console.warn('[AirportCode] Google Places could not verify:', suggestedCode);
      return null;
    } catch (error) {
      console.error('[AirportCode] Google Places verification error:', error);
      return null;
    }
  }

  /**
   * Ask LLM for airport code when database lookup fails
   */
  private async askLLMForAirportCode(cityName: string): Promise<string | null> {
    if (!this.openai) {
      console.warn('[AirportCode] No OpenAI API key, cannot use LLM fallback');
      return null;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `What is the IATA airport code for the main international airport in ${cityName}? Reply with ONLY the 3-letter code, nothing else. Examples: BKK, SIN, HKG`
        }],
        temperature: 0,
        max_tokens: 10
      });

      const code = response.choices[0].message.content?.trim().toUpperCase();

      if (code && code.length === 3 && /^[A-Z]{3}$/.test(code)) {
        console.log('[AirportCode] LLM suggested code:', code, 'for', cityName);
        return code;
      }

      console.warn('[AirportCode] LLM returned invalid code:', code);
      return null;
    } catch (error) {
      console.error('[AirportCode] LLM fallback error:', error);
      return null;
    }
  }

  /**
   * Force refresh airport data (manual update)
   */
  async forceRefresh(): Promise<void> {
    return await this.dbService.forceRefresh();
  }
}

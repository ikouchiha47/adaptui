// Airport Validator - Validates LLM-provided airport data against database

import { AirportDatabaseService } from './AirportDatabaseService';

export interface ValidatedAirport {
  iata: string;
  name: string;
  city: string;
  country: string;
  confidence: 'high' | 'medium' | 'low';
}

export class AirportValidator {
  private db: AirportDatabaseService;

  constructor() {
    this.db = new AirportDatabaseService();
  }

  /**
   * Validate and resolve airport codes/names from LLM
   * Input: Array of strings (can be IATA codes, city names, or airport names)
   * Output: Array of validated airports with IATA codes
   */
  async validateAirports(inputs: string[]): Promise<ValidatedAirport[]> {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    console.log('[AirportValidator] Validating inputs:', inputs);

    const validated: ValidatedAirport[] = [];
    const seen = new Set<string>(); // Prevent duplicates

    for (const input of inputs) {
      const trimmed = input.trim();
      if (!trimmed) continue;

      // Try as IATA code first (3 letters)
      if (trimmed.length === 3) {
        const airport = await this.db.getAirportByCode(trimmed);
        if (airport && !seen.has(airport.iata)) {
          validated.push({
            iata: airport.iata,
            name: airport.name,
            city: airport.city,
            country: airport.country,
            confidence: 'high'
          });
          seen.add(airport.iata);
          console.log('[AirportValidator] ✅ Validated IATA code:', airport.iata);
          continue;
        }
      }

      // Try as city/airport name using FTS
      const results = await this.db.searchByCity(trimmed);
      if (results.length > 0) {
        // Take top result (FTS ranks by relevance)
        const airport = results[0];
        if (!seen.has(airport.iata)) {
          validated.push({
            iata: airport.iata,
            name: airport.name,
            city: airport.city,
            country: airport.country,
            confidence: results.length === 1 ? 'high' : 'medium'
          });
          seen.add(airport.iata);
          console.log('[AirportValidator] ✅ Resolved via FTS:', {
            input: trimmed,
            iata: airport.iata,
            matches: results.length
          });
        }
      } else {
        console.warn('[AirportValidator] ❌ Could not resolve:', trimmed);
      }
    }

    console.log('[AirportValidator] Final validated airports:', validated.map(a => a.iata));
    return validated;
  }

  /**
   * Get all airports for a destination (returns multiple if city has multiple airports)
   */
  async getAirportsForDestination(destination: string): Promise<ValidatedAirport[]> {
    console.log('[AirportValidator] Finding airports for:', destination);

    const results = await this.db.searchByCity(destination);
    
    if (results.length === 0) {
      console.warn('[AirportValidator] No airports found for:', destination);
      return [];
    }

    // Score and sort airports
    const scored = results.map(airport => {
      let score = 0;
      const nameLower = airport.name.toLowerCase();
      const cityLower = airport.city.toLowerCase();
      const destLower = destination.toLowerCase();

      // Exact city match
      if (cityLower === destLower) score += 20;
      
      // City contains destination
      if (cityLower.includes(destLower)) score += 10;
      
      // International airports
      if (nameLower.includes('international')) score += 15;
      
      // Avoid air bases
      if (nameLower.includes('air base') || nameLower.includes('afb')) score -= 30;
      
      // Avoid regional
      if (nameLower.includes('regional')) score -= 10;

      return { airport, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return top 5 airports
    const validated = scored.slice(0, 5).map(({ airport, score }) => ({
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      confidence: score > 20 ? 'high' : score > 10 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
    }));

    console.log('[AirportValidator] Found airports:', validated.map(a => `${a.iata} (${a.confidence})`));
    return validated;
  }
}

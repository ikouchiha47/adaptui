// Transport Mode Analyzer - Determines feasible transport modes based on distance

import { LLMProviderFactory } from '../core/LLMProviderFactory';

import { LLMProvider } from '../core/LLMProvider';

export class TransportModeAnalyzer {
  private llmCore: LLMProvider | null = null;

  constructor() {
    try {
      this.llmCore = LLMProviderFactory.getProvider();
    } catch (error) {
      console.warn('[TransportModeAnalyzer] LLM initialization failed:', error);
    }
  }

  /**
   * Determine feasible transport modes between two locations
   */
  async analyzeFeasibleModes(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    fromCity: string,
    toCity: string
  ): Promise<string[]> {
    // STEP 1: Calculate distance (GROUNDING - hard constraint)
    const distance = this.calculateDistance(fromLat, fromLng, toLat, toLng);
    
    console.log('[TransportModeAnalyzer] Distance-based analysis:', {
      from: fromCity,
      to: toCity,
      distance: `${distance.toFixed(0)}km`
    });

    // STEP 2: Apply distance-based constraints (HARD RULES)
    const distanceConstrainedModes: string[] = [];

    // Flight: feasible for any distance > 100km
    if (distance > 100) {
      distanceConstrainedModes.push('flight');
    }

    // Train: only feasible < 3000km (continental travel)
    if (distance < 3000) {
      distanceConstrainedModes.push('train');
    }

    // Bus: only feasible < 1000km (regional travel)
    if (distance < 1000) {
      distanceConstrainedModes.push('bus');
    }

    // Drive: only feasible < 500km (local travel)
    if (distance < 500) {
      distanceConstrainedModes.push('drive');
    }

    console.log('[TransportModeAnalyzer] Distance-constrained modes:', distanceConstrainedModes);

    // STEP 3: Use LLM to refine based on geography/infrastructure (OPTIONAL)
    if (this.llmCore && distanceConstrainedModes.length > 1) {
      try {
        const prompt = `Given these distance-feasible transport modes: ${distanceConstrainedModes.join(', ')}

From: ${fromCity} to ${toCity} (${distance.toFixed(0)} km)

Which modes are ACTUALLY available considering:
- Geographic barriers (oceans, mountains, borders)
- Infrastructure (rail networks, road connections)
- Political/visa requirements

Return ONLY a JSON array filtering the given modes, e.g.: ["flight", "train"]
Do NOT add modes not in the original list.`;

        const response = await this.llmCore.generateText(prompt);
        const jsonMatch = response.match(/\[[\s\S]*?\]/);
        
        if (jsonMatch) {
          const refinedModes = JSON.parse(jsonMatch[0]);
          // Only keep modes that were in the distance-constrained list
          const validModes = refinedModes.filter((m: string) => distanceConstrainedModes.includes(m));
          
          if (validModes.length > 0) {
            console.log('[TransportModeAnalyzer] LLM refined modes:', validModes);
            return validModes;
          }
        }
      } catch (error) {
        console.error('[TransportModeAnalyzer] LLM refinement failed:', error);
      }
    }

    // Return distance-constrained modes (grounded in reality)
    return distanceConstrainedModes.length > 0 ? distanceConstrainedModes : ['flight'];
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

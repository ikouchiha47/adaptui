// Data Enrichment Service - Enrich places with real-time data

import { GooglePlacesClient } from './GooglePlacesClient';
import { QueryAnalysis } from './QueryAnalysisService';

export interface EnrichedPlace {
  place_id: string;
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  rating: number;
  photos: string[];
  types: string[];
  
  enrichment: {
    openingHours: {
      isOpen: boolean;
      hours: string[];
      nextOpen?: string;
      nextClose?: string;
    };
    
    popularity: {
      current: number;
      crowdLevel: 'quiet' | 'moderate' | 'busy' | 'very busy';
      popularTimes?: any[];
    };
    
    weather: {
      temp: number;
      conditions: string;
      precipitation: number;
      suitability: number;
      recommendation: string;
    };
    
    tidal?: {
      nextTide: string;
      tideType: 'high' | 'low';
      waveHeight: number;
      suitability: number;
    };
    
    timeRecommendation: {
      suggestedTime: string;
      reason: string;
      overallScore: number;
      badges: Array<{
        icon: string;
        text: string;
        color: string;
      }>;
      alternatives: Array<{
        time: string;
        reason: string;
        score: number;
      }>;
    };
  };
}

export class DataEnrichmentService {
  private placesClient: GooglePlacesClient;

  constructor() {
    this.placesClient = new GooglePlacesClient();
  }

  async enrichPlaces(
    places: any[],
    analysis: QueryAnalysis
  ): Promise<EnrichedPlace[]> {
    console.log('📊 [DataEnrichment] Enriching', places.length, 'places');
    
    const enriched: EnrichedPlace[] = [];
    
    for (const place of places) {
      try {
        // Get place details
        const details = await this.getPlaceDetails(place.place_id);
        
        // Get popularity data
        const popularity = this.getPopularityData();
        
        // Get weather data
        const weather = this.getWeatherData(
          place.coordinates,
          analysis.temporal.suggestedTimeOfDay,
          analysis.sentiment.emotion
        );
        
        // Get tidal data if water activity
        let tidal = null;
        if (this.isWaterActivity(place.types)) {
          tidal = this.getTidalData(place.coordinates);
        }
        
        // Calculate time recommendation
        const timeRecommendation = this.calculateTimeRecommendation({
          emotionTime: analysis.temporal.suggestedTimeOfDay,
          emotionReasoning: analysis.temporal.timeReasoning,
          popularity,
          weather,
          tidal,
          openingHours: details.openingHours
        });
        
        enriched.push({
          ...place,
          enrichment: {
            openingHours: details.openingHours,
            popularity,
            weather,
            tidal,
            timeRecommendation
          }
        });
      } catch (error) {
        console.error('❌ [DataEnrichment] Error enriching place:', error);
        // Add place without enrichment
        enriched.push({
          ...place,
          enrichment: this.getDefaultEnrichment(analysis)
        });
      }
    }
    
    console.log('✅ [DataEnrichment] Complete');
    return enriched;
  }

  private async getPlaceDetails(placeId: string): Promise<any> {
    // TODO: Implement Google Places Details API
    // For now, return mock data
    return {
      openingHours: {
        isOpen: true,
        hours: [
          'Monday: 9:00 AM – 10:00 PM',
          'Tuesday: 9:00 AM – 10:00 PM',
          'Wednesday: 9:00 AM – 10:00 PM',
          'Thursday: 9:00 AM – 10:00 PM',
          'Friday: 9:00 AM – 11:00 PM',
          'Saturday: 9:00 AM – 11:00 PM',
          'Sunday: 9:00 AM – 10:00 PM'
        ]
      }
    };
  }

  private getPopularityData(): any {
    // TODO: Implement Google Places Popular Times API
    // For now, return mock data
    const current = Math.floor(Math.random() * 100);
    return {
      current,
      crowdLevel: this.getCrowdLevel(current),
      popularTimes: []
    };
  }

  private getCrowdLevel(popularity: number): 'quiet' | 'moderate' | 'busy' | 'very busy' {
    if (popularity < 30) return 'quiet';
    if (popularity < 60) return 'moderate';
    if (popularity < 80) return 'busy';
    return 'very busy';
  }

  private getWeatherData(
    coordinates: any,
    time: string,
    emotion: string
  ): any {
    // TODO: Implement Weather API
    // For now, return mock data
    const temp = 25 + Math.floor(Math.random() * 10);
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)];
    const precipitation = Math.floor(Math.random() * 30);
    
    let suitability = 1.0;
    if (temp > 35) suitability -= 0.3;
    if (precipitation > 50) suitability -= 0.4;
    
    return {
      temp,
      conditions,
      precipitation,
      suitability: Math.max(0, suitability),
      recommendation: suitability > 0.8 
        ? `Perfect weather (${temp}°C, ${conditions})`
        : `${conditions}, ${temp}°C - ${precipitation}% chance of rain`
    };
  }

  private getTidalData(coordinates: any): any {
    // TODO: Implement Tidal API
    // For now, return mock data
    return {
      nextTide: '3:45 PM',
      tideType: 'high',
      waveHeight: 1.2,
      suitability: 0.8
    };
  }

  private calculateTimeRecommendation(data: any): any {
    // Calculate overall score
    const emotionScore = 1.0;
    const crowdScore = 1 - (data.popularity.current / 100);
    const weatherScore = data.weather.suitability;
    const tidalScore = data.tidal?.suitability || 1.0;
    const openScore = data.openingHours?.isOpen ? 1.0 : 0.0;
    
    const overallScore = (
      emotionScore * 0.3 +
      crowdScore * 0.2 +
      weatherScore * 0.2 +
      tidalScore * 0.15 +
      openScore * 0.15
    );
    
    // Generate badges
    const badges = [];
    
    if (data.popularity.crowdLevel === 'quiet') {
      badges.push({ icon: '🤫', text: 'Quiet', color: '#10B981' });
    } else if (data.popularity.crowdLevel === 'busy') {
      badges.push({ icon: '👥', text: 'Busy', color: '#F59E0B' });
    }
    
    if (data.weather.suitability > 0.8) {
      badges.push({ icon: '☀️', text: 'Perfect Weather', color: '#10B981' });
    } else if (data.weather.suitability < 0.6) {
      badges.push({ icon: '🌧️', text: 'Check Weather', color: '#EF4444' });
    }
    
    if (data.tidal && data.tidal.suitability > 0.8) {
      badges.push({ icon: '🌊', text: 'Good Tide', color: '#3B82F6' });
    }
    
    if (data.openingHours?.isOpen) {
      badges.push({ icon: '✅', text: 'Open', color: '#10B981' });
    } else {
      badges.push({ icon: '🔒', text: 'Closed', color: '#EF4444' });
    }
    
    // Build reason
    const reasonParts = [];
    reasonParts.push(`Best for ${data.emotionTime}`);
    reasonParts.push(data.popularity.crowdLevel);
    reasonParts.push(data.weather.conditions);
    
    return {
      suggestedTime: data.emotionTime,
      reason: reasonParts.join(' • '),
      overallScore,
      badges,
      alternatives: []
    };
  }

  private getDefaultEnrichment(analysis: QueryAnalysis): any {
    return {
      openingHours: {
        isOpen: true,
        hours: []
      },
      popularity: {
        current: 50,
        crowdLevel: 'moderate',
        popularTimes: []
      },
      weather: {
        temp: 25,
        conditions: 'Clear',
        precipitation: 0,
        suitability: 0.9,
        recommendation: 'Good weather'
      },
      tidal: null,
      timeRecommendation: {
        suggestedTime: analysis.temporal.suggestedTimeOfDay,
        reason: analysis.temporal.timeReasoning,
        overallScore: 0.8,
        badges: [
          { icon: '⏰', text: analysis.temporal.suggestedTimeOfDay, color: '#6366F1' }
        ],
        alternatives: []
      }
    };
  }

  private isWaterActivity(types: string[]): boolean {
    const waterTypes = ['beach', 'water_park', 'aquarium', 'marina', 'swimming_pool'];
    return types?.some(type => waterTypes.includes(type)) || false;
  }
}

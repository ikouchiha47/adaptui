// Itinerary Service - Generate travel itineraries based on query and capabilities

import { configManager } from '../config/ConfigManager';
import { GeminiCore } from '../core/GeminiCore';

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Array<{
    time: string;
    activity: string;
    location: string;
    duration: string;
    cost?: string;
    notes?: string;
  }>;
  meals: Array<{
    type: 'breakfast' | 'lunch' | 'dinner';
    restaurant: string;
    cuisine: string;
    cost?: string;
  }>;
  accommodation?: {
    name: string;
    type: string;
    cost: string;
  };
}

export interface Itinerary {
  destination: string;
  duration: number; // days
  startDate: string;
  endDate: string;
  budget: string;
  vibe: string;
  days: ItineraryDay[];
  totalEstimatedCost: string;
  highlights: string[];
  tips: string[];
}

export class ItineraryService {
  private llm: LLMCore;

  constructor() {
    const apiKey = configManager.getApiKeyOrNull('gemini');
    const modelName = configManager.getModelName();

    if (!apiKey) {
      throw new Error('Gemini API key required');
    }

    this.llm = new GeminiCore(apiKey, modelName);
  }

  /**
   * Generate itinerary based on user query and capabilities
   */
  async generateItinerary(
    destination: string,
    query: string,
    capabilities: any,
    duration: number = 3
  ): Promise<Itinerary> {
    try {
      console.log(`📅 [ItineraryService] Generating itinerary for ${destination}...`);

      const prompt = this.buildItineraryPrompt(destination, query, capabilities, duration);

      const result = await this.llm.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        }
      });

      const response = await result.response;
      const text = response.text();
      const itinerary = JSON.parse(text);

      console.log(`✅ [ItineraryService] Generated ${itinerary.days.length}-day itinerary`);
      return itinerary;
    } catch (error) {
      console.error('❌ [ItineraryService] Error:', error);
      return this.getMockItinerary(destination, duration);
    }
  }

  private buildItineraryPrompt(
    destination: string,
    query: string,
    capabilities: any,
    duration: number
  ): string {
    const capabilityText = this.formatCapabilities(capabilities);

    return `You are a travel itinerary expert. Generate a detailed ${duration}-day itinerary.

Destination: ${destination}
User Query: ${query}
Duration: ${duration} days
Available Capabilities: ${capabilityText}

Generate a JSON itinerary with:
{
  "destination": "${destination}",
  "duration": ${duration},
  "startDate": "2024-01-15",
  "endDate": "2024-01-18",
  "budget": "Budget/Mid-range/Luxury",
  "vibe": "Description of the vibe",
  "days": [
    {
      "day": 1,
      "date": "2024-01-15",
      "title": "Arrival & Exploration",
      "activities": [
        {
          "time": "14:00",
          "activity": "Arrive at destination",
          "location": "Airport",
          "duration": "2h",
          "cost": "$50"
        }
      ],
      "meals": [
        {
          "type": "dinner",
          "restaurant": "Local restaurant",
          "cuisine": "Local",
          "cost": "$25"
        }
      ],
      "accommodation": {
        "name": "Hotel name",
        "type": "Hotel/Hostel/Airbnb",
        "cost": "$80"
      }
    }
  ],
  "totalEstimatedCost": "$500-800",
  "highlights": ["Activity 1", "Activity 2"],
  "tips": ["Tip 1", "Tip 2"]
}

Make it specific, actionable, and tailored to the user's query.
Include transport times if location services available.
Include restaurant recommendations if photos available.
Include map locations if maps available.`;
  }

  private formatCapabilities(capabilities: any): string {
    const caps = [];
    if (capabilities?.location) caps.push('Location services');
    if (capabilities?.transport) caps.push('Transport search');
    if (capabilities?.photos) caps.push('Place photos');
    if (capabilities?.maps) caps.push('Maps');
    return caps.length > 0 ? caps.join(', ') : 'Basic features only';
  }

  private getMockItinerary(destination: string, duration: number): Itinerary {
    const days: ItineraryDay[] = [];

    for (let i = 1; i <= duration; i++) {
      days.push({
        day: i,
        date: `2024-01-${15 + i}`,
        title: i === 1 ? 'Arrival' : i === duration ? 'Departure' : `Day ${i} Exploration`,
        activities: [
          {
            time: '09:00',
            activity: 'Breakfast',
            location: 'Hotel',
            duration: '1h',
            cost: '$10'
          },
          {
            time: '11:00',
            activity: 'Explore local attractions',
            location: destination,
            duration: '4h',
            cost: '$20'
          }
        ],
        meals: [
          {
            type: 'breakfast',
            restaurant: 'Hotel restaurant',
            cuisine: 'Local',
            cost: '$10'
          },
          {
            type: 'lunch',
            restaurant: 'Local warung',
            cuisine: 'Local',
            cost: '$8'
          },
          {
            type: 'dinner',
            restaurant: 'Restaurant',
            cuisine: 'Local',
            cost: '$15'
          }
        ],
        accommodation: {
          name: 'Hotel',
          type: 'Hotel',
          cost: '$80'
        }
      });
    }

    return {
      destination,
      duration,
      startDate: '2024-01-15',
      endDate: `2024-01-${15 + duration}`,
      budget: 'Mid-range',
      vibe: 'Relaxing and cultural',
      days,
      totalEstimatedCost: `$${500 + duration * 100}`,
      highlights: ['Local culture', 'Natural beauty', 'Local cuisine'],
      tips: ['Learn basic phrases', 'Respect local customs', 'Try local food']
    };
  }
}

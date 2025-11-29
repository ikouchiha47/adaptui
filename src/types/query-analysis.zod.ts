// Zod schemas for Query Analysis structured outputs

import { z } from 'zod';

// Intent types
export const IntentSchema = z.enum([
  'search',
  'browse', 
  'compare',
  'book',
  'navigate',
  'plan'
]);

// Category types
export const CategorySchema = z.enum([
  'dining',
  'accommodation',
  'activities',
  'transport',
  'shopping',
  'entertainment'
]);

// Emotion types
export const EmotionSchema = z.enum([
  'romantic',
  'fun',
  'adventurous',
  'relaxing',
  'cultural',
  'energetic',
  'peaceful',
  'luxurious'
]);

// Intensity levels
export const IntensitySchema = z.enum(['low', 'medium', 'high']);

// Time of day
export const TimeOfDaySchema = z.enum([
  'morning',
  'afternoon', 
  'evening',
  'night',
  'late-night'
]);

// Nature of travel
export const NatureOfTravelSchema = z.enum([
  'romantic',
  'family',
  'business',
  'solo',
  'adventure',
  'luxury',
  'budget'
]);

// UI types
export const UITypeSchema = z.enum([
  'list',
  'grid',
  'map',
  'comparison',
  'detail'
]);

// Sentiment analysis
export const SentimentSchema = z.object({
  emotion: EmotionSchema,
  intensity: IntensitySchema,
  vibe: z.array(z.string())
});

// Best time window
export const BestTimeSchema = z.object({
  time: z.string(),
  reason: z.string(),
  suitability: z.number().min(0).max(1)
});

// Temporal context
export const TemporalSchema = z.object({
  suggestedTimeOfDay: TimeOfDaySchema,
  timeReasoning: z.string(),
  duration: z.number(),
  bestTimes: z.array(BestTimeSchema)
});

// Sort options
export const SortBySchema = z.enum([
  'rating',
  'price', 
  'distance',
  'popularity'
]);

// Filters
export const FiltersSchema = z.object({
  priceRange: z.string().nullable(),
  rating: z.number().nullable(),
  cuisine: z.string().nullable(),
  amenities: z.array(z.string()).nullable(),
  openNow: z.boolean().nullable()
});

// Query parameters
export const ParametersSchema = z.object({
  destination: z.string().describe('City or destination name (e.g., "Bangkok", "Paris")'),
  destinationAirports: z.array(z.string()).describe('REQUIRED: Array of IATA airport codes for the destination city, sorted by relevance (e.g., ["BKK", "DMK"] for Bangkok). Include all major airports serving the destination. Will be validated against airport database.'),
  establishments: z.array(z.string()).describe('Types of places mentioned (e.g., ["bar", "restaurant", "hotel"])'),
  keywords: z.array(z.string()).describe('Key search terms and descriptors from the query'),
  natureOfTravel: NatureOfTravelSchema,
  filters: FiltersSchema,
  sortBy: SortBySchema,
  limit: z.number().default(10)
});

// Main Query Analysis Schema
export const QueryAnalysisSchema = z.object({
  intent: IntentSchema,
  categories: z.array(CategorySchema),
  sentiment: SentimentSchema,
  temporal: TemporalSchema,
  parameters: ParametersSchema,
  missingFields: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  suggestedUIType: UITypeSchema,
  suggestedComponents: z.array(z.string())
});

// Export types
export type QueryAnalysisType = z.infer<typeof QueryAnalysisSchema>;
export type SentimentType = z.infer<typeof SentimentSchema>;
export type TemporalType = z.infer<typeof TemporalSchema>;
export type ParametersType = z.infer<typeof ParametersSchema>;
export type FiltersType = z.infer<typeof FiltersSchema>;
export type BestTimeType = z.infer<typeof BestTimeSchema>;

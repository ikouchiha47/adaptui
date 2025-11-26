// UI Generation Prompts - Centralized prompt templates

import { EnrichedPlace } from '../services/DataEnrichmentService';
import { QueryAnalysis } from '../services/QueryAnalysisService';
import { DeviceContext } from '../types/ui-schema';

/**
 * Helper to get categories as array (handles both old and new format)
 */
function getCategories(analysis: any): string[] {
  if (analysis.categories && Array.isArray(analysis.categories)) {
    return analysis.categories;
  }
  if (analysis.category) {
    return [analysis.category];
  }
  return ['general'];
}

/**
 * Build dynamic UI generation prompt
 */
export function buildDynamicUIPrompt(
  analysis: QueryAnalysis,
  data: EnrichedPlace[],
  context: DeviceContext,
  capabilities: any
): string {
  const emotionGuidance = getEmotionDesignGuidance(analysis.sentiment.emotion);
  
  return `You are AdaptUI. Generate a complete UI schema with intelligent layout decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Device: ${context.platform}, ${context.dimensions.width}x${context.dimensions.height}px
Intent: ${analysis.intent}
Categories: ${getCategories(analysis).join(', ')}
Emotion: ${analysis.sentiment.emotion} (${analysis.sentiment.intensity})
Vibe: ${analysis.sentiment.vibe.join(', ')}
Suggested Time: ${analysis.temporal.suggestedTimeOfDay}
Data: ${data.length} enriched places

Capabilities:
${Object.entries(capabilities.capabilities).map(([k, v]) => `- ${k}: ${v ? 'YES' : 'NO'}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a UI schema that:

1. LAYOUT DECISION:
   - Device width: ${context.dimensions.width}px
   - ${context.dimensions.width < 375 ? 'Single column, large touch targets (48px)' : context.dimensions.width < 768 ? 'Single column or 2-column grid' : '2-3 column grid'}
   - Use "stack" for sequential content, "grid" for multiple items

2. EMOTION DESIGN:
   - Emotion: ${analysis.sentiment.emotion}
   - ${emotionGuidance}

3. TIME BADGES:
   - Show suggested time: ${analysis.temporal.suggestedTimeOfDay}
   - Reason: ${analysis.temporal.timeReasoning}
   - Include time badges with icons

4. REAL-TIME DATA:
   - Each place has enrichment.timeRecommendation with badges
   - Show crowd level, weather, opening status
   - Use badge icons: 🤫 (quiet), 👥 (busy), ☀️ (weather), ✅ (open)

5. COMPONENTS:
   - Header with title and result count
   - Search input (if search intent)
   - Filter chips (if applicable)
   - Main content area with ${data.length} items
   - Each item shows: name, vibe, photo, time badge, real-time badges

Return complete UISchema with layout, components, theme, actions.`;
}

/**
 * Build hybrid UI generation prompt with full component registry
 */
export function buildHybridUIPrompt(
  componentDocs: string,
  analysis: QueryAnalysis,
  data: EnrichedPlace[],
  context: DeviceContext,
  capabilities: any
): string {
  // Extract actual data structure to show LLM what's available
  const dataSample = data[0] || {};
  const hasPhotos = data.some((d: any) => d.highlights?.some((h: any) => h.photoUrls?.length > 0));
  const hasTransport = data.some((d: any) => d.transportTickets?.length > 0);
  const hasCoordinates = data.some((d: any) => d.highlights?.some((h: any) => h.latitude && h.longitude));
  
  // Collect all available photo URLs
  const allPhotos = data.flatMap((d: any) => 
    d.highlights?.flatMap((h: any) => h.photoUrls || []) || []
  ).filter(Boolean);
  
  // Collect all transport tickets
  const allTransport = data.flatMap((d: any) => d.transportTickets || []);
  
  // Collect all coordinates
  const allCoordinates = data.flatMap((d: any) => 
    d.highlights?.filter((h: any) => h.latitude && h.longitude)
      .map((h: any) => ({ name: h.name, lat: h.latitude, lng: h.longitude })) || []
  );
  
  return `You are AdaptUI. Select and arrange pre-built components to create the UI.

${componentDocs}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Query Analysis:
- Intent: ${analysis.intent}
- Categories: ${getCategories(analysis).join(', ')}
- Emotion: ${analysis.sentiment.emotion} (${analysis.sentiment.intensity})
- Vibe: ${analysis.sentiment.vibe.join(', ')}
- Suggested Time: ${analysis.temporal.suggestedTimeOfDay}

Device:
- Platform: ${context.platform}
- Width: ${context.dimensions.width}px
- Height: ${context.dimensions.height}px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE DATA (Your "Tools" - like Crew AI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data Structure (${data.length} destinations):
${JSON.stringify(dataSample, null, 2).substring(0, 800)}

PHOTOS DATA:
- Total photos available: ${allPhotos.length}
- Sample URLs: ${allPhotos.slice(0, 3).join(', ')}
- Decision: ${hasPhotos ? '✅ USE photo-grid component' : '❌ DO NOT use photo-grid'}

TRANSPORT DATA:
- Transport tickets available: ${allTransport.length}
- Sample: ${JSON.stringify(allTransport[0], null, 2).substring(0, 200)}
- Decision: ${hasTransport ? '✅ USE transport-tickets component' : '❌ DO NOT use transport-tickets'}

MAP DATA:
- Locations with coordinates: ${allCoordinates.length}
- Sample: ${JSON.stringify(allCoordinates.slice(0, 2), null, 2)}
- Decision: ${hasCoordinates ? '✅ CAN use map component (if available)' : '❌ No coordinates for map'}

ENRICHMENT DATA (Real-time):
- Time recommendations: ${dataSample.enrichment?.timeRecommendation ? 'YES' : 'NO'}
- Weather data: ${dataSample.enrichment?.weather ? 'YES' : 'NO'}
- Crowd levels: ${dataSample.enrichment?.popularity ? 'YES' : 'NO'}

Capabilities:
${capabilities && capabilities.capabilities ? Object.entries(capabilities.capabilities).map(([k, v]) => `- ${k}: ${v ? 'YES' : 'NO'}`).join('\n') : '- No capabilities detected'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: DATA-DRIVEN UI COMPOSITION (Like Crew AI Agent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your job: Analyze the AVAILABLE DATA above and select components that match what's actually there.

DECISION TREE:
1. IF photos available (${allPhotos.length} photos) -> INCLUDE photo-grid section
2. IF transport tickets available (${allTransport.length} tickets) -> INCLUDE transport-tickets section
3. IF coordinates available (${allCoordinates.length} locations) -> CONSIDER map section
4. IF time recommendations exist -> INCLUDE badge-time
5. IF crowd data exists -> INCLUDE badge-crowd
6. IF weather data exists -> INCLUDE badge-weather
7. ALWAYS include list-travel with appropriate card type for category

REQUIRED OUTPUT STRUCTURE:
{
  "layout": "vertical",
  "sections": [
    {
      "id": "filters",
      "component": "filter-chips",
      "options": ["budget", "mid-range", "luxury"]
    },
    {
      "id": "results",
      "component": "list-travel",
      "itemComponent": "card-travel",
      "itemCount": ${data.length}
    }${hasTransport ? `,
    {
      "id": "transport",
      "component": "transport-tickets"
    }` : ''}
  ]
}

CRITICAL: Always use "card-travel" as itemComponent to show full destination cards with nested highlights (like the static UI).
CRITICAL: Always include filter-chips at the top for budget filtering.

CRITICAL RULES:
1. DO NOT create badge sections - badges are rendered INSIDE cards automatically
2. DO NOT create photo-grid section - photos are shown in each card automatically
3. DO NOT use stack-vertical or stack-horizontal as wrappers
4. ONLY use these exact component names: list-travel, transport-tickets, filter-chips
5. Each card in the list will automatically show:
   - Photo at the top (from photoUrl in data)
   - Time badge (from enrichment data)
   - Crowd badge (from enrichment data)
   - Weather badge (from enrichment data)
6. Keep it MINIMAL - just 1-2 sections maximum (list + optional transport)

CRITICAL RULES:
1. ONLY include components if the data supports them (check AVAILABLE DATA section above)
2. EVERY component referenced in "children" MUST be defined as its own section first
3. Only use component IDs from the registry: badge-time, badge-crowd, badge-weather, filter-chips, list-travel, card-restaurant, card-hotel, card-activity, photo-grid, transport-tickets, stack-horizontal, stack-vertical
4. Don't invent component IDs - they don't exist!
5. For categories "${getCategories(analysis).join(', ')}", use appropriate card variants:
   - dining → card-restaurant
   - accommodation → card-hotel
   - activities → card-activity
   - transport → card-transport
6. Match the emotion "${analysis.sentiment.emotion}" with appropriate layout density

Return ONLY the high-level structure JSON. No markdown, no explanations.`;
}

/**
 * Build query analysis prompt
 */
export function buildQueryAnalysisPrompt(query: string, userContext?: any): string {
  // Add timestamp to prevent caching issues
  const timestamp = new Date().toISOString();
  
  return `You are a travel query analyzer. Extract structured parameters from natural language.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY ANALYSIS [${timestamp}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User Query: "${query}"

${userContext ? `User Context:
- Location: ${userContext.location || 'Unknown'}
- Previous searches: ${userContext.history?.join(', ') || 'None'}
` : ''}

Extract the following:

1. INTENT: search | browse | compare | book | navigate | plan

2. CATEGORIES: Array of categories - dining | accommodation | activities | transport | shopping | entertainment
   (A query can match multiple categories, e.g., "romantic dinner and hotel" → ["dining", "accommodation"])

3. SENTIMENT & EMOTION:
   - emotion: romantic | fun | adventurous | relaxing | cultural | energetic | peaceful | luxurious
   - intensity: low | medium | high
   - vibe: Array of descriptors ["intimate", "lively", "quiet"]
   
   Examples:
   - "romantic restaurants" → emotion: romantic, intensity: high, vibe: ["intimate", "quiet", "candlelit"]
   - "fun bars" → emotion: fun, intensity: high, vibe: ["lively", "social", "energetic"]
   - "peaceful temples" → emotion: peaceful, intensity: high, vibe: ["serene", "quiet", "spiritual"]

4. TEMPORAL CONTEXT:
   - suggestedTimeOfDay: morning | afternoon | evening | night | late-night
   - timeReasoning: Why this time is recommended
   - duration: Expected duration in hours
   - bestTimes: Array of optimal time windows
   
   Time Recommendations:
   - romantic → evening (sunset, candlelight, ambiance)
   - fun/energetic → night (peak energy, social atmosphere)
   - peaceful/relaxing → morning (quiet, fewer crowds)
   - cultural → morning/afternoon (better light, less crowded)
   - family/kids → morning (kids energetic, less crowded)

5. PARAMETERS:
   - destination: Where they want to go
   - establishments: Types of places ["restaurant", "hotel", "museum"]
   - keywords: Descriptive terms ["romantic", "cheap", "rooftop"]
   - natureOfTravel: romantic | family | business | solo | adventure | luxury | budget
   - filters: priceRange, rating, cuisine, amenities, openNow
   - sortBy: rating | price | distance | popularity
   - limit: Number of results (default 10)

6. VALIDATION:
   - missingFields: Fields that would improve results
   - suggestedQuestions: Questions to ask user
   - confidence: 0-1 score

7. UI HINTS:
   - suggestedUIType: list | grid | map | comparison | detail
   - suggestedComponents: ["card-restaurant", "time-badge", "map-view"]

Return ONLY valid JSON matching this structure:
{
  "intent": "search",
  "categories": ["dining"],
  "sentiment": {
    "emotion": "romantic",
    "intensity": "high",
    "vibe": ["intimate", "quiet", "candlelit"]
  },
  "temporal": {
    "suggestedTimeOfDay": "evening",
    "timeReasoning": "Romantic dining is best enjoyed during sunset and evening hours",
    "duration": 2.5,
    "bestTimes": [
      {
        "time": "6:00 PM - 9:00 PM",
        "reason": "Perfect for sunset views and romantic ambiance",
        "suitability": 0.95
      }
    ]
  },
  "parameters": {
    "destination": "Bali",
    "establishments": ["restaurant"],
    "keywords": ["romantic", "intimate"],
    "natureOfTravel": "romantic",
    "filters": {
      "priceRange": null,
      "rating": 4.0,
      "openNow": false
    },
    "sortBy": "rating",
    "limit": 10
  },
  "missingFields": ["userLocation", "priceRange"],
  "suggestedQuestions": ["What's your budget per person?"],
  "confidence": 0.9,
  "suggestedUIType": "list",
  "suggestedComponents": ["card-restaurant", "time-badge", "filter-chips"]
}`;
}

/**
 * Get emotion-specific design guidance
 */
function getEmotionDesignGuidance(emotion: string): string {
  const guidance: Record<string, string> = {
    romantic: 'Use warm colors, elegant typography, intimate spacing',
    fun: 'Use vibrant colors, playful elements, energetic layout',
    peaceful: 'Use calm colors, spacious layout, minimal design',
    adventurous: 'Use bold colors, dynamic layout, exciting imagery',
    cultural: 'Use sophisticated colors, structured layout, informative design',
    luxurious: 'Use premium colors, elegant spacing, refined typography',
    relaxing: 'Use soft colors, comfortable spacing, gentle design',
    energetic: 'Use bright colors, compact layout, dynamic elements'
  };
  
  return guidance[emotion] || 'Use balanced colors and comfortable spacing';
}


/**
 * Build intent analysis prompt (for UIGenerator.analyzeQuery)
 */
export function buildIntentAnalysisPrompt(query: string, context: DeviceContext): string {
  return `Analyze this user query: "${query}"

Extract:
1. Intent: What does the user want to do? (search, view, create, update, navigate)
2. Category: travel, local, research, quick, entertainment, productivity
3. Data needed: What information to fetch?
4. UI type: list, form, detail, map, dashboard
5. Key filters: What filters/options to show?

Return valid JSON:
{
  "intent": "search|view|create|update|navigate",
  "category": "travel|local|research|quick|entertainment|productivity",
  "dataNeeded": ["item1", "item2"],
  "uiType": "list|form|detail|map|dashboard",
  "filters": ["filter1", "filter2"],
  "constraints": {}
}`;
}

/**
 * Build schema generation prompt (for UIGenerator.generateSchema)
 */
export function buildSchemaGenerationPrompt(
  query: string,
  analysis: any,
  context: DeviceContext,
  capabilities?: any,
  data?: any
): string {
  // Build capabilities description
  let capabilitiesDesc = 'Available capabilities:\n';
  if (capabilities?.capabilities) {
    const caps = capabilities.capabilities;
    capabilitiesDesc += `- Photos: ${caps.photos ? 'YES - can display photo grids and galleries' : 'NO'}\n`;
    capabilitiesDesc += `- Maps: ${caps.maps ? 'YES - can show interactive maps with markers' : 'NO'}\n`;
    capabilitiesDesc += `- Location: ${caps.location ? 'YES - user location available' : 'NO'}\n`;
    capabilitiesDesc += `- Transport: ${caps.transport ? 'YES - can show tickets and routes' : 'NO'}\n`;
  } else {
    capabilitiesDesc = 'No capability information provided. Use basic components only.';
  }

  // Build data description
  let dataDesc = '';
  if (data && Array.isArray(data)) {
    dataDesc = `\n\nData Structure (${data.length} items):
${JSON.stringify(data[0], null, 2).substring(0, 500)}...

Each item has:
- destination: string
- vibe: string
- highlights: array of {name, type, description, estimatedCost, photoUrls?, latitude?, longitude?}
- bestTime: string
- localTip: string
- transportTickets?: array
`;
  }

  return `You are AdaptUI, an expert UI designer for mobile apps.

User Query: "${query}"
Intent: ${analysis.intent}
UI Type: ${analysis.uiType}
Device: ${context.platform}, ${context.dimensions.width}x${context.dimensions.height}px

${capabilitiesDesc}${dataDesc}

Generate a complete UI schema following this structure:

{
  "id": "unique-schema-id",
  "version": "1.0",
  "uiType": "${analysis.uiType}",
  "title": "Screen Title",
  "theme": {
    "colors": {
      "primary": "#6366F1",
      "secondary": "#8B5CF6",
      "background": "#0F172A",
      "surface": "#1E293B",
      "text": "#F1F5F9",
      "textSecondary": "#94A3B8",
      "border": "#334155",
      "error": "#EF4444",
      "success": "#10B981",
      "warning": "#F59E0B"
    },
    "typography": {
      "heading": { "fontSize": 24, "fontWeight": "700", "lineHeight": 32 },
      "body": { "fontSize": 16, "fontWeight": "400", "lineHeight": 24 },
      "caption": { "fontSize": 14, "fontWeight": "400", "lineHeight": 20 }
    },
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
    "borderRadius": { "sm": 8, "md": 12, "lg": 16, "full": 9999 }
  },
  "layout": {
    "type": "stack",
    "config": { "flexDirection": "column", "spacing": { "padding": 16 } }
  },
  "components": [
    {
      "id": "component-id",
      "type": "text|input|button|card|list|chip-group|image",
      "props": {
        "text": "Content",
        "placeholder": "Enter text..."
      },
      "layout": {
        "width": "fill",
        "spacing": { "padding": 16, "margin": { "bottom": 12 } }
      },
      "style": {
        "backgroundColor": "#1E293B",
        "color": "#F1F5F9",
        "border": { "width": 1, "color": "#334155", "radius": 12 }
      },
      "interaction": {
        "onPress": "action-id",
        "hapticFeedback": "light"
      }
    }
  ],
  "actions": {
    "search": { "type": "search", "params": {} },
    "navigate": { "type": "navigate", "params": {} }
  }
}

Requirements:
1. Use modern, beautiful colors appropriate for ${getCategories(analysis).join(', ')}
2. Include relevant components for ${analysis.intent} intent
3. Add interactive elements (buttons, inputs) where needed
4. Make it responsive for ${context.dimensions.width}px width
5. Include proper spacing and layout
6. IMPORTANT: Keep component nesting to MAX 2 levels deep
7. IMPORTANT: Only use these component types: text, input, button, card, list, chip-group, image, stack
8. DO NOT use: icon, container, view, or any other types

Return ONLY valid JSON. No markdown, no explanations.`;
}

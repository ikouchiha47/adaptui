# Transport Plugin: Prompt Injection Flow

## Overview

This document explains how user location and transport capabilities are injected into LLM prompts to enable intelligent airport code extraction and transport option generation.

## Architecture Flow

```
User Query → Query Processing → Query Analysis → Transport Plugin
     ↓              ↓                  ↓               ↓
  "bars in      Context          Airport Codes    Flight/Bus/Train
   Bangkok"     Injection        Extraction       Options
```

## 1. Query Processing with Context Injection

### File: `src/services/QueryProcessingService.ts`

The QueryProcessingService receives user context and injects it into LLM prompts:

```typescript
interface QueryContext {
  userLocation?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  availableDataSources?: string[]; // ['google_places', 'airports_db', 'ddg_scraper']
  timestamp?: Date;
  domainInstructions?: string[]; // Domain-specific expansion hints
  enabledCapabilities?: string[]; // ['maps', 'location', 'camera']
  enabledPlugins?: Array<{ id: string; name: string; description: string }>;
}
```

### Context Formatting for LLM

The `formatContextForPrompt()` method builds a structured context string:

```typescript
private static formatContextForPrompt(context: QueryContext): string {
  const parts: string[] = [];

  if (context.userLocation) {
    parts.push(`User is currently in: ${city}, ${country}`);
    parts.push(`User coordinates: ${lat}, ${lng}`);
  }

  if (context.availableDataSources) {
    parts.push(`Available data sources: ${context.availableDataSources.join(', ')}`);
  }

  if (context.enabledPlugins) {
    parts.push(`\nActive plugins:`);
    context.enabledPlugins.forEach(plugin => {
      parts.push(`  - ${plugin.name}: ${plugin.description}`);
    });
  }

  if (context.domainInstructions) {
    parts.push(`\nIMPORTANT INSTRUCTIONS:`);
    context.domainInstructions.forEach((instruction, i) => {
      parts.push(`${i + 1}. ${instruction}`);
    });
  }

  return parts.join('\n');
}
```

### Example Context Injection

For query: **"fun bars in Bangkok"**

From user in: **Bangalore, India**

```
Context:
User is currently in: Bangalore, India
User coordinates: 12.9716, 77.5946
Available data sources: google_places, airports_db, ddg_scraper

Active plugins:
  - Transport: Provides flight, bus, train options and local transport

IMPORTANT INSTRUCTIONS:
1. If the query is about a destination different from user location, ALWAYS include transport/travel sub-queries
2. For international destinations, include airport codes and flight options in expansions
3. Use airports_db to find relevant airport codes for both origin and destination cities
```

## 2. Query Analysis with Airport Extraction

### File: `src/services/QueryAnalysisService.ts`

The QueryAnalysisService uses the enhanced query to extract structured parameters including multiple airport codes.

### Prompt Injection for Transport Capability

From `src/ui-engine/prompts.ts`:

```typescript
if (capabilities?.transport) {
  capabilityInstructions += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛫 TRANSPORT CAPABILITY ENABLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When extracting destination, provide MULTIPLE airport options:
- destinationAirports: Array of airport codes (up to 5), sorted by relevance
  
  Format: ["PRIMARY", "ALTERNATIVE1", "ALTERNATIVE2", ...]
  
  Examples:
  - Bangkok → ["BKK", "DMK"] (Suvarnabhumi is main, Don Mueang is alternative)
  - Tokyo → ["NRT", "HND"] (Narita for international, Haneda for domestic)
  - New York → ["JFK", "LGA", "EWR"] (JFK main, LaGuardia, Newark)
  - Singapore → ["SIN"] (only one major airport)
  - Bali → ["DPS"] (Ngurah Rai International)
  
  Sorting Priority:
  1. Main international airport first
  2. Distance from DESTINATION CITY CENTER (closest to where user wants to go)
  3. Size/capacity of airport
  4. Frequency of international flights
  
  The system will:
  - Research transport for top 3 airports
  - Display all 5 options in UI for user selection
  - Verify codes against 6,000+ airport database
`;
}
```

### Airport Code Grounding

After LLM extraction, codes are validated against the airport database:

```typescript
private async groundAirportCodes(llmCodes: string[], destination: string): Promise<string[]> {
  const { AirportDatabaseService } = await import('./AirportDatabaseService');
  const airportDB = new AirportDatabaseService();
  
  // Search for all airports near destination
  const destinationAirports = await airportDB.searchByCity(destination);
  const validCodes = destinationAirports.map(a => a.iata.toUpperCase());
  
  // Validate and filter LLM codes
  const groundedCodes: string[] = [];
  const invalidCodes: string[] = [];
  
  for (const code of llmCodes) {
    const upperCode = code.toUpperCase();
    if (validCodes.includes(upperCode)) {
      groundedCodes.push(upperCode);
    } else {
      invalidCodes.push(code);
    }
  }
  
  // If LLM provided no valid codes, use database results
  if (groundedCodes.length === 0) {
    return validCodes.slice(0, 5); // Top 5 from database
  }
  
  // Add missing airports from database if LLM didn't provide enough
  const missingCodes = validCodes.filter(code => !groundedCodes.includes(code));
  return [...groundedCodes, ...missingCodes].slice(0, 5);
}
```

## 3. Search Context Storage

### File: `src/services/SearchContext.ts`

The analyzed query with airport codes is stored in shared context:

```typescript
interface SearchContextData {
  query: string;
  analysis: any;
  results: any[];
  destination: string;
  destinationAirportCode?: string; // Legacy: single code
  destinationAirports?: string[]; // New: multiple codes
  selectedAirport?: string; // User-selected airport from UI
  centerLocation: { lat: number; lng: number };
  userLocation?: { latitude: number; longitude: number };
  timestamp: number;
}
```

Example stored context:

```javascript
{
  query: "fun bars in Bangkok",
  destination: "Bangkok",
  destinationAirports: ["BKK", "DMK"], // Grounded codes
  userLocation: {
    latitude: 12.9716,
    longitude: 77.5946
  },
  analysis: {
    intent: "search",
    categories: ["entertainment"],
    parameters: {
      destinationAirports: ["BKK", "DMK"]
    }
  }
}
```

## 4. Transport Plugin Consumption

### File: `src/plugins/TransportPlugin.tsx`

The Transport Plugin reads the shared context and uses the airport codes:

```typescript
setDataProvider({
  fetch: async (params) => {
    // Get data from shared search context
    const { searchContext } = await import('../services/SearchContext');
    const context = searchContext.getContext();

    if (!context) {
      throw new Error('No search results available');
    }

    console.log('✈️ [TransportPlugin] Researching Transport');
    console.log('From:', context.userLocation);
    console.log('To:', context.destination);
    console.log('Airports:', context.destinationAirports);

    // Get nearest airport from user location
    const fromAirport = await agent.getNearestAirport(
      context.userLocation.latitude,
      context.userLocation.longitude
    );
    
    // Get destination airports - prefer LLM-provided list
    let destinationAirports: string[] = [];
    
    if (context.destinationAirports && context.destinationAirports.length > 0) {
      // LLM provided multiple airports
      destinationAirports = context.destinationAirports.slice(0, 5);
      console.log('[TransportPlugin] Using LLM-provided airports:', destinationAirports);
    } else if (context.destinationAirportCode) {
      // Legacy: single airport code
      destinationAirports = [context.destinationAirportCode];
    } else {
      // Fallback: database lookup
      const toAirport = await agent.getDestinationCode(context.destination);
      if (toAirport && toAirport !== 'XXX') {
        destinationAirports = [toAirport];
      }
    }
    
    // If user selected a specific airport, prioritize it
    if (context.selectedAirport && destinationAirports.includes(context.selectedAirport)) {
      destinationAirports = [
        context.selectedAirport,
        ...destinationAirports.filter(code => code !== context.selectedAirport)
      ];
    }
    
    // Research top 3 airports in parallel
    const airportsToResearch = destinationAirports.slice(0, 3);
    const allResearchPromises = airportsToResearch.flatMap(toAirport => [
      agent.research(
        `flights from ${fromAirport} to ${toAirport}`,
        { from: fromAirport, to: toAirport, transportType: 'flight' }
      ),
      agent.research(
        `buses from ${fromAirport} to ${context.destination}`,
        { from: fromAirport, to: context.destination, transportType: 'bus' }
      ),
      agent.research(
        `trains from ${fromAirport} to ${context.destination}`,
        { from: fromAirport, to: context.destination, transportType: 'train' }
      )
    ]);
    
    const allResults = await Promise.all(allResearchPromises);
    
    // Process results and return transport options
    return {
      longDistance: [...], // Flight/bus/train options
      local: [...] // Grab/Uber options
    };
  }
})
```

## 5. Complete Example Flow

### Input

```
Query: "fun bars in Bangkok"
User Location: Bangalore, India (12.9716, 77.5946)
Enabled Plugins: ['transport', 'neighborhood']
```

### Step 1: Query Processing

```typescript
const context = {
  userLocation: {
    city: 'Bangalore',
    country: 'India',
    coordinates: { lat: 12.9716, lng: 77.5946 }
  },
  availableDataSources: ['google_places', 'airports_db', 'ddg_scraper'],
  domainInstructions: [
    'If the query is about a destination different from user location, ALWAYS include transport/travel sub-queries',
    'For international destinations, include airport codes and flight options in expansions',
    'Use airports_db to find relevant airport codes for both origin and destination cities',
  ]
};

const processed = await QueryProcessingService.processQuery(query, llm, context);
```

**Output:**
```javascript
{
  original: "fun bars in Bangkok",
  enhancedQuery: "fun bars in Bangkok | nightlife venues in Bangkok | entertainment spots in Bangkok",
  contextInjected: "fun bars in Bangkok | nightlife venues in Bangkok [USER_LOCATION: Bangalore, India] [USER_COORDS: 12.9716, 77.5946] [DATA_SOURCES: google_places, airports_db, ddg_scraper]"
}
```

### Step 2: Query Analysis with Airport Extraction

```typescript
const analysis = await QueryAnalysisService.analyzeQuery(
  processed.contextInjected,
  userContext,
  { transport: true, neighborhood: true }
);
```

**LLM Prompt (excerpt):**
```
You are a travel query analyzer. Extract structured parameters from natural language.

Query: "fun bars in Bangkok | nightlife venues in Bangkok [USER_LOCATION: Bangalore, India] [USER_COORDS: 12.9716, 77.5946]"

Context:
User is currently in: Bangalore, India
User coordinates: 12.9716, 77.5946
Available data sources: google_places, airports_db, ddg_scraper

🛫 TRANSPORT CAPABILITY ENABLED
When extracting destination, provide MULTIPLE airport options:
- destinationAirports: Array of airport codes (up to 5), sorted by relevance
  
  Examples:
  - Bangkok → ["BKK", "DMK"] (Suvarnabhumi is main, Don Mueang is alternative)
```

**LLM Output:**
```json
{
  "intent": "search",
  "categories": ["entertainment"],
  "parameters": {
    "destination": "Bangkok",
    "destinationAirports": ["BKK", "DMK"],
    "establishments": ["bar", "nightclub", "pub"],
    "keywords": ["fun", "nightlife", "entertainment"]
  }
}
```

**After Grounding:**
```javascript
// Validates against airport database
groundedCodes = ["BKK", "DMK"] // ✅ Both valid
```

### Step 3: Store in Search Context

```typescript
searchContext.setContext({
  query: "fun bars in Bangkok",
  destination: "Bangkok",
  destinationAirports: ["BKK", "DMK"],
  userLocation: {
    latitude: 12.9716,
    longitude: 77.5946
  },
  analysis: analysis,
  results: places
});
```

### Step 4: Transport Plugin Fetches Data

```typescript
// Plugin reads from shared context
const context = searchContext.getContext();

// Get user's nearest airport
const fromAirport = await agent.getNearestAirport(12.9716, 77.5946);
// Returns: "BLR" (Bangalore Kempegowda International)

// Use LLM-provided airports
const destinationAirports = context.destinationAirports; // ["BKK", "DMK"]

// Research transport for top 3 airports
const airportsToResearch = destinationAirports.slice(0, 3); // ["BKK", "DMK"]

// Parallel research
const results = await Promise.all([
  agent.research('flights from BLR to BKK', {...}),
  agent.research('flights from BLR to DMK', {...}),
  agent.research('buses from BLR to Bangkok', {...}),
  agent.research('trains from BLR to Bangkok', {...})
]);
```

### Step 5: Display Transport Options

```typescript
{
  longDistance: [
    {
      type: 'flight',
      provider: 'Skyscanner',
      from: 'BLR',
      to: 'BKK (Bangkok)',
      deepLink: 'https://skyscanner.com/...'
    },
    {
      type: 'flight',
      provider: 'Kayak',
      from: 'BLR',
      to: 'DMK (Bangkok)',
      deepLink: 'https://kayak.com/...'
    }
  ],
  local: [
    {
      type: 'local',
      provider: 'Grab',
      description: 'Ride-hailing app available in Bangkok'
    }
  ]
}
```

## Key Benefits

1. **Context-Aware**: LLM knows user location and can suggest appropriate transport
2. **Multi-Airport Support**: Provides multiple airport options sorted by relevance
3. **Grounded Codes**: Validates LLM output against 6,000+ airport database
4. **Parallel Research**: Researches multiple airports simultaneously for speed
5. **User Selection**: Allows users to select preferred airport from UI
6. **Fallback Handling**: Gracefully handles missing or invalid codes

## Testing

Run the test script to see the full flow:

```bash
npx ts-node scripts/test-query-processing.ts
```

Example test case:

```typescript
{
  query: 'fun bars in Bangkok',
  context: {
    userLocation: {
      city: 'Bangalore',
      country: 'India',
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    availableDataSources: ['google_places', 'airports_db', 'ddg_scraper'],
    domainInstructions: [
      'If the query is about a destination different from user location, ALWAYS include transport/travel sub-queries',
      'For international destinations, include airport codes and flight options in expansions',
      'Use airports_db to find relevant airport codes for both origin and destination cities',
    ]
  }
}
```

## Related Files

- `src/services/QueryProcessingService.ts` - Context injection and query enhancement
- `src/services/QueryAnalysisService.ts` - Airport code extraction and grounding
- `src/ui-engine/prompts.ts` - LLM prompt templates with capability instructions
- `src/services/SearchContext.ts` - Shared context storage
- `src/plugins/TransportPlugin.tsx` - Transport option generation
- `src/services/TransportResearchAgent.ts` - Transport research logic
- `src/services/AirportDatabaseService.ts` - Airport code validation
- `scripts/test-query-processing.ts` - End-to-end testing

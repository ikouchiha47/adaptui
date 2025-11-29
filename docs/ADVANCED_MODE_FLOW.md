# Advanced Mode Data Flow

## Complete Pipeline: Query → UI

This document shows how the 20-30 places from advanced mode flow through the entire pipeline.

## Flow Diagram

```
User Query: "fun activities in Bangkok"
    ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: QUERY PROCESSING (advancedMode: true)             │
└─────────────────────────────────────────────────────────────┘
    ↓
QueryProcessingService.processQuery()
    ├─ Expansion: ["entertainment venues", "recreational activities", 
    │              "leisure spots", "interactive experiences", "amusement parks"]
    ├─ Decomposition: ["find venues", "check ratings", "filter by budget"]
    └─ Step-back: "What makes activities fun?" → ["social", "novel", "exciting"]
    ↓
QueryProcessingService.executeExpandedPlaceSearches()
    ├─ Parallel Search 1: "entertainment venues" → 5 places
    ├─ Parallel Search 2: "recreational activities" → 5 places
    ├─ Parallel Search 3: "leisure spots" → 5 places
    ├─ Parallel Search 4: "interactive experiences" → 5 places
    └─ Parallel Search 5: "amusement parks" → 5 places
    ↓
QueryProcessingService.deduplicatePlaces()
    ↓
25 unique places with:
    - placeId
    - name
    - generativeSummary (Gemini-powered)
    - areaSummary
    - foundBy (which search term found it)
    ↓
TravelService.generateAdvancedRecommendations()
    ↓
Convert to TravelRecommendation format:
    {
      destination: "Bangkok",
      vibe: "fun activities",
      highlights: [
        {
          name: "Blueprint Livehouse",
          type: "hidden-gem",
          description: "Live music venue...",
          rating: 4.5,
          latitude: 13.756,
          longitude: 100.501
        },
        // ... 24 more places
      ],
      dataSource: "hybrid"
    }
    ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: DATA ENRICHMENT                                    │
└─────────────────────────────────────────────────────────────┘
    ↓
DataEnrichmentService.enrichPlaces()
    ├─ Add real-time data (weather, events)
    ├─ Validate coordinates
    └─ Add crowd intelligence
    ↓
Enriched places (25 places with full data)
    ↓
SearchContext.setContext()
    - Stores all 25 places
    - Available to plugins
    - Used for map markers
    - Used for filtering/ranking
    ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: UI GENERATION                                      │
└─────────────────────────────────────────────────────────────┘
    ↓
UIGenerationService.generateUI()
    ↓
Creates UI schema with:
    - Results tab: Shows all 25 places
    - Map tab: Plots 25 markers
    - Plugin tabs: Access same 25 places
    ↓
ComponentRenderer.render()
    ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: USER SEES RESULTS                                  │
└─────────────────────────────────────────────────────────────┘
    ↓
Results Tab:
    ✓ Blueprint Livehouse (entertainment venues)
    ✓ Galaxy Gaming (recreational activities)
    ✓ Jamadin Bridge (leisure spots)
    ✓ AMAZE ME (interactive experiences)
    ✓ WOW Park (amusement parks)
    ... 20 more places
    ↓
Map Tab:
    [Shows 25 markers on map]
    ↓
Plugin Tabs:
    - Neighborhood: Uses same 25 places
    - Transport: Calculates routes to places
    - Weather: Shows weather for place locations
```

## Key Data Transformations

### 1. PlacesInsights → TravelHighlight

```typescript
// From PlacesInsightsService
{
  placeId: "places/ChIJ...",
  name: "Blueprint Livehouse",
  generativeSummary: {
    overview: "Live music venue with indie bands",
    description: "Popular spot for local and international acts..."
  },
  foundBy: "entertainment venues"
}

// Transformed to TravelHighlight
{
  name: "Blueprint Livehouse",
  type: "hidden-gem",
  description: "Live music venue with indie bands",
  rating: 4.5,
  latitude: 13.756,
  longitude: 100.501,
  photoUrl: "https://...",
  rankingScore: { ... }
}
```

### 2. TravelHighlight → UI Component

```typescript
// TravelHighlight
{
  name: "Blueprint Livehouse",
  type: "hidden-gem",
  description: "Live music venue...",
  ...
}

// Rendered as
<PlaceCard
  title="Blueprint Livehouse"
  badge="Hidden Gem"
  description="Live music venue..."
  image={photoUrl}
  onPress={() => openDetails()}
/>
```

## How Plugins Access the Data

All plugins can access the 25 places through SearchContext:

```typescript
// In any plugin
const { searchContext } = await import('../services/SearchContext');
const context = searchContext.getContext();

// Access all 25 places
const allPlaces = context.results; // TravelRecommendation[]
const highlights = allPlaces.flatMap(r => r.highlights); // 25 places

// Filter by type
const hiddenGems = highlights.filter(h => h.type === 'hidden-gem');

// Get center location
const center = context.centerLocation; // { lat, lng }

// Get user location
const userLoc = context.userLocation;
```

## Performance Metrics

### Standard Mode
```
Query → LLM (2s) → Sequential API (3s) → Enrichment (1s) → UI (1s)
Total: ~7 seconds
Places: 9-15
```

### Advanced Mode
```
Query → LLM Parallel (1s) → Parallel API (2s) → Enrichment (1s) → UI (1s)
Total: ~5 seconds
Places: 20-30
```

## Caching

Results are cached at multiple levels:

1. **TravelService Cache**: Full recommendations cached by query
2. **SearchContext**: Current search results in memory
3. **PlacesInsights Cache**: Individual place data cached
4. **Plugin Caches**: Plugin-specific data cached

Cache key format:
```typescript
`${location}_${feeling}_${budget}_advanced`
// Example: "Bangkok_fun activities_mid_advanced"
```

## Error Handling

If advanced mode fails at any step:

```typescript
try {
  return await generateAdvancedRecommendations(query);
} catch (error) {
  console.error('Advanced mode failed:', error);
  // Automatic fallback to standard hybrid mode
  return await generateHybridRecommendations(query);
}
```

User sees results either way - they just might be fewer places if fallback occurs.

## Debugging

To trace the flow:

1. **Check TravelService logs**:
   ```
   🚀 [TravelService] Using advanced query processing mode
   ✅ [TravelService] Found 25 unique places via advanced search
   ```

2. **Check QueryProcessing logs**:
   ```
   🔍 [QueryProcessing] Starting advanced query processing...
   🚀 [TaskExecutor] Parallel search for 5 terms...
   ✅ [TaskExecutor] Completed 5 parallel searches
   ```

3. **Check SearchContext**:
   ```typescript
   const context = searchContext.getContext();
   console.log('Places in context:', context.results.length);
   ```

4. **Check UI rendering**:
   ```
   📱 [ComponentRenderer] Rendering 25 places
   🗺️ [MapTab] Plotting 25 markers
   ```

## Summary

The 20-30 places from advanced mode:

1. ✅ **Generated** by parallel searches with query expansion
2. ✅ **Stored** in TravelRecommendation format
3. ✅ **Enriched** with real-time data
4. ✅ **Cached** in SearchContext
5. ✅ **Rendered** in Results/Map/Plugin tabs
6. ✅ **Accessible** to all plugins

Everything downstream (enrichment, UI generation, plugins) works exactly the same - they just get more and better places to work with!

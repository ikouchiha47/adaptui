# Query Expansion & Parallel Places Search

## Overview

The query processing system now integrates with PlacesInsightsService to perform **fast parallel nearby searches** based on query expansion and step-back reasoning.

## How It Works

### 1. Query Expansion
When a user searches for "fun activities in Bangkok", the system:
- **Expands** the query into related terms: ["entertainment venues", "recreational activities", "leisure spots", "interactive experiences"]
- **Step-back reasoning**: "What makes activities fun?" → ["social interaction", "novelty", "excitement"]
- **Related concepts**: ["amusement parks", "entertainment districts", "nightlife"]

### 2. Parallel Place Searches
All expanded terms are searched **in parallel** using PlacesInsightsService:
```typescript
const results = await TaskExecutor.executeParallelPlaceSearches(
  ['entertainment venues', 'recreational activities', 'leisure spots'],
  'Bangkok, Thailand'
);
```

### 3. Deduplication
Results are deduplicated by `placeId`, tracking which search term found each place:
```typescript
const uniquePlaces = QueryProcessingService.deduplicatePlaces(results);
// Each place has a `foundBy` field showing the search term that discovered it
```

## Architecture

### Services

**QueryProcessingService**
- `processQuery()` - Full pipeline: expansion + decomposition + step-back
- `executeExpandedPlaceSearches()` - Execute parallel searches for all expanded terms
- `deduplicatePlaces()` - Remove duplicates by place ID

**TaskExecutor**
- `executeParallelPlaceSearches()` - Execute multiple place searches in parallel
- `findPlaces()` - Single place search using PlacesInsightsService

**PlacesInsightsService**
- `getGenerativeSummary()` - Search with Gemini-powered summaries
- Uses Places API v1 with `searchText` endpoint

### Flow

```
User Query: "fun activities in Bangkok"
    ↓
QueryProcessingService.processQuery()
    ├─ Expansion: ["entertainment venues", "recreational activities", ...]
    ├─ Decomposition: ["find venues", "check ratings", ...]
    └─ Step-back: "What makes activities fun?"
    ↓
QueryProcessingService.executeExpandedPlaceSearches()
    ↓
TaskExecutor.executeParallelPlaceSearches()
    ├─ Search "entertainment venues" → 5 places
    ├─ Search "recreational activities" → 5 places
    ├─ Search "leisure spots" → 5 places
    └─ Search "interactive experiences" → 5 places
    ↓
QueryProcessingService.deduplicatePlaces()
    ↓
25 unique places with rich Gemini summaries
```

## Example Results

### Input
```typescript
Query: "peaceful temples in Chiang Mai"
Location: "Chiang Mai, Thailand"
```

### Expanded Terms
- "quiet temples"
- "serene locations"
- "peaceful gardens"
- "meditation centers"
- "tranquil spots"

### Output
```
17 unique places found:
1. Wat Chedi Luang (found by: "quiet temples")
2. Wat Phantao (found by: "quiet temples")
3. Serene Backyard Cafe (found by: "serene locations")
4. 347 Happy life meditation retreat (found by: "meditation centers")
...
```

## Benefits

1. **Richer Results**: Finds places that match the *intent* not just the literal query
2. **Fast**: All searches run in parallel (5 searches complete in ~2 seconds)
3. **Context-Aware**: Uses Gemini summaries to understand place characteristics
4. **Zero Waste**: Deduplication ensures no redundant results
5. **Traceable**: Each place knows which search term found it

## Integration Points

### With TravelService

**Option 1: Enable Advanced Mode (Recommended)**
```typescript
const service = new TravelService();
const recommendations = await service.generateRecommendations({
  location: 'Bangkok',
  feeling: 'fun activities',
  budget: 'mid',
  advancedMode: true, // ← Enable query expansion + parallel search
});
```

**Option 2: Direct Integration**
```typescript
// TravelService can use expanded searches for better results
const processed = await QueryProcessingService.processQuery(query, llm);
const places = await QueryProcessingService.executeExpandedPlaceSearches(
  processed,
  location
);
```

### With SearchContext
```typescript
// Store results for reuse
searchContext.setTaskResult('expanded_places', {
  data: uniquePlaces,
  source: 'places_insights',
  timestamp: new Date()
});
```

### With QueryRouter
```typescript
// Route place queries to TaskExecutor
if (query.includes('find') || query.includes('search for')) {
  return 'task:places';
}
```

## Testing

Run the test script:
```bash
npx tsx scripts/test-parallel-places.ts
```

This tests:
- Parallel searches for multiple expanded terms
- Geocoding location names to coordinates
- Deduplication by place ID
- Result aggregation

## Future Enhancements

1. **Crowd Intelligence**: Use area insights to filter by crowd level
2. **Smart Ranking**: Rank results by relevance to original query intent
3. **Caching**: Cache expanded search results in SearchContext
4. **Adaptive Expansion**: Learn which expansions work best for different query types
5. **Multi-Location**: Support searching multiple locations in parallel

## Notes

- Currently limited to 10 parallel searches to avoid API rate limits
- Uses PlacesInsightsService (Places API v1) for Gemini summaries
- Geocoding is cached by GooglePlacesClient
- Each search returns up to 5 places (configurable)

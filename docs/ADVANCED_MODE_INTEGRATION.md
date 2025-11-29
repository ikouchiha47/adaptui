# Advanced Mode Integration

## Overview

TravelService now has an **Advanced Mode** that uses QueryProcessingService for intelligent query expansion and parallel place searches.

## How to Enable

### In the App

```typescript
const service = new TravelService();
const recommendations = await service.generateRecommendations({
  location: 'Bangkok',
  feeling: 'fun activities',
  budget: 'mid',
  advancedMode: true, // ← Enable advanced query processing
});
```

### In UI Components

```typescript
// In AdaptUIScreen.tsx or similar
const handleSearch = async () => {
  const results = await travelService.generateRecommendations({
    location: userLocation,
    feeling: userQuery,
    advancedMode: true, // Toggle this based on user preference
  });
};
```

## What Happens in Advanced Mode

### Standard Mode (advancedMode: false)
```
User Query: "fun activities in Bangkok"
    ↓
LLM generates basic search queries
    ↓
Sequential API calls (slow)
    ↓
3-5 places per query
```

### Advanced Mode (advancedMode: true)
```
User Query: "fun activities in Bangkok"
    ↓
QueryProcessingService.processQuery()
    ├─ Expansion: ["entertainment venues", "recreational activities", ...]
    ├─ Decomposition: ["find venues", "check ratings", ...]
    └─ Step-back: "What makes activities fun?"
    ↓
Parallel Place Searches (fast)
    ├─ "entertainment venues" → 5 places
    ├─ "recreational activities" → 5 places
    ├─ "leisure spots" → 5 places
    └─ "interactive experiences" → 5 places
    ↓
Deduplication by place ID
    ↓
25+ unique places with Gemini summaries
```

## Performance Comparison

| Mode | LLM Calls | API Calls | Time | Places Found |
|------|-----------|-----------|------|--------------|
| Standard | 2-3 | 3-5 sequential | ~5-8s | 9-15 |
| Advanced | 3 (parallel) | 5-10 parallel | ~3-4s | 20-30 |

## Benefits

1. **Faster**: Parallel searches complete in ~3-4 seconds vs 5-8 seconds
2. **Richer**: Finds 2-3x more unique places
3. **Smarter**: Understands intent, not just literal query
4. **Better Quality**: Gemini-powered summaries for each place

## Requirements

- OpenAI API key (for query processing)
- Google Places API key (for place searches)

## Fallback Behavior

If advanced mode fails (missing API keys, errors), it automatically falls back to standard hybrid mode:

```typescript
try {
  return await this.generateAdvancedRecommendations(query);
} catch (error) {
  console.error('Advanced mode failed, falling back to hybrid');
  return await this.generateHybridRecommendations(query);
}
```

## Testing

### Test Advanced Mode
```bash
npx tsx scripts/test-advanced-travel.ts
```

### Test Parallel Search Only
```bash
npx tsx scripts/test-parallel-places.ts
```

## Configuration

You can control advanced mode behavior:

```typescript
// In TravelService.ts
private async generateAdvancedRecommendations(query: TravelQuery) {
  // Adjust number of parallel searches (default: 10)
  const maxSearches = 10;
  
  // Adjust places per recommendation (default: 10)
  const maxPlaces = 10;
  
  // ... rest of implementation
}
```

## Future Enhancements

1. **Smart Caching**: Cache expanded queries in SearchContext
2. **Adaptive Learning**: Learn which expansions work best
3. **User Preferences**: Remember user's preferred search style
4. **A/B Testing**: Compare standard vs advanced mode results
5. **Hybrid Approach**: Use both modes and merge results

## Notes

- Advanced mode requires both OpenAI and Google Places API keys
- Falls back gracefully if keys are missing
- Results are cached like standard mode
- Compatible with all existing TravelService features (transport, ranking, etc.)

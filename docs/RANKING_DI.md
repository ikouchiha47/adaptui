# Ranking with Dependency Injection

## Overview

Place ranking is now properly separated from deduplication and uses **Dependency Injection** for pluggable ranking strategies.

## Architecture

```
QueryProcessingService.deduplicatePlaces()  ← Pure deduplication
            ↓
    Unique places (unranked)
            ↓
    PlaceRanker.rank()  ← Pluggable ranking (DI)
            ↓
    Ranked places
```

## Interface

```typescript
interface PlaceRanker {
  rank(places: any[], context: RankingContext): any[];
}

interface RankingContext {
  originalQuery?: string;
  userLocation?: { lat: number; lng: number };
  userPreferences?: Record<string, any>;
  timestamp?: Date;
}
```

## Built-in Rankers

### 1. SimpleKeywordRanker

Ranks by keyword overlap with original query.

```typescript
import { SimpleKeywordRanker } from './ranking/PlaceRanker';

const ranker = new SimpleKeywordRanker();
const ranked = ranker.rank(places, {
  originalQuery: 'fun activities in Bangkok'
});
```

**Scoring**:
- 10 points: Term in `foundBy` matches query
- 5 points: Term in place name matches query
- 0-5 points: Place rating
- +2 points: Has generative summary
- +1 point: Has photos

### 2. DistanceRanker

Ranks by proximity to user location.

```typescript
import { DistanceRanker } from './ranking/PlaceRanker';

const ranker = new DistanceRanker();
const ranked = ranker.rank(places, {
  userLocation: { lat: 13.756, lng: 100.501 }
});
```

### 3. HybridRanker

Combines multiple strategies with configurable weights.

```typescript
import { HybridRanker } from './ranking/PlaceRanker';

const ranker = new HybridRanker(
  0.6, // keyword weight
  0.2, // distance weight
  0.2  // rating weight
);

const ranked = ranker.rank(places, {
  originalQuery: 'fun activities',
  userLocation: { lat: 13.756, lng: 100.501 }
});
```

## Usage in TravelService

```typescript
// Step 1: Deduplicate (pure function)
const uniquePlaces = QueryProcessingService.deduplicatePlaces(expandedPlaces);

// Step 2: Rank using DI (pluggable)
const { SimpleKeywordRanker } = await import('./ranking/PlaceRanker');
const ranker = new SimpleKeywordRanker();
const rankedPlaces = ranker.rank(uniquePlaces, {
  originalQuery: 'fun activities in Bangkok',
  timestamp: new Date(),
});
```

## Custom Ranker

Create your own ranker by implementing the interface:

```typescript
import { PlaceRanker, RankingContext } from './ranking/PlaceRanker';

class MLRanker implements PlaceRanker {
  constructor(private model: any) {}

  rank(places: any[], context: RankingContext): any[] {
    // Use ML model to predict relevance
    const predictions = this.model.predict(places, context);
    
    return places.sort((a, b) => {
      const scoreA = predictions.get(a.placeId);
      const scoreB = predictions.get(b.placeId);
      return scoreB - scoreA;
    });
  }
}

// Use it
const ranker = new MLRanker(myModel);
const ranked = ranker.rank(places, context);
```

## Dependency Injection Benefits

### 1. **Testability**
```typescript
// Easy to test with mock ranker
class MockRanker implements PlaceRanker {
  rank(places: any[]) {
    return places.reverse(); // Simple test behavior
  }
}

const ranker = new MockRanker();
const result = service.rankPlaces(places, ranker);
```

### 2. **Flexibility**
```typescript
// Switch rankers at runtime
const ranker = userPreferences.useDistance
  ? new DistanceRanker()
  : new SimpleKeywordRanker();

const ranked = ranker.rank(places, context);
```

### 3. **Composability**
```typescript
// Chain multiple rankers
const keywordRanked = keywordRanker.rank(places, context);
const finalRanked = distanceRanker.rank(keywordRanked, context);
```

## Configuration

### TravelService

Change the ranker in `generateAdvancedRecommendations()`:

```typescript
// Option 1: Simple keyword ranking (default)
const ranker = new SimpleKeywordRanker();

// Option 2: Distance-based ranking
const ranker = new DistanceRanker();

// Option 3: Hybrid ranking
const ranker = new HybridRanker(0.6, 0.2, 0.2);

// Option 4: Custom ranker
const ranker = new MyCustomRanker();
```

### Per-User Preferences

```typescript
const getRanker = (userPrefs: any): PlaceRanker => {
  if (userPrefs.rankBy === 'distance') {
    return new DistanceRanker();
  }
  if (userPrefs.rankBy === 'hybrid') {
    return new HybridRanker(
      userPrefs.keywordWeight || 0.6,
      userPrefs.distanceWeight || 0.2,
      userPrefs.ratingWeight || 0.2
    );
  }
  return new SimpleKeywordRanker(); // default
};

const ranker = getRanker(userPreferences);
const ranked = ranker.rank(places, context);
```

## Testing

```bash
# Test with different rankers
npx tsx scripts/test-parallel-places.ts
```

Look for:
```
🎯 Unique places after deduplication: 25
📊 Ranked by relevance to: "entertainment venues"

📍 Top 10 Places (Ranked by Relevance):
1. Blueprint Livehouse (score: 25)
2. Galaxy Gaming (score: 22)
...
```

## Performance

| Ranker | Time | Use Case |
|--------|------|----------|
| SimpleKeywordRanker | ~1ms | General queries |
| DistanceRanker | ~2ms | Location-based |
| HybridRanker | ~3ms | Best overall |
| Custom ML | ~10-50ms | Personalized |

## Future Enhancements

1. **LLM-based ranker**: Use LLM to judge relevance
2. **Learning ranker**: Learn from user clicks
3. **Time-aware ranker**: Boost places open now
4. **Popularity ranker**: Boost trending places
5. **Personalized ranker**: Based on user history

## Summary

✅ **Clean separation**: Deduplication ≠ Ranking  
✅ **Dependency Injection**: Pluggable rankers  
✅ **Multiple strategies**: Keyword, Distance, Hybrid  
✅ **Easy to extend**: Implement `PlaceRanker` interface  
✅ **Testable**: Mock rankers for testing  
✅ **Configurable**: Switch rankers at runtime  

No more confusion about what `deduplicatePlaces()` does - it just deduplicates!

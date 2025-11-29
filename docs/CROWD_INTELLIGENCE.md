# Crowd Intelligence System

## Overview

A comprehensive multi-source crowd intelligence system that combines real-time data, LLM inference, and heuristics to provide accurate crowd level predictions with place context.

## Architecture

### Data Sources (Parallel Fetching)

1. **Google Places Insights** (35% weight)
   - Area-level aggregate data
   - Place density analysis
   - Cached for 7 days

2. **DuckDuckGo Scraper** (25% weight)
   - Real-time web mentions
   - Social media sentiment
   - Recent reviews and discussions

3. **LLM Inference** (25% weight)
   - Semantic understanding
   - Pattern recognition
   - Context-aware predictions

4. **Heuristic Rules** (15% weight)
   - Time-based patterns
   - Day of week analysis
   - Place type specific rules

### Place Data (Parallel Fetching)

- **Place Summaries**: Name, description, rating, review count
- **Opening Hours**: Current status, weekly schedule
- **Photos**: Place imagery (future enhancement)

## Database Optimization

### SQLite with WAL Mode

```sql
PRAGMA journal_mode = WAL;           -- Write-Ahead Logging for concurrency
PRAGMA synchronous = NORMAL;         -- Balance safety and performance
PRAGMA cache_size = -64000;          -- 64MB cache
PRAGMA temp_store = MEMORY;          -- In-memory temp tables
PRAGMA mmap_size = 30000000000;      -- Memory-mapped I/O
PRAGMA page_size = 4096;             -- Optimal page size
```

### Cache Tables

1. **cache**: General key-value cache with TTL
2. **place_summaries**: Place metadata (7-day TTL)
3. **opening_hours**: Opening hours data (24-hour TTL)

### Indexes

- `idx_namespace`: Fast namespace lookups
- `idx_timestamp`: Efficient TTL expiration checks

## API

### CrowdIntelligenceService

```typescript
interface SearchCriteria {
  place: string;
  city: string;
  placeType: string;
  userIntent: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  desiredCrowdLevel?: 'quiet' | 'moderate' | 'busy' | 'very busy';
}

interface CrowdScore {
  level: 'quiet' | 'moderate' | 'busy' | 'very busy';
  confidence: number;
  bestTimeToVisit: string;
  reasoning: string;
  sources: {
    googleInsights?: number;
    ddgScraper?: number;
    llmInference?: number;
    heuristics?: number;
  };
  sentimentMatch: number;
  placeSummary?: {
    name: string;
    summary: string;
    rating?: number;
    userRatingCount?: number;
  };
  openingHours?: {
    isOpen?: boolean;
    currentStatus?: string;
    hours?: any;
  };
}

// Usage
const service = new CrowdIntelligenceService();
const result = await service.analyzeCrowd(criteria);
```

## Sentiment Matching

Maps user intent to preferred crowd levels:

- **romantic**: quiet, moderate
- **peaceful**: quiet
- **party**: busy, very busy
- **cultural**: quiet, moderate
- **fun**: moderate, busy
- **adventure**: moderate, busy

## Confidence Scoring

Based on available data sources:

- 0 sources: 0.3 (low confidence)
- 1 source: 0.6 (medium confidence)
- 2 sources: 0.8 (high confidence)
- 3 sources: 0.95 (very high confidence)

## Caching Strategy

### Cache Durations

- **Crowd Intelligence**: 4 hours (dynamic data)
- **Place Summaries**: 7 days (semi-static data)
- **Opening Hours**: 24 hours (daily updates)

### Cache Keys

Generated using namespace + hash of query parameters for efficient lookups.

## Performance

### Parallel Execution

All data sources and place data are fetched in parallel using `Promise.all()`:

```typescript
const [googleScore, ddgScore, llmScore, heuristicScore, placeData] = 
  await Promise.all([
    this.getGoogleInsightsScore(criteria),
    this.getDDGScraperScore(criteria),
    this.getLLMInferenceScore(criteria),
    this.getHeuristicScore(criteria),
    this.getPlaceData(criteria)
  ]);
```

### Database Performance

- WAL mode enables concurrent reads during writes
- Memory-mapped I/O reduces disk access
- Proper indexing ensures fast lookups
- 64MB cache keeps hot data in memory

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live crowd data
2. **Historical Patterns**: ML model trained on historical data
3. **User Contributions**: Crowdsourced real-time reports
4. **Photo Analysis**: Computer vision for crowd detection
5. **Weather Integration**: Weather impact on crowd levels
6. **Event Detection**: Special events affecting crowds
7. **Predictive Analytics**: Forecast future crowd levels

## Testing

Run the test script:

```bash
npx ts-node scripts/test-crowd-intelligence.ts
```

## Integration

### In Travel Recommendations

```typescript
const crowdScore = await crowdIntelligence.analyzeCrowd({
  place: destination.name,
  city: destination.city,
  placeType: destination.type,
  userIntent: queryAnalysis.sentiment.emotion,
  timeOfDay: queryAnalysis.temporal.suggestedTimeOfDay
});

// Use crowdScore.level, reasoning, and place data in UI
```

### In Location Details

Show detailed crowd intelligence with opening hours and best times to visit.

### In Planning

Optimize itinerary based on crowd levels and opening hours across multiple locations.

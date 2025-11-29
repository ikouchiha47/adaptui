# Caching Flow & Impact

## Cache Hierarchy

### Level 1: Travel Recommendations Cache
**Key:** `travel_recommendations_{location}_{feeling}_{budget}`  
**TTL:** Set by CacheService (default 24 hours)  
**Contains:** Complete recommendations WITH ranking data

```typescript
{
  destination: "Bangkok",
  highlights: [
    {
      name: "Vertigo Bar",
      rankingScore: {
        totalScore: 87.5,
        breakdown: { ... },
        crowdIntel: { ... }
      },
      crowdLevel: "moderate",
      bestTimeToVisit: "Evening (6-8 PM)"
    }
  ]
}
```

### Level 2: Crowd Intelligence Cache
**Key:** `crowd_intel_{place}_{city}_{userIntent}`  
**TTL:** 4 hours  
**Contains:** Crowd scores with place data

### Level 3: Place Data Cache
**Key:** `place_summaries_{placeId}` & `opening_hours_{placeId}`  
**TTL:** 7 days (summaries), 24 hours (hours)  
**Contains:** Individual place metadata

## Flow Diagram

```
User Search
    ↓
┌─────────────────────────────────────────┐
│ TravelService.generateRecommendations() │
└─────────────────────────────────────────┘
    ↓
    ├─→ Check Cache (Level 1)
    │   ├─→ HIT: Return cached ranked results ✅
    │   └─→ MISS: Continue ↓
    │
    ├─→ Generate LLM Recommendations
    │   (Gets 3-5 destinations with highlights)
    │
    ├─→ Fetch Photos & Details
    │   (Google Places API)
    │
    ├─→ 🆕 RANKING STEP (NEW!)
    │   ├─→ For each highlight:
    │   │   ├─→ Check Crowd Intel Cache (Level 2)
    │   │   │   ├─→ HIT: Use cached crowd data
    │   │   │   └─→ MISS: Fetch fresh ↓
    │   │   │       ├─→ Check Place Cache (Level 3)
    │   │   │       │   ├─→ HIT: Use cached place data
    │   │   │       │   └─→ MISS: Fetch from Google Places
    │   │   │       ├─→ Fetch from 4 sources in parallel
    │   │   │       └─→ Cache crowd intel (4 hours)
    │   │   │
    │   │   ├─→ Calculate weighted score (100 points)
    │   │   └─→ Add ranking data to highlight
    │   │
    │   └─→ Re-order highlights by score
    │
    └─→ Cache complete result (Level 1) ✅
        └─→ Return ranked recommendations
```

## Impact on App Refresh

### Scenario 1: Fresh Search (No Cache)
```
Time: ~5-8 seconds
- Query analysis: 1-2s
- LLM recommendations: 2-3s
- Photo fetching: 1-2s
- Ranking (with crowd intel): 2-3s
  - Parallel fetching of 5 places
  - Each place: 4 data sources in parallel
  - Caches all data for future use
```

### Scenario 2: Cached Search (Same Query)
```
Time: ~100-200ms
- Cache hit on Level 1 ✅
- Returns complete ranked results
- No API calls needed
```

### Scenario 3: Similar Search (Different Intent)
```
Time: ~3-5 seconds
- Cache miss on Level 1 (different feeling/intent)
- LLM recommendations: 2-3s
- Ranking: 1-2s
  - Cache HIT on Level 2/3 (same places) ✅
  - Only re-calculates scores for new intent
  - No API calls to Google Places
```

### Scenario 4: App Refresh (Within TTL)
```
Time: ~100-200ms
- All caches still valid
- Instant results from Level 1 cache
```

### Scenario 5: App Refresh (After 4 Hours)
```
Time: ~3-4 seconds
- Level 1 cache still valid (24h TTL)
- BUT crowd intel expired (4h TTL)
- Returns cached results immediately
- Background refresh of crowd data (optional)
```

## Cache Invalidation Strategy

### Automatic Expiration
- **Travel Recommendations**: 24 hours
- **Crowd Intelligence**: 4 hours (dynamic data)
- **Place Summaries**: 7 days (semi-static)
- **Opening Hours**: 24 hours (daily updates)

### Manual Invalidation
```typescript
// Clear specific query
await CacheService.clear('travel_recommendations', cacheKey);

// Clear all travel recommendations
await CacheService.clear('travel_recommendations');

// Clear all caches
await CacheService.clearAll();
```

## Performance Optimization

### First Search (Cold Start)
```
Without Ranking: ~4-5 seconds
With Ranking:    ~5-8 seconds (+1-3s)
```

### Subsequent Searches
```
Same query:      ~100ms (cached)
Similar query:   ~3-5s (partial cache hit)
Different query: ~5-8s (full fetch)
```

### Cache Hit Rates (Expected)
- **Level 1** (Travel Recs): 60-70% (users repeat searches)
- **Level 2** (Crowd Intel): 40-50% (same places, different intents)
- **Level 3** (Place Data): 80-90% (popular places reused)

## Benefits

### 1. Intelligent Results
- Results are ranked by relevance, not just LLM order
- Same place ranks differently for different intents
- Real-time crowd and opening data included

### 2. Efficient Caching
- Multi-level caching reduces API calls
- Appropriate TTLs for different data types
- Partial cache hits speed up similar queries

### 3. Consistent Experience
- Cached results include all ranking data
- No re-ranking needed on app refresh
- Instant results for repeated queries

### 4. Cost Optimization
- Reduces Google Places API calls (expensive)
- Reduces LLM calls (expensive)
- Maximizes cache reuse across queries

## Monitoring

### Cache Stats
```typescript
const stats = await CacheService.getStats();
console.log(stats);
// {
//   total: 150,
//   namespaces: {
//     travel_recommendations: 20,
//     crowd_intel: 50,
//     place_summaries: 60,
//     opening_hours: 20
//   }
// }
```

### Performance Metrics
- Track cache hit/miss rates
- Monitor API call counts
- Measure response times
- Identify slow queries

## Recommendations

### For Development
- Use shorter TTLs for testing (5 minutes)
- Clear cache between major changes
- Monitor cache size growth

### For Production
- Current TTLs are optimal
- Consider background refresh for popular queries
- Implement cache warming for common searches
- Add cache size limits (e.g., max 1000 entries)

### For Users
- First search may take 5-8 seconds (normal)
- Subsequent searches are instant
- App refresh uses cached data
- Pull-to-refresh can force fresh data

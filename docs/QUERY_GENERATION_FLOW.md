# Query Generation Flow - Visual Guide

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER QUERY                                │
│              "fun activities in Bangkok"                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   TravelService.generate      │
         │   Recommendations()           │
         └───────────────┬───────────────┘
                         │
                         ├─── advancedMode: true ──────┐
                         │                              │
                         ▼                              ▼
         ┌───────────────────────────┐   ┌──────────────────────────┐
         │  ADVANCED MODE PATH       │   │  SIMPLE MODE PATH        │
         │  (Multi-layer LLM)        │   │  (Direct LLM)            │
         └───────────────┬───────────┘   └──────────────┬───────────┘
                         │                               │
                         │                               ▼
                         │                    ┌──────────────────────┐
                         │                    │ LLM generates        │
                         │                    │ recommendations      │
                         │                    │ directly             │
                         │                    └──────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                    ADVANCED MODE FLOW                               │
└────────────────────────────────────────────────────────────────────┘

STEP 1: Query Processing
─────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  QueryProcessingService.processQuery()                      │
│                                                              │
│  Input: "fun activities in Bangkok"                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LLM PROMPT: Query Expansion                         │  │
│  │  ────────────────────────────────────────────────    │  │
│  │  "Generate 8-10 variations including:                │  │
│  │   - Hidden gems and local favorites                  │  │
│  │   - Off-the-beaten-path alternatives                 │  │
│  │   - Less touristy options                            │  │
│  │   - Popular attractions"                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Output:                                                     │
│  ├─ "fun activities Bangkok"                                │
│  ├─ "hidden gem experiences Bangkok"                        │
│  ├─ "local favorite spots Bangkok"                          │
│  ├─ "offbeat attractions Bangkok"                           │
│  ├─ "less touristy things to do Bangkok"                    │
│  ├─ "Bangkok insider secrets"                               │
│  ├─ "popular Bangkok attractions"                           │
│  └─ "must-see places Bangkok"                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 2: Parallel Place Searches
────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  TaskExecutor.executeParallelPlaceSearches()                │
│                                                              │
│  Searches all 8 queries in parallel via Google Places API   │
│                                                              │
│  Query 1 ──┐                                                │
│  Query 2 ──┤                                                │
│  Query 3 ──┤──→ Google Places API ──→ Results              │
│  Query 4 ──┤                                                │
│  Query 5 ──┘                                                │
│                                                              │
│  Result: ~50-100 places (with duplicates)                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 3: Hidden Gem Discovery (Web Intelligence)
────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  TravelService.discoverHiddenGemsFromWeb()                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LLM PROMPT: Generate Search Queries                 │  │
│  │  ────────────────────────────────────────────────    │  │
│  │  "Generate 3 search queries to find hidden gems     │  │
│  │   from Reddit, blogs, and travel sites"             │  │
│  │                                                       │  │
│  │  Example:                                            │  │
│  │  - "site:reddit.com hidden gem restaurants Bangkok" │  │
│  │  - "Bangkok secret spots local favorites blog"      │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SearchProxyService (Brave/DDG)                      │  │
│  │  ────────────────────────────────────────────────    │  │
│  │  Scrapes web results for each query                 │  │
│  │  Returns: titles + snippets                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LLM PROMPT: Extract Place Names                     │  │
│  │  ────────────────────────────────────────────────    │  │
│  │  "Read these search results and extract specific    │  │
│  │   place names mentioned as hidden gems"             │  │
│  │                                                       │  │
│  │  Returns: [                                          │  │
│  │    { name: "Secret Cafe", reason: "Reddit loves" }  │  │
│  │  ]                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Result: ~5-10 hidden gem place names                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 4: Deduplication & Hidden Gem Identification
──────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  QueryProcessingService.deduplicatePlaces()                 │
│                                                              │
│  Removes duplicates by placeId                              │
│  Result: ~30-50 unique places                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hidden Gem Detection (Multi-Source)                 │  │
│  │  ────────────────────────────────────────────────    │  │
│  │  Source 1: Rating Analysis                           │  │
│  │    ├─ Rating >= 4.3                                  │  │
│  │    ├─ Reviews > 10 AND < 500                         │  │
│  │    └─ = Hidden Gem ✓                                 │  │
│  │                                                       │  │
│  │  Source 2: Web Discovery                             │  │
│  │    ├─ Found in Reddit/blog mentions                  │  │
│  │    └─ = Hidden Gem ✓                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Result: ~10-15 places marked as hidden gems                │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 5: Geographical Clustering
────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  TravelService.clusterPlacesByProximity()                   │
│                                                              │
│  K-means clustering by coordinates                          │
│                                                              │
│  Places ──→ [Cluster 1] [Cluster 2] [Cluster 3]            │
│             (5 places)  (7 places)  (6 places)              │
│                                                              │
│  Each cluster has:                                          │
│  ├─ Center coordinates (lat, lng)                           │
│  └─ List of nearby places                                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 6: LLM Cluster Naming
───────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  For each cluster:                                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LLM PROMPT: Name This Area                          │  │
│  │  ────────────────────────────────────────────────    │  │
│  │  "Given these places: Cafe A, Bar B, Restaurant C   │  │
│  │   What is a catchy name for this area?"             │  │
│  │                                                       │  │
│  │  Returns:                                            │  │
│  │  {                                                   │  │
│  │    "name": "Sukhumvit Nightlife",                   │  │
│  │    "vibe": "Trendy bars and rooftop lounges"        │  │
│  │  }                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Cluster 1 → "Sukhumvit Nightlife"                         │
│  Cluster 2 → "Old Town Heritage"                           │
│  Cluster 3 → "Riverside Dining"                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 7: Ranking & Boosting
───────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  PlaceRanker.rank()                                         │
│                                                              │
│  Base ranking by relevance                                  │
│  + Boost hidden gems (+20 points)                           │
│  + Sort by final score                                      │
│                                                              │
│  Result: Ranked places with hidden gems prioritized         │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FINAL OUTPUT                              │
│                                                              │
│  [                                                           │
│    {                                                         │
│      destination: "Sukhumvit Nightlife",                    │
│      vibe: "Trendy bars and rooftop lounges",               │
│      highlights: [                                          │
│        {                                                     │
│          name: "Secret Rooftop Bar",                        │
│          type: "hidden-gem",                                │
│          rating: 4.7,                                       │
│          isHiddenGem: true                                  │
│        },                                                    │
│        ...                                                   │
│      ]                                                       │
│    },                                                        │
│    ...                                                       │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Crowd Intelligence Query Flow

```
┌─────────────────────────────────────────────────────────────┐
│  CrowdIntelligenceService.analyzeCrowd()                    │
│                                                              │
│  Input: {                                                    │
│    place: "Wat Pho",                                        │
│    city: "Bangkok",                                         │
│    userIntent: "peaceful",                                  │
│    placeType: "temple",                                     │
│    timeOfDay: "morning"                                     │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  constructIntentBasedQueries() [RULE-BASED, NOT LLM]       │
│                                                              │
│  Intent: "peaceful" → Queries:                              │
│  ├─ "Wat Pho Bangkok crowded busy reviews"                 │
│  ├─ "Wat Pho Bangkok peaceful quiet calm"                  │
│  ├─ "Wat Pho Bangkok less crowded serene"                  │
│  ├─ "Wat Pho Bangkok morning crowd level"                  │
│  └─ "site:reddit.com Wat Pho Bangkok crowded worth it"     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  DDGScraperService.scrapePlaceData(queries)                 │
│                                                              │
│  Searches each query via DDG/Brave                          │
│  Extracts crowd mentions from snippets                      │
│                                                              │
│  Returns: {                                                 │
│    crowdMentions: ["quiet in morning", "busy afternoon"],  │
│    estimatedCrowdLevel: "moderate"                         │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Multi-Source Fusion                                        │
│                                                              │
│  ├─ Google Insights: 0.6 (moderate)                        │
│  ├─ DDG Scraper: 0.4 (quiet)                               │
│  ├─ LLM Inference: 0.5 (moderate)                          │
│  └─ Heuristics: 0.3 (morning = quiet)                      │
│                                                              │
│  Weighted Average: 0.45 → "moderate"                        │
│  Confidence: 0.8 (3/4 sources available)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Differences

| Aspect | Query Expansion | Hidden Gem Discovery | Crowd Intelligence |
|--------|----------------|---------------------|-------------------|
| **LLM Used?** | ✅ Yes | ✅ Yes (2x) | ❌ No (Rule-based) |
| **Purpose** | Expand to variations | Find web mentions | Assess crowd levels |
| **Output** | 8-10 search terms | 3 web queries | 5 intent queries |
| **Speed** | ~2-3 seconds | ~3-5 seconds | <100ms |
| **Caching** | 1 hour | 1 hour | 4 hours |
| **Fallback** | Use original query | Skip if fails | Use heuristics |

---

## Performance Metrics

**Advanced Mode (Full Pipeline):**
- Query Expansion: ~2s (LLM)
- Parallel Searches: ~3s (8 queries)
- Hidden Gem Discovery: ~4s (LLM + scraping)
- Clustering: ~500ms
- LLM Naming: ~2s per cluster
- **Total: ~15-20 seconds**

**Simple Mode:**
- Direct LLM: ~3-5s
- **Total: ~3-5 seconds**

**Crowd Intelligence:**
- Query Construction: <1ms (rule-based)
- DDG Scraping: ~2s
- **Total: ~2-3 seconds**

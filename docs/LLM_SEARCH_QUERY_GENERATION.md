# LLM Search Query Generation - Complete Guide

## Overview

The system uses **LLM-driven query generation** in **3 different contexts**, each with specific instructions and purposes.

---

## 1. Query Expansion (QueryProcessingService)

**Purpose:** Expand user queries to include hidden gems, synonyms, and related concepts

**Location:** `src/services/QueryProcessingService.ts` → `expandQuery()`

### LLM Prompt

```typescript
const prompt = `You are a query expansion expert for travel and places. Given a search query, generate:
1. Expanded variations including BOTH popular AND hidden gems
2. Synonyms for key terms
3. Related concepts

IMPORTANT: Always include variations for:
- Hidden gems and local favorites
- Off-the-beaten-path alternatives
- Less touristy options
- Local secrets and insider spots

Query: "${query}"
${contextInfo}

Return JSON with 8-10 expanded variations:
{
  "expanded": [
    "original query variation",
    "hidden gems version",
    "local favorites version", 
    "offbeat alternative",
    "less touristy option",
    "insider spots",
    "popular attractions",
    "must-see places"
  ],
  "synonyms": ["synonym1", "synonym2"],
  "relatedConcepts": ["concept1", "concept2"]
}`;
```

### Example Output

**Input:** "fun activities in Bangkok"

**Output:**
```json
{
  "expanded": [
    "fun activities Bangkok",
    "hidden gem experiences Bangkok",
    "local favorite spots Bangkok",
    "offbeat attractions Bangkok",
    "less touristy things to do Bangkok",
    "Bangkok insider secrets",
    "popular Bangkok attractions",
    "must-see places Bangkok"
  ],
  "synonyms": ["entertainment", "leisure", "recreation"],
  "relatedConcepts": ["nightlife", "cultural experiences", "adventure"]
}
```

### Context Injection

The prompt includes:
- User location (city, country, coordinates)
- Available data sources (google_places, airports_db, etc.)
- Enabled capabilities (maps, location, camera)
- Active plugins (Transport, Neighborhood, etc.)
- Domain instructions (focus on intent, crowd levels, ratings)

---

## 2. Hidden Gem Discovery (TravelService)

**Purpose:** Generate search queries to find hidden gems from Reddit, blogs, and travel sites

**Location:** `src/services/TravelService.ts` → `discoverHiddenGemsFromWeb()`

### LLM Prompt

```typescript
const queryPrompt = `Generate 3 search queries to find hidden gems and local favorites in ${location}.

Focus on finding actual place names from Reddit, blogs, and travel sites.

Return JSON:
{
  "queries": ["query1", "query2", "query3"]
}

Example for Bangkok:
{
  "queries": [
    "site:reddit.com hidden gem restaurants Bangkok",
    "site:reddit.com underrated cafes Bangkok locals",
    "Bangkok secret spots local favorites blog"
  ]
}`;
```

### Example Output

**Input:** "Bangkok"

**Output:**
```json
{
  "queries": [
    "site:reddit.com hidden gem restaurants Bangkok",
    "site:reddit.com underrated cafes Bangkok locals",
    "Bangkok secret spots local favorites blog"
  ]
}
```

### Flow

1. **LLM generates queries** → Targets Reddit, blogs, travel sites
2. **SearchProxy executes** → Uses Brave/DDG to scrape results
3. **LLM extracts place names** → Parses snippets for actual place names
4. **Merges with Places API** → Combines web-discovered gems with Google Places data

---

## 3. Intent-Based Queries (CrowdIntelligenceService)

**Purpose:** Generate crowd-level search queries based on user intent

**Location:** `src/services/CrowdIntelligenceService.ts` → `constructIntentBasedQueries()`

### Query Construction (Programmatic, NOT LLM)

**Note:** This is **NOT LLM-generated** - it's **rule-based** for speed and reliability.

```typescript
private constructIntentBasedQueries(criteria: SearchCriteria): string[] {
  const { place, city, userIntent, placeType, timeOfDay } = criteria;
  
  const queries: string[] = [];
  
  // Base query: crowd level mentions
  queries.push(`${place} ${city} crowded busy reviews`);
  
  // Intent-specific queries
  const intentQueries: Record<string, string[]> = {
    romantic: [
      `${place} ${city} romantic quiet intimate`,
      `${place} ${city} couples date night reviews`
    ],
    peaceful: [
      `${place} ${city} peaceful quiet calm`,
      `${place} ${city} less crowded serene`
    ],
    party: [
      `${place} ${city} busy lively nightlife`,
      `${place} ${city} crowded popular party`
    ],
    cultural: [
      `${place} ${city} cultural experience authentic`,
      `${place} ${city} traditional local heritage`
    ],
    fun: [
      `${place} ${city} fun exciting vibrant`,
      `${place} ${city} popular must-visit`
    ],
    adventure: [
      `${place} ${city} adventure thrilling exciting`,
      `${place} ${city} unique experience`
    ]
  };
  
  // Add intent-specific queries
  const intentSpecific = intentQueries[userIntent] || intentQueries.fun;
  queries.push(...intentSpecific);
  
  // Time-specific query if provided
  if (timeOfDay) {
    queries.push(`${place} ${city} ${timeOfDay} crowd level`);
  }
  
  // Place type specific query
  if (placeType) {
    queries.push(`${place} ${city} ${placeType} wait time busy`);
  }
  
  // Reddit-specific query for authentic reviews
  queries.push(`site:reddit.com ${place} ${city} crowded worth it`);
  
  // Limit to top 5 most relevant queries
  return queries.slice(0, 5);
}
```

### Example Output

**Input:**
```typescript
{
  place: "Wat Pho",
  city: "Bangkok",
  placeType: "temple",
  userIntent: "peaceful",
  timeOfDay: "morning"
}
```

**Output:**
```javascript
[
  "Wat Pho Bangkok crowded busy reviews",
  "Wat Pho Bangkok peaceful quiet calm",
  "Wat Pho Bangkok less crowded serene",
  "Wat Pho Bangkok morning crowd level",
  "Wat Pho Bangkok temple wait time busy"
]
```

---

## 4. Hybrid Intent Extraction (TravelService)

**Purpose:** Extract location and generate place type queries from user input

**Location:** `src/services/TravelService.ts` → `generateHybridRecommendations()`

### LLM Prompt

```typescript
const intentPrompt = `User query: "${query.location || ''} ${query.feeling || ''}"
Extract and return JSON:
{
  "location": "city name",
  "searchQueries": ["query1", "query2", "query3"],
  "vibe": "description"
}

searchQueries should be specific place types like "hidden cafes", "rooftop bars", "local markets"`;
```

### Example Output

**Input:** "romantic places in Paris"

**Output:**
```json
{
  "location": "Paris",
  "searchQueries": [
    "romantic restaurants Paris",
    "intimate cafes Paris",
    "scenic viewpoints Paris"
  ],
  "vibe": "Romantic and intimate atmosphere"
}
```

---

## Summary: When Each Method is Used

| Method | When Used | LLM? | Purpose |
|--------|-----------|------|---------|
| **Query Expansion** | Advanced mode enabled | ✅ Yes | Expand to 8-10 variations including hidden gems |
| **Hidden Gem Discovery** | Advanced mode enabled | ✅ Yes | Generate Reddit/blog search queries |
| **Intent-Based Queries** | Crowd intelligence analysis | ❌ No (Rule-based) | Fast, reliable crowd-level queries |
| **Hybrid Intent** | Hybrid recommendations | ✅ Yes | Extract location + generate place types |

---

## Key Design Decisions

### Why Rule-Based for Crowd Intelligence?

**Speed:** Rule-based queries are instant (no LLM latency)
**Reliability:** No risk of malformed JSON or API failures
**Cost:** No additional LLM API calls
**Predictability:** Consistent query patterns for better caching

### Why LLM for Query Expansion?

**Creativity:** LLM generates diverse, contextual variations
**Intent Understanding:** Captures nuanced user preferences
**Hidden Gems:** LLM knows to include off-beaten-path alternatives
**Adaptability:** Adjusts to different locations and contexts

### Why LLM for Hidden Gem Discovery?

**Site-Specific:** Generates Reddit/blog-specific queries
**Location-Aware:** Adapts to different cities and regions
**Extraction:** LLM parses unstructured snippets for place names
**Quality:** Filters for actual place names vs generic mentions

---

## Testing

Run the test script to see intent-based query construction in action:

```bash
tsx scripts/test-intent-queries.ts
```

This will demonstrate how different intents generate different search queries for the same place.

---

---

## System Architecture: Intent Flow & Connection Points

### The Intent Matching Problem

**Critical Issue:** LLM must output intent keys that match CrowdIntelligenceService's hardcoded keys!

```typescript
// CrowdIntelligenceService has these hardcoded:
const intentQueries = {
  romantic: [...],
  peaceful: [...],
  party: [...],
  cultural: [...],
  fun: [...],
  adventure: [...],
  foodie: [...],
  family: [...],
  // ... 16 total
};

// LLM must output one of these EXACT keys
// Otherwise: fallback to 'fun' (default)
```

### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                   │
│                  "romantic places in Bangkok"                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TravelService.generateRecommendations()           │
│                                                                       │
│  Step 1: Analyze Intent                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  LLM PROMPT: "Analyze this travel query..."                │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  Extract:                                                   │    │
│  │  1. experienceType: romantic|adventure|cultural|...         │    │
│  │  2. validationNeeds: ["hours", "status", "reviews"]        │    │
│  │  3. searchQueries: ["specific place 1", ...]               │    │
│  │                                                              │    │
│  │  ⚠️  MUST OUTPUT ONE OF 16 VALID INTENT KEYS!              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  Intent Result: { experienceType: "romantic", ... }                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ├──── advancedMode: true ────┐
                             │                             │
                             ▼                             ▼
┌──────────────────────────────────────┐   ┌──────────────────────────┐
│  ADVANCED MODE PATH                  │   │  SIMPLE MODE PATH        │
│  (Multi-layer Intelligence)          │   │  (Direct LLM)            │
└──────────────────┬───────────────────┘   └──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              QueryProcessingService.processQuery()                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  LLM PROMPT: Query Expansion                               │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  "Generate 8-10 variations including hidden gems..."       │    │
│  │                                                              │    │
│  │  Context includes:                                          │    │
│  │  - userIntent: "romantic" ← FROM STEP 1                    │    │
│  │  - location: "Bangkok"                                      │    │
│  │  - capabilities: [maps, location, ...]                     │    │
│  │  - plugins: [Transport, Neighborhood, ...]                 │    │
│  │                                                              │    │
│  │  Output: {                                                  │    │
│  │    expanded: [                                              │    │
│  │      "romantic restaurants Bangkok",                        │    │
│  │      "intimate cafes Bangkok",                             │    │
│  │      "hidden gem romantic spots Bangkok",                  │    │
│  │      ...                                                    │    │
│  │    ]                                                        │    │
│  │  }                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│         TaskExecutor.executeParallelPlaceSearches()                  │
│                                                                       │
│  Searches all expanded queries in parallel                          │
│  → Google Places API                                                │
│  → Returns ~50-100 places                                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              TravelService.discoverHiddenGemsFromWeb()               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  LLM PROMPT: Generate Search Queries                       │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  "Generate 3 queries for hidden gems in Bangkok..."        │    │
│  │                                                              │    │
│  │  Output: {                                                  │    │
│  │    queries: [                                               │    │
│  │      "site:reddit.com hidden gem romantic Bangkok",        │    │
│  │      "Bangkok romantic secret spots blog",                 │    │
│  │      ...                                                    │    │
│  │    ]                                                        │    │
│  │  }                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  SearchProxyService (Brave/DDG)                            │    │
│  │  Scrapes web results → Returns snippets                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  LLM PROMPT: Extract Place Names                           │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  "Read these results and extract place names..."           │    │
│  │                                                              │    │
│  │  Output: [                                                  │    │
│  │    { name: "Secret Rooftop Bar", reason: "..." },          │    │
│  │    ...                                                      │    │
│  │  ]                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Deduplication & Ranking                           │
│                                                                       │
│  - Remove duplicates by placeId                                     │
│  - Identify hidden gems (rating + web mentions)                     │
│  - Rank by relevance                                                │
│  - Boost hidden gems (+20 points)                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Geographical Clustering (K-means)                       │
│                                                                       │
│  Groups nearby places into clusters                                 │
│  → Cluster 1: Sukhumvit area (8 places)                            │
│  → Cluster 2: Old Town (5 places)                                  │
│  → Cluster 3: Riverside (6 places)                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              LLM Cluster Naming                                      │
│                                                                       │
│  For each cluster:                                                  │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  LLM PROMPT: "Name this area..."                           │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  Given places: [Cafe A, Bar B, Restaurant C]               │    │
│  │                                                              │    │
│  │  Output: {                                                  │    │
│  │    name: "Sukhumvit Nightlife",                            │    │
│  │    vibe: "Trendy bars and lounges"                         │    │
│  │  }                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              RankingService.rankPlaces()                             │
│                                                                       │
│  For each place, calls CrowdIntelligenceService                     │
│  ↓                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│         CrowdIntelligenceService.analyzeCrowd()                      │
│                                                                       │
│  Input: {                                                            │
│    place: "Secret Rooftop Bar",                                     │
│    city: "Bangkok",                                                 │
│    userIntent: "romantic", ← FROM STEP 1 (MUST MATCH!)             │
│    placeType: "bar",                                                │
│    timeOfDay: "evening"                                             │
│  }                                                                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  constructIntentBasedQueries() [RULE-BASED]                │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  const intentQueries = {                                    │    │
│  │    romantic: [                                              │    │
│  │      `${place} ${city} romantic quiet intimate`,           │    │
│  │      `${place} ${city} couples date night reviews`         │    │
│  │    ],                                                       │    │
│  │    peaceful: [...],                                         │    │
│  │    party: [...],                                            │    │
│  │    // ... 16 total                                          │    │
│  │  };                                                         │    │
│  │                                                              │    │
│  │  ⚠️  LOOKUP: intentQueries[userIntent]                     │    │
│  │  ⚠️  IF NOT FOUND: fallback to intentQueries.fun           │    │
│  │                                                              │    │
│  │  Output: [                                                  │    │
│  │    "Secret Rooftop Bar Bangkok crowded busy reviews",      │    │
│  │    "Secret Rooftop Bar Bangkok romantic quiet intimate",   │    │
│  │    "Secret Rooftop Bar Bangkok couples date night",        │    │
│  │    "Secret Rooftop Bar Bangkok evening crowd level",       │    │
│  │    "site:reddit.com Secret Rooftop Bar Bangkok crowded"    │    │
│  │  ]                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  DDGScraperService.scrapePlaceData(queries)                │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  - Searches each query via DDG/Brave                       │    │
│  │  - Extracts crowd mentions from snippets                   │    │
│  │  - Analyzes sentiment with Natural NLP                     │    │
│  │                                                              │    │
│  │  Output: {                                                  │    │
│  │    crowdMentions: ["quiet", "intimate", "not crowded"],    │    │
│  │    estimatedCrowdLevel: "moderate",                        │    │
│  │    sentimentScore: 0.75                                    │    │
│  │  }                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  Multi-Source Fusion:                                               │
│  ├─ Google Insights: 0.5                                            │
│  ├─ DDG Scraper: 0.4                                                │
│  ├─ LLM Inference: 0.6                                              │
│  └─ Heuristics: 0.3                                                 │
│                                                                       │
│  Weighted Average → Final Crowd Score                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FINAL OUTPUT                                    │
│                                                                       │
│  [                                                                   │
│    {                                                                 │
│      destination: "Sukhumvit Nightlife",                            │
│      vibe: "Trendy bars and lounges",                               │
│      highlights: [                                                  │
│        {                                                             │
│          name: "Secret Rooftop Bar",                                │
│          type: "hidden-gem",                                        │
│          crowdLevel: "moderate",                                    │
│          sentimentScore: 0.75,                                      │
│          rankingScore: { totalScore: 85 }                           │
│        },                                                            │
│        ...                                                           │
│      ]                                                               │
│    },                                                                │
│    ...                                                               │
│  ]                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Critical Connection Points

### 🔴 Connection Point 1: Intent Analysis → Query Processing

```typescript
// TravelService.analyzeIntent()
const intent = await this.analyzeIntent(query);
// Returns: { experienceType: "romantic", ... }

// MUST be one of these 16 keys:
const VALID_INTENTS = [
  'romantic', 'peaceful', 'party', 'cultural', 'fun', 'adventure',
  'foodie', 'family', 'luxury', 'budget', 'solo', 'photography',
  'nature', 'shopping', 'spiritual', 'local'
];

// Passed to QueryProcessingService
await QueryProcessingService.processQuery(query, llm, {
  userIntent: intent.experienceType, // ← MUST MATCH!
  ...
});
```

### 🔴 Connection Point 2: Query Processing → Crowd Intelligence

```typescript
// RankingService calls CrowdIntelligenceService
await this.crowdIntel.analyzeCrowd({
  place: "Secret Bar",
  city: "Bangkok",
  userIntent: intent.experienceType, // ← SAME VALUE FROM STEP 1
  placeType: "bar",
  timeOfDay: "evening"
});

// CrowdIntelligenceService.constructIntentBasedQueries()
const intentQueries = {
  romantic: [...],
  peaceful: [...],
  // ... 16 total
};

// LOOKUP:
const queries = intentQueries[criteria.userIntent] || intentQueries.fun;
//                              ↑
//                    MUST MATCH ONE OF THE KEYS!
```

### 🔴 Connection Point 3: LLM Prompt Engineering

**The LLM must be instructed to output valid intent keys:**

```typescript
// TravelService.analyzeIntent() - CURRENT PROMPT
const prompt = `Analyze this travel query:
...
Extract:
1. What type of experience? (romantic, adventure, cultural, relaxation, foodie, nightlife)
...

Return JSON:
{
  "experienceType": "romantic|adventure|cultural|relaxation|foodie|nightlife",
  ...
}`;

// ⚠️  PROBLEM: Only lists 6 intents, but we have 16!
// ⚠️  SOLUTION: Update prompt to list all 16 valid intents
```

---

## The Intent Mismatch Problem

### Current State

```
LLM Prompt lists:        CrowdIntelligence has:
─────────────────        ────────────────────────
romantic ✓               romantic ✓
adventure ✓              adventure ✓
cultural ✓               cultural ✓
relaxation ✗             peaceful ✓  ← MISMATCH!
foodie ✓                 foodie ✓
nightlife ✗              party ✓     ← MISMATCH!
                         fun ✓       ← MISSING!
                         family ✓    ← MISSING!
                         luxury ✓    ← MISSING!
                         budget ✓    ← MISSING!
                         solo ✓      ← MISSING!
                         photography ✓ ← MISSING!
                         nature ✓    ← MISSING!
                         shopping ✓  ← MISSING!
                         spiritual ✓ ← MISSING!
                         local ✓     ← MISSING!
```

### Solution: Update LLM Prompt

```typescript
const prompt = `Analyze this travel query:
...
Extract:
1. What type of experience? Choose ONE from this list:
   - romantic: Intimate, couples, date night
   - peaceful: Calm, serene, quiet, relaxation
   - party: Nightlife, lively, energetic, clubbing
   - cultural: Traditional, heritage, authentic, historical
   - fun: Entertaining, exciting, vibrant, general enjoyment
   - adventure: Thrilling, unique, adventurous, extreme
   - foodie: Culinary, dining, food-focused, gastronomic
   - family: Kid-friendly, family-oriented, safe for children
   - luxury: Upscale, premium, high-end, exclusive
   - budget: Affordable, cheap, value, economical
   - solo: Solo traveler, independent, alone-friendly
   - photography: Photogenic, Instagram-worthy, scenic views
   - nature: Outdoor, natural, scenic, wilderness
   - shopping: Markets, stores, retail, souvenirs
   - spiritual: Sacred, religious, meditation, mindfulness
   - local: Authentic, hidden gems, off-beaten-path, locals' favorite

Return JSON:
{
  "experienceType": "romantic",  // MUST be one of the 16 above
  ...
}`;
```

---

## Future: Query Chaining

### Concept

Use results from one query to inform the next:

```
User Query: "romantic places in Bangkok"
    ↓
Step 1: LLM analyzes → intent: "romantic"
    ↓
Step 2: Query expansion → ["romantic restaurants", "intimate cafes", ...]
    ↓
Step 3: Search Google Places → [Place A, Place B, Place C, ...]
    ↓
Step 4: LLM analyzes results → "Most places are restaurants, user might also like scenic viewpoints"
    ↓
Step 5: CHAIN NEW QUERY → "romantic viewpoints Bangkok"
    ↓
Step 6: Search again → [Viewpoint X, Viewpoint Y, ...]
    ↓
Step 7: Merge results → Final recommendations
```

### Implementation

```typescript
async function queryChaining(initialQuery: string, maxChains: number = 2) {
  const allResults = [];
  let currentQuery = initialQuery;
  
  for (let i = 0; i < maxChains; i++) {
    // Execute current query
    const results = await executeQuery(currentQuery);
    allResults.push(...results);
    
    // Analyze results to generate next query
    const nextQuery = await llm.generateJSON(`
      Based on these results: ${JSON.stringify(results)}
      
      What related query should we search next to complement these results?
      Consider:
      - Missing categories (e.g., if all restaurants, suggest viewpoints)
      - User intent (romantic → also suggest scenic spots)
      - Geographical gaps (if all in one area, suggest other areas)
      
      Return JSON:
      {
        "nextQuery": "romantic viewpoints Bangkok",
        "reasoning": "All results are restaurants, user might enjoy scenic spots too"
      }
    `);
    
    if (!nextQuery.nextQuery) break; // No more chains needed
    currentQuery = nextQuery.nextQuery;
  }
  
  return deduplicateAndRank(allResults);
}
```

---

## Future Enhancements

1. **Hybrid Approach:** Use LLM for initial query generation, cache patterns for speed
2. **Learning System:** Track which queries yield best results, optimize over time
3. **Multi-Language:** Generate queries in local language for better results
4. **Sentiment Analysis:** Analyze query results for sentiment matching
5. **Query Chaining:** Use results from one query to inform next query generation (see above)

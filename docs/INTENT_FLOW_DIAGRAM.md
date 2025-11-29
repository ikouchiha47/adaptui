# Intent Flow & Connection Points - Visual Guide

## The Intent Matching Challenge

**Problem:** LLM must output intent keys that **exactly match** CrowdIntelligenceService's hardcoded keys, otherwise queries fall back to generic "fun" intent.

**Solution:** Explicitly list all 16 valid intents in LLM prompts.

---

## Complete Intent Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INPUT                                   │
│             "romantic places in Bangkok"                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              STEP 1: Intent Analysis (LLM)                     │
│              TravelService.analyzeIntent()                     │
│                                                                │
│  LLM Prompt:                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ "Choose ONE from this list:                            │    │
│  │  - romantic: Intimate, couples, date night             │    │
│  │  - peaceful: Calm, serene, quiet                       │    │
│  │  - party: Nightlife, lively, energetic                 │    │
│  │  - cultural: Traditional, heritage, authentic          │    │
│  │  - fun: Entertaining, exciting, vibrant                │    │
│  │  - adventure: Thrilling, unique, adventurous           │    │
│  │  - foodie: Culinary, dining, food-focused              │    │
│  │  - family: Kid-friendly, family-oriented               │    │
│  │  - luxury: Upscale, premium, high-end                  │    │
│  │  - budget: Affordable, cheap, value                    │    │
│  │  - solo: Solo traveler, independent                    │    │
│  │  - photography: Photogenic, Instagram-worthy           │    │
│  │  - nature: Outdoor, natural, scenic                    │    │
│  │  - shopping: Markets, stores, retail                   │    │
│  │  - spiritual: Sacred, religious, meditation            │    │
│  │  - local: Authentic, hidden gems, off-beaten-path"     │    │
│  │                                                        │    │
│  │ CRITICAL: MUST output one of these 16 keys!            │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                    │
│                           ▼                                    │
│  LLM Output: { experienceType: "romantic" }                    │
│                           │                                    │
│                           ▼                                    │
│  ✅ Validation: "romantic" ∈ VALID_INTENTS                     │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           │ intent = "romantic"
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ STEP 2A:      │  │ STEP 2B:      │  │ STEP 2C:      │
│ Query         │  │ Hidden Gem    │  │ Ranking       │
│ Expansion     │  │ Discovery     │  │ Service       │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        │ Uses intent      │ Uses intent      │ Uses intent
        │ for context      │ for queries      │ for crowd
        │                  │                  │ analysis
        ▼                  ▼                  ▼
```

---

## Detailed Connection Points

### 🔴 Connection Point 1: Intent → Query Expansion

```typescript
// TravelService.generateAdvancedRecommendations()
const intent = await this.analyzeIntent(query);
// Returns: { experienceType: "romantic", ... }

// Pass to QueryProcessingService
const processed = await QueryProcessingService.processQuery(
  originalQuery,
  llm,
  {
    userLocation: { city: query.location },
    domainInstructions: [
      `User intent: ${intent.experienceType}`, // ← Intent used as context
      'Focus on places that match user intent',
      'Consider crowd levels and accessibility'
    ]
  }
);

// LLM uses this context to generate relevant expansions
// "romantic" → ["romantic restaurants", "intimate cafes", "couples spots"]
```

**Flow:**
```
intent: "romantic"
    ↓
QueryProcessingService.expandQuery()
    ↓
LLM Prompt: "User wants romantic experiences..."
    ↓
Output: ["romantic restaurants Bangkok", "intimate cafes Bangkok", ...]
```

---

### 🔴 Connection Point 2: Intent → Hidden Gem Discovery

```typescript
// TravelService.discoverHiddenGemsFromWeb()
const queryPrompt = `Generate 3 search queries to find hidden gems in ${location}.

User intent: ${intent.experienceType}  // ← Intent influences queries

Focus on finding actual place names from Reddit, blogs, and travel sites.

Return JSON:
{
  "queries": ["query1", "query2", "query3"]
}`;

// LLM generates intent-specific queries
// "romantic" → ["site:reddit.com romantic hidden gems Bangkok", ...]
```

**Flow:**
```
intent: "romantic"
    ↓
discoverHiddenGemsFromWeb()
    ↓
LLM Prompt: "Generate queries for romantic hidden gems..."
    ↓
Output: ["site:reddit.com romantic hidden gems Bangkok", ...]
    ↓
SearchProxy scrapes web
    ↓
LLM extracts place names
```

---

### 🔴 Connection Point 3: Intent → Crowd Intelligence (CRITICAL!)

```typescript
// RankingService.rankPlaces()
for (const place of places) {
  const crowdScore = await this.crowdIntel.analyzeCrowd({
    place: place.name,
    city: place.city,
    userIntent: intent.experienceType, // ← MUST MATCH HARDCODED KEYS!
    placeType: place.type,
    timeOfDay: currentTime
  });
}

// CrowdIntelligenceService.constructIntentBasedQueries()
private constructIntentBasedQueries(criteria: SearchCriteria): string[] {
  const intentQueries: Record<string, string[]> = {
    romantic: [
      `${place} ${city} romantic quiet intimate`,
      `${place} ${city} couples date night reviews`
    ],
    peaceful: [...],
    party: [...],
    // ... 16 total
  };
  
  // CRITICAL LOOKUP:
  const queries = intentQueries[criteria.userIntent] || intentQueries.fun;
  //                              ↑
  //                    MUST BE ONE OF THE 16 KEYS!
  //                    OTHERWISE FALLS BACK TO "fun"
  
  return queries.slice(0, 5);
}
```

**Flow:**
```
intent: "romantic"
    ↓
CrowdIntelligenceService.analyzeCrowd({ userIntent: "romantic" })
    ↓
constructIntentBasedQueries()
    ↓
LOOKUP: intentQueries["romantic"]
    ↓
✅ FOUND: ["Secret Bar Bangkok romantic quiet intimate", ...]
    ↓
DDGScraperService.scrapePlaceData(queries)
    ↓
Returns: { crowdLevel: "moderate", sentimentScore: 0.75 }
```

**If intent doesn't match:**
```
intent: "relaxation" (NOT IN VALID LIST!)
    ↓
CrowdIntelligenceService.analyzeCrowd({ userIntent: "relaxation" })
    ↓
constructIntentBasedQueries()
    ↓
LOOKUP: intentQueries["relaxation"]
    ↓
❌ NOT FOUND!
    ↓
FALLBACK: intentQueries["fun"]
    ↓
⚠️  Uses generic "fun" queries instead of "relaxation" queries
```

---

## The 16 Valid Intents

| Intent | Keywords | Use Case |
|--------|----------|----------|
| **romantic** | intimate, couples, date night | Romantic getaways, date spots |
| **peaceful** | calm, serene, quiet, relaxation | Meditation, quiet retreats |
| **party** | nightlife, lively, energetic, clubbing | Nightlife, bars, clubs |
| **cultural** | traditional, heritage, authentic | Museums, historical sites |
| **fun** | entertaining, exciting, vibrant | General entertainment |
| **adventure** | thrilling, unique, adventurous | Extreme sports, hiking |
| **foodie** | culinary, dining, gastronomic | Food tours, restaurants |
| **family** | kid-friendly, family-oriented | Family vacations |
| **luxury** | upscale, premium, high-end | Luxury travel |
| **budget** | affordable, cheap, value | Budget travel |
| **solo** | solo traveler, independent | Solo adventures |
| **photography** | photogenic, Instagram-worthy | Photo spots |
| **nature** | outdoor, natural, scenic | Nature, parks |
| **shopping** | markets, stores, retail | Shopping trips |
| **spiritual** | sacred, religious, meditation | Spiritual journeys |
| **local** | authentic, hidden gems | Local experiences |

---

## Intent Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  LLM Output: { experienceType: "romantic" }                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Is "romantic"  │
                  │ in VALID_      │
                  │ INTENTS?       │
                  └────┬───────┬───┘
                       │       │
                  YES  │       │  NO
                       │       │
                       ▼       ▼
              ┌────────────┐  ┌────────────────┐
              │ Use        │  │ Fallback to    │
              │ "romantic" │  │ "fun"          │
              │ queries    │  │ queries        │
              └────────────┘  └────────────────┘
                       │               │
                       └───────┬───────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │ Generate DDG queries   │
                  │ based on intent        │
                  └────────────────────────┘
```

---

## Testing Intent Matching

Run the test to validate LLM outputs match CrowdIntelligenceService keys:

```bash
tsx scripts/test-intent-matching.ts
```

This will:
1. Test 16 different user queries
2. Validate LLM outputs valid intent keys
3. Check if intents match expected values
4. Report success rate

**Expected output:**
```
✅ Valid intents: 16/16
❌ Invalid intents: 0/16
Success rate: 100.0%

🎉 Perfect! All LLM outputs match CrowdIntelligenceService keys!
```

---

## Future: Query Chaining

### Concept

Use results from one query to generate the next query:

```
User: "romantic places in Bangkok"
    ↓
Intent: "romantic"
    ↓
Query 1: "romantic restaurants Bangkok"
    ↓
Results: [Restaurant A, Restaurant B, Restaurant C]
    ↓
LLM Analysis: "All restaurants, user might also like scenic viewpoints"
    ↓
Query 2: "romantic viewpoints Bangkok"
    ↓
Results: [Viewpoint X, Viewpoint Y]
    ↓
Merge & Rank: [Restaurant A, Viewpoint X, Restaurant B, ...]
```

### Implementation

```typescript
async function queryChaining(
  initialQuery: string,
  intent: string,
  maxChains: number = 2
): Promise<any[]> {
  const allResults = [];
  let currentQuery = initialQuery;
  
  for (let i = 0; i < maxChains; i++) {
    console.log(`🔗 Chain ${i + 1}: "${currentQuery}"`);
    
    // Execute current query
    const results = await executeQuery(currentQuery, intent);
    allResults.push(...results);
    
    // Analyze results to generate next query
    const analysis = await llm.generateJSON(`
      User intent: ${intent}
      Current query: "${currentQuery}"
      Results: ${JSON.stringify(results.slice(0, 5))}
      
      Analyze these results:
      1. What categories are covered? (restaurants, viewpoints, activities, etc.)
      2. What's missing that would complement the user's ${intent} intent?
      3. Should we search for something else?
      
      Return JSON:
      {
        "nextQuery": "romantic viewpoints Bangkok" or null,
        "reasoning": "All results are restaurants, user might enjoy scenic spots",
        "confidence": 0.8
      }
      
      If results are comprehensive, return nextQuery: null
    `);
    
    const parsed = JSON.parse(analysis);
    
    if (!parsed.nextQuery || parsed.confidence < 0.5) {
      console.log(`✅ Chain complete: ${parsed.reasoning}`);
      break;
    }
    
    console.log(`🔗 Next query: "${parsed.nextQuery}" (${parsed.reasoning})`);
    currentQuery = parsed.nextQuery;
  }
  
  return deduplicateAndRank(allResults);
}
```

### Benefits

✅ **Comprehensive results:** Covers multiple categories
✅ **Intent-aware:** Stays aligned with user's original intent
✅ **Adaptive:** Adjusts based on what's already found
✅ **Efficient:** Stops when results are comprehensive

### Example Flow

```
User: "romantic places in Bangkok"
Intent: "romantic"

Chain 1: "romantic restaurants Bangkok"
├─ Results: 10 restaurants
└─ Analysis: "All restaurants, missing viewpoints"

Chain 2: "romantic viewpoints Bangkok"
├─ Results: 5 viewpoints
└─ Analysis: "Good mix now, comprehensive"

Final: 10 restaurants + 5 viewpoints = 15 diverse romantic places
```

---

## Summary

### Critical Points

1. **LLM must output valid intent keys** - Otherwise fallback to "fun"
2. **Intent flows through entire system** - From analysis to crowd intelligence
3. **Hardcoded keys in CrowdIntelligenceService** - Must match LLM output
4. **16 valid intents** - All explicitly listed in LLM prompts

### Connection Points

1. **Intent → Query Expansion** - Context for LLM
2. **Intent → Hidden Gem Discovery** - Influences search queries
3. **Intent → Crowd Intelligence** - CRITICAL: Must match hardcoded keys

### Testing

```bash
# Test intent matching
tsx scripts/test-intent-matching.ts

# Test intent-based queries
tsx scripts/test-intent-queries.ts
```

### Future Enhancements

- Query chaining for comprehensive results
- Intent learning from user feedback
- Multi-intent support (e.g., "romantic AND budget")
- Intent confidence scoring

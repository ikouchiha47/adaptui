# Categorization Solution: LLM-Driven Filters & Tags

## 🔴 The Original Problem (Recap)

### Three Conflicting Systems

1. **Query Categories** (from LLM)
   - `['dining', 'accommodation', 'activities', 'transport', 'shopping', 'entertainment']`
   - Purpose: What TYPE of thing you're searching for

2. **Place Categories** (hardcoded in PlaceCategorizationService)
   - `['offbeat', 'touristy', 'luxury', 'budget', 'hidden-gem']`
   - Purpose: What EXPERIENCE level

3. **Nature of Travel** (from LLM)
   - `['romantic', 'family', 'business', 'solo', 'adventure', 'luxury', 'budget']`
   - Purpose: Travel STYLE

**Conflicts:**
- "luxury" in both Place Categories AND Nature of Travel
- "budget" in both Place Categories AND Nature of Travel
- Filters don't match any category system
- No clear connection between categories and UI filters

---

## ✅ THE SOLUTION: LLM-Driven Categorization

### Core Principle
**Stop hardcoding categories. Let the LLM generate filters based on:**
1. Query analysis (intent, sentiment, nature of travel)
2. Actual data characteristics (what's in the results)
3. User context (device, capabilities)

---

## 🎯 How It Works

### Step 1: Query Analysis (Already Working)

```typescript
// QueryAnalysisService returns
{
  intent: 'search',
  categories: ['dining'],           // Domain: what you're searching for
  sentiment: {
    emotion: 'romantic',             // Emotion: how you want to feel
    intensity: 'high',
    vibe: ['intimate', 'quiet']
  },
  parameters: {
    natureOfTravel: 'romantic',      // Travel style
    filters: {
      priceRange: null,              // User-specified filters
      rating: 4.0
    }
  }
}
```

### Step 2: Data Fetching (Already Working)

```typescript
// TravelService returns enriched places
[
  {
    name: "Secret Garden Restaurant",
    type: "restaurant",
    priceLevel: 3,                   // $$$ (luxury)
    rating: 4.8,
    userRatingsTotal: 1200,          // Popular
    enrichment: {
      popularity: {
        crowdLevel: 'moderate',      // Not too busy
        localFavorite: true           // Authentic
      },
      vibe: ['romantic', 'intimate', 'upscale']
    }
  },
  {
    name: "Street Food Market",
    type: "restaurant",
    priceLevel: 1,                   // $ (budget)
    rating: 4.5,
    userRatingsTotal: 50,            // Hidden gem
    enrichment: {
      popularity: {
        crowdLevel: 'busy',
        localFavorite: true
      },
      vibe: ['authentic', 'casual', 'local']
    }
  }
]
```

### Step 3: LLM Generates Filters (NEW!)

Instead of hardcoded filters, the LLM analyzes the data and generates appropriate filters:

```typescript
// In UIGenerator prompt
const prompt = `
QUERY ANALYSIS:
- Intent: search
- Category: dining
- Emotion: romantic
- Nature of Travel: romantic

DATA CHARACTERISTICS:
- 10 restaurants found
- Price levels: 1 ($), 2 ($$), 3 ($$$), 4 ($$$$)
- Ratings: 4.0 - 4.9
- Crowd levels: quiet, moderate, busy
- Vibes: romantic, casual, upscale, authentic, local

TASK: Generate filters based on:
1. Query emotion (romantic) - prioritize relevant filters
2. Data characteristics - only show filters that apply to the data
3. User intent - help user refine results

Generate filter chips that:
- Match the romantic emotion (show ambiance-related filters)
- Reflect actual data (don't show "budget" if no budget places)
- Are actionable (clicking filters should refine results)

Example output:
{
  "type": "chip-group",
  "props": {
    "options": [
      { "id": "romantic", "label": "Romantic", "icon": "heart", "selected": true },
      { "id": "intimate", "label": "Intimate", "icon": "candle", "selected": false },
      { "id": "upscale", "label": "Upscale", "icon": "diamond", "selected": false },
      { "id": "quiet", "label": "Quiet", "icon": "volume-off", "selected": false },
      { "id": "local", "label": "Local Favorite", "icon": "star", "selected": false }
    ]
  }
}
`;
```

**LLM Output:**
```json
{
  "components": [
    {
      "id": "filters",
      "type": "chip-group",
      "props": {
        "options": [
          { "id": "romantic", "label": "Romantic", "icon": "heart", "selected": true },
          { "id": "intimate", "label": "Intimate", "icon": "candle" },
          { "id": "upscale", "label": "Upscale", "icon": "diamond" },
          { "id": "quiet", "label": "Quiet", "icon": "volume-off" },
          { "id": "local-favorite", "label": "Local Favorite", "icon": "star" }
        ]
      }
    }
  ]
}
```

---

## 🔗 Connecting Categories to Filters

### The Flow

```
User Query: "romantic restaurants in Paris"
    ↓
QueryAnalysisService
    ├─ Domain: dining
    ├─ Emotion: romantic
    ├─ Vibe: [intimate, quiet]
    └─ Nature: romantic
    ↓
TravelService fetches data
    ├─ 10 restaurants
    ├─ Price levels: $, $$, $$$
    ├─ Vibes: romantic, intimate, upscale, casual
    └─ Crowd: quiet, moderate, busy
    ↓
LLM analyzes query + data
    ├─ Query wants: romantic
    ├─ Data has: romantic, intimate, upscale, quiet, local
    ├─ Decision: Show filters that match emotion + data
    └─ Generate: romantic (selected), intimate, upscale, quiet, local
    ↓
UI renders filters
    [❤️ Romantic] [🕯️ Intimate] [💎 Upscale] [🔇 Quiet] [⭐ Local]
```

### Different Query, Different Filters

**Query: "fun bars in Bangkok"**
```
Emotion: fun
Vibe: [lively, social, energetic]
    ↓
Data has: party, rooftop, live-music, budget, touristy
    ↓
LLM generates:
[🎉 Party] [🎵 Live Music] [🏙️ Rooftop] [💰 Budget] [🌟 Popular]
```

**Query: "peaceful temples in Kyoto"**
```
Emotion: peaceful
Vibe: [serene, quiet, spiritual]
    ↓
Data has: zen, garden, meditation, hidden-gem, traditional
    ↓
LLM generates:
[🧘 Zen] [🌿 Garden] [🤫 Hidden Gem] [🏯 Traditional] [☮️ Peaceful]
```

---

## 📊 Two-Tier System (Simplified)

### Tier 1: Domain (from Query Analysis)
**Purpose:** Route to appropriate data sources
**Examples:** dining, accommodation, activities, transport
**Used by:** TravelService to decide what APIs to call

### Tier 2: Tags (from LLM + Data)
**Purpose:** Filter and sort results
**Examples:** romantic, budget, hidden-gem, quiet, local-favorite
**Used by:** UI filters to refine results

### How They Connect

```typescript
// Query Analysis
{
  categories: ['dining'],           // Tier 1: Domain
  sentiment: {
    emotion: 'romantic',             // Used to generate Tier 2 tags
    vibe: ['intimate', 'quiet']
  }
}

// Data
[
  {
    name: "Restaurant",
    type: "restaurant",              // Matches Tier 1: dining
    enrichment: {
      vibe: ['romantic', 'upscale']  // Becomes Tier 2 tags
    }
  }
]

// LLM-Generated Filters (Tier 2)
{
  filters: [
    { id: 'romantic', label: 'Romantic' },      // From query emotion
    { id: 'intimate', label: 'Intimate' },      // From query vibe
    { id: 'upscale', label: 'Upscale' },        // From data vibe
    { id: 'quiet', label: 'Quiet' }             // From query vibe
  ]
}
```

---

## 🎨 Implementation

### 1. Update UIGenerator Prompt

```typescript
// In src/ui-engine/prompts.ts
export function buildDynamicUIPrompt(
  analysis: QueryAnalysis,
  data: EnrichedPlace[],
  context: DeviceContext,
  capabilities: any
): string {
  // Extract all unique vibes from data
  const dataVibes = new Set<string>();
  data.forEach(place => {
    place.enrichment?.vibe?.forEach(v => dataVibes.add(v));
  });
  
  // Extract query vibes
  const queryVibes = analysis.sentiment.vibe;
  const queryEmotion = analysis.sentiment.emotion;
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILTER GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Query Emotion: ${queryEmotion}
Query Vibes: ${queryVibes.join(', ')}
Data Vibes: ${Array.from(dataVibes).join(', ')}

TASK: Generate filter chips that:
1. Match the query emotion (${queryEmotion})
2. Include query vibes (${queryVibes.join(', ')})
3. Include relevant data vibes (from the list above)
4. Limit to 5-7 most relevant filters
5. Select the primary filter (matching query emotion)

FILTER SELECTION LOGIC:
- If query emotion is in data vibes → select it
- If query vibe is in data vibes → include it
- Add complementary filters from data vibes
- Choose icons that match the vibe:
  * romantic → heart, candle, rose
  * fun → party, music, cocktail
  * peaceful → leaf, spa, meditation
  * luxury → diamond, crown, star
  * budget → cash, wallet, piggy-bank
  * hidden-gem → compass, map, treasure
  * local-favorite → star, heart, thumbs-up
  * quiet → volume-off, moon, zen
  * busy → people, fire, trending

Example:
{
  "type": "chip-group",
  "props": {
    "options": [
      { "id": "romantic", "label": "Romantic", "icon": "heart", "selected": true },
      { "id": "intimate", "label": "Intimate", "icon": "candle" },
      { "id": "upscale", "label": "Upscale", "icon": "diamond" }
    ]
  }
}
`;
}
```

### 2. Delete PlaceCategorizationService

```bash
# No longer needed - LLM does categorization
rm src/services/PlaceCategorizationService.ts
```

### 3. Update TravelService

```typescript
// In TravelService.ts
async searchPlaces(query: string) {
  // 1. Analyze query
  const analysis = await QueryAnalysisService.analyzeQuery(query);
  
  // 2. Fetch data (use Tier 1: domain)
  const places = await this.fetchPlaces(analysis.categories);
  
  // 3. Enrich data (adds vibe tags)
  const enriched = await this.enrichPlaces(places, analysis);
  
  // 4. Generate UI (LLM creates filters from query + data)
  const uiSchema = await UIGenerator.generateUI(query, enriched, analysis);
  
  return { places: enriched, ui: uiSchema };
}
```

---

## 🎯 Filter Behavior

### When User Clicks a Filter

```typescript
// In ComponentRenderer.tsx
const handleFilterClick = (filterId: string) => {
  // Filter places by selected tag
  const filtered = places.filter(place => {
    const placeVibes = place.enrichment?.vibe || [];
    return placeVibes.includes(filterId);
  });
  
  // Update UI
  setFilteredPlaces(filtered);
};
```

### Filter Logic

```typescript
// Example: User clicks "Intimate" filter
const filterId = 'intimate';

// Filter places
const filtered = places.filter(place => {
  const vibes = place.enrichment?.vibe || [];
  return vibes.includes('intimate');
});

// Result: Only shows places with 'intimate' vibe
// [Secret Garden Restaurant, Candlelit Bistro, ...]
```

---

## 📊 Complete Example

### Query: "romantic restaurants in Paris"

**Step 1: Query Analysis**
```json
{
  "intent": "search",
  "categories": ["dining"],
  "sentiment": {
    "emotion": "romantic",
    "vibe": ["intimate", "quiet", "candlelit"]
  },
  "parameters": {
    "destination": "Paris",
    "natureOfTravel": "romantic"
  }
}
```

**Step 2: Data Fetching**
```json
[
  {
    "name": "Le Jules Verne",
    "priceLevel": 4,
    "rating": 4.8,
    "enrichment": {
      "vibe": ["romantic", "upscale", "view", "fine-dining"]
    }
  },
  {
    "name": "Septime",
    "priceLevel": 3,
    "rating": 4.7,
    "enrichment": {
      "vibe": ["intimate", "modern", "local-favorite"]
    }
  },
  {
    "name": "Chez Janou",
    "priceLevel": 2,
    "rating": 4.5,
    "enrichment": {
      "vibe": ["cozy", "traditional", "candlelit"]
    }
  }
]
```

**Step 3: LLM Analyzes**
```
Query wants: romantic, intimate, quiet, candlelit
Data has: romantic, upscale, view, intimate, modern, local-favorite, cozy, traditional, candlelit

Best filters:
1. romantic (query emotion + in data) ✅ SELECT
2. intimate (query vibe + in data) ✅
3. candlelit (query vibe + in data) ✅
4. upscale (in data, matches romantic) ✅
5. cozy (in data, matches romantic) ✅
```

**Step 4: LLM Generates UI**
```json
{
  "components": [
    {
      "type": "chip-group",
      "props": {
        "options": [
          { "id": "romantic", "label": "Romantic", "icon": "heart", "selected": true },
          { "id": "intimate", "label": "Intimate", "icon": "candle" },
          { "id": "candlelit", "label": "Candlelit", "icon": "flame" },
          { "id": "upscale", "label": "Upscale", "icon": "diamond" },
          { "id": "cozy", "label": "Cozy", "icon": "home" }
        ]
      }
    },
    {
      "type": "list",
      "props": {
        "items": [
          { "name": "Le Jules Verne", "vibe": ["romantic", "upscale"], ... },
          { "name": "Septime", "vibe": ["intimate"], ... },
          { "name": "Chez Janou", "vibe": ["cozy", "candlelit"], ... }
        ]
      }
    }
  ]
}
```

**Step 5: User Interaction**
```
User clicks "Intimate" filter
    ↓
Filter places where vibe includes "intimate"
    ↓
Show only: Septime
```

---

## 🎬 Summary

### The Solution

1. **No hardcoded categories** - Delete PlaceCategorizationService
2. **LLM generates filters** - Based on query emotion + data vibes
3. **Filters are tags** - Each place has vibe tags from enrichment
4. **Dynamic and flexible** - Different queries = different filters
5. **User can refine** - Click filters to narrow results

### The Connection

```
Query Analysis (Tier 1: Domain)
    ↓
Fetch Data (using domain)
    ↓
Enrich Data (add vibe tags)
    ↓
LLM Analyzes (query emotion + data vibes)
    ↓
Generate Filters (Tier 2: Tags)
    ↓
User Clicks Filter
    ↓
Filter by Tag
```

### No More Conflicts

- ❌ No "luxury" in multiple places
- ❌ No "budget" confusion
- ❌ No hardcoded category lists
- ✅ LLM decides filters based on context
- ✅ Filters match actual data
- ✅ Flexible for any query

**The LLM is your categorization engine.**

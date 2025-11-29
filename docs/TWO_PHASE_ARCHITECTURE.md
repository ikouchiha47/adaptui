# Two-Phase Architecture: Data Gathering → UI Generation

## 🎯 Your Insight is Correct

**The system has two distinct phases:**

### Phase 1: Data Gathering (ReAct Agent Loop)
- Query analysis
- Multi-source data fetching
- Research agents (ReAct pattern)
- Data enrichment (add vibe tags, crowd levels, etc.)
- **Output:** Enriched data with all context

### Phase 2: UI Generation (LLM-Driven)
- Take enriched data
- Analyze query + data characteristics
- Generate complete UI schema
- **Output:** Ready-to-render UI

**The key:** Phase 1 can use full ReAct agent loops, step-back queries, and complex reasoning. Phase 2 just generates UI from the gathered data.

---

## 📁 Files Affected by Categorization Changes

### ❌ DELETE (1 file)

| File | Reason |
|------|--------|
| `src/services/PlaceCategorizationService.ts` | Hardcoded categorization - LLM does this now |

### ✏️ MODIFY (8 files)

#### 1. **src/services/TravelService.ts**
**Changes:**
- Remove PlaceCategorizationService import
- Remove categorization calls
- Pass raw enriched data to UIGenerator
- Let UIGenerator handle categorization

```typescript
// BEFORE
import { PlaceCategorizationService } from './PlaceCategorizationService';

const categorized = await PlaceCategorizationService.categorize(places, analysis);
const uiSchema = await UIGenerator.generate(categorized);

// AFTER
// No categorization service needed
const uiSchema = await UIGenerator.generate(places, analysis);
```

#### 2. **src/services/UIGenerationService.ts** (or use simplified version)
**Changes:**
- Remove hydration logic (200+ lines)
- Add comprehensive prompt building
- Let LLM generate filters from data
- Pass all data to LLM upfront

```typescript
// BEFORE
const minimalStructure = await llm.generateHybridFromPrompt(prompt);
const hydrated = this.hydrateStructure(minimalStructure, data); // 200 lines

// AFTER
const prompt = this.buildCompletePrompt(analysis, data, context);
const schema = await llm.generateUI(prompt); // LLM does everything
```

#### 3. **src/ui-engine/prompts.ts**
**Changes:**
- Add filter generation instructions
- Add vibe-to-icon mapping guidance
- Add data characteristic analysis
- Add step-back query context

```typescript
// ADD: Filter generation section
export function buildDynamicUIPrompt(...) {
  return `
  FILTER GENERATION:
  Query Emotion: ${analysis.sentiment.emotion}
  Data Vibes: ${extractVibes(data)}
  
  Generate filters that:
  1. Match query emotion
  2. Reflect actual data vibes
  3. Include step-back insights (if available)
  4. Limit to 5-7 most relevant
  `;
}
```

#### 4. **src/services/DataEnrichmentService.ts**
**Changes:**
- Make enrichment pluggable per category
- Register category-specific enrichers
- Fall back to LLM if no enricher registered

```typescript
// NEW: Pluggable enrichment system
interface CategoryEnricher {
  category: string;
  enrich(place: Place, analysis: QueryAnalysis): Promise<string[]>;
}

class DataEnrichmentService {
  private enrichers: Map<string, CategoryEnricher> = new Map();
  
  // Register category-specific enrichers
  registerEnricher(enricher: CategoryEnricher) {
    this.enrichers.set(enricher.category, enricher);
  }
  
  async enrichPlace(place: Place, analysis: QueryAnalysis): Promise<EnrichedPlace> {
    // Get category from analysis
    const category = analysis.categories[0]; // 'dining', 'accommodation', etc.
    
    // Check if we have a registered enricher for this category
    const enricher = this.enrichers.get(category);
    
    let vibes: string[];
    if (enricher) {
      // Use category-specific enricher (e.g., TravelEnricher)
      console.log(`🔧 Using registered enricher for: ${category}`);
      vibes = await enricher.enrich(place, analysis);
    } else {
      // Fall back to LLM-based enrichment
      console.log(`🤖 No enricher for ${category}, using LLM`);
      vibes = await this.llmEnrich(place, analysis);
    }
    
    return {
      ...place,
      enrichment: {
        vibe: vibes,
        popularity: await this.getPopularity(place),
        stepBackInsights: await this.getStepBackInsights(place),
      }
    };
  }
  
  // LLM-based enrichment (fallback)
  private async llmEnrich(place: Place, analysis: QueryAnalysis): Promise<string[]> {
    const prompt = `
Analyze this place and generate vibe tags:

Place: ${JSON.stringify(place)}
Query Emotion: ${analysis.sentiment.emotion}
Query Vibes: ${analysis.sentiment.vibe.join(', ')}

Generate 3-5 vibe tags that describe this place.
Consider: price level, rating, reviews, type, and query emotion.

Return as JSON array: ["tag1", "tag2", "tag3"]
    `;
    
    const response = await this.llm.generateJSON(prompt);
    return JSON.parse(response);
  }
}

// Travel-specific enricher (optional, can be registered)
class TravelEnricher implements CategoryEnricher {
  category = 'dining'; // or 'accommodation', 'activities'
  
  async enrich(place: Place, analysis: QueryAnalysis): Promise<string[]> {
    const vibes: string[] = [];
    
    // From price level
    if (place.priceLevel === 1) vibes.push('budget', 'affordable');
    if (place.priceLevel >= 3) vibes.push('upscale', 'luxury');
    
    // From rating
    if (place.rating >= 4.5 && place.userRatingsTotal < 100) vibes.push('hidden-gem');
    if (place.rating >= 4.5 && place.userRatingsTotal > 1000) vibes.push('popular');
    
    // From query emotion
    if (analysis.sentiment.emotion === 'romantic') {
      if (place.types?.includes('fine_dining')) vibes.push('romantic', 'intimate');
    }
    
    // From crowd intelligence
    if (place.enrichment?.popularity?.crowdLevel === 'quiet') vibes.push('peaceful', 'quiet');
    
    return [...new Set(vibes)];
  }
}

// Register travel enricher (in TravelService initialization)
const enrichmentService = new DataEnrichmentService();
enrichmentService.registerEnricher(new TravelEnricher());
```

#### 5. **src/services/CrowdIntelligenceService.ts**
**Changes:**
- Add vibe tags to crowd score output
- Include step-back query insights
- Add local favorite detection

```typescript
// ADD: Vibe tags to output
async analyzeCrowd(criteria: SearchCriteria): Promise<CrowdScore> {
  return {
    level: 'moderate',
    confidence: 0.85,
    vibes: ['local-favorite', 'authentic', 'busy'], // ADD THIS
    stepBackInsights: await this.getStepBackInsights(criteria), // ADD THIS
  };
}
```

#### 6. **src/services/QueryProcessingService.ts**
**Changes:**
- Add step-back query generation
- Include step-back results in processed query
- Pass step-back context to enrichment

```typescript
// ADD: Step-back queries for better categorization
async processQuery(query: string): Promise<ProcessedQuery> {
  const stepBackQueries = this.generateStepBackQueries(query);
  const stepBackResults = await this.executeStepBackQueries(stepBackQueries);
  
  return {
    original: query,
    expanded: [...],
    decomposition: {...},
    stepBackInsights: stepBackResults, // ADD THIS
  };
}

private generateStepBackQueries(query: string): string[] {
  // "romantic restaurants in Paris" 
  // → "What makes a restaurant romantic?"
  // → "What are characteristics of romantic dining?"
  return [
    `What makes a ${extractType(query)} ${extractEmotion(query)}?`,
    `What are characteristics of ${extractEmotion(query)} ${extractType(query)}?`,
  ];
}
```

#### 7. **src/types/query-analysis.zod.ts**
**Changes:**
- Add stepBackInsights field
- Add vibes array to enrichment types

```typescript
// ADD: Step-back insights
export const QueryAnalysisSchema = z.object({
  intent: IntentSchema,
  categories: z.array(CategorySchema),
  sentiment: SentimentSchema,
  temporal: TemporalSchema,
  parameters: ParametersSchema,
  stepBackInsights: z.array(z.string()).optional(), // ADD THIS
  // ... rest
});
```

#### 8. **src/ui-engine/ComponentRenderer.tsx**
**Changes:**
- Add filter click handler
- Filter places by selected vibe tag
- Update UI when filter changes

```typescript
// ADD: Filter handling
const handleFilterClick = (filterId: string) => {
  const filtered = places.filter(place => {
    const vibes = place.enrichment?.vibe || [];
    return vibes.includes(filterId);
  });
  
  setFilteredPlaces(filtered);
  setSelectedFilter(filterId);
};
```

### ✅ NO CHANGES NEEDED (Keep as-is)

- `QueryAnalysisService.ts` - Already extracts emotion/sentiment
- `QueryRouter.ts` - Already routes queries
- Research agents - Already enrich data
- `RankingService.ts` - Already ranks places
- All UI components - Just render what LLM generates

---

## 🔄 Two-Phase Architecture (Detailed)

### PHASE 1: Data Gathering (ReAct Agent Loop)

```
User Query: "romantic restaurants in Paris"
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Query Analysis                                          │
│ - Extract intent, emotion, parameters                           │
│ - Generate step-back queries                                    │
│   * "What makes a restaurant romantic?"                         │
│   * "What are characteristics of romantic dining?"              │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Execute Step-Back Queries (ReAct Loop)                  │
│ - Search web for "romantic restaurant characteristics"          │
│ - Extract insights: candlelit, intimate, quiet, view, etc.      │
│ - Store in stepBackInsights                                     │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Fetch Places (Multi-Source)                             │
│ - Google Places API                                             │
│ - Web scraping (DDG, Brave)                                     │
│ - Reddit discussions                                            │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Research Agents (ReAct Loop)                            │
│ - PlaceDetailsAgent: Get photos, reviews, details               │
│ - NeighborhoodAgent: Get area context                           │
│ - LocalTipsAgent: Get local insights                            │
│ - CrowdIntelligenceAgent: Get crowd levels, vibes               │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Data Enrichment (Add Vibe Tags)                         │
│ - Analyze price level → budget/luxury tags                      │
│ - Analyze ratings → hidden-gem/popular tags                     │
│ - Analyze crowd level → quiet/busy tags                         │
│ - Apply step-back insights → romantic/intimate tags             │
│ - Combine all → final vibe array                                │
└─────────────────────────────────────────────────────────────────┘
    ↓
OUTPUT: Enriched Data
{
  places: [
    {
      name: "Le Jules Verne",
      priceLevel: 4,
      rating: 4.8,
      enrichment: {
        vibe: ['romantic', 'upscale', 'view', 'fine-dining'],
        popularity: { crowdLevel: 'moderate', localFavorite: false },
        stepBackMatch: ['candlelit', 'intimate', 'view'] // Matches step-back insights
      }
    }
  ],
  stepBackInsights: ['candlelit', 'intimate', 'quiet', 'view', 'ambiance']
}
```

### PHASE 2: UI Generation (LLM-Driven)

```
INPUT: Enriched Data + Query Analysis
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Build Comprehensive Prompt                              │
│ - Include query analysis (emotion, intent)                      │
│ - Include ALL enriched data                                     │
│ - Include step-back insights                                    │
│ - Include device context                                        │
│ - Include capabilities                                          │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: LLM Analyzes                                            │
│ - Query wants: romantic, intimate, quiet                        │
│ - Data has: romantic, upscale, view, intimate, cozy             │
│ - Step-back says: candlelit, ambiance, view are important       │
│ - Decision: Generate filters matching all three sources         │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: LLM Generates Complete UI                               │
│ - Filters: [Romantic, Intimate, Candlelit, View, Upscale]       │
│ - List: All places with vibe tags                               │
│ - Badges: Time, crowd, weather                                  │
│ - Photos: Selected based on romantic intent                     │
│ - Layout: Optimized for device                                  │
└─────────────────────────────────────────────────────────────────┘
    ↓
OUTPUT: Complete UISchema (ready to render)
{
  components: [
    {
      type: "chip-group",
      props: {
        options: [
          { id: "romantic", label: "Romantic", icon: "heart", selected: true },
          { id: "intimate", label: "Intimate", icon: "candle" },
          { id: "candlelit", label: "Candlelit", icon: "flame" },
          { id: "view", label: "Great View", icon: "eye" },
          { id: "upscale", label: "Upscale", icon: "diamond" }
        ]
      }
    },
    {
      type: "list",
      props: {
        items: [...] // All data mapped
      }
    }
  ]
}
```

---

## 🎯 Step-Back Queries for Better Categorization

### What Are Step-Back Queries?

Instead of directly answering "romantic restaurants in Paris", first ask:
- "What makes a restaurant romantic?"
- "What characteristics define romantic dining?"

Then use those insights to better categorize the results.

### Example

**Query:** "fun bars in Bangkok"

**Step-Back Queries:**
1. "What makes a bar fun?"
2. "What are characteristics of fun nightlife?"

**Step-Back Results:**
- Live music
- Social atmosphere
- Games (pool, darts)
- Rooftop/outdoor seating
- Energetic crowd
- Affordable drinks

**Apply to Data:**
```typescript
// Place 1: Sky Bar
{
  name: "Sky Bar",
  enrichment: {
    vibe: ['rooftop', 'view', 'upscale'], // From data
    stepBackMatch: ['rooftop', 'social'] // Matches step-back insights
  }
}
// Final vibe: ['rooftop', 'view', 'upscale', 'social', 'fun'] ✅

// Place 2: Cheap Charlie's
{
  name: "Cheap Charlie's",
  enrichment: {
    vibe: ['budget', 'local', 'outdoor'], // From data
    stepBackMatch: ['social', 'affordable'] // Matches step-back insights
  }
}
// Final vibe: ['budget', 'local', 'outdoor', 'social', 'affordable', 'fun'] ✅
```

### Implementation

```typescript
// In QueryProcessingService.ts
async processQuery(query: string): Promise<ProcessedQuery> {
  // Generate step-back queries
  const stepBackQueries = [
    `What makes a ${type} ${emotion}?`,
    `What are characteristics of ${emotion} ${type}?`,
  ];
  
  // Execute step-back queries (web search)
  const stepBackResults = await Promise.all(
    stepBackQueries.map(q => this.searchWeb(q))
  );
  
  // Extract key characteristics
  const insights = this.extractInsights(stepBackResults);
  // ['candlelit', 'intimate', 'quiet', 'view', 'ambiance']
  
  return {
    original: query,
    stepBackInsights: insights,
  };
}

// In DataEnrichmentService.ts
async enrichPlace(place: Place, stepBackInsights: string[]): Promise<EnrichedPlace> {
  const vibes = this.extractVibes(place);
  
  // Match place characteristics with step-back insights
  const matches = stepBackInsights.filter(insight => 
    this.placeMatchesInsight(place, insight)
  );
  
  return {
    ...place,
    enrichment: {
      vibe: [...vibes, ...matches], // Combine both
      stepBackMatch: matches,
    }
  };
}
```

---

## 🔌 Pluggable Enrichment System

### The Problem with Hardcoded `extractVibes`

**Current approach is travel-specific:**
```typescript
// ❌ Hardcoded for travel
if (place.priceLevel === 1) vibes.push('budget');
if (place.types?.includes('fine_dining')) vibes.push('romantic');
```

**Problems:**
- Only works for travel domain
- Can't handle product comparisons ("DSLR vs mobile camera")
- Can't handle other domains (shopping, services, etc.)
- Hardcoded logic for every emotion/category

### The Solution: Pluggable Enrichers

**Register enrichers per category:**
```typescript
// For travel queries
enrichmentService.registerEnricher(new TravelEnricher());

// For product comparisons (future)
enrichmentService.registerEnricher(new ProductEnricher());

// For shopping (future)
enrichmentService.registerEnricher(new ShoppingEnricher());

// If no enricher registered → fall back to LLM
```

### How It Works

```
Query: "romantic restaurants in Paris"
    ↓
Category: dining
    ↓
Check: Is there an enricher for "dining"?
    ├─ YES → Use TravelEnricher (fast, rule-based)
    └─ NO → Use LLM enrichment (flexible, slower)
```

### Example: Travel Enricher (Optional)

```typescript
class TravelEnricher implements CategoryEnricher {
  category = 'dining';
  
  async enrich(place: Place, analysis: QueryAnalysis): Promise<string[]> {
    const vibes: string[] = [];
    
    // Rule-based logic for travel
    if (place.priceLevel === 1) vibes.push('budget', 'affordable');
    if (place.rating >= 4.5 && place.userRatingsTotal < 100) vibes.push('hidden-gem');
    
    return vibes;
  }
}
```

### Example: LLM Enrichment (Fallback)

```typescript
// No enricher registered for "products"
Query: "compare DSLR vs mobile camera"
    ↓
Category: products
    ↓
No enricher found → Use LLM
    ↓
LLM Prompt:
"Analyze this product and generate vibe tags:
Product: Canon EOS R5
Category: camera
Query: compare DSLR vs mobile camera

Generate tags like: professional, high-quality, expensive, bulky, etc."
    ↓
LLM Output: ["professional", "high-quality", "expensive", "bulky", "versatile"]
```

### Benefits

1. **Travel domain:** Use fast rule-based enricher (TravelEnricher)
2. **Other domains:** Fall back to flexible LLM enrichment
3. **No hardcoding:** Each domain can have its own enricher
4. **Optional:** If you don't register an enricher, LLM handles it
5. **Extensible:** Add new enrichers without changing core code

### Registration Example

```typescript
// In TravelService.ts initialization
const enrichmentService = new DataEnrichmentService();

// Register travel enricher (optional - for performance)
enrichmentService.registerEnricher(new TravelEnricher());

// For other categories, LLM will handle it automatically
// No need to register enrichers for every category
```

### When to Use Each Approach

**Use Registered Enricher (Rule-Based):**
- ✅ Domain is well-defined (travel, dining)
- ✅ Rules are clear (price → budget, rating → hidden-gem)
- ✅ Performance matters (avoid LLM calls)
- ✅ You have domain expertise

**Use LLM Enrichment (Fallback):**
- ✅ Domain is new/unknown (products, services)
- ✅ Rules are complex/unclear
- ✅ Flexibility matters more than speed
- ✅ You want to support any category without coding

### Capability-Based Sub-Tags

**Capabilities can also be enrichers:**
```typescript
class CapabilityEnricher implements CategoryEnricher {
  category = '*'; // Apply to all categories
  
  async enrich(place: Place, analysis: QueryAnalysis): Promise<string[]> {
    const vibes: string[] = [];
    
    // If photos capability enabled
    if (capabilities.photos && place.photos?.length > 5) {
      vibes.push('photogenic', 'instagram-worthy');
    }
    
    // If transport capability enabled
    if (capabilities.transport && place.nearMetro) {
      vibes.push('accessible', 'convenient');
    }
    
    return vibes;
  }
}

// Register as global enricher
enrichmentService.registerEnricher(new CapabilityEnricher());
```

**This is manual for now, but flexible and extensible.**

---

## 📊 Summary

### Files to Change: 8
1. ❌ Delete: `PlaceCategorizationService.ts`
2. ✏️ Modify: `TravelService.ts` - Remove categorization calls
3. ✏️ Modify: `UIGenerationService.ts` - Remove hydration, add comprehensive prompts
4. ✏️ Modify: `prompts.ts` - Add filter generation instructions
5. ✏️ Modify: `DataEnrichmentService.ts` - Add vibe tagging
6. ✏️ Modify: `CrowdIntelligenceService.ts` - Add vibe output
7. ✏️ Modify: `QueryProcessingService.ts` - Add step-back queries
8. ✏️ Modify: `ComponentRenderer.tsx` - Add filter handling

### Two-Phase Architecture
**Phase 1: Data Gathering** (ReAct agents, step-back queries, enrichment)
**Phase 2: UI Generation** (LLM analyzes data + query, generates complete UI)

### Step-Back Queries
- Improve categorization by understanding "what makes X Y?"
- Apply insights to data enrichment
- Better filter generation

### Pluggable Enrichment
- **Travel domain:** Register TravelEnricher (fast, rule-based)
- **Other domains:** Fall back to LLM enrichment (flexible)
- **Capability-based:** Register CapabilityEnricher (cross-domain)
- **Extensible:** Add new enrichers without changing core code

### Capability-Based Tags
- Manual for now (controlled by CapabilityDetector)
- Can be automated later with LLM
- Adds context-specific vibes based on available features

**The system is now fully LLM-driven with intelligent categorization and pluggable enrichment.**

---

## 🏗️ Architecture Summary

### The Pluggable Enrichment Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    DataEnrichmentService                         │
│                                                                  │
│  enrichPlace(place, analysis) {                                 │
│    category = analysis.categories[0]                            │
│                                                                  │
│    if (hasEnricher(category)) {                                 │
│      return enricher.enrich(place, analysis)  // Fast           │
│    } else {                                                     │
│      return llm.enrich(place, analysis)       // Flexible       │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Travel     │    │   Product    │    │     LLM      │
│  Enricher    │    │  Enricher    │    │  Enrichment  │
│              │    │              │    │              │
│ (Registered) │    │  (Future)    │    │  (Fallback)  │
│              │    │              │    │              │
│ Rule-based   │    │ Rule-based   │    │  Flexible    │
│ Fast         │    │ Fast         │    │  Slower      │
│ Travel only  │    │ Products     │    │  Any domain  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Decision Flow

```
Query: "romantic restaurants in Paris"
    ↓
Category: dining
    ↓
Has TravelEnricher? YES
    ↓
Use TravelEnricher (fast, rule-based)
    ↓
Vibes: ['romantic', 'upscale', 'intimate']


Query: "compare DSLR vs mobile camera"
    ↓
Category: products
    ↓
Has ProductEnricher? NO
    ↓
Use LLM Enrichment (flexible, slower)
    ↓
Vibes: ['professional', 'high-quality', 'expensive', 'bulky']
```

### Benefits of This Approach

1. **Performance:** Use fast rule-based enrichers for known domains (travel)
2. **Flexibility:** Fall back to LLM for unknown domains (products, services)
3. **Extensibility:** Add new enrichers without changing core code
4. **Optional:** Don't need enrichers for every category - LLM handles it
5. **No hardcoding:** Each domain can have its own logic
6. **Future-proof:** Easy to add new domains as you expand

### Example: Adding Product Enricher (Future)

```typescript
class ProductEnricher implements CategoryEnricher {
  category = 'products';
  
  async enrich(product: Product, analysis: QueryAnalysis): Promise<string[]> {
    const vibes: string[] = [];
    
    // Product-specific rules
    if (product.price > 1000) vibes.push('expensive', 'premium');
    if (product.rating >= 4.5) vibes.push('high-quality', 'reliable');
    if (product.weight > 1000) vibes.push('bulky', 'heavy');
    
    return vibes;
  }
}

// Register it
enrichmentService.registerEnricher(new ProductEnricher());
```

**No changes to core DataEnrichmentService needed!**

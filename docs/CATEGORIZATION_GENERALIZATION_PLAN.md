# Categorization Generalization Plan

## Current State Analysis

### 1. Query Analysis Categories (from LLM)
**Location:** `src/types/query-analysis.zod.ts`

```typescript
categories: ['dining', 'accommodation', 'activities', 'transport', 'shopping', 'entertainment']
```

**Purpose:** High-level intent classification - what TYPE of thing the user is looking for

### 2. Place Categories (hardcoded)
**Location:** `src/services/PlaceCategorizationService.ts`

```typescript
category: ['offbeat', 'touristy', 'luxury', 'budget', 'hidden-gem']
```

**Purpose:** Experience classification - what KIND of experience this place offers

### 3. Nature of Travel (from LLM)
**Location:** `src/types/query-analysis.zod.ts`

```typescript
natureOfTravel: ['romantic', 'family', 'business', 'solo', 'adventure', 'luxury', 'budget']
```

**Purpose:** Travel style classification - HOW the user wants to travel

---

## The Problem

**Three different categorization systems that don't align:**

1. **Query Categories** → What you're searching for (dining, activities, etc.)
2. **Place Categories** → What experience level (touristy, hidden-gem, etc.)
3. **Nature of Travel** → What travel style (luxury, budget, etc.)

**Conflicts:**
- "luxury" appears in both Place Categories AND Nature of Travel
- "budget" appears in both Place Categories AND Nature of Travel
- No clear mapping between Query Categories and Place Categories
- Filters don't align with any category system
- **System is travel-focused** - doesn't handle product comparisons (e.g., "DSLR vs mobile camera")

---

## Proposed Solution: Intent-Based Routing + Two-Tier Categorization

### Step 1: Intent Detection (Already Supported!)
**What:** Detect query intent FIRST
**Source:** LLM Query Analysis (already in schema)
**Intents:** `search`, `browse`, `compare`, `book`, `navigate`, `plan`

**Routing Logic:**
```typescript
if (intent === 'compare') {
  → Route to ComparisonService
  → Use comparison-specific categorization
} else if (intent === 'search') {
  → Route to TravelService
  → Use place-based categorization
}
```

### Step 2A: For Search/Browse Intents (Travel Domain)

#### Tier 1: Domain Categories (from Query Analysis)
**What:** High-level domain classification
**Source:** LLM Query Analysis
**Examples:** dining, accommodation, activities, entertainment
**Use:** Determines what type of search to perform

#### Tier 2: Experience Tags (from Place Categorization)
**What:** Experience-level tags that apply across ALL domains
**Source:** Hybrid (Rule-based + LLM)
**Examples:** 
- `popularity`: offbeat, hidden-gem, popular, touristy
- `price`: budget, mid-range, luxury
- `vibe`: romantic, fun, peaceful, energetic
- `authenticity`: local-favorite, tourist-trap, authentic

**Use:** Filters and sorts results within a domain

### Step 2B: For Compare Intent (Product/Service Domain)

#### Tier 1: Comparison Domain
**What:** What type of things are being compared
**Source:** LLM Query Analysis
**Examples:** 
- `technology`: cameras, phones, laptops
- `travel`: destinations, hotels, airlines
- `services`: apps, platforms, tools

#### Tier 2: Comparison Dimensions
**What:** What aspects to compare
**Source:** LLM-generated based on domain
**Examples for "DSLR vs mobile camera":**
```typescript
{
  domain: 'technology',
  subDomain: 'photography',
  items: [
    { name: 'DSLR Camera', type: 'camera' },
    { name: 'Mobile Phone Camera', type: 'camera' }
  ],
  dimensions: [
    { name: 'Image Quality', weight: 0.9 },
    { name: 'Portability', weight: 0.8 },
    { name: 'Price', weight: 0.7 },
    { name: 'Ease of Use', weight: 0.6 },
    { name: 'Features', weight: 0.5 }
  ],
  suggestedUIType: 'comparison' // side-by-side table
}
```

---

## How Comparison Routing Works

### Current System (QueryRouter.ts)
The QueryRouter already routes based on query content, but doesn't check `intent` from QueryAnalysis.

### Proposed Enhancement
```typescript
// In TravelService or new QueryOrchestrator
async processQuery(query: string) {
  // 1. Analyze query intent
  const analysis = await QueryAnalysisService.analyzeQuery(query);
  
  // 2. Route based on intent
  if (analysis.intent === 'compare') {
    // Route to ComparisonService
    return await ComparisonService.handleComparison(query, analysis);
  } 
  else if (analysis.intent === 'search' || analysis.intent === 'browse') {
    // Route to TravelService (current flow)
    return await TravelService.searchPlaces(query, analysis);
  }
  else if (analysis.intent === 'plan') {
    // Route to ItineraryService
    return await ItineraryService.createPlan(query, analysis);
  }
  // ... other intents
}
```

### ComparisonService (New)
```typescript
class ComparisonService {
  static async handleComparison(query: string, analysis: QueryAnalysisType) {
    // 1. Extract comparison items
    const items = this.extractComparisonItems(query);
    
    // 2. Determine comparison domain
    const domain = this.detectDomain(items, analysis);
    
    // 3. Generate comparison dimensions (LLM)
    const dimensions = await this.generateDimensions(items, domain);
    
    // 4. Fetch data for each item
    const data = await this.fetchComparisonData(items, dimensions);
    
    // 5. Generate comparison UI
    return {
      type: 'comparison',
      items,
      dimensions,
      data,
      suggestedUIType: 'comparison-table'
    };
  }
  
  private static detectDomain(items: any[], analysis: QueryAnalysisType): string {
    // Check if travel-related
    if (analysis.categories.some(c => ['dining', 'accommodation', 'activities'].includes(c))) {
      return 'travel';
    }
    
    // Check for product keywords
    if (items.some(i => ['camera', 'phone', 'laptop'].includes(i.type))) {
      return 'technology';
    }
    
    // Default to general comparison
    return 'general';
  }
}
```

---

## Implementation Plan

### Phase 1: Add Logging (Immediate)
**Goal:** Understand what the LLM is actually returning

```typescript
// In QueryAnalysisService.ts
console.log('📊 [QueryAnalysis] Categories from LLM:', analysis.categories);
console.log('🎭 [QueryAnalysis] Nature of Travel:', analysis.parameters.natureOfTravel);
console.log('💰 [QueryAnalysis] Filters:', analysis.parameters.filters);
console.log('😊 [QueryAnalysis] Sentiment:', analysis.sentiment);
```

### Phase 2: Refactor Place Categories (Next)
**Goal:** Make place categories into multi-dimensional tags

**Current:**
```typescript
type PlaceCategory = 'offbeat' | 'touristy' | 'luxury' | 'budget' | 'hidden-gem';
```

**Proposed:**
```typescript
interface PlaceTags {
  popularity: 'offbeat' | 'hidden-gem' | 'popular' | 'touristy';
  price: 'budget' | 'mid-range' | 'upscale' | 'luxury';
  vibe: string[]; // ['romantic', 'fun', 'peaceful', etc.]
  authenticity: 'local-favorite' | 'mixed' | 'tourist-oriented';
  crowdLevel: 'quiet' | 'moderate' | 'busy' | 'packed';
}
```

### Phase 3: Align Filters with Tags
**Goal:** Make UI filters match the tag system

**Current Filters:**
```typescript
filters: {
  priceRange: string | null;
  rating: number | null;
  cuisine: string | null;
  amenities: string[] | null;
  openNow: boolean | null;
}
```

**Proposed Filters:**
```typescript
filters: {
  // From Query Analysis
  priceRange: 'budget' | 'mid-range' | 'upscale' | 'luxury' | null;
  rating: number | null;
  openNow: boolean | null;
  
  // From Place Tags
  popularity: 'offbeat' | 'hidden-gem' | 'popular' | 'touristy' | null;
  vibe: string[] | null; // ['romantic', 'fun', etc.]
  crowdLevel: 'quiet' | 'moderate' | 'busy' | 'packed' | null;
  
  // Domain-specific
  cuisine: string | null; // Only for dining
  amenities: string[] | null; // Only for accommodation
}
```

### Phase 4: Update UI Generation
**Goal:** Generate filter chips that match the tag system

**Example:**
```typescript
// For "fun bars in Bangkok"
filters: [
  { type: 'popularity', options: ['hidden-gem', 'popular', 'touristy'] },
  { type: 'price', options: ['budget', 'mid-range', 'upscale'] },
  { type: 'vibe', options: ['fun', 'romantic', 'energetic'] },
  { type: 'crowdLevel', options: ['quiet', 'moderate', 'busy'] }
]
```

---

## Benefits

### 1. Consistency
- Same tag system across all domains (dining, activities, etc.)
- Filters match tags exactly
- No conflicts between systems

### 2. Flexibility
- Multi-dimensional tagging (a place can be "luxury" + "hidden-gem" + "romantic")
- Domain-specific filters still possible
- Easy to add new dimensions

### 3. LLM-Friendly
- LLM can suggest tags based on query intent
- Tags are semantic and understandable
- Can override with LLM intelligence

### 4. User-Friendly
- Clear filter options
- Intuitive categories
- Consistent across all searches

---

## Questions to Answer (via Logging)

1. **What categories does the LLM return for different queries?**
   - "fun bars in Bangkok" → ?
   - "romantic restaurants in Paris" → ?
   - "budget hotels in Tokyo" → ?

2. **How does natureOfTravel relate to place categories?**
   - If natureOfTravel = "luxury", should all places be luxury?
   - Or should it just influence ranking?

3. **What filters does the LLM suggest?**
   - Does it populate priceRange?
   - Does it set rating thresholds?
   - Does it use amenities?

4. **How does sentiment.vibe relate to place categories?**
   - If vibe = ["lively", "social"], should places be "touristy" or "popular"?
   - Or is vibe orthogonal to popularity?

---

## Next Steps

### Phase 0: Test Intent Detection
1. ✅ **Add comprehensive logging** to QueryAnalysisService
2. � **Rnun comparison queries** to see if LLM returns `intent: 'compare'`
3. 📊 **Analyze what the LLM returns** for comparison queries

### Phase 1: Travel Domain (Current Focus)
1. 🔨 **Refactor PlaceCategorizationService** to use tags
2. 🎨 **Update UI generation** to match tag system
3. ✅ **Test with travel queries**

### Phase 2: Comparison Domain (Future)
1. 🆕 **Create ComparisonService** (if LLM detects compare intent)
2. 🔨 **Build comparison-specific categorization**
3. 🎨 **Create comparison UI components** (side-by-side tables)
4. ✅ **Test with product comparison queries**

---

## Test Queries to Run

### Travel Queries (intent: 'search')
```typescript
"fun bars in Bangkok"
"romantic restaurants in Paris"
"budget hotels in Tokyo"
"luxury spa in Bali"
"family activities in London"
"hidden gem cafes in Seoul"
"peaceful temples in Kyoto"
"energetic nightlife in Berlin"
"authentic street food in Bangkok"
"touristy attractions in Rome"
"cheap eats in Bangkok"
"expensive restaurants in Paris"
"affordable hotels in Tokyo"
```

### Comparison Queries (intent: 'compare')
```typescript
// Product comparisons
"compare DSLR vs mobile camera"
"iPhone vs Samsung camera quality"
"mirrorless vs DSLR for travel"

// Travel comparisons
"compare Bangkok vs Chiang Mai for digital nomads"
"Phuket vs Krabi beaches"
"luxury hotels vs boutique hotels in Paris"

// Service comparisons
"Airbnb vs hotels for families"
"Grab vs taxi in Bangkok"
"train vs flight Bangkok to Chiang Mai"
```

---

## Expected Outcomes

### For Travel Queries (intent: 'search')

After logging and analysis, we should be able to:

1. **Map Query Categories → Place Tags**
   - dining + fun → popularity: popular, vibe: [fun, social]
   - dining + romantic → popularity: hidden-gem, vibe: [romantic, intimate]

2. **Map Nature of Travel → Tag Filters**
   - luxury → price: luxury, crowdLevel: moderate
   - budget → price: budget, authenticity: local-favorite

3. **Map Sentiment → Vibe Tags**
   - emotion: fun, vibe: [lively, social] → vibe: [fun, energetic, social]
   - emotion: romantic, vibe: [intimate] → vibe: [romantic, intimate, peaceful]

4. **Generate Consistent Filters**
   - All filters derived from tags
   - No hardcoded category lists
   - LLM can suggest custom tags

### For Comparison Queries (intent: 'compare')

After implementing ComparisonService, we should be able to:

1. **Detect Comparison Intent**
   - "compare X vs Y" → intent: 'compare'
   - "X or Y for Z" → intent: 'compare'
   - "which is better X or Y" → intent: 'compare'

2. **Extract Comparison Items**
   ```typescript
   // "compare DSLR vs mobile camera"
   {
     items: [
       { name: 'DSLR Camera', type: 'camera', category: 'technology' },
       { name: 'Mobile Camera', type: 'camera', category: 'technology' }
     ]
   }
   ```

3. **Generate Comparison Dimensions**
   ```typescript
   // LLM determines relevant dimensions based on domain
   {
     domain: 'technology/photography',
     dimensions: [
       { name: 'Image Quality', type: 'rating', weight: 0.9 },
       { name: 'Portability', type: 'rating', weight: 0.8 },
       { name: 'Price', type: 'range', weight: 0.7 },
       { name: 'Ease of Use', type: 'rating', weight: 0.6 },
       { name: 'Low Light Performance', type: 'rating', weight: 0.8 },
       { name: 'Video Quality', type: 'rating', weight: 0.7 }
     ]
   }
   ```

4. **Generate Comparison UI**
   - Side-by-side table
   - Pros/cons lists
   - Feature matrix
   - Winner badges per dimension

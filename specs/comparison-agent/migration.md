# TravelService Migration to CategoryOrchestrator Pattern

## Overview

TravelService already follows the orchestrator pattern. The migration is about **extracting the common pattern** into a base class, not rewriting TravelService.

## Current TravelService Structure

```typescript
export class TravelService {
  private llm: LLMProvider;
  private placesAPI: PlacesAPIService;
  private photosService: PlacesPhotoService;
  private transportService: TransportService;
  private rankingService: RankingService;
  private capabilities: CapabilityContext | null = null;

  async generateRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    // 1. Check cache
    const cached = await CacheService.get(...);
    if (cached) return cached;
    
    // 2. Initialize capabilities
    if (!this.capabilities) {
      this.capabilities = await CapabilityDetector.detectCapabilities();
    }
    
    // 3. Analyze intent
    const intent = await this.analyzeIntent(query);
    
    // 4. Fetch data
    const recommendations = query.advancedMode 
      ? await this.generateAdvancedRecommendations(query)
      : await this.generateLLMOnlyRecommendations(query);
    
    // 5. Add transport
    await this.addTransportOptionsToCity(recommendations, query.location);
    
    // 6. Validate with search
    if (query.useRealData) {
      recommendations = await this.validateWithSearch(recommendations, intent);
    }
    
    // 7. Rank
    recommendations = await this.rankRecommendations(recommendations, query);
    
    // 8. Cache
    await CacheService.set(..., recommendations);
    
    return recommendations;
  }
}
```

## After Migration

### Step 1: Create Base Class

```typescript
// src/services/base/CategoryOrchestrator.ts
export abstract class CategoryOrchestrator<TQuery, TResult> {
  protected llm: LLMProvider;
  protected cacheService: typeof CacheService;
  protected capabilities: CapabilityContext | null = null;
  
  constructor() {
    this.llm = LLMProviderFactory.getProvider();
    this.cacheService = CacheService;
  }
  
  // Abstract methods - subclasses implement these
  protected abstract analyzeIntent(query: TQuery): Promise<any>;
  protected abstract fetchData(query: TQuery, intent: any): Promise<any>;
  protected abstract enrichData(data: any, intent: any): Promise<any>;
  protected abstract rankData(data: any, query: TQuery): Promise<TResult>;
  protected abstract generateCacheKey(query: TQuery): Promise<string>;
  protected abstract validateCache(cached: TResult): boolean;
  
  // Concrete orchestration - same for all categories
  async process(query: TQuery): Promise<TResult> {
    console.log(`[${this.constructor.name}] Starting processing...`);
    
    // 1. Check cache
    const cacheKey = await this.generateCacheKey(query);
    const cached = await this.cacheService.get<TResult>('recommendations', cacheKey);
    
    if (cached && this.validateCache(cached)) {
      console.log(`[${this.constructor.name}] Cache hit`);
      return cached;
    }
    
    // 2. Initialize capabilities
    if (!this.capabilities) {
      this.capabilities = await CapabilityDetector.detectCapabilities();
    }
    
    // 3. Analyze intent
    console.log(`[${this.constructor.name}] Step 1: Analyzing intent...`);
    const intent = await this.analyzeIntent(query);
    
    // 4. Fetch data
    console.log(`[${this.constructor.name}] Step 2: Fetching data...`);
    const rawData = await this.fetchData(query, intent);
    
    // 5. Enrich data
    console.log(`[${this.constructor.name}] Step 3: Enriching data...`);
    const enrichedData = await this.enrichData(rawData, intent);
    
    // 6. Rank data
    console.log(`[${this.constructor.name}] Step 4: Ranking data...`);
    const result = await this.rankData(enrichedData, query);
    
    // 7. Cache result
    await this.cacheService.set('recommendations', cacheKey, result);
    console.log(`[${this.constructor.name}] Complete`);
    
    return result;
  }
}
```

### Step 2: Refactor TravelService

```typescript
// src/services/TravelService.ts
export class TravelService extends CategoryOrchestrator<TravelQuery, TravelRecommendation[]> {
  private placesAPI: PlacesAPIService;
  private photosService: PlacesPhotoService | null;
  private transportService: TransportService;
  private rankingService: RankingService;

  constructor() {
    super(); // Call base constructor
    
    const googlePlacesKey = configManager.getApiKeyOrNull('googlePlaces');
    this.placesAPI = new PlacesAPIService(googlePlacesKey || undefined);
    this.photosService = googlePlacesKey ? new PlacesPhotoService(googlePlacesKey) : null;
    this.transportService = new TransportService(googlePlacesKey || undefined);
    this.rankingService = new RankingService();
  }

  // Keep the public API the same
  async generateRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    return this.process(query); // Delegate to base class
  }

  // Implement abstract methods
  protected async analyzeIntent(query: TravelQuery): Promise<any> {
    const prompt = `Analyze this travel query: ...`;
    const text = await this.llm.generateJSON(prompt, 0.3);
    return JSON.parse(text);
  }

  protected async fetchData(query: TravelQuery, intent: any): Promise<any> {
    if (query.advancedMode) {
      return await this.generateAdvancedRecommendations(query);
    } else {
      return await this.generateLLMOnlyRecommendations(query);
    }
  }

  protected async enrichData(data: any, intent: any): Promise<any> {
    // Add transport
    if (this.capabilities?.capabilities.transport && this.capabilities?.userLocation) {
      await this.addTransportOptionsToCity(data, intent.location);
    }
    
    // Validate with search
    if (intent.useRealData) {
      data = await this.validateWithSearch(data, intent);
    }
    
    return data;
  }

  protected async rankData(data: any, query: TravelQuery): Promise<TravelRecommendation[]> {
    return await this.rankRecommendations(data, query);
  }

  protected async generateCacheKey(query: TravelQuery): Promise<string> {
    const cacheKeyString = `${query.location || 'any'}_${query.feeling || 'any'}_${query.budget || 'mid'}${query.advancedMode ? '_advanced' : ''}`;
    const hash = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      cacheKeyString
    );
    return hash.substring(0, 10);
  }

  protected validateCache(cached: TravelRecommendation[]): boolean {
    return cached.every(rec => {
      if (!rec.coordinates) return false;
      const highlightsWithCoords = rec.highlights.filter((h: any) => h.latitude && h.longitude);
      return highlightsWithCoords.length > 0;
    });
  }

  // Keep all existing private methods unchanged
  private async generateAdvancedRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    // ... existing implementation
  }

  private async generateLLMOnlyRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
    // ... existing implementation
  }

  private async addTransportOptionsToCity(recommendations: TravelRecommendation[], destinationCity: string): Promise<void> {
    // ... existing implementation
  }

  private async validateWithSearch(recommendations: TravelRecommendation[], intent: any): Promise<TravelRecommendation[]> {
    // ... existing implementation
  }

  private async rankRecommendations(recommendations: TravelRecommendation[], query: TravelQuery): Promise<TravelRecommendation[]> {
    // ... existing implementation
  }

  // ... all other private methods unchanged
}
```

## What Changes?

### ✅ Minimal Changes

1. **Add `extends CategoryOrchestrator<TravelQuery, TravelRecommendation[]>`**
2. **Change `generateRecommendations()` to call `this.process(query)`**
3. **Extract orchestration logic into protected methods**:
   - `analyzeIntent()` - already exists as `analyzeIntent()`
   - `fetchData()` - wraps `generateAdvancedRecommendations()` / `generateLLMOnlyRecommendations()`
   - `enrichData()` - wraps `addTransportOptionsToCity()` + `validateWithSearch()`
   - `rankData()` - wraps `rankRecommendations()`
   - `generateCacheKey()` - already exists
   - `validateCache()` - extract from cache validation logic

### ❌ No Changes

1. **All private methods stay the same** - `generateAdvancedRecommendations()`, `clusterPlacesByProximity()`, etc.
2. **All dependencies stay the same** - `placesAPI`, `photosService`, `transportService`, `rankingService`
3. **Public API stays the same** - `generateRecommendations(query)` still works
4. **No changes to callers** - Existing code using TravelService doesn't change

## Benefits

1. **Reusable pattern** - ComparisonOrchestrator, ShoppingOrchestrator can use the same base
2. **Consistent logging** - All orchestrators log the same way
3. **Consistent caching** - All orchestrators cache the same way
4. **Easier testing** - Can test orchestration logic separately from domain logic
5. **Clear separation** - Orchestration (base class) vs domain logic (subclass)

## Migration Steps

### Phase 1: Create Base Class (No Breaking Changes)

```bash
# Create new file
touch src/services/base/CategoryOrchestrator.ts

# Implement base class
# No changes to existing code yet
```

### Phase 2: Refactor TravelService (Backward Compatible)

```typescript
// Keep old method as wrapper
async generateRecommendations(query: TravelQuery): Promise<TravelRecommendation[]> {
  return this.process(query); // Delegate to base class
}

// All existing code still works
```

### Phase 3: Add ComparisonOrchestrator (New Feature)

```bash
# Create new orchestrator
touch src/services/comparison/ComparisonOrchestrator.ts

# Implements same pattern as TravelService
# No changes to TravelService
```

### Phase 4: (Optional) Add More Orchestrators

```bash
# Shopping
touch src/services/shopping/ShoppingOrchestrator.ts

# Research
touch src/services/research/ResearchOrchestrator.ts

# All follow the same pattern
```

## Testing Strategy

### Test Base Class

```typescript
describe('CategoryOrchestrator', () => {
  it('should cache results', async () => {
    const orchestrator = new TestOrchestrator();
    const result1 = await orchestrator.process(query);
    const result2 = await orchestrator.process(query);
    expect(result1).toBe(result2); // Same instance from cache
  });

  it('should initialize capabilities', async () => {
    const orchestrator = new TestOrchestrator();
    await orchestrator.process(query);
    expect(orchestrator.capabilities).toBeDefined();
  });

  it('should call methods in order', async () => {
    const orchestrator = new TestOrchestrator();
    const spy = jest.spyOn(orchestrator, 'analyzeIntent');
    await orchestrator.process(query);
    expect(spy).toHaveBeenCalledBefore(orchestrator.fetchData);
  });
});
```

### Test TravelService (Existing Tests Still Work)

```typescript
describe('TravelService', () => {
  it('should generate recommendations', async () => {
    const service = new TravelService();
    const recommendations = await service.generateRecommendations(query);
    expect(recommendations).toHaveLength(3);
  });

  // All existing tests still pass
});
```

## File Structure After Migration

```
src/
├── services/
│   ├── base/
│   │   └── CategoryOrchestrator.ts          # NEW: Base class
│   ├── TravelService.ts                     # MODIFIED: Extends base class
│   ├── comparison/
│   │   ├── ComparisonOrchestrator.ts        # NEW: Extends base class
│   │   ├── ReActAgent.ts
│   │   └── tools/
│   │       ├── HiddenWebViewScraper.ts
│   │       └── DataExtractor.ts
│   └── shopping/                            # FUTURE
│       └── ShoppingOrchestrator.ts
```

## Summary

**TravelService changes are minimal:**
- Extends `CategoryOrchestrator<TravelQuery, TravelRecommendation[]>`
- Implements 6 abstract methods (mostly extracting existing code)
- Delegates `generateRecommendations()` to `this.process()`
- All private methods stay unchanged
- Public API stays unchanged
- All existing tests still pass

**The pattern enables:**
- ComparisonOrchestrator (new)
- ShoppingOrchestrator (future)
- ResearchOrchestrator (future)
- All following the same proven pattern

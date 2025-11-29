# Simplification Needed - TravelService Flow

## Current Problems

### 1. Original Query is Lost ❌
```typescript
User types: "fun bars in Bangkok"
↓
QueryAnalysis extracts: { emotion: "fun", destination: "Bangkok" }
↓
AdaptUI passes: { feeling: "fun", location: "Bangkok" }
↓
TravelService builds: "fun in Bangkok" // ❌ Lost "bars"!
```

### 2. Redundant Intent Analysis
- `QueryAnalysisService` already analyzes intent
- `TravelService.analyzeIntent()` does it again
- Both extract similar data (emotion, categories, etc.)

### 3. Manual JSON Parsing
```typescript
const intentText = await this.llm.generateJSON(intentPrompt);
const intent = JSON.parse(intentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
```
Should use structured responses instead!

## Solutions Applied

### ✅ Fix 1: Pass Original Query
**File:** `src/screens/AdaptUIScreen.tsx`
```typescript
const places = await travelService.generateRecommendations({
  originalQuery: query, // ✅ Pass actual user query
  location: queryAnalysis.parameters.destination,
  feeling: queryAnalysis.sentiment.emotion, // Deprecated
  advancedMode: true,
});
```

**File:** `src/services/TravelService.ts`
```typescript
export interface TravelQuery {
  originalQuery?: string; // ✅ The actual user query
  location?: string;
  feeling?: string; // Deprecated
  // ...
}

// In generateAdvancedRecommendations:
const originalQuery = query.originalQuery || 
  `${query.feeling || 'interesting places'} in ${query.location || 'the area'}`;
```

### 🔄 TODO: Remove Redundant Intent Analysis
The `analyzeIntent()` method in TravelService duplicates what QueryAnalysisService already does.

**Recommendation:**
- Remove `TravelService.analyzeIntent()`
- Use `QueryAnalysisService` results directly
- Pass analysis results to TravelService if needed

### 🔄 TODO: Use Structured Responses
Replace manual JSON parsing with OpenAICore's structured response API:

**Before:**
```typescript
const intentText = await this.llm.generateJSON(intentPrompt);
const intent = JSON.parse(intentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
```

**After:**
```typescript
const intent = await this.llm.generateJSON(intentPrompt, 0.5, intentSchema);
// Returns parsed object directly
```

## Simplified Flow (Proposed)

```
User Query: "fun bars in Bangkok"
↓
QueryAnalysisService (already done)
  - Extracts: establishments: ["bar"], keywords: ["fun", "bars"]
↓
TravelService.generateRecommendations({ originalQuery: "fun bars in Bangkok" })
  - QueryProcessingService expands: "fun bars" → "hidden gem bars", "local bars", etc.
  - Google Places searches: "bars in Bangkok", "fun bars Bangkok", etc.
  - Ranking prioritizes: places with type="bar"
↓
Results: Actual bars! 🍺
```

## Benefits
1. **No data loss** - Original query preserved throughout
2. **Less duplication** - Single intent analysis
3. **Cleaner code** - Structured responses, no manual parsing
4. **Better results** - "bars" keyword preserved in all searches

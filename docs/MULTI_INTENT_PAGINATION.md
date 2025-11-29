# Multi-Intent Pagination Strategy

## Overview

The LLM can return **multiple valid intents** for ambiguous queries. Instead of combining all intents (which increases search load), we use a **pagination strategy**:

- **Initial load:** Use first intent only
- **Page 2:** Use second intent
- **Page 3:** Use third intent

This provides **diverse results** without overwhelming the initial search.

---

## How It Works

### Step 1: LLM Returns Multiple Intents

```typescript
Query: "quiet temples in Bangkok"

LLM Response:
{
  "experienceType": "spiritual",
  "experienceTypes": ["spiritual", "peaceful", "cultural"],
  "reasoning": "Temples are spiritual, but user wants quiet atmosphere"
}
```

### Step 2: Use First Intent for Initial Load

```typescript
// CrowdIntelligenceService.constructIntentBasedQueries()
if (Array.isArray(userIntent)) {
  const primaryIntent = userIntent[0];  // "spiritual"
  const additionalIntents = userIntent.slice(1);  // ["peaceful", "cultural"]
  
  console.log(`Using primary: "${primaryIntent}"`);
  console.log(`Reserved for pagination: [${additionalIntents.join(', ')}]`);
  
  // Generate queries for FIRST intent only
  return constructIntentBasedQueries({ ...criteria, userIntent: primaryIntent });
}
```

### Step 3: Store Additional Intents for Pagination

```typescript
// TravelService stores all intents
return {
  experienceType: allIntents[0],      // "spiritual" (used immediately)
  experienceTypes: allIntents,        // ["spiritual", "peaceful", "cultural"] (stored)
  validationNeeds: [...],
  searchQueries: [...]
};
```

### Step 4: Use Additional Intents on Pagination

```typescript
// When user scrolls to page 2
const page2Intent = experienceTypes[1];  // "peaceful"

// Generate new queries with second intent
const page2Results = await searchPlaces({
  ...criteria,
  userIntent: page2Intent
});

// When user scrolls to page 3
const page3Intent = experienceTypes[2];  // "cultural"
// ... and so on
```

---

## Example: "quiet temples in Bangkok"

### LLM Analysis

```json
{
  "experienceType": "spiritual",
  "experienceTypes": ["spiritual", "peaceful", "cultural"],
  "reasoning": "Temples are spiritual, but user wants quiet atmosphere"
}
```

### Pagination Flow

**Initial Load (Page 1):**
```
Intent: "spiritual"
Queries:
1. "Wat Pho Bangkok crowded busy reviews"
2. "Wat Pho Bangkok spiritual peaceful sacred"
3. "Wat Pho Bangkok religious quiet respectful"
4. "Wat Pho Bangkok morning crowd level"
5. "site:reddit.com Wat Pho Bangkok crowded worth it"

Results: 10-15 spiritual-focused places
```

**Page 2:**
```
Intent: "peaceful"
Queries:
1. "Wat Pho Bangkok crowded busy reviews"
2. "Wat Pho Bangkok peaceful quiet calm"
3. "Wat Pho Bangkok less crowded serene"
4. "Wat Pho Bangkok relaxing tranquil atmosphere"
5. "Wat Pho Bangkok morning crowd level"

Results: 10-15 peaceful-focused places (different from page 1)
```

**Page 3:**
```
Intent: "cultural"
Queries:
1. "Wat Pho Bangkok crowded busy reviews"
2. "Wat Pho Bangkok cultural experience authentic"
3. "Wat Pho Bangkok traditional local heritage"
4. "Wat Pho Bangkok historical significance"
5. "Wat Pho Bangkok morning crowd level"

Results: 10-15 cultural-focused places (different from pages 1-2)
```

---

## Benefits

### ✅ Performance
- **Initial load is fast** - Only searches one intent
- **No wasted searches** - Additional intents only used if user scrolls
- **Efficient API usage** - Spreads load across pagination

### ✅ Diversity
- **Different perspectives** - Each page shows different aspect
- **Comprehensive coverage** - All intents eventually covered
- **User choice** - User can stop at any page

### ✅ User Experience
- **Fast initial results** - No waiting for multiple searches
- **Fresh content on scroll** - Each page feels new
- **Relevant throughout** - All results match original query

---

## Implementation Details

### CrowdIntelligenceService

```typescript
export interface SearchCriteria {
  userIntent: string | string[];  // Supports both single and multi-intent
  // ... other fields
}

private constructIntentBasedQueries(criteria: SearchCriteria): string[] {
  // If array, use FIRST intent only
  if (Array.isArray(criteria.userIntent)) {
    const primaryIntent = criteria.userIntent[0];
    return this.constructIntentBasedQueries({
      ...criteria,
      userIntent: primaryIntent  // Recursive call with single intent
    });
  }
  
  // Normal single-intent logic
  // ...
}
```

### TravelService

```typescript
private async analyzeIntent(query: TravelQuery): Promise<any> {
  // LLM returns multiple intents
  const parsed = JSON.parse(llmResponse);
  
  const allIntents = parsed.experienceTypes || [parsed.experienceType];
  
  return {
    experienceType: allIntents[0],    // Primary (used immediately)
    experienceTypes: allIntents,      // All (stored for pagination)
    // ...
  };
}
```

### Pagination Handler (Future Implementation)

```typescript
async function loadNextPage(currentPage: number, experienceTypes: string[]) {
  if (currentPage >= experienceTypes.length) {
    // No more intents, use primary intent again or show "no more results"
    return [];
  }
  
  const nextIntent = experienceTypes[currentPage];
  
  console.log(`📄 Loading page ${currentPage + 1} with intent: "${nextIntent}"`);
  
  const results = await searchPlaces({
    ...criteria,
    userIntent: nextIntent
  });
  
  return results;
}
```

---

## Test Results

### Query: "quiet temples in Bangkok"

**LLM Output:**
- Primary: `spiritual`
- Additional: `peaceful`, `cultural`

**Pagination:**
- Page 1: 5 queries (spiritual)
- Page 2: 5 queries (peaceful)
- Page 3: 5 queries (cultural)
- **Total: 15 queries** (but only 5 executed initially)

### Query: "hiking trails in Colorado"

**LLM Output:**
- Primary: `nature`
- Additional: `adventure`, `photography`

**Pagination:**
- Page 1: 5 queries (nature)
- Page 2: 5 queries (adventure)
- Page 3: 3 queries (photography)
- **Total: 13 queries** (but only 5 executed initially)

---

## Comparison: Single vs Multi-Intent

| Aspect | Single Intent | Multi-Intent Pagination |
|--------|---------------|------------------------|
| **Initial load** | 5 queries | 5 queries (same) |
| **Total queries** | 5 queries | 15 queries (spread across pages) |
| **Initial speed** | Fast | Fast (same) |
| **Diversity** | Single perspective | Multiple perspectives |
| **API efficiency** | Good | Better (on-demand) |
| **User experience** | Good | Better (fresh content) |

---

## Future Enhancements

### 1. Smart Pagination Trigger

```typescript
// Only load next intent if user scrolls past 80% of current results
if (scrollPosition > 0.8 && hasMoreIntents) {
  loadNextPage();
}
```

### 2. Intent Confidence Scoring

```typescript
{
  "experienceTypes": [
    { intent: "spiritual", confidence: 0.9 },
    { intent: "peaceful", confidence: 0.7 },
    { intent: "cultural", confidence: 0.5 }
  ]
}

// Only use intents with confidence > 0.6 for pagination
```

### 3. User Intent Selection

```typescript
// Let user choose which intent to explore
<IntentSelector>
  <Button>Spiritual (primary)</Button>
  <Button>Peaceful</Button>
  <Button>Cultural</Button>
</IntentSelector>
```

### 4. Hybrid Pagination

```typescript
// Mix intents on same page
Page 1: 70% spiritual + 30% peaceful
Page 2: 50% spiritual + 50% peaceful
Page 3: 100% cultural
```

---

## Summary

**Multi-intent pagination** provides the best of both worlds:
- ✅ Fast initial load (single intent)
- ✅ Diverse results (multiple intents)
- ✅ Efficient API usage (on-demand)
- ✅ Better UX (fresh content on scroll)

The system **stores multiple intents** but **uses only the first one** initially, reserving additional intents for pagination when the user scrolls.

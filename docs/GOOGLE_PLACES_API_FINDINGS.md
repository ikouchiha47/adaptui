# Google Places API - Description Fields Investigation

## Problem
Bars and many other places were showing generic "A great place to visit" descriptions instead of real descriptions.

## Root Cause
**Google Places API does NOT provide `generativeSummary` or `editorialSummary` for most places**, especially bars, clubs, and entertainment venues.

## API Confusion
There are **3 DIFFERENT Google Places APIs**:

### 1. searchText API (POST)
- **Endpoint**: `https://places.googleapis.com/v1/places:searchText`
- **Method**: POST
- **Purpose**: Search for places with text query
- **Special Fields**: 
  - `places.generativeSummary` (AI-generated description)
  - `places.areaSummary` (area context)
  - `contextualContents` (reviews, photos)
- **Reality**: Even this API does NOT return `generativeSummary` for bars/clubs

### 2. Place Details API (GET)
- **Endpoint**: `https://places.googleapis.com/v1/places/{placeId}`
- **Method**: GET
- **Purpose**: Get details for a specific place
- **Fields**: Basic info (name, address, rating, photos, etc.)
- **Does NOT have**: `generativeSummary` field at all

### 3. Area Insights API (POST)
- **Endpoint**: `https://areainsights.googleapis.com/v1:computeInsights`
- **Method**: POST
- **Purpose**: Aggregate data for crowd estimation
- **Returns**: Counts, averages, not individual place data

## Test Results

### Test 1: Place Details API (GET)
```
Place: The Speakeasy Rooftop Bar Bangkok
editorialSummary: ❌ MISSING
generativeSummary: ❌ MISSING
```

### Test 2: searchText API (POST)
```
Query: "rooftop bars Bangkok"
Results: 3 bars
All 3 bars:
  generativeSummary: ❌ MISSING
  areaSummary: ❌ MISSING
```

## Solution
**Multi-tier Description Strategy** - Google doesn't provide descriptions, so we use web sources + LLM fallback.

### Implementation (Priority Order)
1. **PlacesInsightsService** fetches from searchText API with full field mask
2. Check if `generativeSummary` exists (it won't for bars/clubs)
3. **Auto-enrich** places without summaries by searching DDG/Reddit
4. LLM extracts concise description from web snippets
5. Attach as `webEnrichedSummary` to place data
6. **TravelService** uses enriched data (no refetching needed)
7. Final fallback: Generic LLM generation

### Code Changes
1. **PlacesInsightsService.ts**:
   - Updated field mask to include all needed fields
   - Added `enrichWithWebDescriptions()` method
   - Automatically enriches places missing `generativeSummary`
   - Attaches `webEnrichedSummary` field with web-sourced descriptions
   - Runs in parallel for all places needing enrichment
   
2. **TravelService.ts**:
   - Removed redundant `getPlaceDetails()` call
   - Uses `webEnrichedSummary` from enriched place data
   - No on-demand web fetching (data already there)
   - Priority: `generativeSummary` → `webEnrichedSummary` → LLM fallback

### Why Web Sources?
- **Real context**: Actual reviews and mentions from Reddit, blogs, travel sites
- **Specific details**: What makes the place unique, atmosphere, what it's known for
- **Better than generic**: More authentic than pure LLM generation

## Key Takeaway
**Don't rely on Google for descriptions** - most places (especially bars, clubs, entertainment) don't have them. Use web sources for real context, then LLM as final fallback.

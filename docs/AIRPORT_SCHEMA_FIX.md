# Airport Schema Fix - Critical Bug

## Problem Discovered

The LLM was **NOT returning airport codes** because the Zod schema didn't include the fields!

### Root Cause:
```typescript
// ❌ OLD: Missing airport fields
export const ParametersSchema = z.object({
  destination: z.string(),
  establishments: z.array(z.string()),
  // ... no airport fields!
});
```

### Symptoms:
1. Logs showed NO airport codes from LLM
2. Transport plugin couldn't find destination airports
3. Grounding logic never executed (no airports to ground)
4. SearchContext showed `undefined` for airport fields

## Fix Applied

### 1. Added Airport Fields to Schema
**File:** `src/types/query-analysis.zod.ts`

```typescript
// ✅ NEW: Includes airport fields
export const ParametersSchema = z.object({
  destination: z.string(),
  destinationAirportCode: z.string().optional(), // Legacy: single code
  destinationAirports: z.array(z.string()).optional(), // New: multiple codes
  establishments: z.array(z.string()),
  keywords: z.array(z.string()),
  // ...
});
```

### 2. Added Debug Logging
**File:** `src/services/QueryAnalysisService.ts`

```typescript
// Log what LLM returns
console.log('✈️ [QueryAnalysis] Airport codes from LLM:', {
  destinationAirportCode: analysis.parameters?.destinationAirportCode,
  destinationAirports: analysis.parameters?.destinationAirports
});

// Log grounding process
if (analysis.parameters?.destinationAirports) {
  console.log('🛂 [QueryAnalysis] Grounding airports:', analysis.parameters.destinationAirports);
  // ... ground codes ...
  console.log('✅ [QueryAnalysis] Grounded airports:', analysis.parameters.destinationAirports);
} else {
  console.warn('⚠️ [QueryAnalysis] No destinationAirports from LLM');
}
```

### 3. Fixed Missing Coordinates (CRITICAL)
**Files:** `src/services/PlacesPhotoService.ts`, `src/services/TravelService.ts`, `src/screens/AdaptUIScreen.tsx`

**Problem:** Places had NO coordinates because we weren't extracting them from Google Places API!

```typescript
// ❌ OLD: PlaceDetails didn't include coordinates
export interface PlaceDetails {
  photos: PlacePhoto[];
  rating?: number;
}

// ✅ NEW: Includes coordinates from Google Places
export interface PlaceDetails {
  photos: PlacePhoto[];
  rating?: number;
  latitude?: number;  // From geometry.location.lat
  longitude?: number; // From geometry.location.lng
}
```

**Extract coordinates in PlacesPhotoService:**
```typescript
const latitude = details.geometry?.location?.lat;
const longitude = details.geometry?.location?.lng;

return {
  photos,
  rating,
  latitude,
  longitude
};
```

**Store coordinates in TravelService:**
```typescript
if (details.latitude && details.longitude) {
  (highlight as any).latitude = details.latitude;
  (highlight as any).longitude = details.longitude;
}
```

**Fail loudly if no coordinates:**
```typescript
// ❌ OLD: Silently used (0, 0) - INSANE!
if (validPlaces.length === 0) {
  centerLat = 0;
  centerLng = 0;
}

// ✅ NEW: Throw error - this should NEVER happen
if (validPlaces.length === 0) {
  console.error('❌ CRITICAL: No coordinates!');
  throw new Error('Google Places API failed');
}
```

## Expected Behavior After Fix

### Query: "fun bars in Bangkok"

**LLM Should Return:**
```json
{
  "parameters": {
    "destination": "Bangkok",
    "destinationAirports": ["BKK", "DMK"],
    "establishments": ["bar"],
    "keywords": ["fun"]
  }
}
```

**Logs Should Show:**
```
✈️ [QueryAnalysis] Airport codes from LLM: {
  destinationAirportCode: undefined,
  destinationAirports: ["BKK", "DMK"]
}
🛂 [QueryAnalysis] Grounding airports: ["BKK", "DMK"]
✅ [QueryAnalysis] Grounded airports: ["BKK", "DMK"]
```

**SearchContext Should Store:**
```javascript
{
  destination: "Bangkok",
  destinationAirports: ["BKK", "DMK"],
  centerLocation: { lat: 13.75, lng: 100.50 }
}
```

## Testing

Run a search for "hotels in Bangkok" and check logs for:
1. ✅ LLM returns `destinationAirports: ["BKK", "DMK"]`
2. ✅ Grounding validates codes against database
3. ✅ SearchContext stores the airports
4. ✅ TransportPlugin uses the airports for research
5. ✅ No NaN coordinates warning

## Why This Happened

The schema was created before the multi-airport feature was designed. The prompt instructions were added, but the schema wasn't updated to match. **The LLM can only return fields that exist in the Zod schema** when using structured outputs.

## Lesson Learned

When adding new LLM output fields:
1. ✅ Update the Zod schema FIRST
2. ✅ Update the prompt instructions
3. ✅ Add logging to verify LLM returns the field
4. ✅ Test end-to-end before assuming it works

**Schema = Contract**. If it's not in the schema, the LLM can't return it.

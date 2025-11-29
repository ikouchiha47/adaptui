# Transport Research Fix

## Problems Fixed

### 1. **Lat/Long Instead of Airport Codes**
**Before:** `Location (12.95°, 77.66°) → Luang Prabang, Laos`
**After:** `BLR → LPQ (Luang Prabang, Laos)`

Now uses **Google Places API** to:
- Search for airports near user's coordinates (100km radius)
- Get actual airport name and IATA code
- Calculate real distance to airport
- Falls back to hardcoded list if API fails

### 2. **Fake URLs Instead of Real Search**
**Before:** Generated fake URLs directly
**After:** Uses DDG search to find real booking URLs

Added DDG search integration:
- Searches: `"Flights from BLR to LPQ Skyscanner"`
- Extracts actual Skyscanner URL from results
- Falls back to generated URL if search fails

### 3. **Destination City Names Instead of Codes**
**Before:** `Luang Prabang, Laos` (not recognized by booking sites)
**After:** `LPQ` (proper IATA code)

Now uses **Google Places API** to:
- Search for airports in destination city
- Extract IATA code from place details
- Falls back to hardcoded list if API fails

## Changes Made

### `TransportResearchAgent.ts`
- **Added Google Places API integration** for real airport lookups
- Added `getNearestAirport(lat, lon)` - uses Google Places Nearby Search API
- Added `getDestinationCode(city)` - uses Google Places Text Search API
- Added `getAirportCode(placeId, name)` - extracts IATA code from place details
- Added `extractCodeFromName()` - parses IATA code from airport name
- Added fallback methods for when API is unavailable
- Added `DDGScraperService` integration for real booking URLs
- Added `calculateDistance()` - Haversine formula for distance calculation
- Made `generateSearchUrl()` async to support DDG search
- Reduced to only Skyscanner (most reliable)

### `DDGScraperService.ts`
- Added `search(query)` method - returns search results
- Added `SearchResult` interface with title, url, snippet
- Added `decodeHtml()` helper for HTML entity decoding

### `BaseResearchAgent.ts`
- Made `generateSearchUrl()` support async (returns `string | Promise<string>`)
- Updated `batchScrape()` to await async URL generation

### `AdaptUIScreen.tsx`
- Converts user location to airport code before research
- Converts destination city to airport code
- Uses proper codes in all logging and display

## Airport Database

Currently supports 20+ major airports:
- **India:** BLR, BOM, DEL
- **Thailand:** BKK, HKT, CNX
- **Singapore:** SIN
- **Malaysia:** KUL
- **Indonesia:** DPS
- **Vietnam:** HAN, SGN
- **Cambodia:** REP, PNH
- **Myanmar:** RGN, MDL
- **Laos:** LPQ, VTE
- **Hong Kong:** HKG
- **Japan:** TYO
- **South Korea:** SEL

## Example Flow

1. User at lat/long (12.95, 77.66) searches for "Luang Prabang"

2. **Find nearest airport (Google Places API):**
   - API call: `nearbysearch?location=12.95,77.66&radius=100000&type=airport`
   - Returns: "Kempegowda International Airport"
   - Extract code: **BLR**
   - Distance: 6km away

3. **Find destination airport (Google Places API):**
   - API call: `textsearch?query=Luang Prabang airport&type=airport`
   - Returns: "Luang Prabang International Airport"
   - Extract code: **LPQ**

4. **Search for booking URL (DDG):**
   - Query: `"Flights from BLR to LPQ Skyscanner"`
   - Extract real Skyscanner URL from results

5. **Display:** BLR → LPQ (Luang Prabang, Laos)

6. **User clicks** → Opens actual Skyscanner booking page with real data

## API Usage

### Google Places API Endpoints Used

1. **Nearby Search** - Find airports near coordinates
   ```
   GET /maps/api/place/nearbysearch/json
   ?location={lat},{lon}
   &radius=100000
   &type=airport
   &key={API_KEY}
   ```

2. **Text Search** - Find airport by city name
   ```
   GET /maps/api/place/textsearch/json
   ?query={city} airport
   &type=airport
   &key={API_KEY}
   ```

3. **Place Details** - Get IATA code from place
   ```
   GET /maps/api/place/details/json
   ?place_id={PLACE_ID}
   &fields=name,address_components
   &key={API_KEY}
   ```

### Fallback Strategy

If Google API fails or is not configured:
- Uses hardcoded list of 20+ major Asian airports
- Calculates distance using Haversine formula
- Extracts codes from common airport name patterns

## Next Steps

To make this production-ready:

1. ✅ **Use Google Places API** - DONE! Now using real airport data
2. **Add more booking sites** - Rome2Rio, Kayak, Google Flights
3. **Scrape actual prices** - Parse Skyscanner HTML for real prices
4. **Add date selection** - Let users choose travel dates
5. **Cache API results** - Avoid repeated Google API calls
6. **Handle multi-airport cities** - NYC (JFK, LGA, EWR), London (LHR, LGW, STN)

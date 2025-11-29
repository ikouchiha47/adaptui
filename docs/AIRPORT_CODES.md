# Airport Code Service

## Overview

The `AirportCodeService` provides accurate IATA airport codes using **SQLite with FTS (Full-Text Search)** backed by the **OpenFlights Airport Database** - a free, open-source database containing over 6,000 airports worldwide.

## Architecture

- **Storage**: SQLite database with FTS5 virtual tables
- **Data Source**: OpenFlights (https://github.com/jpatokal/openflights)
- **Coverage**: 6,072 airports with valid IATA codes, 261 countries
- **Bundled**: JSON data files included in app assets (1.2MB)
- **Initialization**: Automatic on first use (2-3 seconds)
- **Refresh**: Automatic every 7 days, or manual via `forceRefresh()`

## Features

### 1. Find Nearest Airport by Coordinates

```typescript
const airport = await airportService.findNearestAirport(12.97, 77.59, 200);
// Returns: { iata: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', ... }
```

- Searches within specified radius (default 200km)
- Uses Haversine formula in SQL for accurate distance calculation
- Indexed for fast lookups
- Returns null if no airport found within range

### 2. Find Airport by City Name (with FTS)

```typescript
const airport = await airportService.findAirportByCity('Singapore');
// Returns: { iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', ... }
```

- **FTS5 Full-Text Search** for fuzzy matching
- Intelligent scoring system:
  - +20 points for exact city match
  - +10 points for city contains search term
  - +10 points for "International" in name
  - +5 points for city name in airport name
  - -20 points for air bases
  - -5 points for regional airports
- Prioritizes major commercial airports over military/regional facilities
- Fallback to LIKE search if FTS returns no results

## Integration

### TransportResearchAgent

The service is integrated into `TransportResearchAgent` to replace unreliable Google Places API lookups:

```typescript
// Get nearest airport from user location
const fromCode = await agent.getNearestAirport(lat, lon);

// Get destination airport from city name
const toCode = await agent.getDestinationCode('Luang Prabang');
```

### Benefits Over Previous Approach

1. **No API Key Required** - Uses free, public data
2. **Accurate IATA Codes** - Direct from authoritative database
3. **Fully Offline** - All data bundled with app, works without internet
4. **Blazing Fast** - SQLite with indexes, instant lookups
5. **Fuzzy Search** - FTS5 handles typos and partial matches
6. **Comprehensive** - 6,072 airports vs limited Google Places results
7. **No Rate Limits** - Local database, unlimited queries
8. **Auto-Refresh** - Updates weekly to stay current

## Build Process

### Initial Setup

Run the build script to download and prepare airport data:

```bash
npm run build-airport-db
```

This script:
1. Downloads airports.dat and countries.dat from OpenFlights
2. Parses CSV data (6,072 airports, 261 countries)
3. Creates JSON files in `assets/data/`
4. Runs automatically on `npm install` (postinstall hook)

### Generated Files

```
assets/data/
├── airports.json    (1.2MB - bundled with app)
├── countries.json   (bundled with app)
├── metadata.json    (build info)
├── airports.dat     (ignored by git)
└── countries.dat    (ignored by git)
```

## Runtime Behavior

### First Launch
1. App detects no SQLite database exists
2. Loads airports.json from bundled assets
3. Creates SQLite tables with FTS indexes
4. Inserts 6,072 airports in batches
5. Takes ~2-3 seconds (one-time cost)

### Subsequent Launches
1. Checks if database exists ✓
2. Checks if data < 7 days old ✓
3. Uses existing database (instant)

### Weekly Refresh
1. Detects data is > 7 days old
2. Downloads fresh data from OpenFlights
3. Rebuilds database
4. Happens automatically in background

## Testing

The database requires React Native environment. To test:

```bash
# Build the data files
npm run build-airport-db

# Run the app and check console logs
npm start
```

Expected results:
- Bangalore (12.97, 77.59) → BLR
- Bangkok (13.75, 100.50) → DMK  
- Luang Prabang → LPQ
- Singapore → SIN (Changi, not Seletar)
- Chiang Mai → CNX

## Database Schema

### airports table
```sql
CREATE TABLE airports (
  id INTEGER PRIMARY KEY,
  iata TEXT NOT NULL,
  icao TEXT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL
);

CREATE INDEX idx_iata ON airports(iata);
CREATE INDEX idx_city ON airports(city);
CREATE INDEX idx_location ON airports(lat, lon);
```

### airports_fts (FTS5 Virtual Table)
```sql
CREATE VIRTUAL TABLE airports_fts USING fts5(
  iata, name, city, country,
  content=airports,
  content_rowid=id
);
```

### metadata table
```sql
CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);
-- Stores: last_update timestamp
```

## Performance

- **Initial load**: ~2-3 seconds (one-time)
- **Nearest airport lookup**: <10ms (indexed Haversine in SQL)
- **City search**: <5ms (FTS5 with rank ordering)
- **Database size**: ~2MB on disk
- **Memory usage**: Minimal (SQLite handles paging)

## Error Handling

- Returns `null` if no airport found
- Logs warnings for missing data
- Falls back to download if bundled assets missing
- Graceful degradation on network errors
- Database corruption auto-rebuilds

## Manual Refresh

Force a data refresh anytime:

```typescript
await airportService.forceRefresh();
```

## Future Improvements

- ✅ SQLite with FTS (done)
- ✅ Bundled data (done)
- ✅ Auto-refresh (done)
- 🔄 ICAO code support (in schema, not exposed)
- 🔄 Airport metadata (timezone, altitude)
- 🔄 Multi-airport city handling (NYC: JFK, LGA, EWR)
- 🔄 Country-based filtering

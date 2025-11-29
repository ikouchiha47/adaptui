# Airport Validation - Simple FTS Approach

## Overview

Simple, clean flow for validating airport data from LLM using FTS (Full-Text Search) against the airport database.

## Flow

```
User Query: "flights to Bangkok"
         ↓
    LLM Analysis
         ↓
destinationAirports: ["Bangkok", "BKK", "Suvarnabhumi", "Don Mueang"]
         ↓
   FTS Validation (AirportValidator)
         ↓
Validated: ["BKK", "DMK"]
         ↓
   Transport Plugin
```

## Components

### 1. AirportValidator (`src/services/AirportValidator.ts`)

**Purpose**: Validate any airport identifier (IATA code, city name, or airport name) using FTS

**Methods**:
- `validateAirports(inputs: string[])` - Validates array of mixed inputs
- `getAirportsForDestination(destination: string)` - Gets all airports for a city

**Features**:
- Accepts IATA codes (3 letters): `"BKK"`, `"JFK"`
- Accepts city names: `"Bangkok"`, `"New York"`
- Accepts airport names: `"Suvarnabhumi"`, `"LaGuardia"`
- Uses FTS for fuzzy matching
- Removes duplicates automatically
- Returns confidence scores

### 2. Schema (`src/types/query-analysis.zod.ts`)

```typescript
destinationAirports: z.array(z.string()).describe(
  'Array of airport identifiers (IATA codes, city names, or airport names). 
   Examples: ["BKK", "Bangkok"], ["Paris", "CDG", "Orly"]'
)
```

**LLM can return**:
- IATA codes if it knows them
- City names if unsure
- Airport names for clarity
- Mix of all three

### 3. Prompt (`src/ui-engine/prompts.ts`)

**Instructions to LLM**:
```
Provide airport information for the destination:
- destinationAirports: Array of airport identifiers

You can provide:
- IATA codes if you know them: ["BKK", "DMK"]
- City names: ["Bangkok"]
- Airport names: ["Suvarnabhumi", "Don Mueang"]
- Mix of all: ["Bangkok", "BKK", "Suvarnabhumi"]

Examples:
- Bangkok → ["Bangkok", "BKK", "DMK"]
- Tokyo → ["Tokyo", "Narita", "Haneda"]
- New York → ["New York", "JFK", "LaGuardia", "Newark"]
```

### 4. QueryAnalysisService

**Grounding Process**:
```typescript
private async groundAirportCodes(llmInputs: string[], destination: string) {
  const validator = new AirportValidator();
  
  // Validate all inputs using FTS
  const validated = await validator.validateAirports(llmInputs);
  
  if (validated.length > 0) {
    return validated.map(a => a.iata);
  }
  
  // Fallback: search by destination
  const fallback = await validator.getAirportsForDestination(destination);
  return fallback.map(a => a.iata);
}
```

### 5. SearchContext

**Clean interface**:
```typescript
interface SearchContextData {
  destinationAirports: string[]; // Array of validated IATA codes
  selectedAirport?: string; // User-selected from UI
}
```

**No legacy fields** - only the validated array.

### 6. TransportPlugin

**Simple usage**:
```typescript
const destinationAirports = context.destinationAirports || [];

// If user selected specific airport, prioritize it
if (context.selectedAirport) {
  destinationAirports = [
    context.selectedAirport,
    ...destinationAirports.filter(code => code !== context.selectedAirport)
  ];
}

// Research top 3 airports
const airportsToResearch = destinationAirports.slice(0, 3);
```

## Examples

### Example 1: LLM knows IATA codes
```
Input: ["BKK", "DMK"]
Validation: ✅ Both valid
Output: ["BKK", "DMK"]
```

### Example 2: LLM provides city name
```
Input: ["Bangkok"]
FTS Search: Finds "Bangkok" in city column
Output: ["BKK", "DMK"] (all Bangkok airports)
```

### Example 3: LLM provides airport names
```
Input: ["Suvarnabhumi", "Don Mueang"]
FTS Search: Finds in name column
Output: ["BKK", "DMK"]
```

### Example 4: Mixed inputs
```
Input: ["Bangkok", "BKK", "Suvarnabhumi", "DMK"]
Validation: All resolve to BKK or DMK
Deduplication: Removes duplicates
Output: ["BKK", "DMK"]
```

### Example 5: Invalid inputs
```
Input: ["XXX", "InvalidCity"]
Validation: ❌ No matches
Fallback: Search by destination "Bangkok"
Output: ["BKK", "DMK"]
```

## Benefits

1. **Flexible**: LLM can provide any format it knows
2. **Robust**: FTS handles typos and variations
3. **Simple**: One validator service, clean flow
4. **Fast**: FTS is indexed and optimized
5. **Reliable**: Always falls back to destination search

## Testing

Run validation tests:
```bash
npx ts-node scripts/test-airport-validation.ts
```

Tests:
- Mixed inputs (codes, names, cities)
- IATA codes only
- City names only
- Invalid inputs
- Duplicate handling
- Destination search

## Database

- **6,000+ airports** from OpenFlights
- **FTS5 virtual table** for full-text search
- **Indexed** on IATA, city, name, country
- **Ranked results** by relevance
- **Automatic refresh** every 7 days

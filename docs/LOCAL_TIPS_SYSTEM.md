# Local Tips System

## Overview

A comprehensive system for generating context-aware local tips by combining Google Places generative summaries with DDG web search results.

## Components

### 1. Google Places Summary Service

Uses the new Google Places API with generative AI summaries:

```typescript
const service = new GooglePlacesSummaryService();
const summaries = await service.getPlaceSummaries('tanga in lucknow', { lat: 26.8467, lon: 80.9462 });

// Returns:
// - placeId
// - displayName
// - generativeSummary (AI-generated overview)
// - areaSummary (area description)
// - contextualContent (additional context)
```

**API Endpoint:**
```
POST https://places.googleapis.com/v1/places:searchText
```

**Headers:**
```
X-Goog-Api-Key: YOUR_API_KEY
X-Goog-FieldMask: places.id,places.displayName,contextualContents,places.generativeSummary,places.areaSummary
```

### 2. Local Tips Generator

Generates context-aware tips for cities:

```typescript
const generator = new LocalTipsGenerator();
const tips = await generator.generateTips('lucknow', { lat: 26.8467, lon: 80.9462 });

// Returns array of LocalTip objects with:
// - query: "tanga in lucknow"
// - context: "Traditional horse-drawn carriage"
// - googleSummaries: [...] 
// - ddgResults: [...]
// - combined: "Combined text from both sources"
```

### 3. City-Specific Contexts

Pre-defined context-aware queries for major cities:

```typescript
{
  'lucknow': ['tanga in lucknow', 'tunday kababi lucknow', 'chowk lucknow'],
  'kolkata': ['tram in kolkata', 'howrah bridge', 'victoria memorial'],
  'mumbai': ['local train mumbai', 'vada pav mumbai', 'marine drive'],
  'bangkok': ['tuk tuk bangkok', 'street food bangkok', 'floating market'],
  'singapore': ['hawker centers singapore', 'mrt singapore'],
  'tokyo': ['ramen tokyo', 'shibuya crossing', 'senso-ji temple'],
  // ... more cities
}
```

### 4. Enhanced DDG Scraper

Now extracts snippets from search results:

```html
<a class="result__snippet" href="...">
  Looking for tickets to Laos from Bengaluru? 
  Compare hundreds of flights from all major airlines...
</a>
```

Snippets are matched to URLs and included in results:

```typescript
{
  title: "Cheap flights from Bengaluru to Laos",
  url: "https://www.skyscanner.com/...",
  snippet: "Looking for tickets to Laos from Bengaluru? Compare hundreds of flights..."
}
```

## Usage Examples

### Generate Tips for a City

```typescript
import { LocalTipsGenerator } from './services/LocalTipsGenerator';

const generator = new LocalTipsGenerator();

// With location
const tips = await generator.generateTips('lucknow', {
  lat: 26.8467,
  lon: 80.9462
});

// Without location (uses generic queries)
const genericTips = await generator.generateTips('unknown city');
```

### Batch Get Summaries

```typescript
import { GooglePlacesSummaryService } from './services/GooglePlacesSummaryService';

const service = new GooglePlacesSummaryService();

const queries = [
  'tanga in lucknow',
  'tunday kababi lucknow',
  'chowk lucknow'
];

const results = await service.batchGetSummaries(queries, location);

// Returns Map<string, PlaceSummary[]>
results.forEach((summaries, query) => {
  console.log(`${query}: ${summaries.length} results`);
});
```

### Combined Results

```typescript
const tip = await generator.generateTip('tanga in lucknow', location);

console.log(tip.combined);
// Output:
// Local Tip: tanga in lucknow
//
// From Google Places:
// - Lucknow Tanga Stand: Traditional horse-drawn carriages...
//   Area: Located in the heart of old Lucknow...
//
// From Web Search:
// - Experience Lucknow's Heritage with Tanga Rides
//   Discover the charm of old Lucknow with traditional tanga rides...
```

## Plugin Initialization Logging

The Neighborhood plugin now logs detailed initialization info:

```
[Plugins] Initializing AdaptUI plugins...
============================================================
[Plugins] Registered: {
  id: 'neighborhood',
  name: 'Neighborhood Insights',
  version: '1.0.0',
  capability: 'Neighborhood',
  icon: 'business',
  defaultEnabled: false,
  requiresTab: true,
  tabLabel: 'Area'
}
[Plugins] Summary: {
  total: 1,
  enabled: 0,
  withTabs: 1
}
============================================================
[Plugins] Initialization complete
```

## Context Extraction

The system automatically extracts context from queries:

```typescript
'tanga' → 'Traditional horse-drawn carriage'
'tram' → 'Historic streetcar system'
'local train' → 'Commuter rail network'
'auto rickshaw' → 'Three-wheeled taxi'
'tuk tuk' → 'Motorized rickshaw'
'hawker' → 'Street food stalls'
'floating market' → 'Boat-based market'
```

## Integration with Research Agents

Local tips can be integrated into research agents:

```typescript
export class LocalTipsAgent extends BaseResearchAgent {
  private tipsGenerator = new LocalTipsGenerator();

  async research(query: string, params: any) {
    const city = params.destination;
    const location = params.location;
    
    const tips = await this.tipsGenerator.generateTips(city, location);
    
    return {
      query,
      tips,
      summary: this.aggregateTips(tips)
    };
  }
}
```

## API Response Structure

### Google Places Summary Response

```json
{
  "places": [
    {
      "id": "ChIJ...",
      "displayName": {
        "text": "Lucknow Tanga Stand"
      },
      "generativeSummary": {
        "overview": {
          "text": "Traditional horse-drawn carriages offering heritage tours..."
        }
      },
      "areaSummary": {
        "contentBlocks": [
          {
            "content": {
              "text": "Located in the heart of old Lucknow..."
            }
          }
        ]
      }
    }
  ],
  "contextualContents": [
    {
      "reviews": [...],
      "photos": [...]
    }
  ]
}
```

## Benefits

✅ **AI-Generated Summaries** - Google's generative AI provides rich context  
✅ **Area Descriptions** - Detailed area summaries from Google  
✅ **Web Search Integration** - DDG results add real-world context  
✅ **Context-Aware** - Pre-defined queries for major cities  
✅ **Batch Processing** - Efficient batch API calls  
✅ **Snippet Extraction** - Full snippets from DDG results  
✅ **Location-Biased** - Results biased to user's location  
✅ **Fallback Queries** - Generic queries for unknown cities  

## Future Enhancements

- [ ] LLM-based query generation for any city
- [ ] User-contributed local tips
- [ ] Photo integration from contextual content
- [ ] Review sentiment analysis
- [ ] Real-time tip updates
- [ ] Tip voting/ranking system
- [ ] Multi-language support
- [ ] Offline tip caching

---

**Local Tips System** - Discover hidden gems everywhere! 🗺️

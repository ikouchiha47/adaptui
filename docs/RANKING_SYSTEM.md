# Intelligent Ranking System

## Overview

A hybrid ranking system that combines LLM intelligence with manual scoring across multiple signals to intelligently rank and re-order travel recommendations based on user intent, crowd levels, opening hours, and ratings.

## Architecture

### Weighted Scoring Model (Total: 100 points)

1. **Sentiment Match** (25 points)
   - How well the place matches user's emotional intent
   - Based on crowd intelligence sentiment matching
   - Examples: romantic → quiet places, party → busy places

2. **Crowd Level** (20 points)
   - Appropriateness of crowd level for user intent
   - Dynamic scoring based on real-time crowd intelligence
   - Considers time of day and day of week

3. **Opening Hours** (15 points)
   - Is the place open now or at desired time?
   - Can be prioritized for immediate visits
   - Reduces score for closed places

4. **Rating** (20 points)
   - Google rating (0-5 scale)
   - Review count confidence boost
   - Higher weight for places with 1000+ reviews

5. **LLM Relevance** (20 points)
   - LLM's assessment of relevance to query
   - Semantic understanding of user intent
   - Context-aware recommendations

## Scoring Details

### Sentiment Match Scoring

Maps user intent to preferred crowd levels:

```typescript
{
  romantic: { quiet: 1.0, moderate: 0.8, busy: 0.3, 'very busy': 0.1 },
  peaceful: { quiet: 1.0, moderate: 0.6, busy: 0.2, 'very busy': 0.0 },
  party: { quiet: 0.2, moderate: 0.5, busy: 0.9, 'very busy': 1.0 },
  cultural: { quiet: 0.9, moderate: 0.8, busy: 0.5, 'very busy': 0.3 },
  fun: { quiet: 0.4, moderate: 0.8, busy: 0.9, 'very busy': 0.7 },
  adventure: { quiet: 0.5, moderate: 0.9, busy: 0.8, 'very busy': 0.6 },
  relaxing: { quiet: 1.0, moderate: 0.7, busy: 0.3, 'very busy': 0.1 },
  energetic: { quiet: 0.2, moderate: 0.6, busy: 0.9, 'very busy': 1.0 }
}
```

### Rating Scoring

- **Base Score** (80%): `(rating / 5) * 0.8 * 20`
- **Confidence Boost** (20%):
  - 1000+ reviews: +0.2
  - 500-999 reviews: +0.15
  - 100-499 reviews: +0.1
  - 50-99 reviews: +0.05
  - <50 reviews: 0

### Opening Hours Scoring

- **Open + Prioritized**: 15 points
- **Open + Not Prioritized**: 15 points
- **Closed + Prioritized**: 0 points
- **Closed + Not Prioritized**: 4.5 points (30%)
- **Unknown**: 7.5 points (50%)

## API

### RankingService

```typescript
interface RankingCriteria {
  userIntent: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  budget?: 'budget' | 'mid' | 'luxury';
  prioritizeOpen?: boolean;
}

interface PlaceScore {
  placeId: string;
  placeName: string;
  totalScore: number; // 0-100
  breakdown: {
    sentimentMatch: number;
    crowdLevel: number;
    openingHours: number;
    rating: number;
    llmRelevance: number;
  };
  crowdIntel?: CrowdScore;
  reasoning: string;
}

// Usage
const rankingService = new RankingService();
const scores = await rankingService.rankPlaces(places, criteria);
```

### Integration with TravelService

```typescript
// Automatically ranks highlights within each recommendation
const recommendations = await travelService.generateRecommendations({
  location: 'Bangkok',
  feeling: 'romantic',
  budget: 'mid',
  useRealData: true
});

// Each highlight now has:
recommendations[0].highlights[0].rankingScore // PlaceScore object
recommendations[0].highlights[0].crowdLevel // 'quiet' | 'moderate' | 'busy' | 'very busy'
recommendations[0].highlights[0].bestTimeToVisit // 'Early morning (7-9 AM)'
```

## Example Scenarios

### Scenario 1: Romantic Evening

**Input:**
- User Intent: romantic
- Time: evening
- Day: Saturday

**Ranking Behavior:**
- Prioritizes quiet/moderate crowd levels (+25 points for quiet)
- Favors highly-rated places with ambiance
- Checks if open in evening
- Re-orders: Rooftop bars > Temples > Markets

### Scenario 2: Party Night

**Input:**
- User Intent: party
- Time: night
- Day: Friday

**Ranking Behavior:**
- Prioritizes busy/very busy crowd levels (+20 points for very busy)
- Favors nightlife venues
- Checks late-night opening hours
- Re-orders: Clubs > Bars > Restaurants

### Scenario 3: Peaceful Morning

**Input:**
- User Intent: peaceful
- Time: morning
- Day: Monday

**Ranking Behavior:**
- Strongly prioritizes quiet places (+25 points)
- Penalizes busy places (-20 points)
- Checks morning opening hours
- Re-orders: Temples > Parks > Cafes

## Benefits

### 1. Context-Aware Ranking
- Same place ranks differently based on time, day, and intent
- Dynamic re-ordering based on real-time conditions

### 2. Hybrid Intelligence
- Combines LLM semantic understanding (20%)
- With objective metrics (80%): crowd, hours, ratings
- Not over-reliant on LLM alone

### 3. Transparent Scoring
- Clear breakdown of why each place scored as it did
- Human-readable reasoning for each ranking
- Debuggable and tunable weights

### 4. User Intent Matching
- Romantic seekers get quiet places first
- Party-goers get busy venues first
- Cultural explorers get balanced crowds

## Weight Tuning

Weights can be adjusted based on user feedback:

```typescript
private readonly WEIGHTS = {
  sentimentMatch: 25,  // Increase for stronger intent matching
  crowdLevel: 20,      // Increase for crowd-sensitive users
  openingHours: 15,    // Increase for immediate visits
  rating: 20,          // Increase for quality-focused users
  llmRelevance: 20     // Increase for semantic matching
};
```

## Performance

- Parallel crowd intelligence fetching for all places
- Cached crowd data (4 hours)
- Cached place summaries (7 days)
- Cached opening hours (24 hours)
- Typical ranking time: 2-3 seconds for 5 places

## Future Enhancements

1. **Personalization**: Learn user preferences over time
2. **Budget Scoring**: Add price appropriateness to ranking
3. **Distance Scoring**: Factor in travel time from user location
4. **Weather Integration**: Adjust outdoor venue rankings
5. **Event Detection**: Boost places with special events
6. **Social Proof**: Integrate Instagram/TikTok popularity
7. **A/B Testing**: Test different weight configurations

## Testing

Run the ranking test:

```bash
npx ts-node scripts/test-ranking.ts
```

This will show how the same places rank differently for romantic, party, and peaceful intents.

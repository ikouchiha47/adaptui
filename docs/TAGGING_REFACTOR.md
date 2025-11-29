# Place Tagging Refactor

## Problem
Current system has hardcoded "hidden gem" detection based on review count (50-1500 reviews, 4.3+ rating). This is:
- Inaccurate (popular places get marked as hidden gems)
- Inflexible (can't adapt to different place types)
- Causes confusion in UI

## Solution
Replace with LLM-based tagging that considers:
- Place characteristics (rating, reviews, price, type)
- User query context ("fun bars" vs "quiet cafes")
- Actual place descriptions and reviews
- Local vs tourist appeal

## New Tagging System

### Tags:
- `luxury` - High-end, expensive, upscale
- `budget` - Affordable, cheap eats, value
- `mid-range` - Moderate pricing
- `touristy` - Popular with tourists, crowded
- `offbeat` - Unique, unusual, quirky
- `local-favorite` - Where locals go (replaces "hidden gem")

### Implementation:
1. Remove hardcoded hidden gem detection
2. Add LLM tagging service that analyzes each place
3. Tag places in batches to reduce LLM calls
4. Cache tags per place

### Benefits:
- More accurate categorization
- Context-aware (considers user query)
- Flexible (can add new tags easily)
- Reduces confusion ("hidden gem" was misleading)

## Changes Needed:
1. Remove `isHiddenGem` logic from TravelService
2. Remove `discoverHiddenGemsFromWeb()` method
3. Create `PlaceTaggingService` with LLM
4. Update `categorizePlace()` to use LLM tags
5. Update UI to show new tag types

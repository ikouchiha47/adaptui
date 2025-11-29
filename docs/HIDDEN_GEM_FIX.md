# Hidden Gem Detection Fix

## Problem Analysis

From the logs, the hidden gem detection had multiple issues:

### 1. Web Scraping Completely Broken
```
LOG  📄 [TravelService] Found 3 search results
LOG  💎 [TravelService] Found 0 hidden gems from web research
```

**Root causes:**
- DDG returns CAPTCHA on ~95% of requests
- Brave fallback returns 429 (rate limited) with only 1 result per query
- Search proxy gets 0 usable results, so LLM has nothing to extract

### 2. Inconsistent Thresholds

**Original filtering (line 677):**
```typescript
return rating >= 4.3 && reviewCount > 10 && reviewCount < 500;
```

**Original categorization (line 1121):**
```typescript
else if (reviewCount >= 100 && reviewCount < 1000 && rating >= 4.3) {
  category = 'hidden-gem';
}
```

**Problem:** A place with 600 reviews would:
- ❌ Not be filtered as a hidden gem (> 500 reviews)
- ✅ Be categorized as a hidden gem (100-1000 reviews)

This inconsistency meant good places were being excluded.

### 3. Too Strict Criteria

Many excellent local spots have 500-1000 reviews but are still "hidden" compared to tourist traps with 5000+ reviews.

## Solution

### 1. Disabled Web-Based Discovery
```typescript
private async discoverHiddenGemsFromWeb(location: string, llm: LLMProvider) {
  // DISABLED: Web scraping is unreliable (CAPTCHAs, rate limits)
  console.log('⚠️ [TravelService] Web-based hidden gem discovery disabled');
  console.log('   Using Places API filtering: 4.3+ rating, 50-1500 reviews');
  return [];
}
```

**Rationale:**
- Web scraping is fundamentally unreliable in production
- Places API data is more accurate and consistent
- Reduces API calls and latency

### 2. Aligned Thresholds

**New filtering:**
```typescript
return rating >= 4.3 && reviewCount >= 50 && reviewCount < 1500;
```

**New categorization:**
```typescript
else if (reviewCount >= 50 && reviewCount < 1500 && rating >= 4.3) {
  category = 'hidden-gem';
}
```

**Benefits:**
- Consistent logic across filtering and categorization
- Captures more quality places (50-1500 reviews vs 10-500)
- Better balance between "hidden" and "quality"

### 3. Updated Category Boundaries

| Category | Old Threshold | New Threshold | Rationale |
|----------|--------------|---------------|-----------|
| Offbeat | < 100 reviews | < 50 reviews | Too many low-quality places |
| Hidden Gem | 100-1000 reviews | 50-1500 reviews | Better captures local favorites |
| Touristy | 1000+ reviews | 1500+ reviews | More realistic for "over-touristed" |

## Expected Results

### Before Fix
```
LOG  💎 [TravelService] Found 0 hidden gems from web research
LOG  💎 [TravelService] Found 12 hidden gems from Places API
LOG  💎 [TravelService] Total 12 hidden gems identified
```

### After Fix
- Web research: 0 (disabled, but faster)
- Places API: 15-20 hidden gems (expanded range)
- More consistent categorization
- Reduced latency (no failed web scraping attempts)

## Testing

Run the bars test again:
```bash
npm run test:bars-fix
```

Expected improvements:
- More places categorized as "hidden gems"
- Faster response (no web scraping delays)
- No CAPTCHA/rate limit errors
- Consistent gem detection across filtering and categorization

## Why Web Scraping Fails

### Missing Sec-Fetch Headers
DDG uses Sec-Fetch-* headers to detect bots. Our code now includes:
```typescript
'Sec-Fetch-Dest': 'document',
'Sec-Fetch-Mode': 'navigate',
'Sec-Fetch-Site': 'none',
'Sec-Fetch-User': '?1',
```

### React Native Limitation
React Native's `fetch()` doesn't support Sec-Fetch headers (browser-only). Even with proper headers in code, they won't be sent.

### Solutions Attempted
1. ✅ Added Sec-Fetch headers to DDGScraperService
2. ✅ Changed URL encoding from %20 to + for spaces
3. ✅ Added full browser headers
4. ❌ Still fails in React Native (fetch API limitation)

### Working Solution
Use WebView (already implemented in WebViewScraperService) - it automatically adds browser headers and bypasses CAPTCHAs.

## URL Encoding Note

`%26` = `&` (ampersand)
`%20` or `+` = space

Changed to use `+` for spaces (more traditional, preferred by DDG):
```typescript
private encodeQueryForDDG(query: string): string {
  return encodeURIComponent(query).replace(/%20/g, '+');
}
```

## Future Improvements

If web-based discovery is needed:
1. Use WebView for all scraping (bypasses CAPTCHA)
2. Use official APIs (Reddit API, TripAdvisor API)
3. Implement proper rate limiting and backoff
4. Cache results aggressively (7+ days)

For now, Places API filtering is more reliable and sufficient.

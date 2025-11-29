# WebView Scraper System 😈

## Overview

A powerful WebView-based scraping system that bypasses CAPTCHAs and extracts clean content from any website.

## Features

### 1. **User Agent Rotation**
DDGScraperService now rotates through 6 different user agents:
- Chrome on Mac/Windows/Linux
- Safari on Mac
- Firefox on Windows/Mac

### 2. **WebView Content Extractor**
Extracts clean, structured content from any URL:
- **Body Text** - All text content without scripts/styles
- **Body HTML** - Clean HTML without scripts/styles
- **Metadata** - Title, description, keywords, author
- **Full HTML** - Complete page source (optional)

### 3. **Smart Fallback**
Research agents automatically fall back to WebView when:
- URL returns non-200 status
- Fetch fails due to CORS/blocking
- Site requires JavaScript rendering

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AdaptUIScreen                         │
│  - Manages WebView state                                │
│  - Routes requests to appropriate scraper               │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│ DDGScraper   │  │ WebViewScraper│
│ Service      │  │ Service       │
│              │  │               │
│ - Search DDG │  │ - Check URL   │
│ - Parse HTML │  │ - Scrape page │
│ - Rotate UA  │  │ - Extract     │
└──────┬───────┘  └───────┬───────┘
       │                  │
       └────────┬─────────┘
                │
     ┌──────────▼──────────┐
     │ HiddenWebViewScraper│
     │                     │
     │ - Loads URL         │
     │ - Injects JS        │
     │ - Extracts content  │
     │ - Returns data      │
     └─────────────────────┘
```

## Usage

### Basic Scraping

```typescript
import { webViewScraperService } from '../services/WebViewScraperService';

// Scrape a URL
const content = await webViewScraperService.scrapeUrl('https://example.com');

console.log(content.title);        // Page title
console.log(content.bodyText);     // Clean text content
console.log(content.bodyHTML);     // Clean HTML
console.log(content.metadata);     // Meta tags
```

### In Research Agents

```typescript
export class MyResearchAgent extends BaseResearchAgent {
  async research(query: string) {
    // fetchPage automatically uses WebView as fallback
    const html = await this.fetchPage('https://complex-site.com');
    
    // Or explicitly use WebView
    const content = await this.fetchPageWithWebView('https://js-heavy-site.com');
    
    return content;
  }
}
```

### Scraping Flight Results

```typescript
// Example: Scrape Skyscanner for actual flight data
const skyscannerUrl = 'https://www.skyscanner.com/transport/flights/blr/bkk/...';

const content = await webViewScraperService.scrapeUrl(skyscannerUrl);

// Send to LLM for parsing
const flightData = await webViewScraperService.parseWithLLM(
  content,
  'Extract flight prices, times, and airlines from this page'
);
```

## Content Structure

```typescript
interface ScrapedContent {
  url: string;              // Final URL (after redirects)
  title: string;            // Page title
  bodyText: string;         // Clean text (no scripts/styles)
  bodyHTML: string;         // Clean HTML (no scripts/styles)
  metadata: {
    description?: string;   // Meta description
    keywords?: string;      // Meta keywords
    author?: string;        // Meta author
  };
  timestamp: number;        // When scraped
}
```

## Flow

### 1. URL Check
```
HEAD request → Check if URL exists → 200 OK ✅
                                   → 404/500 ❌ Return null
```

### 2. WebView Load
```
Load URL in hidden WebView (0x0 size)
  ↓
Wait 3 seconds for page to load
  ↓
Inject JavaScript
  ↓
Extract content
```

### 3. Content Extraction (JavaScript)
```javascript
// Clone body
const body = document.body.cloneNode(true);

// Remove scripts and styles
body.querySelectorAll('script, style, noscript').forEach(el => el.remove());

// Extract text
const bodyText = body.textContent.trim();

// Extract HTML
const bodyHTML = body.innerHTML;

// Extract metadata
const title = document.title;
const description = document.querySelector('meta[name="description"]').content;
```

### 4. Return to React Native
```
postMessage → React Native receives data → Callback fired
```

## Logs

```
[WebViewScraper] Checking URL: https://example.com
[WebViewScraper] URL check: { url: '...', exists: true, status: 200 }
[WebViewScraper] Loading URL in WebView: https://example.com
[WebViewScraper] Page loaded: https://example.com
[WebViewScraper] Message received: { type: 'content', titleLength: 50, bodyTextLength: 5000 }
[WebViewScraper] Content received: { url: '...', title: '...', bodyTextLength: 5000 }
```

## Use Cases

### 1. **Flight Price Scraping**
```typescript
const url = 'https://www.skyscanner.com/...';
const content = await webViewScraperService.scrapeUrl(url);
// Parse content.bodyText for prices, times, airlines
```

### 2. **Restaurant Reviews**
```typescript
const url = 'https://www.tripadvisor.com/...';
const content = await webViewScraperService.scrapeUrl(url);
// Extract reviews from content.bodyText
```

### 3. **Hotel Availability**
```typescript
const url = 'https://www.booking.com/...';
const content = await webViewScraperService.scrapeUrl(url);
// Parse availability and prices
```

### 4. **Event Information**
```typescript
const url = 'https://www.eventbrite.com/...';
const content = await webViewScraperService.scrapeUrl(url);
// Extract event details, dates, tickets
```

## Benefits

✅ **Bypasses CAPTCHAs** - WebView acts like real browser  
✅ **Handles JavaScript** - Fully renders dynamic content  
✅ **Clean Content** - Removes scripts/styles automatically  
✅ **Metadata Extraction** - Gets all meta tags  
✅ **Automatic Fallback** - Research agents use it automatically  
✅ **User Agent Rotation** - Avoids rate limiting  
✅ **URL Validation** - Checks existence before scraping  
✅ **Timeout Protection** - 30 second timeout  

## Future Enhancements

- [ ] LLM integration for content parsing
- [ ] Screenshot capture
- [ ] Cookie/session management
- [ ] Proxy support
- [ ] Rate limiting
- [ ] Cache scraped content
- [ ] Batch scraping with queue
- [ ] Custom JavaScript injection
- [ ] Form submission support

---

**WebView Scraper** - Scrape anything, anywhere! 😈

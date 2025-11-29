# Transport WebView Implementation Plan

## Issues Fixed
1. ✅ Removed duplicate transport tabs (old hardcoded + new plugin)
2. ⏳ WebView for booking links
3. ⏳ Remove "Refresh" text (icon only)
4. ⏳ LLM fallback for airport codes

## 1. WebView Implementation

### Current Behavior
- "Tap to search" opens external browser via `Linking.openURL()`
- User leaves the app

### New Behavior
- Opens in-app WebView with custom styling
- Matches app theme (dark, accent colors)
- Back button to return to app
- Loading indicator

### Implementation
```typescript
// Create WebViewModal component
<WebViewModal
  visible={webViewVisible}
  url={selectedUrl}
  onClose={() => setWebViewVisible(false)}
  theme={theme}
  accentColor={accentColor}
/>
```

## 2. Refresh Button - Icon Only

### Current
```
[🔄 Refresh]
```

### New
```
[🔄]
```

Just remove the text, keep icon only.

## 3. LLM Fallback for Airport Codes

### Current Flow
1. Search database for "Bangkok"
2. If not found → return "XXX"
3. Display shows "XXX (Bangkok, Thailand)"

### New Flow
1. Search database for "Bangkok"
2. If not found → Ask LLM: "What is the main international airport code for Bangkok?"
3. LLM returns: "BKK - Suvarnabhumi International Airport"
4. Use "BKK" instead of "XXX"

### Implementation
```typescript
async getDestinationCode(cityName: string): Promise<string> {
  const airport = await this.dbService.findAirportByCity(cityName);
  
  if (airport) {
    return airport.iata;
  }
  
  // LLM fallback
  console.log('[AirportCode] Database lookup failed, asking LLM...');
  const llmCode = await this.askLLMForAirportCode(cityName);
  return llmCode || 'XXX';
}

private async askLLMForAirportCode(cityName: string): Promise<string | null> {
  const prompt = `What is the IATA airport code for the main international airport in ${cityName}? Reply with ONLY the 3-letter code, nothing else.`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 10
  });
  
  const code = response.choices[0].message.content?.trim().toUpperCase();
  
  if (code && code.length === 3) {
    console.log('[AirportCode] LLM suggested:', code);
    return code;
  }
  
  return null;
}
```

## Priority Order
1. **Remove duplicate tabs** ✅ DONE
2. **Icon-only refresh** - Quick fix (2 min)
3. **WebView** - Medium (30 min)
4. **LLM fallback** - Medium (20 min)

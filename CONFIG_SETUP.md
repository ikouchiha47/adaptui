# API Configuration Setup

## Quick Start

1. **Copy the example config**:
   ```bash
   cp config.example.json config.json
   ```

2. **Add your API keys** to `config.json`

3. **Never commit** `config.json` (it's in `.gitignore`)

---

## Getting API Keys

### 1. Gemini API Key (Required)
**Used for**: LLM-powered recommendations

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Add to `config.json`:
   ```json
   "gemini": "YOUR_KEY_HERE"
   ```

**Free Tier**: 60 requests/minute

---

### 2. Google Places API Key (Optional)
**Used for**: Real-time place data (ratings, hours, photos)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Places API"
4. Go to Credentials → Create Credentials → API Key
5. Restrict the key to "Places API" only
6. Add to `config.json`:
   ```json
   "googlePlaces": "YOUR_KEY_HERE"
   ```

**Free Tier**: $200 credit/month (≈28,000 requests)

**Enable in config**:
```json
"settings": {
  "useRealData": true
}
```

---

### 3. OpenAI API Key (Optional)
**Used for**: Alternative LLM provider

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Add to `config.json`:
   ```json
   "openai": "sk-..."
   ```

**Cost**: Pay-as-you-go (GPT-3.5: $0.002/1K tokens)

---

### 4. Anthropic API Key (Optional)
**Used for**: Claude AI as alternative LLM

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Get API key
3. Add to `config.json`:
   ```json
   "anthropic": "sk-ant-..."
   ```

---

## Configuration Options

### Settings Explained

```json
{
  "settings": {
    "useRealData": false,        // Use real APIs vs mock data
    "defaultLLMProvider": "gemini", // Which LLM to use
    "cacheEnabled": true,        // Cache LLM responses
    "debugMode": false           // Show debug logs
  }
}
```

### Development vs Production

**Development** (POC):
```json
{
  "apiKeys": {
    "gemini": "your-key"
  },
  "settings": {
    "useRealData": false,  // Use mock data
    "debugMode": true      // See what's happening
  }
}
```

**Production**:
```json
{
  "apiKeys": {
    "gemini": "your-key",
    "googlePlaces": "your-key"
  },
  "settings": {
    "useRealData": true,   // Real API calls
    "debugMode": false,
    "cacheEnabled": true   // Save API costs
  }
}
```

---

## Usage in Code

```typescript
import { configManager } from './src/config/ConfigManager';

// Get API key
const geminiKey = configManager.getApiKey('gemini');

// Check setting
if (configManager.shouldUseRealData()) {
  // Use real APIs
}

// Debug mode
if (configManager.isDebugMode()) {
  console.log('Debug info...');
}
```

---

## Security Best Practices

✅ **DO**:
- Keep `config.json` in `.gitignore`
- Use environment variables in production
- Restrict API keys to specific services
- Rotate keys regularly

❌ **DON'T**:
- Commit `config.json` to git
- Share keys in screenshots/videos
- Use production keys in development
- Hardcode keys in source files

---

## Troubleshooting

### "API key not configured"
→ Make sure `config.json` exists and has the key

### "Invalid API key"
→ Check the key is correct and not expired

### "Quota exceeded"
→ You've hit the free tier limit, wait or upgrade

### Mock data showing instead of real data
→ Set `"useRealData": true` in settings
→ Make sure Google Places key is configured

---

## Cost Estimation

**For 1000 users/month** (POC):

| Service | Free Tier | Cost if Exceeded |
|---------|-----------|------------------|
| Gemini | 60 req/min | Free (enough for POC) |
| Google Places | 28k req/month | $0.017/request after |
| OpenAI GPT-3.5 | $5 credit | $0.002/1K tokens |

**Estimated POC cost**: $0 (within free tiers)

---

## Example config.json

```json
{
  "apiKeys": {
    "gemini": "AIzaSyD...",
    "googlePlaces": "AIzaSyC...",
    "openai": "",
    "anthropic": ""
  },
  "settings": {
    "useRealData": false,
    "defaultLLMProvider": "gemini",
    "cacheEnabled": true,
    "debugMode": true
  }
}
```

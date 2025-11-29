#!/bin/bash

# Test User-Agent rotation with a single problematic query

echo "Testing User-Agent rotation on site:reddit.com query"
echo "====================================================="
echo ""

# The problematic query that triggers CAPTCHA
QUERY="Bangkok+hidden+gems+local+favorites"
URL="https://html.duckduckgo.com/html/?q=${QUERY}"

# User-Agent that works in test-ddg-simple.sh (Firefox 145)
WORKING_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0"

# User-Agents from DDGScraperService.ts (older versions)
USER_AGENTS=(
  "$WORKING_UA"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
)

echo "Query: ${QUERY/+/ }"
echo "Testing ${#USER_AGENTS[@]} different User-Agents..."
echo ""

for i in "${!USER_AGENTS[@]}"; do
  ua="${USER_AGENTS[$i]}"
  
  # Extract browser name for display
  if [[ "$ua" == *"Firefox/145"* ]]; then
    browser="Firefox 145 (WORKING)"
  elif [[ "$ua" == *"Chrome"* ]]; then
    browser="Chrome"
  elif [[ "$ua" == *"Firefox"* ]]; then
    browser="Firefox"
  elif [[ "$ua" == *"Safari"* ]] && [[ "$ua" == *"Version"* ]]; then
    browser="Safari"
  elif [[ "$ua" == *"Edg"* ]]; then
    browser="Edge"
  else
    browser="Unknown"
  fi
  
  echo "[$((i+1))/${#USER_AGENTS[@]}] Testing $browser..."
  
  response=$(curl -s --compressed -w "\n%{http_code}" \
    -H "User-Agent: $ua" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
    -H "Accept-Language: en-US,en;q=0.5" \
    -H "Connection: keep-alive" \
    -H "Upgrade-Insecure-Requests: 1" \
    -H "Sec-Fetch-Dest: document" \
    -H "Sec-Fetch-Mode: navigate" \
    -H "Sec-Fetch-Site: none" \
    -H "Sec-Fetch-User: ?1" \
    -H "Cache-Control: no-cache" \
    -H "Pragma: no-cache" \
    "$URL")
  
  # Extract HTTP code (last line) and body (all but last line)
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')  # Remove last line (works on macOS)
  body_length=${#body}
  
  # Check result
  if echo "$body" | grep -q "anomaly-modal\|challenge-form"; then
    echo "    ❌ CAPTCHA (${body_length} bytes)"
  elif [ "$body_length" -eq 0 ]; then
    echo "    ❌ Empty response"
  elif [ "$http_code" = "200" ] && [ "$body_length" -gt 25000 ]; then
    echo "    ✅ Success (${body_length} bytes)"
  else
    echo "    ⚠️  Suspicious (${body_length} bytes)"
  fi
  
  sleep 3  # Longer delay between requests
done

echo ""
echo "=== SUMMARY ==="
echo ""
echo "If all User-Agents fail:"
echo "  → site:reddit.com queries are specifically blocked"
echo "  → DDG may have special rules for site-specific searches"
echo "  → Consider removing site: operator or using Reddit API directly"
echo ""
echo "If some User-Agents work:"
echo "  → Use those specific User-Agents in production"
echo "  → Rotate between working UAs"
echo "  → Add delay between requests (3-5 seconds)"

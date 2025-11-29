#!/bin/bash

# Simple DDG test - check if we get CAPTCHA or real results

echo "Testing DDG queries with proper headers..."
echo ""

# Test function
test() {
  local query="$1"
  local url="https://html.duckduckgo.com/html/?q=${query}"
  
  echo "Query: ${query/+/ }"
  
  # --compressed: curl auto-decompresses gzip/deflate/br
  # Don't request zstd since older curl versions don't support it
  response=$(curl -s --compressed \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0" \
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
    "$url")
  
  length=${#response}
  
  # Check for CAPTCHA markers
  if echo "$response" | grep -q "anomaly-modal\|challenge-form"; then
    echo "❌ CAPTCHA (${length} bytes)"
  elif [ "$length" -eq 0 ]; then
    echo "❌ Empty response (curl error or compression issue)"
  elif [ "$length" -lt 15000 ]; then
    echo "⚠️  Suspicious (${length} bytes - likely CAPTCHA)"
  elif [ "$length" -gt 25000 ]; then
    echo "✅ Success (${length} bytes)"
  else
    echo "⚠️  Unknown (${length} bytes)"
  fi
  
  echo ""
  sleep 2
}

# Test queries from logs
test "Starlight+Rooftop+Bar+bar+price+range+atmosphere+reviews"
test "The+Speakeasy+Rooftop+Bar+Bangkok+bar+price+range+atmosphere+reviews"
test "YOU+KNOW+WHERE+bar+price+range+atmosphere+reviews"
test "reddit.com+Bangkok+hidden+gems+local+favorites"
test "Bangkok+underrated+neighborhoods+local+food+blog"

echo "Done!"
echo ""
echo "Summary:"
echo "  ✅ Success = Real search results"
echo "  ❌ CAPTCHA = DDG blocking automated requests"
echo "  ⚠️  Suspicious = Likely CAPTCHA or error page"
echo ""
echo "Note: Even with proper headers, React Native fetch() won't work"
echo "      because it doesn't support Sec-Fetch-* headers (browser-only)"

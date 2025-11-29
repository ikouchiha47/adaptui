/**
 * Test Google Places searchText API to see if it returns generativeSummary
 */

import { configManager } from '../src/config/ConfigManager';

async function testSearchTextAPI() {
  const apiKey = configManager.getApiKeyOrNull('googlePlaces');
  if (!apiKey) {
    console.error('No Google Places API key');
    return;
  }

  const url = 'https://places.googleapis.com/v1/places:searchText';
  
  const payload = {
    textQuery: 'rooftop bars Bangkok',
    maxResultCount: 3,
    locationBias: {
      circle: {
        center: { latitude: 13.7563, longitude: 100.5018 },
        radius: 5000
      }
    }
  };
  
  const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.primaryType,places.priceLevel,places.currentOpeningHours,contextualContents,places.generativeSummary,places.areaSummary';
  
  console.log('🧪 Testing searchText API\n');
  console.log('📡 Request:');
  console.log(`URL: ${url}`);
  console.log(`Query: ${payload.textQuery}`);
  console.log(`FieldMask: ${fieldMask}\n`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask
    },
    body: JSON.stringify(payload)
  });

  console.log(`📥 Response: ${response.status} ${response.statusText}\n`);
  
  const data = await response.json();
  
  if (!data.places) {
    console.error('❌ No places returned');
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  
  console.log(`✅ Found ${data.places.length} places\n`);
  
  data.places.forEach((place: any, idx: number) => {
    console.log(`\n━━━ Place ${idx + 1}: ${place.displayName?.text} ━━━`);
    console.log(`ID: ${place.id}`);
    console.log(`Rating: ${place.rating || 'N/A'} (${place.userRatingCount || 0} reviews)`);
    console.log(`Type: ${place.primaryType || 'N/A'}`);
    console.log(`Location: ${place.location ? `${place.location.latitude}, ${place.location.longitude}` : 'N/A'}`);
    console.log(`Photos: ${place.photos?.length || 0}`);
    
    console.log(`\n🤖 generativeSummary: ${place.generativeSummary ? '✅ EXISTS' : '❌ MISSING'}`);
    if (place.generativeSummary) {
      console.log(`  Overview: ${place.generativeSummary.overview || 'N/A'}`);
      console.log(`  Description: ${place.generativeSummary.description || 'N/A'}`);
    }
    
    console.log(`\n📍 areaSummary: ${place.areaSummary ? '✅ EXISTS' : '❌ MISSING'}`);
    if (place.areaSummary) {
      console.log(`  ${place.areaSummary}`);
    }
  });
  
  if (data.contextualContents) {
    console.log(`\n\n📝 contextualContents: ${data.contextualContents.length} items`);
    data.contextualContents.forEach((content: any, idx: number) => {
      console.log(`\n  Context ${idx + 1}:`);
      console.log(`  Reviews: ${content.reviews?.length || 0}`);
      console.log(`  Photos: ${content.photos?.length || 0}`);
    });
  }
}

async function testWebDescription(placeName: string, location: string) {
  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🌐 Testing Web-Based Description for: ${placeName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  const apiKey = configManager.getApiKeyOrNull('openai');
  if (!apiKey) {
    console.error('❌ No OpenAI API key');
    return;
  }
  
  // Step 1: Search DDG
  const query = `${placeName} ${location} review what is it like`;
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  console.log(`🔍 Search Query: ${query}`);
  console.log(`📡 DDG URL: ${ddgUrl}\n`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  
  const response = await fetch(ddgUrl, { headers });
  const html = await response.text();
  
  console.log(`📥 DDG Response: ${response.status} (${html.length} bytes)\n`);
  
  // Extract snippets with simple regex
  const snippetRegex = /<a class="result__snippet"[^>]*>(.*?)<\/a>/gs;
  const titleRegex = /<a class="result__a"[^>]*>(.*?)<\/a>/gs;
  
  const snippetMatches = [...html.matchAll(snippetRegex)];
  const titleMatches = [...html.matchAll(titleRegex)];
  
  console.log(`📄 Found ${snippetMatches.length} snippets\n`);
  
  if (snippetMatches.length === 0) {
    console.log('❌ No snippets found - DDG may have blocked the request');
    return;
  }
  
  // Show top 3 results
  console.log('📝 Top 3 Results:\n');
  for (let i = 0; i < Math.min(3, snippetMatches.length); i++) {
    const title = titleMatches[i]?.[1]?.replace(/<[^>]*>/g, '').trim() || 'No title';
    const snippet = snippetMatches[i][1].replace(/<[^>]*>/g, '').trim();
    
    console.log(`  [${i + 1}] ${title}`);
    console.log(`  ${snippet.substring(0, 150)}...\n`);
  }
  
  // Combine snippets
  const combinedSnippets = snippetMatches
    .slice(0, 3)
    .map(m => m[1].replace(/<[^>]*>/g, '').trim())
    .join(' ');
  
  console.log(`📊 Combined snippet length: ${combinedSnippets.length} chars\n`);
  
  // Step 2: Use LLM to extract description
  const prompt = `Based on these web snippets about "${placeName}", write ONE engaging sentence describing what makes this place special.

Snippets:
${combinedSnippets}

Rules:
- ONE sentence only
- Focus on unique features, atmosphere, or what it's known for
- Be specific, not generic
- No quotes around the output

Description:`;

  console.log('🤖 Generating description with LLM...\n');
  
  const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    })
  });
  
  const llmData = await llmResponse.json();
  const description = llmData.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  
  console.log('✅ Generated Description:');
  console.log(`"${description}"`);
  console.log(`\nLength: ${description.length} chars`);
  
  if (description.length > 20 && description.length < 200) {
    console.log('✅ Valid description length');
  } else {
    console.log('⚠️ Description length out of range');
  }
}

async function runTests() {
  // Test 1: Google Places searchText API
  await testSearchTextAPI();
  
  // Test 2: Web-based description extraction
  await testWebDescription('The Speakeasy Rooftop Bar Bangkok', 'Bangkok');
}

runTests().catch(console.error);

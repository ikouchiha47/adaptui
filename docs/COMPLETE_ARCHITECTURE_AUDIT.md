# Complete Architecture Audit: Every File in src/

## 🎯 Analysis Methodology

**Keep Criteria:**
- ✅ Fetches/enriches data
- ✅ Infrastructure (cache, LLM, config)
- ✅ UI rendering (not UI logic)

**Delete Criteria:**
- ❌ Makes UI decisions (LLM's job)
- ❌ Unused/dead code
- ❌ Redundant with other services

---

## 📁 src/components/ (19 files)

### ✅ KEEP - UI Rendering Components

| File | Purpose | Verdict |
|------|---------|---------|
| `CentralOrb.tsx` | Animated orb UI element | ✅ Keep - Pure UI |
| `ComponentRenderer.tsx` | Renders UISchema components | ✅ Keep - Core renderer |
| `DynamicTravelScreen.tsx` | Dynamic UI screen | ✅ Keep - Screen component |
| `GlassCard.tsx` | Glassmorphism card UI | ✅ Keep - Pure UI |
| `Header.tsx` | App header | ✅ Keep - Pure UI |
| `HiddenWebViewScraper.tsx` | Hidden WebView for scraping | ✅ Keep - Data fetching |
| `MapView.tsx` | Map display | ✅ Keep - Pure UI |
| `OrbScene.tsx` | 3D orb scene | ✅ Keep - Pure UI |
| `PhotoDetailView.tsx` | Photo viewer | ✅ Keep - Pure UI |
| `PhotoGrid.tsx` | Photo grid layout | ✅ Keep - Pure UI |
| `Planet.tsx` | 3D planet animation | ✅ Keep - Pure UI |
| `SearchProgressIndicator.tsx` | Progress indicator | ✅ Keep - Pure UI |
| `TabBar.tsx` | Tab navigation | ✅ Keep - Pure UI |
| `ThemePicker.tsx` | Theme selector | ✅ Keep - Pure UI |
| `ThemeToggle.tsx` | Theme toggle button | ✅ Keep - Pure UI |
| `TicketCard.tsx` | Transport ticket card | ✅ Keep - Pure UI |
| `TravelScreen.tsx` | Static travel screen | ✅ Keep - Screen component |
| `WebViewModal.tsx` | WebView modal | ✅ Keep - Pure UI |

**Summary:** All components are pure UI rendering - no logic, just display. Keep all.

---

## 📁 src/config/ (1 file)

| File | Purpose | Verdict |
|------|---------|---------|
| `ConfigManager.ts` | Manages app configuration | ✅ Keep - Infrastructure |

---

## 📁 src/core/ (6 files)

### ✅ KEEP - Core Infrastructure

| File | Purpose | Verdict |
|------|---------|---------|
| `CategoryManager.ts` | Manages categories | ⚠️ **REVIEW** - Might be UI logic |
| `GeminiCore.ts` | Gemini LLM integration | ✅ Keep - LLM provider |
| `LLMProvider.ts` | LLM interface | ✅ Keep - Core abstraction |
| `LLMProviderFactory.ts` | LLM factory | ✅ Keep - Infrastructure |
| `OpenAICore.ts` | OpenAI integration | ✅ Keep - LLM provider |
| `WorkflowEngine.ts` | Workflow orchestration | ⚠️ **REVIEW** - Check if used |

**Action Items:**
- Review `CategoryManager.ts` - might be doing UI categorization
- Check if `WorkflowEngine.ts` is actually used

---

## 📁 src/plugins/ (5 files)

### ✅ KEEP - Plugin System

| File | Purpose | Verdict |
|------|---------|---------|
| `index.ts` | Plugin exports | ✅ Keep |
| `LocalTipsPlugin.tsx` | Local tips tab | ✅ Keep - Data enrichment |
| `NeighborhoodPlugin.tsx` | Neighborhood tab | ✅ Keep - Data enrichment |
| `PluginSystem.ts` | Plugin infrastructure | ✅ Keep - Core system |
| `TransportPlugin.tsx` | Transport tab | ✅ Keep - Data enrichment |

**Summary:** Plugins enrich data and provide additional context. Keep all.

---

## 📁 src/screens/ (2 files)

| File | Purpose | Verdict |
|------|---------|---------|
| `AdaptUIScreen.tsx` | Main adaptive UI screen | ✅ Keep - Core screen |
| `ModeSelectorScreen.tsx` | Mode selection screen | ✅ Keep - Core screen |

---

## 📁 src/services/ (42 files) 🔥 **MAIN AUDIT TARGET**

### ✅ KEEP - Data Fetching (10 files)

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `GooglePlacesClient.ts` | Fetch places from Google | TravelService | ✅ Keep |
| `DDGScraperService.ts` | Scrape DuckDuckGo | SearchProxyService | ✅ Keep |
| `BraveScraperService.ts` | Scrape Brave | SearchProxyService | ✅ Keep |
| `RedditScraperService.ts` | Scrape Reddit | TravelService | ✅ Keep |
| `WebViewScraperService.ts` | General web scraping | TravelService | ✅ Keep |
| `SearchProxyService.ts` | Load balancer for scrapers | TravelService, PlacesInsights | ✅ Keep |
| `PlacesAPIService.ts` | Places API wrapper | ? | ⚠️ Check usage |
| `GooglePlacesSummaryService.ts` | Google Places summaries | ? | ⚠️ Check usage |
| `PlacesPhotoService.ts` | Fetch place photos | TravelService | ✅ Keep |
| `StreetViewService.ts` | Street view images | ? | ⚠️ Check usage |

### ✅ KEEP - Query Processing (3 files)

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `QueryAnalysisService.ts` | Analyze query intent | TravelService | ✅ Keep |
| `QueryProcessingService.ts` | Decompose queries | TravelService | ✅ Keep |
| `QueryRouter.ts` | Route sub-queries | TravelService | ✅ Keep |

### ✅ KEEP - Data Enrichment (6 files)

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `DataEnrichmentService.ts` | Enrich place data | TravelService | ✅ Keep |
| `EnrichmentCoordinator.ts` | Coordinate enrichment | ? | ⚠️ Check usage |
| `PlacesInsightsService.ts` | Generate insights | CrowdIntelligence | ✅ Keep |
| `LocalTipsGenerator.ts` | Generate local tips | LocalTipsAgent | ✅ Keep |
| `CrowdIntelligenceService.ts` | Crowd intelligence | RankingService | ✅ Keep |
| `SentimentAnalyzer.ts` | Sentiment analysis | ? | ⚠️ Check usage |

### ✅ KEEP - Infrastructure (8 files)

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `CacheService.ts` | Cache (React Native) | Everywhere | ✅ Keep |
| `CacheService.node.ts` | Cache (Node.js) | Tests | ✅ Keep |
| `CacheServiceFactory.ts` | Cache factory | Everywhere | ✅ Keep |
| `ICacheService.ts` | Cache interface | Everywhere | ✅ Keep |
| `DatabaseService.ts` | Database access | ? | ⚠️ Check usage |
| `TaskExecutor.ts` | Parallel task execution | TravelService | ✅ Keep |
| `CapabilityDetector.ts` | Detect capabilities | TravelService | ✅ Keep |
| `SearchProgressTracker.ts` | Track search progress | TravelService | ✅ Keep |

### ✅ KEEP - Transport (5 files)

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `TransportService.ts` | Transport orchestration | TravelService | ✅ Keep |
| `TransportResearchAgent.ts` | Research transport | TransportService | ✅ Keep |
| `TransportModeAnalyzer.ts` | Analyze transport modes | TransportService | ✅ Keep |
| `AirportCodeService.ts` | Airport code lookup | TransportService | ✅ Keep |
| `AirportDatabaseService.ts` | Airport database | AirportCodeService | ✅ Keep |
| `AirportValidator.ts` | Validate airports | TransportService | ✅ Keep |

### ✅ KEEP - Ranking (2 files)

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `RankingService.ts` | Rank places | TravelService | ✅ Keep |
| `ranking/PlaceRanker.ts` | Place ranking logic | RankingService | ✅ Keep |
| `ranking/LLMReranker.ts` | LLM-based reranking | RankingService | ✅ Keep |

### ❌ DELETE - UI Logic (2 files)

| File | Purpose | Problem | Verdict |
|------|---------|---------|---------|
| `PlaceCategorizationService.ts` | Categorize places | **UI logic - LLM should decide** | ❌ DELETE |
| `UIGenerationService.ts` | Generate UI | **Too complex - simplify** | ⚠️ SIMPLIFY |

### ⚠️ REVIEW - Unclear Purpose (6 files)

| File | Purpose | Action |
|------|---------|--------|
| `SearchService.ts` | Generic search? | Check if redundant with TravelService |
| `SearchContext.ts` | Search context? | Check usage |
| `ReasoningService.ts` | Reasoning logic? | Check if used |
| `ToolService.ts` | Tool management? | Check if used |
| `ItineraryService.ts` | Itinerary planning | Check if used (plan intent) |
| `LocationService.ts` | Location services | Check if used |

### ✅ KEEP - Main Orchestrator (1 file)

| File | Purpose | Verdict |
|------|---------|---------|
| `TravelService.ts` | Main orchestrator | ✅ Keep - Core service |

---

## 📁 src/services/research/ (9 files)

### ✅ KEEP - Research Agents

| File | Purpose | Used By | Verdict |
|------|---------|---------|---------|
| `BaseResearchAgent.ts` | Base agent class | All agents | ✅ Keep |
| `PlaceDetailsAgent.ts` | Research place details | TravelService | ✅ Keep |
| `NeighborhoodAgent.ts` | Research neighborhoods | NeighborhoodPlugin | ✅ Keep |
| `LocalTipsAgent.ts` | Research local tips | LocalTipsPlugin | ✅ Keep |
| `ReActAgent.ts` | ReAct pattern agent | ? | ⚠️ Check usage |
| `ResearchOrchestrator.ts` | Orchestrate research | TravelService | ✅ Keep |
| `TaskManager.ts` | Manage research tasks | ResearchOrchestrator | ✅ Keep |
| `SharedTempMemory.ts` | Shared memory | Agents | ✅ Keep |
| `PlaceDetailsCapability.ts` | Place details capability | PlaceDetailsAgent | ✅ Keep |

---

## 📁 src/store/ (1 file)

| File | Purpose | Verdict |
|------|---------|---------|
| `appStore.ts` | Zustand store | ✅ Keep - State management |

---

## 📁 src/theme/ (3 files)

| File | Purpose | Verdict |
|------|---------|---------|
| `orbitalThemes.ts` | Orbital themes | ✅ Keep - Theme data |
| `ThemeContext.tsx` | Theme context | ✅ Keep - Theme provider |
| `themes.ts` | Theme definitions | ✅ Keep - Theme data |

---

## 📁 src/types/ (6 files)

| File | Purpose | Verdict |
|------|---------|---------|
| `hybrid-ui.zod.ts` | Hybrid UI schema | ✅ Keep - Type definitions |
| `index.ts` | Type exports | ✅ Keep |
| `query-analysis.zod.ts` | Query analysis schema | ✅ Keep - Type definitions |
| `ui-schema.ts` | UI schema types | ✅ Keep - Type definitions |
| `ui-schema.zod.ts` | UI schema validation | ✅ Keep - Type definitions |
| `wink-sentiment.d.ts` | Sentiment types | ✅ Keep - Type definitions |

---

## 📁 src/ui-engine/ (8 files + 2 subdirs)

### ✅ KEEP - UI Engine Core

| File | Purpose | Verdict |
|------|---------|---------|
| `ComponentRegistry.ts` | Component registry | ✅ Keep - Core registry |
| `ComponentRenderer.tsx` | Render components | ✅ Keep - Core renderer |
| `ModularComponentRenderer.tsx` | Modular renderer | ✅ Keep - Core renderer |
| `UIGenerator.ts` | Generate UI from LLM | ✅ Keep - Core generator |
| `prompts.ts` | LLM prompts | ✅ Keep - Prompt templates |
| `SchemaValidator.ts` | Validate schemas | ✅ Keep - Validation |
| `index.ts` | Exports | ✅ Keep |

### ✅ KEEP - UI Components (src/ui-engine/components/)

All component renderers are pure UI - keep all 9 files.

### ✅ KEEP - Examples (src/ui-engine/examples/)

Example code for testing - keep all 3 files.

---

## 📁 src/utils/ (3 files)

| File | Purpose | Verdict |
|------|---------|---------|
| `formatters.ts` | Format utilities | ✅ Keep - Utilities |
| `photoGridVariants.ts` | Photo grid layouts | ✅ Keep - Utilities |
| `priceFormatter.ts` | Price formatting | ✅ Keep - Utilities |

---

## 📊 SUMMARY

### Total Files: 115

### ✅ KEEP: 100 files (87%)
- Components: 19
- Core: 6
- Plugins: 5
- Screens: 2
- Services: 40
- Research: 9
- Store: 1
- Theme: 3
- Types: 6
- UI Engine: 17
- Utils: 3

### ❌ DELETE: 1 file (1%)
- `PlaceCategorizationService.ts` - UI logic, LLM should decide

### ⚠️ REVIEW: 14 files (12%)
- `CategoryManager.ts` - Check if UI logic
- `WorkflowEngine.ts` - Check if used
- `PlacesAPIService.ts` - Check if redundant
- `GooglePlacesSummaryService.ts` - Check if used
- `StreetViewService.ts` - Check if used
- `EnrichmentCoordinator.ts` - Check if used
- `SentimentAnalyzer.ts` - Check if used
- `DatabaseService.ts` - Check if used
- `SearchService.ts` - Check if redundant
- `SearchContext.ts` - Check usage
- `ReasoningService.ts` - Check if used
- `ToolService.ts` - Check if used
- `ItineraryService.ts` - Check if used (plan intent)
- `LocationService.ts` - Check if used

### ⚠️ SIMPLIFY: 1 file
- `UIGenerationService.ts` - Remove complex hydration, let LLM do more

---

## 🎯 ACTION PLAN

### Phase 1: Immediate Deletions
1. ❌ Delete `PlaceCategorizationService.ts`
2. ⚠️ Simplify `UIGenerationService.ts` (remove 200-line hydration)

### Phase 2: Usage Audit (Run grep searches)
For each file in REVIEW list:
```bash
# Example
grep -r "CategoryManager" src/
grep -r "WorkflowEngine" src/
grep -r "PlacesAPIService" src/
# ... etc
```

If not used → Delete
If used → Keep

### Phase 3: Consolidation
- Merge redundant services (e.g., SearchService vs TravelService)
- Simplify service dependencies
- Document what each service does

---

## 🏆 FINAL ARCHITECTURE

### Data Flow (Simplified)
```
User Query
    ↓
QueryAnalysisService (intent, sentiment, params)
    ↓
TravelService (orchestrate everything)
    ├─→ GooglePlacesClient (fetch places)
    ├─→ SearchProxyService (web search)
    ├─→ ResearchOrchestrator (enrich data)
    │   ├─→ PlaceDetailsAgent
    │   ├─→ NeighborhoodAgent
    │   └─→ LocalTipsAgent
    ├─→ TransportService (transport options)
    └─→ RankingService (rank results)
    ↓
UIGenerator (LLM generates UI)
    ↓
ComponentRenderer (render UI)
```

### Service Categories
1. **Data Sources** (10) - Fetch raw data
2. **Query Processing** (3) - Understand queries
3. **Data Enrichment** (6) - Add context
4. **Infrastructure** (8) - Cache, LLM, tasks
5. **Transport** (5) - Transport-specific
6. **Ranking** (3) - Sort results
7. **Research** (9) - Deep research
8. **UI Generation** (2) - Generate UI (LLM-driven)

**Total: 46 core services** (down from 42 after deletions)

---

## 💡 KEY INSIGHTS

1. **Most services are good** - 87% are doing data fetching/enrichment
2. **Only 1 service is pure UI logic** - PlaceCategorizationService
3. **14 services need usage audit** - Might be dead code
4. **UI generation needs simplification** - Too much hydration logic

**Your architecture is mostly correct** - just needs cleanup, not redesign.

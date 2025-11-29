# Comparison Feature - Requirements

## Overview

Implement product/service comparison using a **full-fledged ReAct agent** that autonomously gathers data via web scraping, then generates a comparison UI using the existing theming and dynamic UI generation system.

**Key Principle:** Don't build a specialized ComparisonAgent. Use a general-purpose ReAct agent with tools (HiddenWebViewScraper) and let it figure out how to gather comparison data.

## User Story

**As a user**, I want to compare products/services by asking natural language questions like:
- "Compare iPhone 15 Pro vs Samsung S24 Ultra"
- "Compare Tesla Model 3 vs BMW i4"
- "Compare Notion vs Obsidian for note-taking"

**So that** I get a side-by-side comparison with specs, pros/cons, pricing, and reviews without manually visiting multiple websites.

## Architecture

### Phase 1: Data Gathering (ReAct Agent Loop)

```
User Query: "Compare iPhone 15 Pro vs Samsung S24 Ultra"
    ↓
QueryAnalysisService
    ├─ Intent: compare
    ├─ Items: ["iPhone 15 Pro", "Samsung S24 Ultra"]
    ├─ Needs structured response: YES
    └─ Schema: ComparisonSchema (specs, pricing, pros/cons)
    ↓
QueryProcessingService (existing)
    ├─ Validates query
    └─ Passes to ReAct agent
    ↓
ReActAgent (max_iterations: 10-15)
    ├─ Tool: HiddenWebViewScraper
    ├─ Tool: TrustedSiteRegistry
    └─ Tool: DataValidator
    ↓
Agent Loop:
  1. Thought: "I need specs for iPhone 15 Pro"
  2. Action: scrape("https://apple.com/iphone-15-pro/specs")
  3. Observation: [HTML content]
  4. Thought: "Extract specs from HTML"
  5. Action: extract_specs(html)
  6. Observation: {display: "6.1 inch", chip: "A17 Pro", ...}
  7. Thought: "I need specs for Samsung S24 Ultra"
  8. Action: scrape("https://samsung.com/s24-ultra/specs")
  9. ... (continues until data complete)
    ↓
Output: Structured comparison data
{
  items: [
    {
      name: "iPhone 15 Pro",
      specs: {...},
      pricing: {...},
      pros: [...],
      cons: [...]
    },
    {
      name: "Samsung S24 Ultra",
      specs: {...},
      pricing: {...},
      pros: [...],
      cons: [...]
    }
  ]
}
```

### Phase 2: UI Generation (Existing System)

```
Structured Data → UIGenerator → Comparison UI Schema → ComponentRenderer
```

## Goals

1. **ReAct agent autonomy** - Agent decides what sites to visit, what data to extract, when it's done
2. **Structured response detection** - QueryAnalysisService detects when structured data is needed
3. **Tool-based scraping** - HiddenWebViewScraper as a tool, not a specialized agent
4. **Trusted site control** - TrustedSiteRegistry validates domains before scraping
5. **No code changes to working systems** - Don't touch LLM providers, existing services

## Non-Goals

- Building specialized ComparisonAgent (use general ReAct agent)
- Modifying existing LLM provider internals
- Changing TravelService or existing data gathering flows
- Building new UI generation system (use existing)
- Real-time price tracking or monitoring

## Success Criteria

1. ReAct agent successfully gathers comparison data in 10-15 iterations
2. Agent visits 3+ trusted sites per item
3. Generates valid comparison UI schema using existing UIGenerator
4. Comparison UI renders correctly with side-by-side layout
5. Response time < 20 seconds for 2-item comparison
6. Works for at least 3 categories: tech products, cars, software tools

## Constraints

- **No touching**: LLMProvider, LLMProviderFactory, OpenAICore, GeminiCore
- **No touching**: Existing TravelService, UIGenerationService, ComponentRenderer
- **Must use**: Existing QueryAnalysisService (extend for structured response detection)
- **Must use**: Existing QueryProcessingService (pass to ReAct agent)
- **Must use**: Existing ComponentRegistry, UIGenerator
- **Must implement**: ReActAgent, HiddenWebViewScraper (as tool), TrustedSiteRegistry

## Implementation Plan

### 1. Extend QueryAnalysisService

Add structured response detection:

```typescript
interface QueryAnalysis {
  intent: 'search' | 'compare' | 'plan' | 'navigate';
  needsStructuredResponse: boolean;
  structuredSchema?: z.ZodSchema; // Zod schema for validation
  items?: string[]; // For comparison: ["iPhone 15 Pro", "Samsung S24 Ultra"]
  // ... existing fields
}
```

### 2. Create ReActAgent

General-purpose agent with tool calling:

```typescript
class ReActAgent {
  constructor(
    private llm: LLMProvider,
    private tools: Tool[],
    private maxIterations: number = 15
  ) {}

  async run(query: string, analysis: QueryAnalysis): Promise<any> {
    let iteration = 0;
    let context = { query, analysis, observations: [] };
    
    while (iteration < this.maxIterations) {
      // 1. Thought: LLM decides next action
      const thought = await this.llm.generateThought(context);
      
      // 2. Action: LLM selects tool and parameters
      const action = await this.llm.selectAction(thought, this.tools);
      
      if (action.type === 'finish') {
        return action.result;
      }
      
      // 3. Observation: Execute tool
      const observation = await this.executeTool(action);
      context.observations.push({ thought, action, observation });
      
      iteration++;
    }
    
    throw new Error('Max iterations reached');
  }
}
```

### 3. Create HiddenWebViewScraper Tool

```typescript
class HiddenWebViewScraper implements Tool {
  name = 'scrape_website';
  description = 'Scrape a website using hidden WebView. Returns HTML content.';
  
  async execute(params: { url: string }): Promise<string> {
    // Validate URL with TrustedSiteRegistry
    if (!TrustedSiteRegistry.isAllowed(params.url)) {
      throw new Error(`Domain not in trusted list: ${params.url}`);
    }
    
    // Use existing HiddenWebViewScraper component
    return await HiddenWebViewScraper.scrape(params.url);
  }
}
```

### 4. Create TrustedSiteRegistry

```typescript
class TrustedSiteRegistry {
  private static trustedDomains = [
    'apple.com',
    'samsung.com',
    'gsmarena.com',
    'techradar.com',
    'cnet.com',
    'theverge.com',
    'tesla.com',
    'bmw.com',
    'notion.so',
    'obsidian.md'
  ];
  
  static isAllowed(url: string): boolean {
    const domain = new URL(url).hostname;
    return this.trustedDomains.some(trusted => 
      domain === trusted || domain.endsWith(`.${trusted}`)
    );
  }
  
  static addDomain(domain: string): void {
    this.trustedDomains.push(domain);
  }
}
```

### 5. Create ComparisonService (Orchestrator)

```typescript
class ComparisonService {
  private reactAgent: ReActAgent;
  
  constructor() {
    const tools = [
      new HiddenWebViewScraper(),
      new DataExtractor(),
      new DataValidator()
    ];
    
    this.reactAgent = new ReActAgent(
      LLMProviderFactory.getProvider(),
      tools,
      15 // max iterations
    );
  }
  
  async compare(query: string): Promise<ComparisonData> {
    // 1. Analyze query
    const analysis = await QueryAnalysisService.analyzeQuery(query);
    
    if (analysis.intent !== 'compare') {
      throw new Error('Not a comparison query');
    }
    
    // 2. Run ReAct agent
    const data = await this.reactAgent.run(query, analysis);
    
    // 3. Validate structured response
    if (analysis.structuredSchema) {
      analysis.structuredSchema.parse(data);
    }
    
    return data;
  }
}
```

### 6. Update QueryAnalysisService

Add comparison detection:

```typescript
// In QueryAnalysisService.analyzeQuery()
if (intent === 'compare') {
  return {
    ...analysis,
    needsStructuredResponse: true,
    structuredSchema: ComparisonSchema,
    items: extractItems(query) // ["iPhone 15 Pro", "Samsung S24 Ultra"]
  };
}
```

## Acceptance Criteria

### Phase 1: Data Gathering
- [ ] QueryAnalysisService detects comparison intent
- [ ] QueryAnalysisService extracts items to compare
- [ ] QueryAnalysisService sets needsStructuredResponse flag
- [ ] ReActAgent runs with max 15 iterations
- [ ] HiddenWebViewScraper tool works in agent loop
- [ ] TrustedSiteRegistry validates domains
- [ ] Agent extracts structured data (specs, pricing, pros/cons)
- [ ] Agent validates data completeness
- [ ] Agent handles scraping failures gracefully

### Phase 2: UI Generation
- [ ] Uses existing UIGenerator with comparison-specific prompt
- [ ] Generates side-by-side comparison layout
- [ ] Shows specs table with highlighting
- [ ] Shows pros/cons lists
- [ ] Shows pricing comparison
- [ ] Uses existing theme system

### Quality
- [ ] No changes to LLM provider code
- [ ] No changes to existing TravelService
- [ ] No changes to existing UIGenerationService
- [ ] All new code in separate files
- [ ] Comprehensive error handling
- [ ] Logging for debugging agent loop

## Out of Scope (Future Work)

- Vision-based theme generation (mentioned in BLOG_1)
- Multi-item comparison (>2 items)
- Historical price tracking
- User reviews aggregation
- Affiliate links
- Specialized agents (use general ReAct agent for everything)

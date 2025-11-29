// UI Generation Service - Simplified (LLM-driven, no hydration)

import { DeviceContext, UISchema } from '../types/ui-schema';
import { UIGenerator } from '../ui-engine/UIGenerator';
import { EnrichedPlace } from './DataEnrichmentService';
import { QueryAnalysis } from './QueryAnalysisService';

export type UIMode = 'static' | 'dynamic';

export class UIGenerationService {
  private uiGenerator: UIGenerator;

  constructor() {
    this.uiGenerator = new UIGenerator();
  }

  /**
   * Generate UI based on mode
   * @param mode - static (use existing TravelScreen) or dynamic (LLM-generated)
   * @param analysis - Query analysis with intent, sentiment, temporal context
   * @param enrichedData - Enriched place data with all details
   * @param deviceContext - Device info (platform, dimensions)
   * @param capabilities - Available capabilities (photos, maps, transport, etc.)
   * @param externalInstruction - Optional instruction to override UI generation (e.g., "use masonry photo grid")
   */
  async generateUI(
    mode: UIMode,
    analysis: QueryAnalysis,
    enrichedData: EnrichedPlace[],
    deviceContext: DeviceContext,
    capabilities: any,
    externalInstruction?: string
  ): Promise<UISchema | null> {
    console.log(`🎨 [UIGeneration] Mode: ${mode}`);
    
    if (mode === 'static') {
      console.log('📱 [UIGeneration] Using static TravelScreen');
      return null;
    }
    
    console.log('✨ [UIGeneration] Generating dynamic UI with LLM');
    if (externalInstruction) {
      console.log(`📝 [UIGeneration] External instruction: ${externalInstruction}`);
    }
    return this.generateDynamicUI(analysis, enrichedData, deviceContext, capabilities, externalInstruction);
  }

  /**
   * Generate complete UI schema using LLM (no hydration needed)
   */
  private async generateDynamicUI(
    analysis: QueryAnalysis,
    data: EnrichedPlace[],
    context: DeviceContext,
    capabilities: any,
    externalInstruction?: string
  ): Promise<UISchema> {
    // Build comprehensive prompt with ALL data
    const prompt = this.buildCompletePrompt(analysis, data, context, capabilities, externalInstruction);
    
    // Let LLM generate COMPLETE UISchema (no hydration!)
    const schema = await this.uiGenerator.generateUI(prompt, context, capabilities, data);
    
    // Validate schema
    if (!this.isValidSchema(schema)) {
      console.error('❌ [UIGeneration] Invalid schema from LLM, using fallback');
      return this.getFallbackSchema(analysis, data);
    }
    
    console.log('✅ [UIGeneration] Generated complete schema:', {
      components: schema.components.length,
      hasData: schema.components.some(c => c.props && 'items' in c.props && (c.props as any).items?.length > 0)
    });
    
    return schema;
  }

  /**
   * Sanitize data to remove API keys and compress photo URLs
   */
  private sanitizeData(data: any): any {
    const sanitized = JSON.parse(JSON.stringify(data)); // Deep clone
    
    const sanitizeObject = (obj: any): void => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        // Replace photo URL arrays with count indicator
        if (key === 'photoUrls' && Array.isArray(obj[key])) {
          const count = obj[key].length;
          obj[key] = count > 0 ? [`[${count} photos available]`] : [];
        }
        // Replace single photo URL with placeholder
        else if (key === 'photoUrl' && typeof obj[key] === 'string') {
          obj[key] = '[photo available]';
        }
        // Recursively sanitize nested objects
        else if (Array.isArray(obj[key])) {
          obj[key].forEach((item: any) => {
            if (typeof item === 'object') {
              sanitizeObject(item);
            }
          });
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    };
    
    if (Array.isArray(sanitized)) {
      sanitized.forEach(item => sanitizeObject(item));
    } else {
      sanitizeObject(sanitized);
    }
    
    return sanitized;
  }

  /**
   * Build comprehensive prompt with all data for LLM
   */
  private buildCompletePrompt(
    analysis: QueryAnalysis,
    data: EnrichedPlace[],
    context: DeviceContext,
    capabilities: any,
    externalInstruction?: string
  ): string {
    // Extract key info
    const intent = analysis.intent;
    const sentiment = analysis.sentiment;
    const categories = analysis.categories || [];
    const temporal = analysis.temporal;
    
    // Sanitize data to remove API keys
    const sanitizedData = this.sanitizeData(data);
    
    // Sample data structure (first item)
    const dataSample = sanitizedData[0] || {};
    
    return `You are AdaptUI. Generate a COMPLETE UISchema with all data populated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Intent: ${intent}
Categories: ${categories.join(', ')}
Emotion: ${sentiment.emotion} (${sentiment.intensity})
Vibe: ${sentiment.vibe.join(', ')}
Best Time: ${temporal.suggestedTimeOfDay}
Time Reasoning: ${temporal.timeReasoning}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEVICE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Platform: ${context.platform}
Screen: ${context.dimensions.width}x${context.dimensions.height}px
Layout: ${context.dimensions.width < 375 ? 'Single column, large touch targets' : context.dimensions.width < 768 ? 'Single/dual column' : 'Multi-column grid'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAPABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(capabilities?.capabilities || {}).map(([k, v]) => `- ${k}: ${v ? '✅ Available' : '❌ Not available'}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA (${data.length} places)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sample Structure:
${JSON.stringify(dataSample, null, 2).substring(0, 1000)}...

Full Data:
${JSON.stringify(sanitizedData, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: Generate COMPLETE UISchema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a complete UISchema with ALL data populated. No placeholders, no minimal structures.

${externalInstruction ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  EXTERNAL INSTRUCTION (HIGHEST PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${externalInstruction}

CRITICAL: Follow this instruction EXACTLY. Override any default behavior if needed.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

INTENT-SPECIFIC UI:
${this.getIntentGuidance(intent, sentiment, categories)}

COMPONENT REQUIREMENTS:

1. FILTER CHIPS (if applicable)
   - Generate based on data characteristics
   - Choose icons based on sentiment:
     * romantic → heart, candle, rose
     * fun → party, music, cocktail
     * peaceful → leaf, spa, meditation
     * luxury → diamond, crown, star
     * budget → cash, wallet, piggy-bank
   - Example:
     {
       "type": "chip-group",
       "props": {
         "options": [
           { "id": "budget", "label": "Budget Friendly", "icon": "cash" },
           { "id": "luxury", "label": "Luxury", "icon": "diamond" }
         ]
       }
     }

2. LIST COMPONENTS
   - Map ALL data fields to component props
   - Include: destination, vibe, highlights, bestTime, localTip, photoUrls
   - Add enrichment data: crowdLevel, weather, timeRecommendation
   - Example:
     {
       "type": "list",
       "props": {
         "items": [
           {
             "destination": "Bangkok",
             "vibe": "energetic and fun",
             "highlights": [...],
             "bestTime": "evening",
             "crowdLevel": "busy",
             "weather": { "temp": 32, "conditions": "sunny" }
           }
         ]
       }
     }

3. PHOTO SELECTION (if photos capability available)
   - Select photos based on query intent:
     * romantic → sunset, candlelit, intimate settings
     * fun → crowds, nightlife, activities
     * peaceful → nature, temples, quiet spaces
     * adventure → action, outdoor, exciting
   - Limit to 5 most relevant photos

4. BADGES & INDICATORS
   - Time badge: Show best time with appropriate icon
     * morning → sunrise
     * afternoon → sun
     * evening → sunset
     * night → moon
   - Crowd badge: Show crowd level with icon
     * quiet → 1 person
     * moderate → 2 people
     * busy → 3 people
     * packed → 4 people
   - Weather badge: Show current weather

5. STYLING
   - Use emotion-appropriate colors:
     * romantic → warm pinks, reds, golds
     * fun → vibrant blues, purples, greens
     * peaceful → soft greens, blues, whites
     * luxury → deep purples, golds, blacks
   - Adjust spacing based on emotion intensity

CRITICAL RULES:
1. Return COMPLETE schema - all props populated with actual data
2. NO placeholders like "{{destination}}" or "TBD"
3. Map ALL fields from data to component props
4. Choose icons intelligently based on sentiment
5. Select photos based on query intent
6. Include proper theme colors matching emotion
7. Ensure all components have required props

Return valid JSON matching UISchema type.`;
  }

  /**
   * Get intent-specific UI guidance
   */
  private getIntentGuidance(intent: string, sentiment: any, categories: string[]): string {
    switch (intent) {
      case 'compare':
        return `
COMPARISON UI:
- Generate side-by-side comparison table
- Show comparison dimensions (price, rating, features)
- Add winner badges per dimension
- Use two-column layout
- Include pros/cons lists`;

      default:
        return `
GENERAL UI:
- Generate appropriate layout for ${categories.join(', ')}
- Use ${sentiment.emotion} emotion styling
- Include relevant filters and actions`;
    }
  }

  /**
   * Validate schema has required fields
   */
  private isValidSchema(schema: UISchema): boolean {
    if (!schema) return false;
    if (!schema.components || schema.components.length === 0) return false;
    if (!schema.theme) return false;
    if (!schema.layout) return false;
    
    // Check if components have data
    const hasData = schema.components.some(c => {
      if (c.type === 'list' && c.props && 'items' in c.props) {
        return (c.props as any).items?.length > 0;
      }
      return true;
    });
    
    return hasData;
  }

  /**
   * Fallback schema if LLM fails
   */
  private getFallbackSchema(analysis: QueryAnalysis, data: EnrichedPlace[]): UISchema {
    return {
      id: `fallback-${Date.now()}`,
      version: '1.0',
      uiType: 'list',
      title: `Results for ${analysis.categories?.[0] || 'search'}`,
      theme: {
        colors: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          background: '#0F172A',
          surface: '#1E293B',
          text: '#F1F5F9',
          textSecondary: '#94A3B8',
          border: '#334155',
          error: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
        },
        typography: {
          heading: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
          subheading: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
          body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
          caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
        borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 },
      },
      layout: {
        type: 'stack',
        config: { flexDirection: 'column' },
      },
      components: [
        {
          id: 'results-list',
          type: 'list',
          props: {
            items: data.map((place: any) => ({
              destination: place.destination || place.name,
              vibe: place.vibe || place.enrichment?.vibe?.join(', '),
              highlights: place.highlights || [],
              bestTime: place.bestTime || analysis.temporal?.suggestedTimeOfDay,
              localTip: place.localTip || '',
              photoUrls: place.highlights?.flatMap((h: any) => h.photoUrls || []) || [],
              crowdLevel: place.enrichment?.popularity?.crowdLevel,
              weather: place.enrichment?.weather,
            })),
          },
        },
      ],
      actions: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        queryHash: '',
        category: analysis.categories?.[0] || 'unknown',
        tags: [analysis.intent, ...(analysis.categories || [])].filter(Boolean) as string[],
      },
    };
  }
}

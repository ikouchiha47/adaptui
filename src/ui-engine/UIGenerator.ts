// UI Generator - Creates UI schemas from user queries using LLM

import { configManager } from '../config/ConfigManager';
import { GeminiCore } from '../core/GeminiCore';
import { LLMProvider } from '../core/LLMProvider';
import { OpenAICore } from '../core/OpenAICore';
import { HybridUIStructure, HybridUIStructureSchema } from '../types/hybrid-ui.zod';
import { QueryAnalysisSchema } from '../types/query-analysis.zod';
import { DeviceContext, UISchema } from '../types/ui-schema';
import { buildIntentAnalysisPrompt, buildSchemaGenerationPrompt } from './prompts';

export class UIGenerator {
  private llm: LLMProvider;

  constructor() {
    // Try OpenAI first (better JSON support), fall back to Gemini
    const openaiKey = configManager.getApiKeyOrNull('openai');
    const openaiModel = configManager.getOpenAIModel();
    
    if (openaiKey) {
      console.log('🤖 [UIGenerator] Using OpenAI for UI generation');
      this.llm = new OpenAICore(openaiKey, openaiModel);
    } else {
      const geminiKey = configManager.getApiKeyOrNull('gemini');
      const modelName = configManager.getModelName();
      if (!geminiKey) {
        throw new Error('OpenAI or Gemini API key required for UI generation');
      }
      console.log('🤖 [UIGenerator] Using Gemini for UI generation');
      this.llm = new GeminiCore(geminiKey, modelName);
    }
  }

  async generateUI(query: string, context: DeviceContext, capabilities?: any, data?: any): Promise<UISchema> {
    console.log('🎨 [UIGenerator] Starting UI generation...');
    console.log('📝 Query:', query);
    console.log('📱 Device:', `${context.platform} ${context.dimensions.width}x${context.dimensions.height}`);
    console.log('🔧 Capabilities:', capabilities ? Object.keys(capabilities.capabilities) : 'none');
    console.log('📊 Data provided:', data ? 'yes' : 'no');
    
    try {
      // Step 1: Analyze query intent
      console.log('🔍 [UIGenerator] Step 1: Analyzing query intent...');
      const analysis = await this.analyzeQuery(query, context);
      console.log('✅ [UIGenerator] Intent analysis:', analysis);
      
      // Step 2: Generate UI schema based on analysis
      console.log('🏗️ [UIGenerator] Step 2: Generating UI schema...');
      const schema = await this.generateSchema(query, analysis, context, capabilities, data);
      console.log('✅ [UIGenerator] Schema generated:', {
        id: schema.id,
        type: schema.uiType,
        components: schema.components.length
      });
      
      return schema;
    } catch (error) {
      console.error('❌ [UIGenerator] UI generation error:', error);
      return this.getFallbackSchema();
    }
  }

  // New method for direct prompt-based generation
  async generateSchemaFromPrompt(prompt: string): Promise<UISchema> {
    console.log('🎨 [UIGenerator] Generating from custom prompt...');
    
    try {
      const text = await this.llm.generateContent(prompt, true);
      const schema = JSON.parse(text);
      return this.normalizeSchema(schema, 'custom', { uiType: 'list' });
    } catch (error) {
      console.error('❌ [UIGenerator] Prompt generation error:', error);
      return this.getFallbackSchema();
    }
  }

  // Hybrid-specific: generate minimal structure from a prompt
  async generateHybridFromPrompt(prompt: string): Promise<HybridUIStructure> {
    console.log('🎨 [UIGenerator] Generating hybrid structure from prompt...');
    
    try {
      const text = await this.llm.generateHybridStructure(prompt);
      const parsed = JSON.parse(text);
      const validated = HybridUIStructureSchema.parse(parsed);
      console.log('✅ [UIGenerator] Hybrid structure validated');
      return validated;
    } catch (error) {
      console.error('❌ [UIGenerator] Hybrid generation error:', error);
      // Minimal safe fallback
      return {
        layout: 'vertical',
        sections: [{
          id: 'fallback-section',
          component: 'list-travel',
          itemComponent: 'card-travel',
          itemCount: 0,
        }],
      };
    }
  }

  private async analyzeQuery(query: string, context: DeviceContext): Promise<any> {
    const analysisPrompt = buildIntentAnalysisPrompt(query, context);

    try {
      console.log('⏳ [UIGenerator] Calling LLM for intent analysis...');
      const startTime = Date.now();
      
      const text = await this.llm.generateContent(analysisPrompt, QueryAnalysisSchema);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ [UIGenerator] Intent analysis complete (${duration}ms)`);
      console.log('📄 [UIGenerator] Raw response:', text.substring(0, 200));
      
      return JSON.parse(text);
    } catch (error) {
      console.error('❌ [UIGenerator] Query analysis error:', error);
      return {
        intent: 'search',
        category: 'quick',
        dataNeeded: [],
        uiType: 'list',
        filters: [],
        constraints: {}
      };
    }
  }

  private async generateSchema(query: string, analysis: any, context: DeviceContext, capabilities?: any, data?: any): Promise<UISchema> {
    const schemaPrompt = buildSchemaGenerationPrompt(query, analysis, context, capabilities, data);
    console.log("🐟", query)

    try {
      console.log('⏳ [UIGenerator] Calling LLM for schema generation...');
      console.log('📋 [UIGenerator] Prompt length:', schemaPrompt.length, 'chars');
      const startTime = Date.now();
      
      let text: string;
      
      // Use unified interface
      text = await this.llm.generateContent(schemaPrompt);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ [UIGenerator] Schema generation complete (${duration}ms)`);
      console.log('📄 [UIGenerator] Response length:', text.length, 'chars');
      
      // Check if response is empty
      if (!text || text.trim().length === 0) {
        console.error('❌ [UIGenerator] Empty response from LLM');
        console.log('🔄 [UIGenerator] Falling back to mock schema');
        return this.getMockSchema(query);
      }
      
      // Log first 200 chars for debugging
      console.log('📝 [UIGenerator] Response preview:', text.substring(0, 200));
      
      // Parse JSON directly (no need to extract)
      const schema = JSON.parse(text);
      
      console.log('🔧 [UIGenerator] Normalizing schema...');
      
      // Ensure required fields
      const normalized = this.normalizeSchema(schema, query, analysis);
      console.log('✅ [UIGenerator] Schema normalized');
      
      return normalized;
    } catch (error) {
      console.error('❌ [UIGenerator] Schema generation error:', error);
      console.log('🔄 [UIGenerator] Falling back to mock schema');
      return this.getMockSchema(query);
    }
  }

  private buildSchemaPrompt(query: string, analysis: any, context: DeviceContext, capabilities?: any, data?: any): string {
    // Build capabilities description
    let capabilitiesDesc = 'Available capabilities:\n';
    if (capabilities?.capabilities) {
      const caps = capabilities.capabilities;
      capabilitiesDesc += `- Photos: ${caps.photos ? 'YES - can display photo grids and galleries' : 'NO'}\n`;
      capabilitiesDesc += `- Maps: ${caps.maps ? 'YES - can show interactive maps with markers' : 'NO'}\n`;
      capabilitiesDesc += `- Location: ${caps.location ? 'YES - user location available' : 'NO'}\n`;
      capabilitiesDesc += `- Transport: ${caps.transport ? 'YES - can show tickets and routes' : 'NO'}\n`;
    } else {
      capabilitiesDesc = 'No capability information provided. Use basic components only.';
    }

    // Build data description
    let dataDesc = '';
    if (data && Array.isArray(data)) {
      dataDesc = `\n\nData Structure (${data.length} items):
${JSON.stringify(data[0], null, 2).substring(0, 500)}...

Each item has:
- destination: string
- vibe: string
- highlights: array of {name, type, description, estimatedCost, photoUrls?, latitude?, longitude?}
- bestTime: string
- localTip: string
- transportTickets?: array
`;
    }

    return `You are AdaptUI, an expert UI designer for mobile apps.

User Query: "${query}"
Intent: ${analysis.intent}
UI Type: ${analysis.uiType}
Device: ${context.platform}, ${context.dimensions.width}x${context.dimensions.height}px

${capabilitiesDesc}${dataDesc}

Generate a complete UI schema following this structure:

{
  "id": "unique-schema-id",
  "version": "1.0",
  "uiType": "${analysis.uiType}",
  "title": "Screen Title",
  "theme": {
    "colors": {
      "primary": "#6366F1",
      "secondary": "#8B5CF6",
      "background": "#0F172A",
      "surface": "#1E293B",
      "text": "#F1F5F9",
      "textSecondary": "#94A3B8",
      "border": "#334155",
      "error": "#EF4444",
      "success": "#10B981",
      "warning": "#F59E0B"
    },
    "typography": {
      "heading": { "fontSize": 24, "fontWeight": "700", "lineHeight": 32 },
      "body": { "fontSize": 16, "fontWeight": "400", "lineHeight": 24 },
      "caption": { "fontSize": 14, "fontWeight": "400", "lineHeight": 20 }
    },
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
    "borderRadius": { "sm": 8, "md": 12, "lg": 16, "full": 9999 }
  },
  "layout": {
    "type": "stack",
    "config": { "flexDirection": "column", "spacing": { "padding": 16 } }
  },
  "components": [
    {
      "id": "component-id",
      "type": "text|input|button|card|list|chip-group|image",
      "props": {
        "text": "Content",
        "placeholder": "Enter text..."
      },
      "layout": {
        "width": "fill",
        "spacing": { "padding": 16, "margin": { "bottom": 12 } }
      },
      "style": {
        "backgroundColor": "#1E293B",
        "color": "#F1F5F9",
        "border": { "width": 1, "color": "#334155", "radius": 12 }
      },
      "interaction": {
        "onPress": "action-id",
        "hapticFeedback": "light"
      }
    }
  ],
  "actions": {
    "search": { "type": "search", "params": {} },
    "navigate": { "type": "navigate", "params": {} }
  }
}

Requirements:
1. Use modern, beautiful colors appropriate for ${analysis.categories?.join(', ') || 'general'}
2. Include relevant components for ${analysis.intent} intent
3. Add interactive elements (buttons, inputs) where needed
4. Make it responsive for ${context.dimensions.width}px width
5. Include proper spacing and layout
6. IMPORTANT: Keep component nesting to MAX 2 levels deep
7. IMPORTANT: Only use these component types: text, input, button, card, list, chip-group, image, stack
8. DO NOT use: icon, container, view, or any other types

CAPABILITY-BASED COMPONENTS:
${capabilities?.capabilities.photos ? '- Use "image" components for photos (photoUrls from data)' : '- DO NOT use image components (photos not available)'}
${capabilities?.capabilities.maps ? '- Include a "map" section placeholder (maps available)' : '- DO NOT include map components'}
${capabilities?.capabilities.transport ? '- Include transport ticket cards if available in data' : ''}

DATA BINDING:
- For lists: use "list" component with items from data
- For cards: bind data fields like {destination}, {vibe}, {highlights}
- For images: use photoUrls[0] or photoUrls array from highlights
- Use "stack" for grouping related components

Return ONLY valid JSON. No markdown, no explanations.`;
  }

  private normalizeSchema(schema: any, query: string, analysis: any): UISchema {
    // Ensure required fields exist
    if (!schema.id) schema.id = `schema-${Date.now()}`;
    if (!schema.version) schema.version = '1.0';
    if (!schema.uiType) schema.uiType = analysis.uiType || 'list';
    if (!schema.title) schema.title = this.generateTitle(query);
    if (!schema.components) schema.components = [];
    
    // Normalize all components
    schema.components = schema.components.map((comp: any) => this.normalizeComponent(comp));
    
    // Ensure theme exists with defaults
    if (!schema.theme) {
      schema.theme = {
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
          warning: '#F59E0B'
        },
        typography: {
          heading: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
          subheading: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
          body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
          caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 }
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
        borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 }
      };
    }
    
    // Ensure layout exists
    if (!schema.layout) {
      schema.layout = {
        type: 'stack',
        config: { flexDirection: 'column' }
      };
    }
    
    return schema as UISchema;
  }

  private normalizeComponent(comp: any): any {
    if (!comp.type) comp.type = 'text';
    
    // Ensure props exists
    if (!comp.props) {
      comp.props = {};
      
      // Add default props based on type
      switch (comp.type) {
        case 'text':
          comp.props.text = comp.text || 'Text';
          break;
        case 'input':
          comp.props.placeholder = comp.placeholder || 'Enter text...';
          break;
        case 'button':
          comp.props.text = comp.text || 'Button';
          break;
        case 'list':
          comp.props.items = comp.items || [];
          break;
        case 'chip-group':
          comp.props.options = comp.options || [];
          break;
        case 'image':
          comp.props.source = comp.source || '';
          break;
      }
    }
    
    // Normalize children recursively
    if (comp.children && Array.isArray(comp.children)) {
      comp.children = comp.children.map((child: any) => this.normalizeComponent(child));
    }
    
    return comp;
  }

  private generateTitle(query: string): string {
    // Generate a title from the query
    const words = query.split(' ');
    if (words.length > 5) {
      return words.slice(0, 5).join(' ') + '...';
    }
    return query.charAt(0).toUpperCase() + query.slice(1);
  }

  private getMockSchema(query: string): UISchema {
    // Mock schema for testing
    return {
      id: 'mock-schema',
      version: '1.0',
      uiType: 'list',
      title: 'Search Results',
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
          warning: '#F59E0B'
        },
        typography: {
          heading: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
          subheading: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
          body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
          caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 }
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
        borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 }
      },
      layout: {
        type: 'stack',
        config: {
          flexDirection: 'column'
        }
      },
      components: [
        {
          id: 'search-input',
          type: 'input',
          props: {
            placeholder: 'Search...',
            value: query,
          },
          layout: {
            width: 'fill',
            spacing: {
              margin: 16
            }
          },
        },
        {
          id: 'results-list',
          type: 'list',
          props: {
            items: [
              { title: 'Result 1', subtitle: 'Description' },
              { title: 'Result 2', subtitle: 'Description' },
            ],
          },
          layout: {
            flex: 1,
          },
        },
      ],
    };
  }

  private getFallbackSchema(): UISchema {
    return {
      id: 'fallback-schema',
      version: '1.0',
      uiType: 'form',
      title: 'Error',
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
          warning: '#F59E0B'
        },
        typography: {
          heading: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
          subheading: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
          body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
          caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 }
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
        borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 }
      },
      layout: {
        type: 'stack',
        config: {
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }
      },
      components: [
        {
          id: 'error-text',
          type: 'text',
          props: {
            text: 'Unable to generate UI. Please try again.',
          },
        },
      ],
    };
  }
}

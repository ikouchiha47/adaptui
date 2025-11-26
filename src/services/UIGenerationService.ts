// UI Generation Service - Mode-specific UI generation

import { buildDynamicUIPrompt, buildHybridUIPrompt } from '@/ui-engine/prompts';
import { HybridUIStructure } from '../types/hybrid-ui.zod';
import { DeviceContext, UISchema } from '../types/ui-schema';
import { generateComponentDocs, hydrateComponent } from '../ui-engine/ComponentRegistry';
import { UIGenerator } from '../ui-engine/UIGenerator';
import { EnrichedPlace } from './DataEnrichmentService';
import { QueryAnalysis } from './QueryAnalysisService';

export type UIMode = 'static' | 'dynamic' | 'hybrid';

export class UIGenerationService {
  private uiGenerator: UIGenerator;

  constructor() {
    this.uiGenerator = new UIGenerator();
  }

  async generateUI(
    mode: UIMode,
    analysis: QueryAnalysis,
    enrichedData: EnrichedPlace[],
    deviceContext: DeviceContext,
    capabilities: any
  ): Promise<UISchema | null> {
    console.log(`🎨 [UIGeneration] Mode: ${mode}`);
    
    switch (mode) {
      case 'static':
        // Return null - use existing TravelScreen
        console.log('📱 [UIGeneration] Using static TravelScreen');
        return null;
      
      case 'dynamic':
        console.log('✨ [UIGeneration] Generating dynamic UI');
        return this.generateDynamicUI(analysis, enrichedData, deviceContext, capabilities);
      
      case 'hybrid':
        console.log('🔀 [UIGeneration] Generating hybrid UI');
        return this.generateHybridUI(analysis, enrichedData, deviceContext, capabilities);
      
      default:
        return null;
    }
  }

  private async generateDynamicUI(
    analysis: QueryAnalysis,
    data: EnrichedPlace[],
    context: DeviceContext,
    capabilities: any
  ): Promise<UISchema> {
    const prompt = buildDynamicUIPrompt(analysis, data, context, capabilities);
    return this.uiGenerator.generateUI(prompt, context, capabilities, data);
  }

  private async generateHybridUI(
    analysis: QueryAnalysis,
    data: EnrichedPlace[],
    context: DeviceContext,
    capabilities: any
  ): Promise<UISchema> {
    // Generate full component documentation
    const componentDocs = generateComponentDocs();
    const prompt = buildHybridUIPrompt(componentDocs, analysis, data, context, capabilities);

    // Step 1: Ask LLM for minimal hybrid structure
    const minimalStructure = await this.uiGenerator.generateHybridFromPrompt(prompt);

    // Step 2: Hydrate minimal structure into full UISchema
    const hydratedSchema = this.hydrateStructure(minimalStructure, analysis, data, context, capabilities);
    return hydratedSchema;
  }

  // Hydrate minimal hybrid structure into full UISchema the renderer can consume
  private hydrateStructure(
    structure: HybridUIStructure,
    analysis: QueryAnalysis,
    data: EnrichedPlace[],
    context: DeviceContext,
    capabilities: any
  ): UISchema {
    const now = new Date().toISOString();

    const baseTheme: UISchema['theme'] = {
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
    };

    const layoutType: UISchema['layout']['type'] = 'stack';

    console.log('🔧 [UIGeneration] Hydrating structure:', JSON.stringify(structure, null, 2));
    console.log('📊 [UIGeneration] Data items:', data.length);

    // Build a map of all sections by ID for easy lookup
    const sectionMap = new Map(structure.sections.map(s => [s.id, s]));

    // Recursive function to hydrate a section and its children
    const hydrateSection = (sectionId: string): any => {
      const section = sectionMap.get(sectionId);
      if (!section) {
        console.warn(`⚠️ [UIGeneration] Section not found: ${sectionId}`);
        return null;
      }

      console.log(`🔧 [UIGeneration] Hydrating section: ${section.id}, component: ${section.component}`);

      // Hydrate the main section component from registry
      const sectionComponent = hydrateComponent(section.component, {});
      
      if (!sectionComponent) {
        console.warn(`⚠️ [UIGeneration] Failed to hydrate component: ${section.component}`);
        return null;
      }

      console.log(`✅ [UIGeneration] Hydrated component: ${section.component}`);
      sectionComponent.id = section.id;

      // Populate badge data from analysis
      if (section.component === 'badge-time') {
        if (!sectionComponent.props) sectionComponent.props = {};
        sectionComponent.props.time = analysis.temporal.suggestedTimeOfDay;
        sectionComponent.props.label = `Best time: ${analysis.temporal.suggestedTimeOfDay}`;
        sectionComponent.props.icon = analysis.temporal.suggestedTimeOfDay === 'evening' ? 'moon' : 'sunny';
      }
      
      if (section.component === 'badge-crowd') {
        if (!sectionComponent.props) sectionComponent.props = {};
        const avgCrowd = data[0]?.enrichment?.popularity?.crowdLevel || 'moderate';
        sectionComponent.props.label = `Crowd: ${avgCrowd}`;
        sectionComponent.props.icon = 'people';
      }

      if (section.component === 'badge-weather') {
        if (!sectionComponent.props) sectionComponent.props = {};
        const weather = data[0]?.enrichment?.weather;
        sectionComponent.props.label = weather ? `${weather.temp}°C ${weather.conditions}` : 'Weather unavailable';
        sectionComponent.props.icon = 'partly-sunny';
      }

      // Handle options (for filter-chips, etc.)
      if (section.options && section.options.length > 0) {
        if (!sectionComponent.props) sectionComponent.props = {};
        // Convert string options to proper option objects
        sectionComponent.props.options = section.options.map((opt: string) => ({
          id: opt,
          label: opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' '),
          icon: opt === 'budget' ? 'cash' : opt === 'luxury' ? 'diamond' : 'card'
        }));
        console.log(`✅ [UIGeneration] Added ${section.options.length} options to ${section.id}`);
      }

      // Handle children (string IDs that need to be hydrated)
      if (section.children && section.children.length > 0) {
        sectionComponent.children = section.children
          .map(childId => hydrateSection(childId))
          .filter(Boolean);
        console.log(`✅ [UIGeneration] Added ${sectionComponent.children.length} children to ${section.id}`);
      }

      // Special handling for photo-grid
      if (section.component === 'photo-grid') {
        if (!sectionComponent.props) sectionComponent.props = {};
        // Collect all photos from all places
        const allPhotos = data.flatMap((place: any) => 
          place.highlights?.flatMap((h: any) => h.photoUrls || []) || []
        ).filter(Boolean);
        sectionComponent.props.photos = allPhotos.slice(0, 5); // Max 5 photos
        console.log(`📸 [UIGeneration] Photo grid with ${allPhotos.length} photos`);
      }

      // Special handling for transport-tickets
      if (section.component === 'transport-tickets') {
        // Check if transport capability is enabled
        const transportEnabled = capabilities?.capabilities?.transport !== false;
        
        if (!transportEnabled) {
          console.log(`🚫 [UIGeneration] Transport capability disabled, skipping tickets`);
          return null; // Don't render transport section if disabled
        }
        
        if (!sectionComponent.props) sectionComponent.props = {};
        const allTickets = data.flatMap((place: any) => place.transportTickets || []);
        sectionComponent.props.tickets = allTickets;
        console.log(`🚆 [UIGeneration] Transport tickets: ${allTickets.length}`);
      }

      // Special handling for lists with itemComponent
      if (section.component.startsWith('list-')) {
        // Use enriched data as items
        if (!sectionComponent.props) sectionComponent.props = {};
        
        // Check if we should render destinations or individual highlights
        const isDestinationCard = section.itemComponent === 'card-travel';
        console.log(`🔍 [UIGeneration] itemComponent: ${section.itemComponent}, isDestinationCard: ${isDestinationCard}`);
        
        if (isDestinationCard) {
          // Render full destination cards (like static UI)
          sectionComponent.props.items = data.map((place: any) => ({
            destination: place.destination,
            vibe: place.vibe,
            highlights: place.highlights || [],
            bestTime: place.bestTime,
            localTip: place.localTip,
            photoUrls: place.highlights?.flatMap((h: any) => h.photoUrls || []).filter(Boolean) || [],
            // Add enrichment data
            crowdLevel: place.enrichment?.popularity?.crowdLevel,
            weather: place.enrichment?.weather,
          }));
          console.log(`📋 [UIGeneration] List with ${sectionComponent.props.items.length} destination cards`);
        } else {
          // Render individual highlight cards (flatten)
          sectionComponent.props.items = data.flatMap((place: any) => 
            place.highlights?.map((highlight: any) => ({
              name: highlight.name,
              description: highlight.description,
              category: highlight.type,
              type: highlight.type,
              price: highlight.estimatedCost || 'Free',
              priceRange: highlight.estimatedCost || 'Free',
              estimatedCost: highlight.estimatedCost || 'Free',
              photoUrl: highlight.photoUrl,
              photoUrls: highlight.photoUrls || [],
              image: highlight.photoUrl,
              bestTime: place.bestTime,
              crowdLevel: place.enrichment?.popularity?.crowdLevel,
              weather: place.enrichment?.weather,
            })) || []
          );
          console.log(`📋 [UIGeneration] List with ${sectionComponent.props.items.length} highlight cards`);
        }

        if (section.itemComponent) {
          const itemTemplate = hydrateComponent(section.itemComponent, {});
          if (itemTemplate) {
            sectionComponent.children = [itemTemplate];
            console.log(`✅ [UIGeneration] Added item template: ${section.itemComponent}`);
          }
        }
      }

      return sectionComponent;
    };

    // Find root sections (sections not referenced as children by any other section)
    const childIds = new Set(
      structure.sections.flatMap(s => s.children || [])
    );
    const rootSections = structure.sections.filter(s => !childIds.has(s.id));

    console.log(`🌳 [UIGeneration] Found ${rootSections.length} root sections:`, rootSections.map(s => s.id));

    // Hydrate only root sections (they will recursively hydrate their children)
    const components = rootSections
      .map(section => hydrateSection(section.id))
      .filter(Boolean);

    console.log(`✅ [UIGeneration] Hydrated ${components.length} root components`);

    const schema: UISchema = {
      id: `hybrid-${Date.now()}`,
      version: '1.0',
      uiType: (analysis as any).suggestedUIType || 'list',
      title: `Results for ${analysis.categories?.[0] || 'search'}`,
      theme: baseTheme,
      layout: {
        type: layoutType,
        config: {
          flexDirection: structure.layout === 'horizontal' ? 'row' : 'column',
        },
      },
      components,
      actions: {},
      metadata: {
        generatedAt: now,
        queryHash: '',
        category: analysis.categories?.[0] || 'unknown',
        tags: [analysis.intent, ...(analysis.categories || [])].filter(Boolean) as string[],
      },
    };

    console.log('📦 [UIGeneration] Final schema:', JSON.stringify({
      id: schema.id,
      componentCount: schema.components.length,
      components: schema.components.map(c => ({ id: c.id, type: c.type, childrenCount: c.children?.length || 0 }))
    }, null, 2));

    return schema;
  }

}

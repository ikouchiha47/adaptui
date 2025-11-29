// AdaptUI Plugin System - Framework for extensible capabilities

import React from 'react';

/**
 * Plugin Definition Interface
 */
export interface AdaptUIPlugin {
  id: string;
  name: string;
  version: string;
  
  // Capability Configuration
  capability: {
    id: string;
    label: string;
    defaultEnabled: boolean;
    requiresTab: boolean;
    tabLabel?: string;
    icon?: string;
  };
  
  // UI Components
  components: {
    // Main card component
    card: React.ComponentType<any>;
    
    // Variants for different contexts
    variants?: {
      compact?: React.ComponentType<any>;
      detailed?: React.ComponentType<any>;
      list?: React.ComponentType<any>;
      grid?: React.ComponentType<any>;
    };
    
    // Loading state
    loading?: React.ComponentType<any>;
    
    // Error state
    error?: React.ComponentType<any>;
  };
  
  // Data Provider
  dataProvider: {
    // Fetch data
    fetch: (params: PluginFetchParams) => Promise<any>;
    
    // Enrich existing data
    enrich?: (data: any, context: PluginContext) => Promise<any>;
    
    // Cache configuration
    cache?: {
      enabled: boolean;
      ttl: number; // seconds
      key: (params: any) => string;
    };
    
    // Dependencies (other plugins this depends on)
    dependencies?: string[];
  };
  
  // LLM Integration
  llmIntegration: {
    // Whether to include in LLM prompts
    enabled: boolean;
    
    // Prompt template for this capability
    promptTemplate: string;
    
    // Component schema for LLM to understand
    componentSchema: {
      type: string;
      props: Record<string, any>;
      description: string;
    };
    
    // How to extract data from LLM response
    dataExtractor?: (llmResponse: any) => any;
  };
  
  // Metadata
  metadata: {
    author: string;
    description: string;
    icon: string;
    tags: string[];
    homepage?: string;
    repository?: string;
  };
  
  // Lifecycle hooks
  hooks?: {
    onInstall?: () => Promise<void>;
    onEnable?: () => Promise<void>;
    onDisable?: () => Promise<void>;
    onUninstall?: () => Promise<void>;
  };
}

export interface PluginFetchParams {
  query: string;
  location?: { lat: number; lng: number };
  userPreferences?: any;
  context?: any;
}

export interface PluginContext {
  capabilities: Record<string, boolean>;
  userLocation?: { lat: number; lng: number };
  theme: any;
  [key: string]: any;
}

/**
 * Plugin Registry - Manages all plugins
 */
export class PluginRegistry {
  private plugins: Map<string, AdaptUIPlugin> = new Map();
  private enabledPlugins: Set<string> = new Set();
  
  /**
   * Register a plugin
   */
  register(plugin: AdaptUIPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`⚠️ Plugin ${plugin.id} already registered, overwriting`);
    }
    
    this.plugins.set(plugin.id, plugin);
    
    if (plugin.capability.defaultEnabled) {
      this.enabledPlugins.add(plugin.id);
    }
    
    console.log(`✅ Plugin registered: ${plugin.name} v${plugin.version}`);
  }
  
  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
    this.enabledPlugins.delete(pluginId);
    console.log(`🗑️ Plugin unregistered: ${pluginId}`);
  }
  
  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // Check dependencies
    if (plugin.dataProvider.dependencies) {
      for (const dep of plugin.dataProvider.dependencies) {
        if (!this.enabledPlugins.has(dep)) {
          throw new Error(`Plugin ${pluginId} requires ${dep} to be enabled`);
        }
      }
    }
    
    this.enabledPlugins.add(pluginId);
    await plugin.hooks?.onEnable?.();
    
    console.log(`✅ Plugin enabled: ${plugin.name}`);
  }
  
  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    
    this.enabledPlugins.delete(pluginId);
    await plugin.hooks?.onDisable?.();
    
    console.log(`⏸️ Plugin disabled: ${plugin.name}`);
  }
  
  /**
   * Get all enabled plugins
   */
  getEnabledPlugins(): AdaptUIPlugin[] {
    return Array.from(this.enabledPlugins)
      .map(id => this.plugins.get(id))
      .filter(Boolean) as AdaptUIPlugin[];
  }
  
  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): AdaptUIPlugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all plugins
   */
  getAllPlugins(): AdaptUIPlugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get plugins that require tabs
   */
  getPluginsWithTabs(): AdaptUIPlugin[] {
    return this.getEnabledPlugins().filter(p => p.capability.requiresTab);
  }
  
  /**
   * Generate LLM prompt from enabled plugins
   */
  generateLLMPrompt(): string {
    const enabledPlugins = this.getEnabledPlugins().filter(p => p.llmIntegration.enabled);
    
    let prompt = 'Available capabilities:\n\n';
    
    for (const plugin of enabledPlugins) {
      prompt += `${plugin.capability.label}:\n`;
      prompt += `${plugin.llmIntegration.promptTemplate}\n\n`;
    }
    
    return prompt;
  }
  
  /**
   * Get component schemas for LLM
   */
  getComponentSchemas(): any[] {
    return this.getEnabledPlugins()
      .filter(p => p.llmIntegration.enabled)
      .map(p => ({
        pluginId: p.id,
        ...p.llmIntegration.componentSchema
      }));
  }
  
  /**
   * Fetch data from all enabled plugins
   */
  async fetchAllData(params: PluginFetchParams, context: PluginContext): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const plugins = this.getEnabledPlugins();
    
    await Promise.all(
      plugins.map(async (plugin) => {
        try {
          const data = await plugin.dataProvider.fetch(params);
          results.set(plugin.id, data);
        } catch (error) {
          console.error(`❌ Plugin ${plugin.id} fetch error:`, error);
          results.set(plugin.id, { error: true });
        }
      })
    );
    
    return results;
  }
}

// Global plugin registry
export const pluginRegistry = new PluginRegistry();

/**
 * Plugin Builder - Helper for creating plugins
 */
export class PluginBuilder {
  private plugin: Partial<AdaptUIPlugin> = {};
  
  setBasicInfo(id: string, name: string, version: string) {
    this.plugin.id = id;
    this.plugin.name = name;
    this.plugin.version = version;
    return this;
  }
  
  setCapability(config: AdaptUIPlugin['capability']) {
    this.plugin.capability = config;
    return this;
  }
  
  setComponents(components: AdaptUIPlugin['components']) {
    this.plugin.components = components;
    return this;
  }
  
  setDataProvider(provider: AdaptUIPlugin['dataProvider']) {
    this.plugin.dataProvider = provider;
    return this;
  }
  
  setLLMIntegration(integration: AdaptUIPlugin['llmIntegration']) {
    this.plugin.llmIntegration = integration;
    return this;
  }
  
  setMetadata(metadata: AdaptUIPlugin['metadata']) {
    this.plugin.metadata = metadata;
    return this;
  }
  
  setHooks(hooks: AdaptUIPlugin['hooks']) {
    this.plugin.hooks = hooks;
    return this;
  }
  
  build(): AdaptUIPlugin {
    // Validate required fields
    if (!this.plugin.id || !this.plugin.name || !this.plugin.version) {
      throw new Error('Plugin must have id, name, and version');
    }
    
    return this.plugin as AdaptUIPlugin;
  }
}

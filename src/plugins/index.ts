// Plugin Registry - Register all plugins here

import { createNeighborhoodPlugin } from './NeighborhoodPlugin';
import { pluginRegistry } from './PluginSystem';
import { createTransportPlugin } from './TransportPlugin';

/**
 * Initialize all plugins
 */
export function initializePlugins() {
  console.log('[Plugins] Initializing AdaptUI plugins...');
  console.log('='.repeat(60));
  
  // Register built-in plugins
  const neighborhoodPlugin = createNeighborhoodPlugin();
  const transportPlugin = createTransportPlugin();
  
  pluginRegistry.register(neighborhoodPlugin);
  pluginRegistry.register(transportPlugin);
  
  console.log('[Plugins] Registered:');
  console.log('  1. Neighborhood:', neighborhoodPlugin.capability.tabLabel);
  console.log('  2. Transport:', transportPlugin.capability.tabLabel);
  
  const allPlugins = pluginRegistry.getAllPlugins();
  const enabledPlugins = pluginRegistry.getEnabledPlugins();
  const tabPlugins = pluginRegistry.getPluginsWithTabs();
  
  console.log('[Plugins] Summary:', {
    total: allPlugins.length,
    enabled: enabledPlugins.length,
    withTabs: tabPlugins.length
  });
  
  console.log('='.repeat(60));
  console.log('[Plugins] Initialization complete');
}

/**
 * Get plugin registry (for external use)
 */
export { pluginRegistry };

/**
 * Export plugin creators for custom plugins
 */
    export { createNeighborhoodPlugin } from './NeighborhoodPlugin';
    export { createTransportPlugin } from './TransportPlugin';


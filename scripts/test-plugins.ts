// Test Plugin System Integration

import { initializePlugins, pluginRegistry } from '../src/plugins';

console.log('🧪 Testing Plugin System...\n');

// Initialize plugins
initializePlugins();

// Get all plugins
const plugins = pluginRegistry.getAllPlugins();
console.log(`✅ Total plugins: ${plugins.length}`);

plugins.forEach(plugin => {
  console.log(`\n📦 Plugin: ${plugin.name} (${plugin.id})`);
  console.log(`   Version: ${plugin.version}`);
  console.log(`   Capability: ${plugin.capability.label} (${plugin.capability.id})`);
  console.log(`   Icon: ${plugin.capability.icon}`);
  console.log(`   Default Enabled: ${plugin.capability.defaultEnabled}`);
  console.log(`   Requires Tab: ${plugin.capability.requiresTab}`);
  if (plugin.capability.tabLabel) {
    console.log(`   Tab Label: ${plugin.capability.tabLabel}`);
  }
});

// Get enabled plugins
const enabled = pluginRegistry.getEnabledPlugins();
console.log(`\n✅ Enabled plugins: ${enabled.length}`);

// Get plugins with tabs
const withTabs = pluginRegistry.getPluginsWithTabs();
console.log(`✅ Plugins with tabs: ${withTabs.length}`);

console.log('\n✅ Plugin system test complete!');

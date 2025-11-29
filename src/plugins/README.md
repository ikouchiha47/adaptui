# AdaptUI Plugin System

A framework for extending AdaptUI with custom capabilities, UI components, and data providers.

## Architecture

```
Plugin
├── Capability (toggle, tab config)
├── Components (React components + variants)
├── Data Provider (fetch, enrich, cache)
├── LLM Integration (prompts, schemas)
└── Metadata (author, description, tags)
```

## Creating a Plugin

### 1. Define Your Plugin

```typescript
import { PluginBuilder } from './PluginSystem';

export function createMyPlugin() {
  return new PluginBuilder()
    .setBasicInfo('my-plugin', 'My Plugin', '1.0.0')
    
    .setCapability({
      id: 'my-capability',
      label: 'My Feature',
      defaultEnabled: false,
      requiresTab: true,
      tabLabel: 'My Tab',
      icon: 'star' // Ionicons name
    })
    
    .setComponents({
      card: MyCardComponent,
      variants: {
        compact: MyCompactComponent,
        detailed: MyDetailedComponent,
      },
      loading: MyLoadingComponent,
    })
    
    .setDataProvider({
      fetch: async (params) => {
        // Fetch your data
        return await myAPI.getData(params);
      },
      cache: {
        enabled: true,
        ttl: 3600,
        key: (params) => `my-plugin_${params.id}`
      }
    })
    
    .setLLMIntegration({
      enabled: true,
      promptTemplate: `
        My Plugin provides X, Y, Z capabilities.
        Use this when user asks about...
      `,
      componentSchema: {
        type: 'my-card',
        props: { data: 'object' },
        description: 'Displays my custom data'
      }
    })
    
    .setMetadata({
      author: 'Your Name',
      description: 'What your plugin does',
      icon: 'star', // Ionicons name
      tags: ['tag1', 'tag2']
    })
    
    .build();
}
```

### 2. Register Your Plugin

```typescript
// src/plugins/index.ts
import { pluginRegistry } from './PluginSystem';
import { createMyPlugin } from './MyPlugin';

export function initializePlugins() {
  pluginRegistry.register(createMyPlugin());
}
```

### 3. Use in Your App

```typescript
import { initializePlugins, pluginRegistry } from './plugins';

// Initialize
initializePlugins();

// Get enabled plugins
const plugins = pluginRegistry.getEnabledPlugins();

// Fetch data from all plugins
const data = await pluginRegistry.fetchAllData(params, context);

// Generate LLM prompt
const prompt = pluginRegistry.generateLLMPrompt();

// Get tabs
const tabs = pluginRegistry.getPluginsWithTabs();
```

## Built-in Plugins

### 1. Neighborhood Plugin

**Capability**: `neighborhood`  
**Tab**: "Area"  
**Data**: Vibe, transport, food culture, establishments, negotiation tips

```typescript
import { createNeighborhoodPlugin } from './plugins';

const plugin = createNeighborhoodPlugin();
pluginRegistry.register(plugin);
```

## Plugin Lifecycle

```
Install → Register → Enable → Fetch Data → Render UI
                   ↓
                Disable → Uninstall
```

## Hooks

```typescript
hooks: {
  onInstall: async () => {
    // Run once when plugin is first installed
  },
  onEnable: async () => {
    // Run when plugin is enabled
  },
  onDisable: async () => {
    // Run when plugin is disabled
  },
  onUninstall: async () => {
    // Run when plugin is removed
  }
}
```

## Component Variants

Plugins can provide multiple UI variants:

- **card**: Default card view
- **compact**: Minimal view for lists
- **detailed**: Expanded view with all info
- **list**: List item view
- **grid**: Grid item view

## LLM Integration

Plugins can inject themselves into LLM prompts:

```typescript
llmIntegration: {
  enabled: true,
  promptTemplate: `
    This plugin provides X capability.
    Use when user asks about Y.
    Available data: Z
  `,
  componentSchema: {
    type: 'my-component',
    props: { ... },
    description: 'What this component does'
  }
}
```

The LLM will:
1. See the plugin in available capabilities
2. Understand when to use it
3. Know how to structure the data
4. Generate appropriate UI

## Future Plugins

- **Transport Plugin**: Multi-modal transport research
- **Local Tips Plugin**: Reddit/forum scraping
- **Food Plugin**: Restaurant recommendations
- **Safety Plugin**: Travel advisories
- **Weather Plugin**: Forecast and conditions
- **Events Plugin**: Local events and festivals
- **Accommodation Plugin**: Hotels, Airbnb, hostels

## Publishing Plugins

Plugins can be:
1. **Built-in**: Shipped with AdaptUI
2. **Community**: Published to npm as `adaptui-plugin-*`
3. **Private**: Custom plugins for specific use cases

```bash
npm install adaptui-plugin-weather
```

```typescript
import { createWeatherPlugin } from 'adaptui-plugin-weather';
pluginRegistry.register(createWeatherPlugin());
```

## Benefits

✅ **Extensible**: Add new capabilities without modifying core  
✅ **Modular**: Enable/disable features per user  
✅ **Composable**: Plugins can depend on each other  
✅ **LLM-aware**: Automatically integrated into AI prompts  
✅ **Type-safe**: Full TypeScript support  
✅ **Cacheable**: Built-in caching per plugin  
✅ **Themeable**: Components use app theme  

---

## Icon Guidelines

All plugin icons must use valid [Ionicons](https://ionic.io/ionicons) names (not emojis):

```typescript
// ✅ Correct - Ionicons names
icon: 'business'
icon: 'star'
icon: 'map'
icon: 'restaurant'

// ❌ Wrong - Emojis
icon: '🏘️'
icon: '🎯'
icon: '🗺️'
```

Common Ionicons for plugins:
- `business` - Neighborhoods, areas
- `map` - Location, navigation
- `restaurant` - Food, dining
- `train` - Transport
- `information-circle` - Tips, info
- `sunny` - Weather
- `calendar` - Events
- `home` - Accommodation

---

**AdaptUI Plugin System** - Build once, extend forever! 🔌✨

# Dynamic UI Generation Engine

Generate infinite UIs from natural language queries using LLM-powered schema generation.

## 🎯 Overview

The UI Generation Engine converts user queries into complete, validated UI schemas that render as native React Native components. One codebase, infinite interfaces.

## 🏗️ Architecture

```
User Query
    ↓
UIGenerator (LLM)
    ↓
UISchema (JSON)
    ↓
SchemaValidator
    ↓
ComponentRenderer
    ↓
React Native UI
```

## 📦 Components

### 1. UIGenerator (`UIGenerator.ts`)

Generates UI schemas from natural language queries using Gemini LLM.

**Features:**
- Two-step generation: Query analysis → Schema generation
- Automatic fallback for errors
- Device-aware generation (screen size, platform)
- Structured JSON output

**Usage:**
```typescript
import { UIGenerator } from './ui-engine/UIGenerator';

const generator = new UIGenerator();
const schema = await generator.generateUI(
  "Find romantic restaurants in Paris",
  deviceContext
);
```

### 2. SchemaValidator (`SchemaValidator.ts`)

Validates and sanitizes UI schemas for security and correctness.

**Validates:**
- Required fields (id, version, components)
- Color formats (hex, rgba)
- Component types and props
- Layout values (no negatives)
- Action types

**Sanitizes:**
- Removes dangerous props (`__proto__`, `constructor`)
- Limits text length (10,000 chars)
- Limits list items (1,000 items)

**Usage:**
```typescript
import { SchemaValidator } from './ui-engine/SchemaValidator';

const validator = new SchemaValidator();
const validSchema = validator.validate(rawSchema);
```

### 3. ComponentRenderer (`ComponentRenderer.tsx`)

Renders UI schemas as React Native components.

**Supports:**
- Text, Input, Button, Card, List, Chips, Images
- Flexbox layouts
- Styling (colors, borders, shadows)
- Interactions (onPress, haptic feedback)
- Animations

**Usage:**
```typescript
import { ComponentRenderer } from './ui-engine/ComponentRenderer';

<ComponentRenderer 
  schema={validSchema} 
  onAction={handleAction}
/>
```

## 🚀 Quick Start

```typescript
import { UIGenerator } from './ui-engine/UIGenerator';
import { SchemaValidator } from './ui-engine/SchemaValidator';
import { ComponentRenderer } from './ui-engine/ComponentRenderer';

// 1. Setup
const generator = new UIGenerator();
const validator = new SchemaValidator();

const deviceContext = {
  dimensions: { width: 393, height: 852, scale: 3 },
  platform: 'ios',
  orientation: 'portrait',
  safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
};

// 2. Generate UI
const schema = await generator.generateUI(
  "Find coffee shops nearby",
  deviceContext
);

// 3. Validate
const validSchema = validator.validate(schema);

// 4. Render
<ComponentRenderer 
  schema={validSchema}
  onAction={(actionId, params) => {
    console.log('Action:', actionId, params);
  }}
/>
```

## 📋 Schema Structure

```typescript
interface UISchema {
  id: string;
  version: string;
  uiType: 'list' | 'form' | 'detail' | 'dashboard' | 'map';
  title: string;
  
  theme: {
    colors: ColorScheme;
    typography: { heading, body, caption };
    spacing: { xs, sm, md, lg, xl };
    borderRadius: { sm, md, lg, full };
  };
  
  layout: {
    type: 'stack' | 'grid' | 'tabs';
    config: LayoutConfig;
  };
  
  components: UIComponent[];
  actions?: Record<string, UIAction>;
}
```

## 🎨 Component Types

| Type | Description | Props |
|------|-------------|-------|
| `text` | Display text | text, numberOfLines |
| `input` | Text input | placeholder, value, keyboardType |
| `button` | Action button | text, icon, variant |
| `card` | Content card | title, subtitle, image |
| `list` | Scrollable list | items, itemLayout |
| `chip-group` | Filter chips | options, multiSelect |
| `image` | Display image | source, fit |

## 🔒 Security

The SchemaValidator ensures:
- No code injection (sanitizes dangerous props)
- No memory issues (limits text/list sizes)
- Valid data types (colors, numbers)
- Safe component types only

## 🧪 Testing

```bash
# Run the test suite
npx ts-node src/ui-engine/examples/UIGeneratorTest.ts
```

## 📖 Examples

See `examples/` directory:
- `TravelUIExample.ts` - Complete travel search UI
- `UIGeneratorTest.ts` - Test multiple queries

## 🎯 Use Cases

- **Dynamic search results** - Generate UIs based on search queries
- **Personalized dashboards** - Create custom layouts per user
- **A/B testing** - Test different UI variations
- **Multi-tenant apps** - Different UIs per client
- **Adaptive interfaces** - Adjust to user behavior

## 🔧 Configuration

Requires Gemini API key in `config.json`:
```json
{
  "apiKeys": {
    "gemini": "your-api-key-here"
  }
}
```

## 📚 Documentation

- `UIGenerationFlow.md` - Complete flow explanation with examples
- `DYNAMIC_UI_ARCHITECTURE.md` - System architecture
- Type definitions in `src/types/ui-schema.ts`

## 🚦 Status

✅ **Production Ready**
- UIGenerator: LLM integration complete
- SchemaValidator: Full validation & sanitization
- ComponentRenderer: All component types supported
- Type system: Complete TypeScript definitions

## 🤝 Contributing

When adding new component types:
1. Add type to `ComponentType` in `ui-schema.ts`
2. Add props interface (e.g., `NewComponentProps`)
3. Update `SchemaValidator` validation
4. Add renderer in `ComponentRenderer`
5. Update this README

## 📄 License

Part of AdaptUI - The Adaptive Interface System

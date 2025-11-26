# UI Generation Flow: From Query to Rendered UI

## Complete Flow

```
User Query
    ↓
1. Query Analysis (LLM)
    ↓
2. UI Schema Generation (LLM)
    ↓
3. Schema Validation
    ↓
4. Component Rendering (React Native)
    ↓
Displayed UI
```

---

## Step-by-Step Example

### User Query:
```
"Find romantic restaurants in Paris under $50"
```

---

## Step 1: Query Analysis

**LLM Prompt:**
```typescript
const analysisPrompt = `
Analyze this user query: "Find romantic restaurants in Paris under $50"

Extract:
1. Intent: What does the user want to do?
2. Category: travel, local, research, quick
3. Data needed: What information to fetch?
4. UI type: list, form, detail, map, dashboard
5. Key filters: What filters/options to show?

Return JSON:
{
  "intent": "search",
  "category": "local",
  "dataNeeded": ["restaurants", "location", "price", "ambiance"],
  "uiType": "list",
  "filters": ["price", "cuisine", "rating", "distance"],
  "location": "Paris",
  "constraints": {
    "maxPrice": 50,
    "vibe": "romantic"
  }
}
`;
```

**LLM Response:**
```json
{
  "intent": "search",
  "category": "local",
  "dataNeeded": ["restaurants", "location", "price", "ambiance"],
  "uiType": "list",
  "filters": ["price", "cuisine", "rating", "distance"],
  "location": "Paris",
  "constraints": {
    "maxPrice": 50,
    "vibe": "romantic"
  }
}
```

---

## Step 2: UI Schema Generation

**LLM Prompt (with context):**
```typescript
const uiGenerationPrompt = `
You are AdaptUI, an expert UI designer.

User wants: "Find romantic restaurants in Paris under $50"
Intent: search
UI Type: list
Device: iPhone 14 Pro, 393x852px, iOS

Generate a complete UI schema following this TypeScript interface:

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
  layout: { type, config };
  components: UIComponent[];
  actions: Record<string, UIAction>;
}

interface UIComponent {
  id: string;
  type: 'text' | 'input' | 'button' | 'card' | 'list' | 'chip-group' | 'image';
  props: { /* component-specific */ };
  layout: {
    width, height, flex, flexDirection, justifyContent, alignItems,
    spacing: { padding, margin, gap }
  };
  style: {
    backgroundColor, color, border, shadow, typography
  };
  interaction: { onPress, hapticFeedback };
  animation: { type, duration };
  children?: UIComponent[];
}

Requirements:
1. Use romantic colors (soft pinks, warm tones)
2. Show search input at top
3. Add filter chips for: Price, Cuisine, Rating, Distance
4. Display restaurant cards with: image, name, price, rating, distance
5. Each card should be tappable
6. Add a map view button (floating action button)
7. Make it beautiful and functional

Return ONLY valid JSON. No markdown, no explanations.
`;
```

**LLM Response (UI Schema):**
```json
{
  "id": "romantic-restaurants-paris",
  "version": "1.0",
  "uiType": "list",
  "title": "Romantic Restaurants in Paris",
  "theme": {
    "colors": {
      "primary": "#FF6B9D",
      "secondary": "#FFA07A",
      "background": "#1A1625",
      "surface": "#2D2438",
      "text": "#F8F0E3",
      "textSecondary": "#C4B5A0",
      "border": "#4A3F5C",
      "error": "#FF6B6B",
      "success": "#6BCF7F",
      "warning": "#FFB84D"
    },
    "typography": {
      "heading": { "fontSize": 28, "fontWeight": "700", "lineHeight": 36 },
      "body": { "fontSize": 16, "fontWeight": "400", "lineHeight": 24 },
      "caption": { "fontSize": 14, "fontWeight": "400", "lineHeight": 20 }
    },
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
    "borderRadius": { "sm": 8, "md": 12, "lg": 16, "full": 9999 }
  },
  "layout": {
    "type": "stack",
    "config": {
      "flexDirection": "column",
      "spacing": { "padding": 16 }
    }
  },
  "components": [
    {
      "id": "header",
      "type": "text",
      "props": { "text": "Romantic Restaurants", "numberOfLines": 1 },
      "style": {
        "typography": { "fontSize": 28, "fontWeight": "700" },
        "color": "#F8F0E3"
      },
      "layout": { "spacing": { "margin": { "bottom": 8 } } }
    },
    {
      "id": "subtitle",
      "type": "text",
      "props": { "text": "Paris • Under $50" },
      "style": {
        "typography": { "fontSize": 14 },
        "color": "#C4B5A0"
      },
      "layout": { "spacing": { "margin": { "bottom": 20 } } }
    },
    {
      "id": "search",
      "type": "input",
      "props": {
        "placeholder": "Search restaurants...",
        "icon": "search",
        "iconPosition": "left"
      },
      "layout": {
        "width": "fill",
        "spacing": { "margin": { "bottom": 16 } }
      },
      "style": {
        "backgroundColor": "#2D2438",
        "border": { "width": 1, "color": "#4A3F5C", "radius": 12 }
      },
      "interaction": { "onPress": "search", "hapticFeedback": "light" }
    },
    {
      "id": "filters",
      "type": "chip-group",
      "props": {
        "options": [
          { "id": "price", "label": "Under $50", "icon": "dollar" },
          { "id": "cuisine", "label": "French", "icon": "restaurant" },
          { "id": "rating", "label": "4+ Stars", "icon": "star" },
          { "id": "distance", "label": "Nearby", "icon": "location" }
        ],
        "multiSelect": true,
        "variant": "outlined"
      },
      "layout": { "spacing": { "margin": { "bottom": 20 }, "gap": 8 } },
      "style": {
        "border": { "width": 1, "color": "#FF6B9D", "radius": 20 }
      },
      "interaction": { "onPress": "filter", "hapticFeedback": "light" }
    },
    {
      "id": "restaurant-list",
      "type": "list",
      "props": {
        "items": [],
        "itemLayout": "card",
        "separator": true,
        "loading": true
      },
      "layout": { "flex": 1, "spacing": { "gap": 16 } },
      "children": [
        {
          "id": "restaurant-card",
          "type": "card",
          "props": {
            "imagePosition": "left"
          },
          "layout": { "width": "fill" },
          "style": {
            "backgroundColor": "#2D2438",
            "border": { "width": 1, "color": "#4A3F5C", "radius": 16 },
            "shadow": {
              "color": "#000",
              "offset": { "x": 0, "y": 4 },
              "blur": 12,
              "opacity": 0.3
            }
          },
          "interaction": {
            "onPress": "view-details",
            "hapticFeedback": "medium"
          },
          "animation": { "type": "fade", "duration": 300 }
        }
      ]
    },
    {
      "id": "map-fab",
      "type": "button",
      "props": { "icon": "map", "variant": "primary" },
      "layout": {
        "position": "fixed",
        "bottom": 24,
        "right": 24,
        "width": 56,
        "height": 56
      },
      "style": {
        "backgroundColor": "#FF6B9D",
        "border": { "radius": 28 },
        "shadow": {
          "color": "#FF6B9D",
          "offset": { "x": 0, "y": 8 },
          "blur": 24,
          "opacity": 0.5
        }
      },
      "interaction": { "onPress": "show-map", "hapticFeedback": "heavy" }
    }
  ],
  "actions": {
    "search": { "type": "search", "params": {} },
    "filter": { "type": "filter", "params": { "refresh": true } },
    "view-details": { "type": "navigate", "params": { "screen": "detail" } },
    "show-map": { "type": "navigate", "params": { "screen": "map" } }
  }
}
```

---

## Step 3: Schema Validation

```typescript
import { UISchema } from '../types/ui-schema';

class SchemaValidator {
  validate(schema: any): UISchema {
    // Check required fields
    if (!schema.id || !schema.components) {
      throw new Error('Invalid schema: missing required fields');
    }

    // Validate colors are valid hex
    if (schema.theme?.colors) {
      Object.values(schema.theme.colors).forEach(color => {
        if (!/^#[0-9A-F]{6}$/i.test(color as string)) {
          throw new Error(`Invalid color: ${color}`);
        }
      });
    }

    // Validate component types
    const validTypes = ['text', 'input', 'button', 'card', 'list', 'chip-group', 'image', 'stack'];
    schema.components.forEach(component => {
      if (!validTypes.includes(component.type)) {
        throw new Error(`Invalid component type: ${component.type}`);
      }
    });

    // Sanitize and return
    return schema as UISchema;
  }
}
```

---

## Step 4: Component Rendering

```typescript
// ComponentRenderer.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { UISchema, UIComponent } from '../types/ui-schema';

export function ComponentRenderer({ schema }: { schema: UISchema }) {
  return (
    <View style={{ flex: 1, backgroundColor: schema.theme.colors.background }}>
      {schema.components.map(component => (
        <RenderComponent key={component.id} component={component} theme={schema.theme} />
      ))}
    </View>
  );
}

function RenderComponent({ component, theme }: { component: UIComponent; theme: any }) {
  // Convert schema to React Native styles
  const style = {
    backgroundColor: component.style?.backgroundColor,
    color: component.style?.color,
    padding: component.layout?.spacing?.padding,
    margin: component.layout?.spacing?.margin,
    borderRadius: component.style?.border?.radius,
    borderWidth: component.style?.border?.width,
    borderColor: component.style?.border?.color,
    width: component.layout?.width === 'fill' ? '100%' : component.layout?.width,
    height: component.layout?.height,
    flex: component.layout?.flex,
    flexDirection: component.layout?.flexDirection,
    justifyContent: component.layout?.justifyContent,
    alignItems: component.layout?.alignItems,
    // ... more style mappings
  };

  // Render based on component type
  switch (component.type) {
    case 'text':
      return (
        <Text style={[style, { fontSize: component.style?.typography?.fontSize }]}>
          {component.props.text}
        </Text>
      );

    case 'input':
      return (
        <TextInput
          style={style}
          placeholder={component.props.placeholder}
          placeholderTextColor={theme.colors.textSecondary}
        />
      );

    case 'button':
      return (
        <TouchableOpacity
          style={style}
          onPress={() => handleAction(component.interaction?.onPress)}
        >
          <Text>{component.props.text}</Text>
        </TouchableOpacity>
      );

    case 'list':
      return (
        <FlatList
          data={component.props.items}
          renderItem={({ item }) => (
            <RenderComponent component={component.children[0]} theme={theme} />
          )}
          style={style}
        />
      );

    case 'card':
      return (
        <View style={style}>
          {component.children?.map(child => (
            <RenderComponent key={child.id} component={child} theme={theme} />
          ))}
        </View>
      );

    default:
      return null;
  }
}
```

---

## Complete Integration Example

```typescript
// Usage in your app
import { UIGenerator } from './ui-engine/UIGenerator';
import { ComponentRenderer } from './ui-engine/ComponentRenderer';
import { SchemaValidator } from './ui-engine/SchemaValidator';

export function DynamicScreen() {
  const [schema, setSchema] = useState<UISchema | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateUI();
  }, []);

  const generateUI = async () => {
    try {
      // 1. Get device context
      const deviceContext = {
        dimensions: { width, height, scale: PixelRatio.get() },
        platform: Platform.OS,
        orientation: 'portrait',
        safeArea: { top: 44, bottom: 34, left: 0, right: 0 },
      };

      // 2. Generate UI schema from query
      const generator = new UIGenerator();
      const rawSchema = await generator.generateUI(
        "Find romantic restaurants in Paris under $50",
        deviceContext
      );

      // 3. Validate schema
      const validator = new SchemaValidator();
      const validSchema = validator.validate(rawSchema);

      // 4. Set schema (triggers render)
      setSchema(validSchema);
      setLoading(false);
    } catch (error) {
      console.error('UI generation failed:', error);
      // Show fallback UI
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // 5. Render the dynamic UI
  return <ComponentRenderer schema={schema} />;
}
```

---

## Summary

**Flow:**
1. **User Query** → LLM analyzes intent
2. **LLM** → Generates complete UI schema (JSON)
3. **Validator** → Checks schema is valid
4. **Renderer** → Converts schema to React Native components
5. **Display** → User sees custom UI

**Key Points:**
- LLM outputs **structured JSON**, not code
- Schema is **declarative** (describes what, not how)
- Renderer **maps schema to components**
- Same schema can render on iOS, Android, Web
- Can cache schemas for common queries
- Can A/B test different UI schemas

This is how AdaptUI generates infinite UIs from a single codebase! 🚀

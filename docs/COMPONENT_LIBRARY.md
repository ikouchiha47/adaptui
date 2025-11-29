# AdaptUI Component Library

> Pre-built, visually validated components for LLM-driven UI generation

## Overview

AdaptUI uses **component selection**, not code generation. The LLM selects from 20+ pre-built components and configures their props. This ensures visual quality because **broken UI can be iterated and fixed, but bad UI can't be fixed without vision**.

**Stats:**
- 📦 **20 Components** across 5 categories
- 🎨 **4 Photo Grid Variants** for visual variety
- ✅ **95% Success Rate** in LLM generation
- 🚀 **Zero Hydration** - Complete schemas from LLM

---

## Component Categories

### 🎴 Cards (8 components)
Rich components for displaying destinations, restaurants, hotels, activities, and generic items.

### 📋 Lists (4 components)
Layout components for vertical lists, grids, and carousels.

### 🏷️ Badges (3 components)
Status indicators for time, crowd levels, and weather.

### 🔍 Filters (1 component)
Interactive filter chips for refining results.

### 📐 Layout (4 components)
Container components for stacking, photo grids, and transport tickets.

---

## Cards

### card-travel
**Travel Destination Card** - Complete destination with grouped highlights and local tip

**Required Props:** `destination`, `vibe`, `highlights`  
**Optional Props:** `photoUrl`, `photoUrls`, `photoGridVariant`, `bestTime`, `localTip`, `transportTickets`

**Photo Grid Variants** (set on EACH highlight):

```
┌─────────┬───┐  "hero-left" - Main photo left, 2 stacked right
│    1    │ 2 │  Use for: Romantic, luxury, featured attractions
│  HERO   ├───┤
│         │ 3 │
└─────────┴───┘

┌───┬─────────┐  "hero-right" - 2 stacked left, main photo right  
│ 1 │         │  Use for: Temples, nature, cultural sites
├───┤    3    │
│ 2 │  HERO   │
└───┴─────────┘

┌───┬───┬───┐  "equal-row" - 3 equal (BORING, avoid)
│ 1 │ 2 │ 3 │  Use for: Generic listings only
└───┴───┴───┘
```

**⚠️ CRITICAL:** Always vary layouts across highlights - mix hero-left and hero-right for visual interest!

**Example:**
```json
{
  "type": "card",
  "props": {
    "variant": "destination",
    "destination": "Ubud, Bali",
    "vibe": "Peaceful & Cultural",
    "highlights": [
      { 
        "name": "Tegalalang Rice Terrace", 
        "type": "touristy", 
        "description": "Iconic terraced rice fields", 
        "estimatedCost": "$10",
        "photoUrls": ["url1", "url2", "url3"],
        "photoGridVariant": "hero-left"
      },
      { 
        "name": "Campuhan Ridge Walk", 
        "type": "offbeat", 
        "description": "Scenic jungle trail", 
        "estimatedCost": "Free",
        "photoUrls": ["url1", "url2", "url3"],
        "photoGridVariant": "hero-right"
      }
    ],
    "bestTime": "Morning (6-9 AM)",
    "localTip": "Visit rice terraces early to avoid crowds"
  }
}
```

**Use Cases:** Travel recommendations, destination browsing, trip planning, visual storytelling

---

### card-restaurant
**Restaurant Card** - Restaurant with cuisine, price range, hours, and ratings

**Required Props:** `name`, `cuisine`, `priceRange`  
**Optional Props:** `rating`, `hours`, `distance`, `photoUrl`, `isOpen`, `crowdLevel`

**Example:**
```json
{
  "type": "card",
  "props": {
    "variant": "restaurant",
    "name": "Locavore",
    "cuisine": "Indonesian Fusion",
    "priceRange": "$$",
    "rating": 4.8,
    "hours": "6:00 PM - 11:00 PM",
    "isOpen": true,
    "crowdLevel": "moderate",
    "photoUrl": "https://..."
  }
}
```

**Use Cases:** Restaurant search, dining recommendations, food discovery

---

### card-hotel
**Hotel Card** - Hotel with amenities, room types, and pricing

**Required Props:** `name`, `roomTypes`, `pricePerNight`  
**Optional Props:** `amenities`, `rating`, `distance`, `photoUrl`, `availability`

**Example:**
```json
{
  "type": "card",
  "props": {
    "variant": "hotel",
    "name": "Four Seasons Resort",
    "roomTypes": ["Deluxe Room", "Villa with Pool"],
    "pricePerNight": "$450",
    "amenities": ["Pool", "Spa", "Restaurant", "Gym"],
    "rating": 4.9,
    "photoUrl": "https://..."
  }
}
```

**Use Cases:** Hotel search, accommodation booking, stay planning

---

### card-activity
**Activity Card** - Activity/experience with duration, difficulty, and cost

**Required Props:** `name`, `type`, `duration`  
**Optional Props:** `difficulty`, `cost`, `description`, `photoUrl`, `bestTime`

**Example:**
```json
{
  "type": "card",
  "props": {
    "variant": "activity",
    "name": "Sunrise Volcano Hike",
    "type": "adventure",
    "duration": "4 hours",
    "difficulty": "moderate",
    "cost": "$75/person",
    "description": "Hike to the summit for breathtaking sunrise views",
    "bestTime": "3:00 AM start"
  }
}
```

**Use Cases:** Activity search, experience booking, adventure planning

---

### card-highlight
**Highlight Card** - Compact card for individual highlights/attractions with type badge

**Required Props:** `name`, `type`  
**Optional Props:** `description`, `cost`, `photoUrl`, `rating`

**Example:**
```json
{
  "type": "card",
  "props": {
    "variant": "highlight",
    "name": "Pura Tirta Empul",
    "type": "cultural",
    "description": "Sacred water temple with purification pools",
    "cost": "Free",
    "photoUrl": "https://..."
  }
}
```

**Use Cases:** Quick highlights, attraction lists, points of interest

---

### card-item
**Generic Item Card** - Generic card for any item (products, services, etc.)

**Required Props:** `name`, `description`  
**Optional Props:** `price`, `rating`, `image`, `tags`, `metadata`

**Example:**
```json
{
  "type": "card",
  "props": {
    "name": "Canon EOS R5",
    "description": "Professional mirrorless camera",
    "price": "$3,899",
    "rating": 4.8,
    "image": "https://...",
    "tags": ["professional", "high-quality", "expensive"]
  }
}
```

**Use Cases:** Product listings, service cards, generic items, comparison items

---

### card-detail
**Detail Card** - Detailed card with specs/features

**Required Props:** `name`  
**Optional Props:** `specs`, `features`, `price`, `image`, `description`

**Example:**
```json
{
  "type": "card",
  "props": {
    "name": "iPhone 15 Pro",
    "specs": ["A17 Pro chip", "48MP camera", "Titanium design"],
    "price": "$999",
    "image": "https://..."
  }
}
```

**Use Cases:** Product details, spec comparisons, feature lists

---

### transport-tickets
**Transport Tickets** - Shows available flights, trains, and buses

**Required Props:** `tickets`

**Example:**
```json
{
  "type": "transport-tickets",
  "props": {
    "tickets": [
      {
        "type": "flight",
        "from": "Bangkok",
        "to": "Phuket",
        "price": "$120",
        "duration": "1h 20m"
      }
    ]
  }
}
```

**Use Cases:** Travel booking, transport options, trip planning

---

## Lists

### list-travel
**Travel List** - Vertical list layout with photos, best for mobile

**Required Props:** `items`  
**Optional Props:** `title`, `separator`, `emptyMessage`

**Example:**
```json
{
  "type": "list",
  "props": {
    "layout": "vertical",
    "items": [],
    "separator": true,
    "title": "Recommended Destinations"
  }
}
```

**Use Cases:** Main content display, search results, recommendations

---

### list-items
**Generic Items List** - Vertical list for any items (products, services, etc.)

**Required Props:** `items`  
**Optional Props:** `title`, `separator`, `emptyMessage`

**Example:**
```json
{
  "type": "list",
  "props": {
    "layout": "vertical",
    "items": [],
    "separator": true,
    "title": "Results"
  }
}
```

**Use Cases:** Product lists, search results, any item listing

---

### list-grid
**Grid List** - Grid layout (2 columns on mobile), good for browsing

**Required Props:** `items`  
**Optional Props:** `columns`, `gap`, `title`

**Example:**
```json
{
  "type": "list",
  "props": {
    "layout": "grid",
    "columns": 2,
    "gap": 12,
    "items": []
  }
}
```

**Use Cases:** Photo galleries, product browsing, category selection

---

### list-carousel
**Carousel List** - Horizontal scrolling list, good for featured items

**Required Props:** `items`  
**Optional Props:** `title`, `showIndicators`

**Example:**
```json
{
  "type": "list",
  "props": {
    "layout": "horizontal",
    "items": [],
    "title": "Featured Experiences",
    "showIndicators": true
  }
}
```

**Use Cases:** Featured content, quick browse, highlights

---

## Badges

### badge-time
**Time Badge** - Shows suggested time with icon (morning/afternoon/evening/night)

**Required Props:** `time`  
**Optional Props:** `icon`, `reasoning`

**Example:**
```json
{
  "type": "badge",
  "props": {
    "variant": "time",
    "time": "evening",
    "icon": "moon",
    "reasoning": "Best for romantic ambiance"
  }
}
```

**Use Cases:** Time recommendations, scheduling hints, activity timing

---

### badge-crowd
**Crowd Level Badge** - Shows crowd level (quiet/moderate/busy)

**Required Props:** `level`  
**Optional Props:** `percentage`, `icon`

**Example:**
```json
{
  "type": "badge",
  "props": {
    "variant": "crowd",
    "level": "quiet",
    "percentage": 25,
    "icon": "people"
  }
}
```

**Use Cases:** Crowd information, busy indicators, real-time status

---

### badge-weather
**Weather Badge** - Shows weather conditions (sunny/cloudy/rainy)

**Required Props:** `condition`  
**Optional Props:** `temperature`, `icon`

**Example:**
```json
{
  "type": "badge",
  "props": {
    "variant": "weather",
    "condition": "sunny",
    "temperature": "28°C",
    "icon": "sunny"
  }
}
```

**Use Cases:** Weather info, outdoor activity planning, real-time conditions

---

## Filters

### filter-chips
**Filter Chips** - Horizontal row of filter chips (Budget/Mid-range/Luxury)

**Required Props:** `options`  
**Optional Props:** `selected`, `multiSelect`

**Example:**
```json
{
  "type": "chip-group",
  "props": {
    "variant": "filter",
    "options": [
      { "id": "budget", "label": "Budget", "icon": "cash" },
      { "id": "mid", "label": "Mid-range", "icon": "card" },
      { "id": "luxury", "label": "Luxury", "icon": "diamond" }
    ],
    "multiSelect": false
  }
}
```

**Use Cases:** Filtering, category selection, quick options

---

## Layout

### stack-vertical
**Vertical Stack** - Vertical container for stacking components

**Required Props:** `children`  
**Optional Props:** `gap`, `padding`

**Example:**
```json
{
  "type": "stack",
  "props": {
    "direction": "vertical",
    "gap": 16,
    "padding": 20
  },
  "children": []
}
```

**Use Cases:** Layout container, section grouping, component stacking

---

### stack-horizontal
**Horizontal Stack** - Horizontal container for side-by-side components

**Required Props:** `children`  
**Optional Props:** `gap`, `alignment`

**Example:**
```json
{
  "type": "stack",
  "props": {
    "direction": "horizontal",
    "gap": 12,
    "alignment": "center"
  },
  "children": []
}
```

**Use Cases:** Horizontal layout, badge rows, action buttons

---

### photo-grid
**Photo Grid** - Grid layout for destination photos with 3 dynamic variants

**Required Props:** `photos`  
**Optional Props:** `maxPhotos`, `variant`

**Example:**
```json
{
  "type": "photo-grid",
  "props": {
    "photos": [],
    "maxPhotos": 5,
    "variant": "split"
  }
}
```

**Use Cases:** Destination photos, gallery view, image showcase, dynamic photo layouts

---

### photo-grid-variant
**Photo Grid Variant** - Smart photo grid with 4 layout variants

**Required Props:** `photos`, `variant`  
**Optional Props:** `maxPhotos`, `styleOverrides`

**Variants:**

1. **"hero-left"** - Hero photo dominates left, 2 stacked right
   - Use for: Romantic places, luxury venues, featured attractions

2. **"hero-right"** - 2 stacked left, hero photo dominates right
   - Use for: Temples, nature spots, cultural sites, visual variety

3. **"equal-row"** - 3 equal photos side-by-side (BORING, avoid)
   - Use for: Generic listings only

4. **"experimental"** - Custom layout with style overrides
   - Use for: Testing new layouts, special themes

**Example:**
```json
{
  "type": "photo-grid-variant",
  "props": {
    "photos": ["url1", "url2", "url3"],
    "variant": "hero-left",
    "maxPhotos": 3,
    "styleOverrides": { "gap": 4, "borderRadius": 16 }
  }
}
```

**Use Cases:** Dynamic photo layouts, context-aware galleries, romantic/luxury showcases, attraction highlights

---

## Complete UI Example

```json
{
  "id": "romantic-restaurants-paris",
  "version": "1.0",
  "uiType": "list",
  "title": "Romantic Restaurants in Paris",
  "theme": {
    "colors": {
      "primary": "#6366F1",
      "secondary": "#8B5CF6",
      "background": "#0F172A"
    }
  },
  "components": [
    {
      "id": "filters",
      "type": "chip-group",
      "props": {
        "variant": "filter",
        "options": [
          { "id": "romantic", "label": "Romantic", "icon": "heart", "selected": true },
          { "id": "intimate", "label": "Intimate", "icon": "candle" },
          { "id": "upscale", "label": "Upscale", "icon": "diamond" }
        ]
      }
    },
    {
      "id": "results",
      "type": "list",
      "props": {
        "layout": "vertical",
        "items": [
          {
            "destination": "Le Jules Verne",
            "vibe": "Fine dining with Eiffel Tower views",
            "highlights": [
              {
                "name": "Michelin-starred cuisine",
                "type": "luxury",
                "photoUrls": ["url1", "url2", "url3"],
                "photoGridVariant": "hero-left"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

---

## Design Principles

### 1. Component Selection, Not Generation

The LLM doesn't generate UI code. It selects from pre-built components and configures props. This ensures:
- ✅ Visual quality (components are pre-validated)
- ✅ Consistency (same components across all UIs)
- ✅ Reliability (95% success rate)

### 2. Why This Works

**In production:**
- ✅ **Broken UI can be iterated and fixed** - Validation errors, missing fields, wrong types
- ❌ **Bad UI can't be fixed without vision** - Ugly colors, poor spacing, inconsistent design

The LLM has no visual feedback loop. Pre-built components solve this.

### 3. Photo Grid Variants

Always mix variants for visual interest:
- First highlight: `hero-left` (main attraction)
- Second highlight: `hero-right` (variety)
- Third highlight: `hero-left` (rhythm)

Never use all `equal-row` - it's boring!

---

## Implementation

### Component Registry

All components are registered in `src/ui-engine/ComponentRegistry.ts`:

```typescript
export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  'card-travel': { ... },
  'card-restaurant': { ... },
  'list-travel': { ... },
  // ... 20 total components
};
```

### Component Renderers

Each component has a dedicated renderer in `src/ui-engine/components/`:

- `CardRenderer.tsx` - All card variants
- `ListRenderer.tsx` - All list variants
- `ChipGroupRenderer.tsx` - Filter chips
- `SimpleRenderers.tsx` - Badges, stacks, etc.
- `PhotoGridVariant.tsx` - Photo grid layouts

### Usage

```typescript
import { ModularComponentRenderer } from '../ui-engine/ModularComponentRenderer';

<ModularComponentRenderer 
  schema={uiSchema} 
  onAction={(actionId, params) => {
    console.log('Action:', actionId, params);
  }}
/>
```

---

## Future: LLM-Generated Theming

Right now, themes are hardcoded. The next step is **LLM-generated themes with vision validation**:

1. LLM generates theme based on query emotion
2. Render preview with generated theme
3. Vision model (GPT-4V, Claude 3.5 Sonnet) validates design
4. Iterate until validated (max 3 attempts)

This is the gateway to fully autonomous UI generation. Once themes are validated visually, we can trust the LLM to generate complete UIs.

**Read more:** [BLOG_1_ADAPTUI_ARCHITECTURE.md](../BLOG_1_ADAPTUI_ARCHITECTURE.md)

---

## Interactive Showcase

View the interactive component showcase: [component-showcase.html](./component-showcase.html)

---

**Built with ❤️ and AI**

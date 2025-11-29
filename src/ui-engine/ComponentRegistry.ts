// Component Registry - Full schema definitions for all UI components

export interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'card' | 'list' | 'badge' | 'filter' | 'layout';
  requiredProps: string[];
  optionalProps: string[];
  example: any;
  useCases: string[];
}

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CARDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  'card-travel': {
    id: 'card-travel',
    name: 'Travel Destination Card',
    description: `Card for displaying complete destination with grouped highlights and local tip. 

PHOTO GRID VARIANTS (set on EACH highlight):
┌─────────┬───┐  "hero-left" - Main photo left, 2 stacked right (romantic/luxury/featured)
│    1    │ 2 │
│  HERO   ├───┤
│         │ 3 │
└─────────┴───┘

┌───┬─────────┐  "hero-right" - 2 stacked left, main photo right (temples/nature/variety)
│ 1 │         │
├───┤    3    │
│ 2 │  HERO   │
└───┴─────────┘

┌───┬───┬───┐  "equal-row" - 3 equal (BORING, avoid unless generic)
│ 1 │ 2 │ 3 │
└───┴───┴───┘

CRITICAL: ALWAYS vary layouts across highlights - mix hero-left and hero-right for visual interest!`,
    category: 'card',
    requiredProps: ['destination', 'vibe', 'highlights'],
    optionalProps: ['photoUrl', 'photoUrls', 'photoGridVariant', 'bestTime', 'localTip', 'transportTickets'],
    example: {
      type: 'card',
      props: {
        variant: 'destination',
        destination: 'Ubud, Bali',
        vibe: 'Peaceful & Cultural',
        highlights: [
          { 
            name: 'Tegalalang Rice Terrace', 
            type: 'touristy', 
            description: 'Iconic terraced rice fields', 
            estimatedCost: '$10',
            photoUrls: ['url1', 'url2', 'url3'],
            photoGridVariant: 'hero-left'  // Main attraction gets hero treatment
          },
          { 
            name: 'Campuhan Ridge Walk', 
            type: 'offbeat', 
            description: 'Scenic jungle trail', 
            estimatedCost: 'Free',
            photoUrls: ['url1', 'url2', 'url3'],
            photoGridVariant: 'hero-right'  // Alternate for variety
          }
        ],
        bestTime: 'Morning (6-9 AM)',
        localTip: 'Visit rice terraces early to avoid crowds'
      }
    },
    useCases: ['Travel recommendations', 'Destination browsing', 'Trip planning', 'Visual storytelling with varied photo layouts']
  },

  'card-restaurant': {
    id: 'card-restaurant',
    name: 'Restaurant Card',
    description: 'Card for displaying restaurants with cuisine, price range, hours, and ratings',
    category: 'card',
    requiredProps: ['name', 'cuisine', 'priceRange'],
    optionalProps: ['rating', 'hours', 'distance', 'photoUrl', 'isOpen', 'crowdLevel'],
    example: {
      type: 'card',
      props: {
        variant: 'restaurant',
        name: 'Locavore',
        cuisine: 'Indonesian Fusion',
        priceRange: '$$$',
        rating: 4.8,
        hours: '6:00 PM - 11:00 PM',
        isOpen: true,
        crowdLevel: 'moderate',
        photoUrl: 'https://...'
      }
    },
    useCases: ['Restaurant search', 'Dining recommendations', 'Food discovery']
  },

  'card-hotel': {
    id: 'card-hotel',
    name: 'Hotel Card',
    description: 'Card for displaying hotels with amenities, room types, and pricing',
    category: 'card',
    requiredProps: ['name', 'roomTypes', 'pricePerNight'],
    optionalProps: ['amenities', 'rating', 'distance', 'photoUrl', 'availability'],
    example: {
      type: 'card',
      props: {
        variant: 'hotel',
        name: 'Four Seasons Resort',
        roomTypes: ['Deluxe Room', 'Villa with Pool'],
        pricePerNight: '$450',
        amenities: ['Pool', 'Spa', 'Restaurant', 'Gym'],
        rating: 4.9,
        photoUrl: 'https://...'
      }
    },
    useCases: ['Hotel search', 'Accommodation booking', 'Stay planning']
  },

  'card-activity': {
    id: 'card-activity',
    name: 'Activity Card',
    description: 'Card for displaying activities/experiences with duration, difficulty, and cost',
    category: 'card',
    requiredProps: ['name', 'type', 'duration'],
    optionalProps: ['difficulty', 'cost', 'description', 'photoUrl', 'bestTime'],
    example: {
      type: 'card',
      props: {
        variant: 'activity',
        name: 'Sunrise Volcano Hike',
        type: 'adventure',
        duration: '4 hours',
        difficulty: 'moderate',
        cost: '$75/person',
        description: 'Hike to the summit for breathtaking sunrise views',
        bestTime: '3:00 AM start'
      }
    },
    useCases: ['Activity search', 'Experience booking', 'Adventure planning']
  },

  'card-highlight': {
    id: 'card-highlight',
    name: 'Highlight Card',
    description: 'Compact card for individual highlights/attractions with type badge',
    category: 'card',
    requiredProps: ['name', 'type'],
    optionalProps: ['description', 'cost', 'photoUrl', 'rating'],
    example: {
      type: 'card',
      props: {
        variant: 'highlight',
        name: 'Pura Tirta Empul',
        type: 'cultural',
        description: 'Sacred water temple with purification pools',
        cost: 'Free',
        photoUrl: 'https://...'
      }
    },
    useCases: ['Quick highlights', 'Attraction lists', 'Points of interest']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GENERIC ALIASES (for non-travel use cases)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  'card-item': {
    id: 'card-item',
    name: 'Generic Item Card',
    description: 'Generic card for any item (products, services, etc.) - alias for card-travel',
    category: 'card',
    requiredProps: ['name', 'description'],
    optionalProps: ['price', 'rating', 'image', 'tags', 'metadata'],
    example: {
      type: 'card',
      props: {
        name: 'Canon EOS R5',
        description: 'Professional mirrorless camera',
        price: '$3,899',
        rating: 4.8,
        image: 'https://...',
        tags: ['professional', 'high-quality', 'expensive']
      }
    },
    useCases: ['Product listings', 'Service cards', 'Generic items', 'Comparison items']
  },

  'card-detail': {
    id: 'card-detail',
    name: 'Detail Card',
    description: 'Detailed card with specs/features - alias for card-highlight',
    category: 'card',
    requiredProps: ['name'],
    optionalProps: ['specs', 'features', 'price', 'image', 'description'],
    example: {
      type: 'card',
      props: {
        name: 'iPhone 15 Pro',
        specs: ['A17 Pro chip', '48MP camera', 'Titanium design'],
        price: '$999',
        image: 'https://...'
      }
    },
    useCases: ['Product details', 'Spec comparisons', 'Feature lists']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LISTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  'list-travel': {
    id: 'list-travel',
    name: 'Travel List',
    description: 'Vertical list layout with photos, best for mobile',
    category: 'list',
    requiredProps: ['items'],
    optionalProps: ['title', 'separator', 'emptyMessage'],
    example: {
      type: 'list',
      props: {
        layout: 'vertical',
        items: [], // Will be populated with data
        separator: true,
        title: 'Recommended Destinations'
      }
    },
    useCases: ['Main content display', 'Search results', 'Recommendations']
  },

  'list-items': {
    id: 'list-items',
    name: 'Generic Items List',
    description: 'Vertical list for any items (products, services, etc.) - alias for list-travel',
    category: 'list',
    requiredProps: ['items'],
    optionalProps: ['title', 'separator', 'emptyMessage'],
    example: {
      type: 'list',
      props: {
        layout: 'vertical',
        items: [],
        separator: true,
        title: 'Results'
      }
    },
    useCases: ['Product lists', 'Search results', 'Any item listing']
  },

  'list-grid': {
    id: 'list-grid',
    name: 'Grid List',
    description: 'Grid layout (2 columns on mobile), good for browsing',
    category: 'list',
    requiredProps: ['items'],
    optionalProps: ['columns', 'gap', 'title'],
    example: {
      type: 'list',
      props: {
        layout: 'grid',
        columns: 2,
        gap: 12,
        items: []
      }
    },
    useCases: ['Photo galleries', 'Product browsing', 'Category selection']
  },

  'list-carousel': {
    id: 'list-carousel',
    name: 'Carousel List',
    description: 'Horizontal scrolling list, good for featured items',
    category: 'list',
    requiredProps: ['items'],
    optionalProps: ['title', 'showIndicators'],
    example: {
      type: 'list',
      props: {
        layout: 'horizontal',
        items: [],
        title: 'Featured Experiences',
        showIndicators: true
      }
    },
    useCases: ['Featured content', 'Quick browse', 'Highlights']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BADGES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  'badge-time': {
    id: 'badge-time',
    name: 'Time Badge',
    description: 'Shows suggested time with icon (morning/afternoon/evening/night)',
    category: 'badge',
    requiredProps: ['time'],
    optionalProps: ['icon', 'reasoning'],
    example: {
      type: 'badge',
      props: {
        variant: 'time',
        time: 'evening',
        icon: 'moon',
        reasoning: 'Best for romantic ambiance'
      }
    },
    useCases: ['Time recommendations', 'Scheduling hints', 'Activity timing']
  },

  'badge-crowd': {
    id: 'badge-crowd',
    name: 'Crowd Level Badge',
    description: 'Shows crowd level (quiet/moderate/busy)',
    category: 'badge',
    requiredProps: ['level'],
    optionalProps: ['percentage', 'icon'],
    example: {
      type: 'badge',
      props: {
        variant: 'crowd',
        level: 'quiet',
        percentage: 25,
        icon: 'people'
      }
    },
    useCases: ['Crowd information', 'Busy indicators', 'Real-time status']
  },

  'badge-weather': {
    id: 'badge-weather',
    name: 'Weather Badge',
    description: 'Shows weather conditions (sunny/cloudy/rainy)',
    category: 'badge',
    requiredProps: ['condition'],
    optionalProps: ['temperature', 'icon'],
    example: {
      type: 'badge',
      props: {
        variant: 'weather',
        condition: 'sunny',
        temperature: '28°C',
        icon: 'sunny'
      }
    },
    useCases: ['Weather info', 'Outdoor activity planning', 'Real-time conditions']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FILTERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  'filter-chips': {
    id: 'filter-chips',
    name: 'Filter Chips',
    description: 'Horizontal row of filter chips (Budget/Mid-range/Luxury)',
    category: 'filter',
    requiredProps: ['options'],
    optionalProps: ['selected', 'multiSelect'],
    example: {
      type: 'chip-group',
      props: {
        variant: 'filter',
        options: [
          { id: 'budget', label: 'Budget', icon: 'cash' },
          { id: 'mid', label: 'Mid-range', icon: 'card' },
          { id: 'luxury', label: 'Luxury', icon: 'diamond' }
        ],
        multiSelect: false
      }
    },
    useCases: ['Filtering', 'Category selection', 'Quick options']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LAYOUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  'stack-vertical': {
    id: 'stack-vertical',
    name: 'Vertical Stack',
    description: 'Vertical container for stacking components',
    category: 'layout',
    requiredProps: ['children'],
    optionalProps: ['gap', 'padding'],
    example: {
      type: 'stack',
      props: {
        direction: 'vertical',
        gap: 16,
        padding: 20
      },
      children: []
    },
    useCases: ['Layout container', 'Section grouping', 'Component stacking']
  },

  'stack-horizontal': {
    id: 'stack-horizontal',
    name: 'Horizontal Stack',
    description: 'Horizontal container for side-by-side components',
    category: 'layout',
    requiredProps: ['children'],
    optionalProps: ['gap', 'alignment'],
    example: {
      type: 'stack',
      props: {
        direction: 'horizontal',
        gap: 12,
        alignment: 'center'
      },
      children: []
    },
    useCases: ['Horizontal layout', 'Badge rows', 'Action buttons']
  },

  'photo-grid': {
    id: 'photo-grid',
    name: 'Photo Grid',
    description: 'Grid layout for destination photos with 3 dynamic variants: horizontal (3 equal photos), split (1 large + 2 small stacked), masonry (2 small stacked + 1 large). Variants are auto-selected based on context.',
    category: 'layout',
    requiredProps: ['photos'],
    optionalProps: ['maxPhotos', 'variant'],
    example: {
      type: 'photo-grid',
      props: {
        photos: [],
        maxPhotos: 5,
        variant: 'split'
      }
    },
    useCases: ['Destination photos', 'Gallery view', 'Image showcase', 'Dynamic photo layouts']
  },

  'photo-grid-variant': {
    id: 'photo-grid-variant',
    name: 'Photo Grid Variant',
    description: `Smart photo grid with 4 layout variants. VISUAL LAYOUTS:

(1) "hero-left" - Hero photo dominates left, 2 stacked right:
    ┌─────────┬───┐
    │         │ 2 │
    │    1    ├───┤
    │ (HERO)  │ 3 │
    └─────────┴───┘
    Use for: Romantic places, luxury venues, featured attractions, main highlights

(2) "hero-right" - 2 stacked left, hero photo dominates right:
    ┌───┬─────────┐
    │ 1 │         │
    ├───┤    3    │
    │ 2 │ (HERO)  │
    └───┴─────────┘
    Use for: Temples, nature spots, cultural sites, visual variety

(3) "equal-row" - 3 equal photos side-by-side (BORING, avoid):
    ┌─────┬─────┬─────┐
    │  1  │  2  │  3  │
    └─────┴─────┴─────┘
    Use for: Generic listings only when no emphasis needed

(4) "experimental" - Custom layout with style overrides:
    Accepts styleOverrides prop for custom spacing, sizes, borders
    Use for: Testing new layouts, special themes`,
    category: 'layout',
    requiredProps: ['photos', 'variant'],
    optionalProps: ['maxPhotos', 'styleOverrides'],
    example: {
      type: 'photo-grid-variant',
      props: {
        photos: ['url1', 'url2', 'url3'],
        variant: 'hero-left',
        maxPhotos: 3,
        styleOverrides: { gap: 4, borderRadius: 16 }
      }
    },
    useCases: ['Dynamic photo layouts', 'Context-aware galleries', 'Romantic/luxury showcases', 'Attraction highlights', 'Visual variety', 'Custom themed layouts']
  },

  'transport-tickets': {
    id: 'transport-tickets',
    name: 'Transport Tickets',
    description: 'Shows available flights, trains, and buses',
    category: 'card',
    requiredProps: ['tickets'],
    optionalProps: [],
    example: {
      type: 'transport-tickets',
      props: {
        tickets: []
      }
    },
    useCases: ['Travel booking', 'Transport options', 'Trip planning']
  }
};

/**
 * Generate component registry documentation for LLM prompts
 */
export function generateComponentDocs(): string {
  let docs = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  docs += 'COMPONENT REGISTRY - Full Schema Definitions\n';
  docs += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  const categories = ['card', 'list', 'badge', 'filter', 'layout'];
  
  for (const category of categories) {
    const components = Object.values(COMPONENT_REGISTRY).filter(c => c.category === category);
    
    if (components.length === 0) continue;
    
    docs += `\n${category.toUpperCase()}S:\n`;
    docs += '─'.repeat(80) + '\n\n';
    
    for (const comp of components) {
      docs += `${comp.id}:\n`;
      docs += `  Name: ${comp.name}\n`;
      docs += `  Description: ${comp.description}\n`;
      docs += `  Required Props: ${comp.requiredProps.join(', ')}\n`;
      docs += `  Optional Props: ${comp.optionalProps.join(', ')}\n`;
      docs += `  Use Cases: ${comp.useCases.join(', ')}\n`;
      docs += `  Example:\n`;
      docs += `    ${JSON.stringify(comp.example, null, 2).split('\n').join('\n    ')}\n\n`;
    }
  }
  
  return docs;
}

/**
 * Get component definition by ID
 */
export function getComponentDef(id: string): ComponentDefinition | undefined {
  return COMPONENT_REGISTRY[id];
}

/**
 * Hydrate high-level structure into full schema
 */
export function hydrateComponent(componentId: string, data: any): any {
  const def = getComponentDef(componentId);
  
  if (!def) {
    console.warn(`⚠️ Unknown component: ${componentId}`);
    return null;
  }
  
  // Use the example structure but replace props entirely with real data
  const hydrated = {
    type: def.example.type,
    props: data  // Use real data directly, don't merge with example
  };
  
  return hydrated;
}

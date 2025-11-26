// Example of a complete, rich UI schema for travel search

import { UISchema } from '../../types/ui-schema';

export const travelSearchUIExample: UISchema = {
  id: 'travel-search-tokyo',
  version: '1.0',
  uiType: 'list',
  title: 'Hotels in Tokyo',
  description: 'Find the perfect place to stay',

  // Complete theme definition
  theme: {
    colors: {
      primary: '#3B82F6',
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
      heading: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
        letterSpacing: -0.5,
      },
      subheading: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
      },
      body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
      },
      caption: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      full: 9999,
    },
  },

  // Layout structure
  layout: {
    type: 'stack',
    config: {
      flexDirection: 'column',
      spacing: {
        padding: 16,
      },
    },
  },

  // Component tree
  components: [
    // Header section
    {
      id: 'header',
      type: 'stack',
      layout: {
        flexDirection: 'column',
        spacing: {
          margin: { bottom: 24 },
        },
      },
      children: [
        {
          id: 'title',
          type: 'text',
          props: {
            text: 'Hotels in Tokyo',
            numberOfLines: 1,
          },
          style: {
            typography: {
              fontSize: 28,
              fontWeight: '700',
            },
            color: '#F1F5F9',
          },
        },
        {
          id: 'subtitle',
          type: 'text',
          props: {
            text: '127 places found',
          },
          style: {
            typography: {
              fontSize: 14,
              fontWeight: '400',
            },
            color: '#94A3B8',
          },
          layout: {
            spacing: {
              margin: { top: 4 },
            },
          },
        },
      ],
    },

    // Search input
    {
      id: 'search-input',
      type: 'input',
      props: {
        placeholder: 'Search hotels...',
        icon: 'search',
        iconPosition: 'left',
        autoCorrect: false,
      },
      layout: {
        width: 'fill',
        spacing: {
          margin: { bottom: 16 },
        },
      },
      style: {
        backgroundColor: '#1E293B',
        border: {
          width: 1,
          color: '#334155',
          radius: 12,
        },
        typography: {
          fontSize: 16,
        },
      },
      interaction: {
        onPress: 'focus-search',
        hapticFeedback: 'light',
      },
    },

    // Filter chips
    {
      id: 'filters',
      type: 'chip-group',
      props: {
        options: [
          { id: 'budget', label: 'Budget', icon: 'wallet' },
          { id: 'luxury', label: 'Luxury', icon: 'star' },
          { id: 'near-station', label: 'Near Station', icon: 'train' },
          { id: 'wifi', label: 'Free WiFi', icon: 'wifi' },
        ],
        multiSelect: true,
        variant: 'outlined',
      },
      layout: {
        spacing: {
          margin: { bottom: 20 },
          gap: 8,
        },
      },
      style: {
        border: {
          width: 1,
          color: '#334155',
          radius: 20,
        },
      },
      interaction: {
        onPress: 'toggle-filter',
        hapticFeedback: 'light',
      },
    },

    // Results list
    {
      id: 'hotel-list',
      type: 'list',
      props: {
        items: [
          {
            id: 'hotel-1',
            title: 'Park Hyatt Tokyo',
            subtitle: 'Shinjuku • 5 min walk',
            description: 'Luxury hotel with stunning city views',
            image: 'https://example.com/hotel1.jpg',
            rating: 4.8,
            price: '$320/night',
            badge: 'Popular',
          },
          {
            id: 'hotel-2',
            title: 'Shibuya Excel Hotel',
            subtitle: 'Shibuya • Near station',
            description: 'Modern hotel in the heart of Shibuya',
            image: 'https://example.com/hotel2.jpg',
            rating: 4.5,
            price: '$180/night',
          },
        ],
        itemLayout: 'card',
        separator: true,
        emptyMessage: 'No hotels found',
        onEndReached: 'load-more',
      },
      layout: {
        flex: 1,
        spacing: {
          gap: 16,
        },
      },
      children: [
        // Card template for each item
        {
          id: 'hotel-card-template',
          type: 'card',
          props: {
            imagePosition: 'top',
          },
          layout: {
            width: 'fill',
          },
          style: {
            backgroundColor: '#1E293B',
            border: {
              width: 1,
              color: '#334155',
              radius: 16,
            },
            shadow: {
              color: '#000',
              offset: { x: 0, y: 4 },
              blur: 12,
              opacity: 0.3,
            },
          },
          interaction: {
            onPress: 'view-hotel-details',
            hapticFeedback: 'medium',
          },
          animation: {
            type: 'fade',
            duration: 300,
          },
        },
      ],
    },

    // Floating action button
    {
      id: 'map-fab',
      type: 'button',
      props: {
        text: '',
        icon: 'map',
        variant: 'primary',
        size: 'large',
      },
      layout: {
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
      },
      style: {
        backgroundColor: '#3B82F6',
        border: {
          radius: 28,
        },
        shadow: {
          color: '#3B82F6',
          offset: { x: 0, y: 8 },
          blur: 24,
          opacity: 0.5,
        },
      },
      interaction: {
        onPress: 'show-map-view',
        hapticFeedback: 'heavy',
      },
      animation: {
        type: 'scale',
        duration: 200,
      },
    },
  ],

  // Actions
  actions: {
    'focus-search': {
      type: 'navigate',
      params: { screen: 'search' },
    },
    'toggle-filter': {
      type: 'filter',
      params: { refresh: true },
    },
    'view-hotel-details': {
      type: 'navigate',
      params: { screen: 'hotel-detail' },
    },
    'load-more': {
      type: 'search',
      params: { page: 'next' },
    },
    'show-map-view': {
      type: 'navigate',
      params: { screen: 'map' },
    },
  },

  // Data bindings
  data: {
    sources: {
      hotels: {
        type: 'api',
        config: {
          endpoint: '/api/hotels',
          params: { city: 'tokyo' },
        },
      },
    },
    bindings: {
      'hotel-list': 'hotels.results',
    },
  },

  // Responsive overrides
  responsive: {
    small: {
      components: [
        {
          id: 'hotel-list',
          props: {
            itemLayout: 'card',
            columns: 1,
          },
        },
      ],
    },
    large: {
      components: [
        {
          id: 'hotel-list',
          props: {
            itemLayout: 'grid',
            columns: 3,
          },
        },
      ],
    },
  },

  // Metadata
  metadata: {
    generatedAt: new Date().toISOString(),
    queryHash: 'hotels-tokyo-abc123',
    category: 'travel',
    tags: ['hotels', 'tokyo', 'accommodation'],
  },
};

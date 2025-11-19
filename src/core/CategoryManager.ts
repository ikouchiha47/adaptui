import { Category, CategoryConfig, QueryRequest } from '@/types';

export class CategoryManager {
  private categories: Map<string, Category>;
  private userDefinedCategories: Map<string, Category>;

  constructor() {
    this.categories = new Map();
    this.userDefinedCategories = new Map();
    this.initializeBuiltInCategories();
  }

  private initializeBuiltInCategories() {
    const builtInCategories: Category[] = [
      {
        id: 'text-search',
        name: 'Text Search',
        description: 'General information retrieval and web search',
        icon: '🔍',
        color: '#3B82F6',
        isUserDefined: false,
        promptSuffix: 'Focus on providing accurate, comprehensive information with clear sources.'
      },
      {
        id: 'maps-locations',
        name: 'Maps & Locations',
        description: 'Geographic queries, navigation, and location-based services',
        icon: '🗺️',
        color: '#10B981',
        isUserDefined: false,
        promptSuffix: 'Provide location-specific information with geographic context and relevant details.'
      },
      {
        id: 'food',
        name: 'Food',
        description: 'Restaurant discovery, recipes, nutrition, and food-related queries',
        icon: '🍽️',
        color: '#F59E0B',
        isUserDefined: false,
        promptSuffix: 'Focus on food-related information including restaurants, recipes, and dietary details.'
      },
      {
        id: 'events',
        name: 'Events',
        description: 'Calendar, scheduling, and event discovery',
        icon: '📅',
        color: '#8B5CF6',
        isUserDefined: false,
        promptSuffix: 'Provide event-related information including dates, times, locations, and scheduling details.'
      },
      {
        id: 'todo-lists',
        name: 'Todo Lists',
        description: 'Task management and productivity tools',
        icon: '✅',
        color: '#EF4444',
        isUserDefined: false,
        promptSuffix: 'Focus on task organization, prioritization, and productivity enhancement.'
      },
      {
        id: 'transport',
        name: 'Transport',
        description: 'Travel planning, routes, and transportation services',
        icon: '🚗',
        color: '#6366F1',
        isUserDefined: false,
        promptSuffix: 'Provide transportation-related information including routes, schedules, and travel options.'
      },
      {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Product search, comparison, and shopping',
        icon: '🛒',
        color: '#EC4899',
        isUserDefined: false,
        promptSuffix: 'Focus on product information, comparisons, pricing, and shopping-related details.'
      },
      {
        id: 'stocks',
        name: 'Stocks',
        description: 'Financial data, market information, and investment tracking',
        icon: '📈',
        color: '#14B8A6',
        isUserDefined: false,
        promptSuffix: 'Provide financial and market information with relevant data and analysis.'
      },
      {
        id: 'music-video',
        name: 'Music & Video',
        description: 'Media discovery, playback, and entertainment',
        icon: '🎵',
        color: '#F97316',
        isUserDefined: false,
        promptSuffix: 'Focus on media and entertainment content with relevant details and options.'
      }
    ];

    builtInCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  async categorizeQuery(query: QueryRequest): Promise<Category[]> {
    const queryText = query.query.toLowerCase();
    const matchedCategories: Category[] = [];

    // Simple keyword-based categorization
    // In a real implementation, this would use ML classification
    
    const categoryKeywords: Record<string, string[]> = {
      'text-search': ['search', 'find', 'what is', 'how to', 'information', 'lookup', 'define', 'explain'],
      'maps-locations': ['where', 'location', 'near me', 'map', 'direction', 'address', 'place', 'area'],
      'food': ['restaurant', 'food', 'eat', 'recipe', 'cooking', 'meal', 'diet', 'nutrition', 'hungry'],
      'events': ['event', 'calendar', 'schedule', 'meeting', 'appointment', 'date', 'time', 'when'],
      'todo-lists': ['task', 'todo', 'list', 'reminder', 'goal', 'plan', 'organize', 'productivity'],
      'transport': ['travel', 'flight', 'train', 'bus', 'drive', 'route', 'transportation', 'trip'],
      'ecommerce': ['buy', 'shop', 'product', 'price', 'store', 'order', 'purchase', 'deal'],
      'stocks': ['stock', 'market', 'investment', 'finance', 'money', 'trading', 'portfolio', 'crypto'],
      'music-video': ['music', 'song', 'video', 'movie', 'entertainment', 'listen', 'watch', 'play']
    };

    // Check each category for keyword matches
    for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
      const category = this.categories.get(categoryId);
      if (category && keywords.some(keyword => queryText.includes(keyword))) {
        matchedCategories.push(category);
      }
    }

    // If no categories matched, default to text-search
    if (matchedCategories.length === 0) {
      const defaultCategory = this.categories.get('text-search');
      if (defaultCategory) {
        matchedCategories.push(defaultCategory);
      }
    }

    // Add user-defined categories if they match
    for (const category of this.userDefinedCategories.values()) {
      if (this.matchesUserDefinedCategory(query, category)) {
        matchedCategories.push(category);
      }
    }

    return matchedCategories;
  }

  private matchesUserDefinedCategory(query: QueryRequest, category: Category): boolean {
    if (!category.config?.customPrompts) {
      return false;
    }

    const queryText = query.query.toLowerCase();
    
    // Check if any custom prompt keywords match
    for (const prompt of Object.values(category.config.customPrompts)) {
      if (queryText.includes(prompt.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  addUserDefinedCategory(category: Omit<Category, 'id' | 'isUserDefined'>): Category {
    const newCategory: Category = {
      ...category,
      id: `user-${Date.now()}`,
      isUserDefined: true
    };

    this.userDefinedCategories.set(newCategory.id, newCategory);
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const category = this.categories.get(id) || this.userDefinedCategories.get(id);
    if (!category) {
      return null;
    }

    const updatedCategory = { ...category, ...updates };
    
    if (category.isUserDefined) {
      this.userDefinedCategories.set(id, updatedCategory);
    } else {
      this.categories.set(id, updatedCategory);
    }

    return updatedCategory;
  }

  deleteCategory(id: string): boolean {
    const category = this.userDefinedCategories.get(id);
    if (!category) {
      return false; // Cannot delete built-in categories
    }

    return this.userDefinedCategories.delete(id);
  }

  getCategory(id: string): Category | undefined {
    return this.categories.get(id) || this.userDefinedCategories.get(id);
  }

  getAllCategories(): Category[] {
    return [
      ...Array.from(this.categories.values()),
      ...Array.from(this.userDefinedCategories.values())
    ];
  }

  getBuiltInCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  getUserDefinedCategories(): Category[] {
    return Array.from(this.userDefinedCategories.values());
  }

  // Enhanced categorization with context
  async categorizeWithContext(query: QueryRequest, context: any): Promise<Category[]> {
    const categories = await this.categorizeQuery(query);
    
    // Apply context-based adjustments
    if (context.preferredCategories) {
      const preferred = categories.filter(cat => 
        context.preferredCategories.includes(cat.id)
      );
      if (preferred.length > 0) {
        return preferred;
      }
    }

    if (context.location && categories.some(cat => cat.id === 'maps-locations')) {
      // Prioritize location-based categories if location is available
      const locationCategory = categories.find(cat => cat.id === 'maps-locations');
      if (locationCategory) {
        return [locationCategory, ...categories.filter(cat => cat.id !== 'maps-locations')];
      }
    }

    return categories;
  }
}
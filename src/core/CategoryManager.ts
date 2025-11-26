import { Category, QueryRequest } from '@/types';

export class CategoryManager {
  private categories: Map<string, Category>;

  constructor() {
    this.categories = new Map();
    this.initializeBuiltInCategories();
  }

  private initializeBuiltInCategories() {
    const builtInCategories: Category[] = [
      {
        id: 'travel-planning',
        name: 'Travel Planning',
        description: 'Plan trips, find destinations, and create itineraries',
        icon: '✈️',
        color: '#3B82F6',
        isUserDefined: false,
        promptSuffix: 'Focus on creating a detailed itinerary with locations, times, and travel information.',
      },
      {
        id: 'local-discovery',
        name: 'Local Discovery',
        description: 'Discover local events, restaurants, and attractions',
        icon: '🔍',
        color: '#10B981',
        isUserDefined: false,
        promptSuffix: 'Provide local recommendations with ratings, hours, and contact information.',
      },
      {
        id: 'research',
        name: 'Research',
        description: 'Compare products, analyze data, and gather information',
        icon: '📊',
        color: '#8B5CF6',
        isUserDefined: false,
        promptSuffix: 'Create comparison tables and detailed analysis with pros/cons.',
      },
      {
        id: 'text-search',
        name: 'Text Search',
        description: 'General information retrieval and questions',
        icon: '📝',
        color: '#6B7280',
        isUserDefined: false,
      },
      {
        id: 'maps-locations',
        name: 'Maps & Locations',
        description: 'Geographic queries and navigation',
        icon: '🗺️',
        color: '#EF4444',
        isUserDefined: false,
      },
    ];

    builtInCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  getAllCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  getCategory(id: string): Category | undefined {
    return this.categories.get(id);
  }

  addCategory(category: Category): void {
    this.categories.set(category.id, category);
  }

  removeCategory(id: string): boolean {
    return this.categories.delete(id);
  }

  async categorizeWithContext(
    query: QueryRequest,
    context?: { preferredCategories?: string[] }
  ): Promise<Category[]> {
    const queryLower = query.query.toLowerCase();
    const matches: Array<{ category: Category; score: number }> = [];

    // Keywords for each category
    const categoryKeywords: Record<string, string[]> = {
      'travel-planning': [
        'trip', 'travel', 'visit', 'vacation', 'weekend', 'plan', 'itinerary',
        'destination', 'hotel', 'flight', 'booking', 'tour', 'sightseeing'
      ],
      'local-discovery': [
        'near me', 'nearby', 'local', 'around', 'happening', 'events',
        'restaurant', 'cafe', 'bar', 'shop', 'store', 'this weekend'
      ],
      'research': [
        'compare', 'vs', 'versus', 'difference', 'best', 'top', 'review',
        'analysis', 'evaluate', 'pros and cons', 'which', 'better'
      ],
      'maps-locations': [
        'where', 'location', 'address', 'directions', 'route', 'map',
        'navigate', 'distance', 'how to get'
      ],
    };

    // Score each category
    this.categories.forEach(category => {
      let score = 0;
      const keywords = categoryKeywords[category.id] || [];

      // Check keyword matches
      keywords.forEach(keyword => {
        if (queryLower.includes(keyword)) {
          score += 10;
        }
      });

      // Boost preferred categories
      if (context?.preferredCategories?.includes(category.id)) {
        score += 5;
      }

      // Add some randomness for variety
      score += Math.random() * 2;

      if (score > 0) {
        matches.push({ category, score });
      }
    });

    // Sort by score and return top matches
    matches.sort((a, b) => b.score - a.score);

    // If no matches, return text-search as default
    if (matches.length === 0) {
      const defaultCategory = this.categories.get('text-search');
      return defaultCategory ? [defaultCategory] : [];
    }

    return matches.slice(0, 3).map(m => m.category);
  }
}

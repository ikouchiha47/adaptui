/**
 * Query Router - Distributes sub-queries to appropriate services/plugins
 * Based on query decomposition from QueryProcessingService
 */

import { ProcessedQuery } from './QueryProcessingService';

export interface RoutedQueries {
  tasks: Array<{ id: string; query: string; purpose: string; priority: number; target: string }>;
  mainSearch: string[]; // Queries for main results (TravelService)
  pluginQueries: {
    neighborhood?: string[];
    transport?: string[];
    weather?: string[];
    [key: string]: string[] | undefined;
  };
  expansions: string[]; // Synonyms/variations to enrich main search
}

export class QueryRouter {
  /**
   * Route processed query to appropriate services
   * @param processed - Processed query with expansions/decomposition
   * @param availablePlugins - List of available plugin IDs (from CapabilityDetector)
   */
  static routeQuery(processed: ProcessedQuery, availablePlugins?: string[]): RoutedQueries {
    console.log('🚦 [QueryRouter] Routing queries to services...');
    if (availablePlugins) {
      console.log('🔌 [QueryRouter] Available plugins:', availablePlugins.join(', '));
    }

    const routed: RoutedQueries = {
      tasks: [],
      mainSearch: [processed.original],
      pluginQueries: {},
      expansions: [],
    };

    // 1. Route sub-queries from decomposition
    processed.decomposition.subQueries.forEach((sq, index) => {
      const target = this.identifyTarget(sq.query, sq.purpose, availablePlugins);
      
      routed.tasks.push({
        id: `task_${index}`,
        query: sq.query,
        purpose: sq.purpose,
        priority: sq.priority,
        target,
      });

      // Also add to plugin-specific queries
      if (target.startsWith('plugin:')) {
        const pluginName = target.replace('plugin:', '');
        if (!routed.pluginQueries[pluginName]) {
          routed.pluginQueries[pluginName] = [];
        }
        routed.pluginQueries[pluginName]!.push(sq.query);
      } else if (target === 'main') {
        routed.mainSearch.push(sq.query);
      }
    });

    // 2. Add high-value expansions to main search
    routed.expansions = processed.expansion.expanded.slice(0, 5); // Top 5 variations
    routed.expansions.push(...processed.expansion.relatedConcepts.slice(0, 3)); // Top 3 concepts

    // 3. Add related concepts to appropriate plugins
    this.routeRelatedConcepts(processed.expansion.relatedConcepts, routed);

    console.log(`✅ [QueryRouter] Routed to:`);
    console.log(`   - ${routed.tasks.length} tasks`);
    console.log(`   - ${routed.mainSearch.length} main search queries`);
    console.log(`   - ${Object.keys(routed.pluginQueries).length} plugins`);
    console.log(`   - ${routed.expansions.length} expansions`);

    return routed;
  }

  /**
   * Identify target service/plugin for a query
   * Only routes to plugins that are actually available
   */
  private static identifyTarget(query: string, purpose: string, availablePlugins?: string[]): string {
    const lowerQuery = query.toLowerCase();
    const lowerPurpose = purpose.toLowerCase();
    
    // Helper to check if plugin is available
    const hasPlugin = (pluginId: string) => 
      !availablePlugins || availablePlugins.includes(pluginId);

    // Ranking/filtering queries → Main (highest priority)
    if (lowerQuery.includes('rank') || lowerQuery.includes('filter') || 
        lowerQuery.includes('sort') || lowerQuery.includes('prioritize')) {
      return 'main';
    }

    // Airport/flight queries → TaskExecutor
    if (lowerQuery.includes('airport') && (lowerQuery.includes('iata') || lowerQuery.includes('code'))) {
      return 'task:airports';
    }

    if (lowerQuery.includes('flight') || lowerQuery.includes('airlines')) {
      return 'task:flights';
    }

    // Neighborhood/area queries → NeighborhoodPlugin (if available)
    if ((lowerQuery.includes('neighborhood') || lowerQuery.includes('district') || 
        lowerQuery.includes('area') || lowerPurpose.includes('neighborhood')) &&
        hasPlugin('neighborhood')) {
      return 'plugin:neighborhood';
    }

    // Transport queries → TransportPlugin (if available)
    if ((lowerQuery.includes('transport') || lowerQuery.includes('how to get') ||
        lowerPurpose.includes('transport') || lowerPurpose.includes('travel options')) &&
        hasPlugin('transport')) {
      return 'plugin:transport';
    }

    // Weather queries → WeatherPlugin (if available)
    if ((lowerQuery.startsWith('get') || lowerQuery.startsWith('fetch')) && 
        (lowerQuery.includes('weather') || lowerQuery.includes('forecast')) &&
        hasPlugin('weather')) {
      return 'plugin:weather';
    }

    // Opening hours, ratings, details → Main search
    if (lowerQuery.includes('opening hours') || lowerQuery.includes('rating') ||
        lowerQuery.includes('price') || lowerQuery.includes('highly rated')) {
      return 'main';
    }

    // Default: main search
    return 'main';
  }

  /**
   * Route related concepts to plugins
   */
  private static routeRelatedConcepts(concepts: string[], routed: RoutedQueries) {
    concepts.forEach(concept => {
      const lower = concept.toLowerCase();

      // Neighborhood-related
      if (lower.includes('district') || lower.includes('neighborhood') || 
          lower.includes('area') || lower.match(/\b(sukhumvit|thonglor|silom|khao san)\b/i)) {
        if (!routed.pluginQueries.neighborhood) {
          routed.pluginQueries.neighborhood = [];
        }
        routed.pluginQueries.neighborhood.push(concept);
      }

      // Transport-related
      if (lower.includes('airport') || lower.includes('flight') || 
          lower.includes('train') || lower.includes('bus')) {
        if (!routed.pluginQueries.transport) {
          routed.pluginQueries.transport = [];
        }
        routed.pluginQueries.transport.push(concept);
      }
    });
  }

  /**
   * Get queries for a specific target
   */
  static getQueriesForTarget(routed: RoutedQueries, target: string): string[] {
    if (target === 'main') {
      return [...routed.mainSearch, ...routed.expansions];
    }

    if (target.startsWith('plugin:')) {
      const pluginName = target.replace('plugin:', '');
      return routed.pluginQueries[pluginName] || [];
    }

    if (target.startsWith('task:')) {
      const taskType = target.replace('task:', '');
      return routed.tasks
        .filter(t => t.target === target)
        .map(t => t.query);
    }

    return [];
  }
}

/**
 * Enrichment Coordinator - Adds contextual insights to search results
 * Avoids duplication with plugin data
 */

import { RoutedQueries } from './QueryRouter';

export interface EnrichmentPlan {
  needsAreaNamesForExpansion: boolean; // Lightweight: just area names for query expansion
  needsPlaceSummaries: boolean; // Only if user wants summaries (opt-in)
  reason: string;
}

export class EnrichmentCoordinator {
  /**
   * Determine what enrichments are needed based on routed queries
   * Philosophy: Don't waste API calls. Only enrich what's explicitly needed.
   */
  static planEnrichment(routed: RoutedQueries, userPreferences?: { wantSummaries?: boolean }): EnrichmentPlan {
    const hasNeighborhoodPlugin = routed.pluginQueries.neighborhood && 
                                   routed.pluginQueries.neighborhood.length > 0;
    
    // Area names for query expansion: Only if we DON'T have neighborhood plugin
    // This is lightweight - just get area names, not full insights
    const needsAreaNamesForExpansion = !hasNeighborhoodPlugin;
    
    // Place summaries: Only if user explicitly wants them (opt-in)
    const needsPlaceSummaries = userPreferences?.wantSummaries || false;

    let reason = 'Enrichment: ';
    if (needsAreaNamesForExpansion) {
      reason += 'Area names for expansion (lightweight), ';
    } else {
      reason += 'Skip area names (neighborhood plugin active), ';
    }
    if (needsPlaceSummaries) {
      reason += 'Place summaries (user opted in)';
    } else {
      reason += 'Skip summaries (not requested)';
    }

    return {
      needsAreaNamesForExpansion,
      needsPlaceSummaries,
      reason,
    };
  }

  /**
   * Get enrichment queries for PlacesInsightsService
   */
  static getInsightQueries(
    originalQuery: string,
    routed: RoutedQueries,
    plan: EnrichmentPlan
  ): string[] {
    const queries: string[] = [];

    if (plan.needsAreaSummary) {
      // Extract location from main search queries
      const locationQuery = routed.mainSearch[0]; // Original query
      queries.push(`area insights for ${locationQuery}`);
    }

    if (plan.needsPlaceInsights) {
      // Use top main search queries for place summaries
      queries.push(...routed.mainSearch.slice(0, 3));
    }

    return queries;
  }

  /**
   * Log enrichment plan
   */
  static logPlan(plan: EnrichmentPlan) {
    console.log('📊 [Enrichment] Planning enrichment (zero-waste approach)...');
    console.log(`   Area Names (for expansion): ${plan.needsAreaNamesForExpansion ? '✅ Lightweight' : '❌ Skip'}`);
    console.log(`   Place Summaries: ${plan.needsPlaceSummaries ? '✅ User opted in' : '❌ Not requested'}`);
    console.log(`   ${plan.reason}`);
  }
}

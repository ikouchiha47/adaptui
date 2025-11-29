/**
 * LLM-based Re-ranker
 * Uses a fast LLM (gpt-5-mini, gemini-2.5-flash) to intelligently re-rank places
 */

import { configManager } from '../../config/ConfigManager';
import { LLMProvider } from '../../core/LLMProvider';
import { LLMProviderFactory } from '../../core/LLMProviderFactory';
import { PlaceRanker, RankingContext } from './PlaceRanker';

export interface RerankerConfig {
  provider: 'openai' | 'gemini' | 'anthropic';
  model: string; // e.g., 'gpt-5-mini', 'gemini-2.5-flash'
  enabled: boolean;
}

export class LLMReranker implements PlaceRanker {
  private llm: LLMProvider;
  private config: RerankerConfig;

  constructor(config?: Partial<RerankerConfig>) {
    // Get config from ConfigManager or use defaults
    const defaultConfig: RerankerConfig = {
      provider: 'openai',
      model: 'gpt-5-mini',
      enabled: true,
    };

    // Try to load from config.json
    const configFromFile = configManager.getConfig();
    const rerankerConfig = (configFromFile as any)?.reranker;

    this.config = {
      ...defaultConfig,
      ...rerankerConfig,
      ...config,
    };

    // Initialize LLM provider (always use the default for now)
    // TODO: Support provider-specific initialization
    this.llm = LLMProviderFactory.getProvider();
  }

  async rank(places: any[], context: RankingContext): Promise<any[]> {
    if (!this.config.enabled || !context.originalQuery) {
      console.log('[LLMReranker] Disabled or no query, skipping');
      return places;
    }

    if (places.length === 0) {
      return places;
    }

    console.log(`🤖 [LLMReranker] Re-ranking ${places.length} places with ${this.config.model}...`);

    try {
      // Prepare place summaries for LLM
      const placeSummaries = places.map((place, idx) => ({
        index: idx,
        name: place.name || 'Unknown',
        types: place.types || place.primaryType || [],
        rating: place.rating || 0,
        reviewCount: place.userRatingsTotal || place.user_ratings_total || 0,
        description: place.generativeSummary?.overview || place.editorialSummary?.overview || '',
        foundBy: place.foundBy || '',
      }));

      const prompt = `You are a search relevance expert. Re-rank these places based on how well they match the user's query.

User Query: "${context.originalQuery}"

Places to rank:
${placeSummaries.map((p, i) => `
${i + 1}. ${p.name}
   Types: ${Array.isArray(p.types) ? p.types.join(', ') : p.types}
   Rating: ${p.rating} (${p.reviewCount} reviews)
   Found by: ${p.foundBy}
   ${p.description ? `Description: ${p.description.substring(0, 150)}` : ''}
`).join('\n')}

CRITICAL RULES:
1. Prioritize places whose TYPE matches the query's main intent
   - If query is "bars in Bangkok", prioritize places with type "bar"
   - If query is "temples in Tokyo", prioritize places with type "temple"
2. Consider rating and review count as secondary factors
3. Boost places found by queries that closely match the original query
4. Penalize places that don't match the query intent at all

Return JSON with re-ranked indices (0-based):
{
  "rankedIndices": [2, 5, 1, 0, 3, 4],
  "reasoning": "Brief explanation of top 3 choices"
}

The rankedIndices array should contain all ${places.length} indices in order of relevance (most relevant first).`;

      const response = await this.llm.generateJSON(prompt, 0.3);
      const result = JSON.parse(response);

      if (!result.rankedIndices || !Array.isArray(result.rankedIndices)) {
        console.warn('[LLMReranker] Invalid response, returning original order');
        return places;
      }

      // Validate indices
      const validIndices = result.rankedIndices.filter(
        (idx: number) => idx >= 0 && idx < places.length
      );

      if (validIndices.length !== places.length) {
        console.warn('[LLMReranker] Missing indices, returning original order');
        return places;
      }

      // Re-order places
      const reranked = validIndices.map((idx: number) => places[idx]);

      console.log('✅ [LLMReranker] Re-ranking complete');
      console.log(`   Reasoning: ${result.reasoning}`);
      console.log(`   Top 3: ${reranked.slice(0, 3).map((p: any) => p.name).join(', ')}`);

      return reranked;
    } catch (error) {
      console.error('❌ [LLMReranker] Error:', error);
      return places; // Fallback to original order
    }
  }
}

/**
 * Hybrid ranker that combines keyword ranking with LLM re-ranking
 */
export class HybridLLMRanker implements PlaceRanker {
  private keywordRanker: PlaceRanker;
  private llmReranker: LLMReranker;

  constructor(keywordRanker: PlaceRanker, rerankerConfig?: Partial<RerankerConfig>) {
    this.keywordRanker = keywordRanker;
    this.llmReranker = new LLMReranker(rerankerConfig);
  }

  async rank(places: any[], context: RankingContext): Promise<any[]> {
    // Step 1: Fast keyword-based ranking
    console.log('🔍 [HybridLLMRanker] Step 1: Keyword ranking...');
    const keywordRankedResult = this.keywordRanker.rank(places, context);
    const keywordRanked = await Promise.resolve(keywordRankedResult); // Handle both sync and async

    // Step 2: LLM re-ranking on top candidates
    console.log('🤖 [HybridLLMRanker] Step 2: LLM re-ranking...');
    const topCandidates = keywordRanked.slice(0, 20); // Only re-rank top 20
    const rest = keywordRanked.slice(20);

    const reranked = await this.llmReranker.rank(topCandidates, context);

    return [...reranked, ...rest];
  }
}

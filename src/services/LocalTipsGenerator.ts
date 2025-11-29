// Local Tips Generator - ACTIONABLE local tips (HOW to experience, not WHERE to go)
//
// DIFFERENCE FROM RESULTS TAB:
// - Results: WHERE to go (restaurants, attractions, hotels)
// - LocalTips: HOW to experience (transport tips, food customs, safety, money, etiquette)
//
// DATA SOURCES:
// - LLM: Generates tip categories and initial tips
// - Google Places: Validates tips with real place data (e.g., "tuk tuk" → actual tuk tuk stands)
// - DDG: Gets real-world advice from travel blogs/forums

import { LLMProvider } from '../core/LLMProvider';
import { LLMProviderFactory } from '../core/LLMProviderFactory';
import { DDGScraperService } from './DDGScraperService';
import { GooglePlacesSummaryService } from './GooglePlacesSummaryService';

export interface LocalTip {
  category: 'transport' | 'food' | 'customs' | 'safety' | 'money';
  tip: string;           // The actionable tip
  source: 'llm' | 'google' | 'ddg';
  details: string;       // Supporting details
}

export class LocalTipsGenerator {
  private googleSummary = new GooglePlacesSummaryService();
  private ddgScraper = new DDGScraperService();
  private llmCore: LLMProvider | null = null;

  constructor() {
    try {
      this.llmCore = LLMProviderFactory.getProvider();
    } catch (error) {
      console.warn('[LocalTips] LLM core initialization failed:', error);
    }
  }

  /**
   * Generate actionable local tips using LLM
   */
  async generateTips(city: string, location?: { lat: number; lon: number }): Promise<LocalTip[]> {
    console.log('[LocalTips] Generating actionable tips for:', city);

    if (!this.llmCore) {
      console.warn('[LocalTips] No LLM available, returning empty');
      return [];
    }

    // Step 1: LLM generates actionable tips
    const prompt = `You are a local expert in ${city}. Generate 5 ACTIONABLE tips for travelers.

Focus on HOW to experience the city, NOT where to go:
- Transport: How to get around (e.g., "Use tuk tuks, negotiate price before riding")
- Food: Eating customs (e.g., "Street food is safe, look for busy stalls")
- Customs: Local etiquette (e.g., "Remove shoes before entering temples")
- Safety: What to watch out for (e.g., "Avoid unofficial taxis at airport")
- Money: Payment tips (e.g., "Bargaining expected at markets, start at 50%")

Return JSON array:
[
  {"category": "transport", "tip": "actionable tip here"},
  {"category": "food", "tip": "actionable tip here"},
  ...
]`;

    try {
      const response = await this.llmCore.generateText(prompt);
      console.log('[LocalTips] LLM response length:', response.length);
      console.log('[LocalTips] LLM response preview:', response.substring(0, 300));

      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('[LocalTips] Could not parse LLM response as JSON');
        console.log('[LocalTips] Full response:', response);
        return [];
      }

      const llmTips = JSON.parse(jsonMatch[0]);
      console.log('[LocalTips] Parsed tips:', { count: llmTips.length, tips: llmTips });

      // Step 2: Enrich tips with real data
      const enrichedTips: LocalTip[] = [];
      
      for (const llmTip of llmTips) {
        const enriched = await this.enrichTip(llmTip, city, location);
        enrichedTips.push(enriched);
      }

      return enrichedTips;
    } catch (error) {
      console.error('[LocalTips] Generation failed:', error);
      return [];
    }
  }

  /**
   * Enrich LLM tip with real data from Google/DDG
   */
  private async enrichTip(
    llmTip: { category: string; tip: string }, 
    city: string, 
    location?: { lat: number; lon: number }
  ): Promise<LocalTip> {
    console.log('[LocalTips] Enriching tip:', llmTip.tip);

    // Extract key terms from tip for searching
    const searchQuery = this.extractSearchQuery(llmTip.tip, city);
    console.log('[LocalTips] Search query:', searchQuery);

    try {
      // Parallel fetch from Google and DDG
      const [googleResults, ddgResults] = await Promise.all([
        this.googleSummary.getPlaceSummaries(searchQuery, location).catch(() => []),
        this.ddgScraper.search(searchQuery).catch(() => [])
      ]);

      // Combine additional context (don't duplicate the tip itself)
      const additionalContext: string[] = [];
      
      if (googleResults.length > 0 && googleResults[0].generativeSummary) {
        additionalContext.push(googleResults[0].generativeSummary);
      }
      
      if (ddgResults.length > 0 && ddgResults[0].snippet) {
        additionalContext.push(ddgResults[0].snippet);
      }

      return {
        category: llmTip.category as any,
        tip: llmTip.tip,
        source: 'llm',
        details: additionalContext.length > 0 ? additionalContext.join(' • ') : `Source: Local knowledge`
      };
    } catch (error) {
      console.error('[LocalTips] Enrichment failed:', error);
      return {
        category: llmTip.category as any,
        tip: llmTip.tip,
        source: 'llm',
        details: `Source: Local knowledge`
      };
    }
  }

  /**
   * Extract search query from tip
   * Example: "Use tuk tuks, negotiate price" → "tuk tuk bangkok"
   */
  private extractSearchQuery(tip: string, city: string): string {
    const keywords = [
      'tuk tuk', 'taxi', 'metro', 'train', 'bus', 'rickshaw',
      'street food', 'market', 'temple', 'mosque', 'church',
      'bargain', 'negotiate', 'tip', 'payment'
    ];

    for (const keyword of keywords) {
      if (tip.toLowerCase().includes(keyword)) {
        return `${keyword} ${city}`;
      }
    }

    // Fallback: first 3 words + city
    const words = tip.split(' ').slice(0, 3).join(' ');
    return `${words} ${city}`;
  }
}

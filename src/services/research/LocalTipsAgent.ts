// Local Tips Agent - Scrapes Reddit, forums, blogs for local insights

import { BaseResearchAgent, ResearchStep, TrustedSite } from './BaseResearchAgent';

export interface LocalTip {
  source: string;
  tip: string;
  category: 'transport' | 'safety' | 'food' | 'culture' | 'money' | 'general';
  confidence: number;
}

export class LocalTipsAgent extends BaseResearchAgent {
  
  getTrustedSites(): TrustedSite[] {
    return [
      { name: 'Reddit Travel', domain: 'old.reddit.com', types: ['tips', 'advice'], priority: 9 },
      { name: 'Lonely Planet Forum', domain: 'lonelyplanet.com', types: ['tips', 'advice'], priority: 8 },
      { name: 'TripAdvisor Forum', domain: 'tripadvisor.com', types: ['tips', 'reviews'], priority: 7 },
      { name: 'Nomad List', domain: 'nomadlist.com', types: ['tips', 'cost'], priority: 6 },
    ];
  }

  generateSearchUrl(site: TrustedSite, query: string, params?: any): string {
    const { destination, topic } = params || {};
    const searchQuery = `${destination} ${topic || 'tips advice'}`;
    
    switch (site.domain) {
      case 'old.reddit.com':
        // Search r/travel, r/solotravel, r/backpacking
        return `https://old.reddit.com/r/travel/search?q=${encodeURIComponent(searchQuery)}&restrict_sr=on&sort=top`;
      
      case 'lonelyplanet.com':
        return `https://www.lonelyplanet.com/thorntree/search?q=${encodeURIComponent(searchQuery)}`;
      
      case 'tripadvisor.com':
        return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(searchQuery)}`;
      
      case 'nomadlist.com':
        const citySlug = destination.toLowerCase().replace(/\s+/g, '-');
        return `https://nomadlist.com/${citySlug}`;
      
      default:
        return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}+site:${site.domain}`;
    }
  }
  
  extractData(html: string, site: TrustedSite): any {
    const tips: LocalTip[] = [];
    
    // Extract tips based on site
    if (site.domain === 'old.reddit.com') {
      tips.push(...this.extractRedditTips(html));
    }
    
    return {
      tips,
      hasResults: tips.length > 0
    };
  }
  
  aggregateResults(steps: ResearchStep[]): any {
    const allTips: LocalTip[] = [];
    
    for (const step of steps) {
      if (step.status === 'complete' && step.data?.tips) {
        allTips.push(...step.data.tips);
      }
    }
    
    // Group by category
    const byCategory = allTips.reduce((acc, tip) => {
      if (!acc[tip.category]) acc[tip.category] = [];
      acc[tip.category].push(tip);
      return acc;
    }, {} as Record<string, LocalTip[]>);
    
    return {
      totalTips: allTips.length,
      byCategory,
      topTips: allTips.slice(0, 10)
    };
  }
  
  /**
   * Extract tips from Reddit HTML
   */
  private extractRedditTips(html: string): LocalTip[] {
    const tips: LocalTip[] = [];
    
    // Look for common tip patterns
    const patterns = [
      /avoid\s+([^.!?]+)/gi,
      /don't\s+([^.!?]+)/gi,
      /always\s+([^.!?]+)/gi,
      /never\s+([^.!?]+)/gi,
      /tip:\s*([^.!?]+)/gi,
      /pro tip:\s*([^.!?]+)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const tip = match[1].trim();
        if (tip.length > 10 && tip.length < 200) {
          tips.push({
            source: 'Reddit',
            tip,
            category: this.categorizeTip(tip),
            confidence: 0.7
          });
        }
      }
    }
    
    return tips.slice(0, 5); // Top 5 tips per site
  }
  
  /**
   * Categorize a tip
   */
  private categorizeTip(tip: string): LocalTip['category'] {
    const lower = tip.toLowerCase();
    
    if (lower.includes('taxi') || lower.includes('bus') || lower.includes('train') || lower.includes('uber')) {
      return 'transport';
    }
    if (lower.includes('safe') || lower.includes('danger') || lower.includes('scam') || lower.includes('avoid')) {
      return 'safety';
    }
    if (lower.includes('food') || lower.includes('restaurant') || lower.includes('eat')) {
      return 'food';
    }
    if (lower.includes('price') || lower.includes('cost') || lower.includes('money') || lower.includes('bargain')) {
      return 'money';
    }
    if (lower.includes('culture') || lower.includes('custom') || lower.includes('tradition')) {
      return 'culture';
    }
    
    return 'general';
  }
}

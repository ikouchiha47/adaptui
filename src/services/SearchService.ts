// Search service for validating places using DuckDuckGo and Reddit

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export class SearchService {
  async searchDDG(query: string): Promise<SearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodedQuery}`);
      const html = await response.text();
      
      // Parse HTML to extract results
      const results = this.parseDDGResults(html);
      return results.slice(0, 5); // Top 5 results
    } catch (error) {
      console.error('DDG search error:', error);
      return [];
    }
  }

  async searchReddit(query: string): Promise<SearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://old.reddit.com/search.json?q=${encodedQuery}&limit=5`);
      const data = await response.json();
      
      return data.data.children.map((child: any) => ({
        title: child.data.title,
        snippet: child.data.selftext?.substring(0, 200) || '',
        url: `https://reddit.com${child.data.permalink}`
      }));
    } catch (error) {
      console.error('Reddit search error:', error);
      return [];
    }
  }

  private parseDDGResults(html: string): SearchResult[] {
    // Simple regex-based parsing (in production, use a proper HTML parser)
    const results: SearchResult[] = [];
    
    // Extract result blocks
    const resultRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
    const snippetRegex = /<a class="result__snippet"[^>]*>([^<]*)<\/a>/g;
    
    let match;
    const urls: string[] = [];
    const titles: string[] = [];
    
    while ((match = resultRegex.exec(html)) !== null) {
      urls.push(match[1]);
      titles.push(match[2]);
    }
    
    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1]);
    }
    
    for (let i = 0; i < Math.min(urls.length, titles.length); i++) {
      results.push({
        url: urls[i],
        title: titles[i],
        snippet: snippets[i] || ''
      });
    }
    
    return results;
  }
}

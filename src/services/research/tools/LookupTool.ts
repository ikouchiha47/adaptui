// Lookup Tool - Search within already-scraped content
// Useful for follow-up queries without re-scraping

import { AgentContext, Tool } from '../ReActAgent';

export class LookupTool implements Tool {
  name = 'lookup';
  description = 'Search for specific information within previously scraped content. Input: search term or question';

  async execute(input: string, context: AgentContext): Promise<string> {
    try {
      // Get all scraped content from memory
      const scrapedEntries = await context.memory.getAll(context.agentId, 'data');
      
      if (scrapedEntries.length === 0) {
        return 'No scraped content available. Use scrape_url first.';
      }

      // Search through scraped content
      const results: string[] = [];
      const searchTerm = input.toLowerCase();

      for (const entry of scrapedEntries) {
        if (entry.key.startsWith('scraped_')) {
          const content = entry.value;
          
          // Find paragraphs containing the search term
          const paragraphs = content.split('\n').filter(p => p.length > 50);
          const matches = paragraphs.filter(p => 
            p.toLowerCase().includes(searchTerm)
          );

          if (matches.length > 0) {
            results.push(...matches.slice(0, 3)); // Top 3 matches per source
          }
        }
      }

      if (results.length === 0) {
        return `No matches found for "${input}" in scraped content.`;
      }

      // Return top 5 results
      return results.slice(0, 5)
        .map((r, i) => `Result ${i + 1}: ${r.substring(0, 200)}...`)
        .join('\n\n');

    } catch (error: any) {
      return `Lookup error: ${error.message}`;
    }
  }
}

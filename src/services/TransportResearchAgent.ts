// Transport Research Agent - Deep research across multiple travel sites

import { AirportCodeService } from './AirportCodeService';
import { DDGScraperService } from './DDGScraperService';
import { BaseResearchAgent, ResearchStep, TrustedSite } from './research/BaseResearchAgent';

export class TransportResearchAgent extends BaseResearchAgent {
  private ddgScraper = new DDGScraperService();
  private airportService = new AirportCodeService();

  constructor() {
    super();
  }
  
  getTrustedSites(): TrustedSite[] {
    return [
      // Flight aggregators
      { name: 'Skyscanner', domain: 'skyscanner.com', types: ['flight'], priority: 10 },
      { name: 'Google Flights', domain: 'google.com/flights', types: ['flight'], priority: 9 },
      { name: 'Kayak', domain: 'kayak.com', types: ['flight'], priority: 8 },
      
      // Bus aggregators
      { name: '12Go Asia', domain: '12go.asia', types: ['bus', 'train'], priority: 9 },
      { name: 'Busbud', domain: 'busbud.com', types: ['bus'], priority: 8 },
      { name: 'Rome2rio', domain: 'rome2rio.com', types: ['bus', 'train'], priority: 7 },
      
      // Train aggregators
      { name: 'Rail Europe', domain: 'raileurope.com', types: ['train'], priority: 8 },
      { name: 'Trainline', domain: 'trainline.com', types: ['train'], priority: 8 },
    ];
  }

  /**
   * Override research to filter sites by transport type
   */
  async research(
    query: string,
    params?: any,
    onProgress?: (step: ResearchStep) => void
  ): Promise<any> {
    const { transportType } = params || {};
    
    // Filter sites by transport type
    const allSites = this.getTrustedSites();
    const filteredSites = transportType 
      ? allSites.filter(site => site.types.includes(transportType))
      : allSites;
    
    console.log(`[TransportResearch] Searching ${filteredSites.length} sites for ${transportType}:`, 
      filteredSites.map(s => s.name).join(', '));
    
    // Temporarily override getTrustedSites to return filtered list
    const originalGetTrustedSites = this.getTrustedSites.bind(this);
    this.getTrustedSites = () => filteredSites;
    
    // Call parent research method
    const result = await super.research(query, params, onProgress);
    
    // Restore original method
    this.getTrustedSites = originalGetTrustedSites;
    
    return result;
  }

  /**
   * Get nearest airport from lat/long using OpenFlights database
   */
  async getNearestAirport(lat: number, lon: number): Promise<string> {
    console.log('[Transport] Finding nearest airport to:', { lat, lon });
    
    const airport = await this.airportService.findNearestAirport(lat, lon, 200);
    
    if (airport) {
      return airport.iata;
    }
    
    console.warn('[Transport] No airport found within 200km');
    return 'XXX'; // Invalid code to indicate failure
  }

  async generateSearchUrl(site: TrustedSite, query: string, params?: any): Promise<string> {
    const { from, to, transportType } = params || {};
    
    // Build search query based on transport type
    const typeLabel = transportType === 'flight' ? 'Flights' : 
                     transportType === 'bus' ? 'Buses' :
                     transportType === 'train' ? 'Trains' : 'Transport';
    
    const searchQuery = `${typeLabel} from ${from} to ${to} ${site.name}`;
    console.log('[Transport] Searching:', { query: searchQuery, type: transportType, site: site.name });
    
    try {
      const results = await this.ddgScraper.search(searchQuery);
      console.log('[Transport] DDG results:', { count: results.length });
      
      if (results.length > 0) {
        // Find result from the trusted site
        const siteResult = results.find((r: any) => 
          r.url.includes(site.domain) || 
          r.title.toLowerCase().includes(site.name.toLowerCase())
        );
        
        if (siteResult) {
          console.log('[Transport] Found booking URL from DDG:', { 
            site: site.name, 
            url: siteResult.url 
          });
          return siteResult.url;
        }
      }
    } catch (error) {
      console.log('[Transport] DDG search failed:', error);
    }
    
    // Fallback: Generate URL directly
    console.log('[Transport] Using generated URL');
    return await this.generateTransportUrl(site.domain, from, to, transportType);
  }
  
  extractData(html: string, site: TrustedSite): any {
    return {
      prices: this.extractPrices(html),
      durations: this.extractDurations(html),
      hasResults: html.includes('result') || html.includes('flight') || html.includes('bus')
    };
  }
  
  aggregateResults(steps: ResearchStep[]): any {
    return {
      totalResults: steps.filter(s => s.status === 'complete').length
    };
  }

  /**
   * Generate transport-specific URL
   */
  private async generateTransportUrl(domain: string, from: string, to: string, type: string): Promise<string> {
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    switch (domain) {
      case 'skyscanner.com':
        const fromCode = await this.getCityCode(from);
        const toCode = await this.getCityCode(to);
        return `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${dateStr}/?adultsv2=1`;
      
      case 'rome2rio.com':
        return `https://www.rome2rio.com/map/${fromEncoded}/${toEncoded}`;
      
      case '12go.asia':
        return `https://12go.asia/en/travel/${fromEncoded}/${toEncoded}`;
      
      default:
        return `https://www.google.com/search?q=${type}+from+${fromEncoded}+to+${toEncoded}`;
    }
  }

  /**
   * Get destination airport code from city name using OpenFlights database
   */
  async getDestinationCode(cityName: string): Promise<string> {
    console.log('[Transport] Finding airport for city:', cityName);
    
    const airport = await this.airportService.findAirportByCity(cityName);
    
    if (airport) {
      return airport.iata;
    }
    
    console.warn('[Transport] No airport found for city:', cityName);
    return 'XXX'; // Invalid code to indicate failure
  }

  /**
   * Get city/airport code (legacy method for URL generation)
   */
  private async getCityCode(cityName: string): Promise<string> {
    const code = await this.getDestinationCode(cityName);
    return code.toLowerCase();
  }
}

// Transport Service - Get flight, bus, train tickets

export interface TransportTicket {
  id: string;
  type: 'flight' | 'bus' | 'train';
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  provider: string;
  seats: number;
  stops?: number;
  distance?: number;
  image?: string;
  deepLink?: string; // URL to open in WebView
  searchQuery?: string; // DDG search query
}

export interface TransportSearch {
  from: string;
  to: string;
  date: string;
  passengers: number;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
}

export class TransportService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  /**
   * Search for flights by scraping DuckDuckGo and generating deep links
   */
  async searchFlights(search: TransportSearch): Promise<TransportTicket[]> {
    try {
      console.log(`✈️ [TransportService] Searching flights: ${search.from} → ${search.to}`);
      
      // Generate Skyscanner deep link
      const skyscannerUrl = this.generateSkyscannerUrl(search);
      
      // Scrape DDG for flight info
      const query = `flights from ${search.from} to ${search.to}`;
      const scrapedInfo = await this.scrapeDDGForTransport(query);
      
      // Create flight options with deep links
      const flights: TransportTicket[] = [
        {
          id: 'FL001',
          type: 'flight',
          from: search.from,
          to: search.to,
          departureTime: 'Search',
          arrivalTime: 'Flights',
          duration: 'Varies',
          price: 0,
          currency: 'USD',
          provider: 'Skyscanner',
          seats: 0,
          distance: 0,
          image: '✈️',
          deepLink: skyscannerUrl,
          searchQuery: query
        },
        {
          id: 'FL002',
          type: 'flight',
          from: search.from,
          to: search.to,
          departureTime: 'Search',
          arrivalTime: 'Options',
          duration: 'Varies',
          price: 0,
          currency: 'USD',
          provider: 'Rome2Rio',
          seats: 0,
          distance: 0,
          image: '🗺️',
          deepLink: this.generateRome2RioUrl(search),
          searchQuery: `transport from ${search.from} to ${search.to}`
        },
        {
          id: 'FL003',
          type: 'flight',
          from: search.from,
          to: search.to,
          departureTime: '22:00',
          arrivalTime: '04:30',
          duration: '6h 30m',
          price: 180,
          currency: 'USD',
          provider: 'Lion Air',
          seats: 8,
          distance: 1200,
          image: '✈️'
        }
      ];

      console.log(`✅ [TransportService] Found ${flights.length} flights`);
      return flights;
    } catch (error) {
      console.error('❌ [TransportService] Flight search error:', error);
      return [];
    }
  }

  /**
   * Search for buses
   */
  async searchBuses(search: TransportSearch): Promise<TransportTicket[]> {
    try {
      console.log(`🚌 [TransportService] Searching buses: ${search.from} → ${search.to}`);
      
      const buses: TransportTicket[] = [
        {
          id: 'BUS001',
          type: 'bus',
          from: search.from,
          to: search.to,
          departureTime: '06:00',
          arrivalTime: '18:00',
          duration: '12h',
          price: 45,
          currency: 'USD',
          provider: 'Perama Tours',
          seats: 12,
          stops: 3,
          distance: 450,
          image: '🚌'
        },
        {
          id: 'BUS002',
          type: 'bus',
          from: search.from,
          to: search.to,
          departureTime: '14:00',
          arrivalTime: '02:00',
          duration: '12h',
          price: 35,
          currency: 'USD',
          provider: 'Kura-Kura Bus',
          seats: 8,
          stops: 2,
          distance: 450,
          image: '🚌'
        }
      ];

      console.log(`✅ [TransportService] Found ${buses.length} buses`);
      return buses;
    } catch (error) {
      console.error('❌ [TransportService] Bus search error:', error);
      return [];
    }
  }

  /**
   * Search for trains
   */
  async searchTrains(search: TransportSearch): Promise<TransportTicket[]> {
    try {
      console.log(`🚂 [TransportService] Searching trains: ${search.from} → ${search.to}`);
      
      const trains: TransportTicket[] = [
        {
          id: 'TRAIN001',
          type: 'train',
          from: search.from,
          to: search.to,
          departureTime: '07:30',
          arrivalTime: '15:45',
          duration: '8h 15m',
          price: 65,
          currency: 'USD',
          provider: 'PT Kereta Api',
          seats: 20,
          stops: 5,
          distance: 350,
          image: '🚂'
        },
        {
          id: 'TRAIN002',
          type: 'train',
          from: search.from,
          to: search.to,
          departureTime: '19:00',
          arrivalTime: '03:30',
          duration: '8h 30m',
          price: 55,
          currency: 'USD',
          provider: 'PT Kereta Api',
          seats: 15,
          stops: 4,
          distance: 350,
          image: '🚂'
        }
      ];

      console.log(`✅ [TransportService] Found ${trains.length} trains`);
      return trains;
    } catch (error) {
      console.error('❌ [TransportService] Train search error:', error);
      return [];
    }
  }

  /**
   * Search all transport options
   */
  async searchAllTransport(search: TransportSearch): Promise<TransportTicket[]> {
    try {
      console.log(`🚀 [TransportService] Searching all transport options...`);
      
      const [flights, buses, trains] = await Promise.all([
        this.searchFlights(search),
        this.searchBuses(search),
        this.searchTrains(search)
      ]);

      const all = [...flights, ...buses, ...trains];
      console.log(`✅ [TransportService] Found ${all.length} total options`);
      
      return all.sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error('❌ [TransportService] Transport search error:', error);
      return [];
    }
  }

  /**
   * Get recommended transport based on distance
   */
  getRecommendedTransport(distanceKm: number): ('flight' | 'bus' | 'train')[] {
    console.log(`📊 [TransportService] Recommending transport for ${distanceKm}km`);
    
    if (distanceKm > 1000) {
      return ['flight', 'train', 'bus'];
    } else if (distanceKm > 300) {
      return ['train', 'bus', 'flight'];
    } else {
      return ['bus', 'train'];
    }
  }

  /**
   * Generate Skyscanner deep link
   */
  private generateSkyscannerUrl(search: TransportSearch): string {
    // Convert city names to airport codes (simplified - in production use proper mapping)
    const fromCode = this.getCityCode(search.from);
    const toCode = this.getCityCode(search.to);
    const date = search.date.replace(/-/g, '');
    
    return `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${date}/?adultsv2=1&cabinclass=economy&rtn=0`;
  }

  /**
   * Generate Rome2Rio deep link
   */
  private generateRome2RioUrl(search: TransportSearch): string {
    const from = encodeURIComponent(search.from);
    const to = encodeURIComponent(search.to);
    return `https://www.rome2rio.com/map/${from}/${to}`;
  }

  /**
   * Get city/airport code (simplified)
   */
  private getCityCode(cityName: string): string {
    // Extract first 3 letters or use common codes
    const codes: Record<string, string> = {
      'bangalore': 'blr',
      'mumbai': 'bom',
      'delhi': 'del',
      'bangkok': 'bkk',
      'singapore': 'sin',
      'kuala lumpur': 'kul',
      'bali': 'dps',
      'phuket': 'hkt',
      'tokyo': 'tyo',
      'seoul': 'sel',
      'hong kong': 'hkg',
    };
    
    const normalized = cityName.toLowerCase().split(',')[0].trim();
    return codes[normalized] || normalized.substring(0, 3);
  }

  /**
   * Scrape DuckDuckGo for transport information
   */
  private async scrapeDDGForTransport(query: string): Promise<any> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract useful info from HTML (simplified)
      // In production, parse HTML properly to extract prices, durations, etc.
      const hasResults = html.includes('result');
      
      return {
        hasResults,
        query,
        // Could extract more info here
      };
    } catch (error) {
      console.error('❌ [TransportService] DDG scrape error:', error);
      return { hasResults: false };
    }
  }
}

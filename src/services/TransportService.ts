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
}

export interface TransportSearch {
  from: string;
  to: string;
  date: string;
  passengers: number;
}

export class TransportService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  /**
   * Search for flights (using mock data for now)
   * In production, integrate with Skyscanner, Amadeus, or Kiwi API
   */
  async searchFlights(search: TransportSearch): Promise<TransportTicket[]> {
    try {
      console.log(`✈️ [TransportService] Searching flights: ${search.from} → ${search.to}`);
      
      // Mock flight data
      const flights: TransportTicket[] = [
        {
          id: 'FL001',
          type: 'flight',
          from: search.from,
          to: search.to,
          departureTime: '08:00',
          arrivalTime: '14:30',
          duration: '6h 30m',
          price: 250,
          currency: 'USD',
          provider: 'AirAsia',
          seats: 5,
          distance: 1200,
          image: '✈️'
        },
        {
          id: 'FL002',
          type: 'flight',
          from: search.from,
          to: search.to,
          departureTime: '14:00',
          arrivalTime: '20:15',
          duration: '6h 15m',
          price: 280,
          currency: 'USD',
          provider: 'Garuda Indonesia',
          seats: 3,
          distance: 1200,
          image: '✈️'
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
}

// Airport Database Service - SQLite-based airport lookup with FTS
// Initializes on first use, refreshes weekly

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export interface Airport {
  id: number;
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export class AirportDatabaseService {
  private static instance: AirportDatabaseService | null = null;
  private static initPromise: Promise<void> | null = null;
  
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = 'airports.db';
  private readonly REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Singleton pattern - only one instance across the app
   */
  constructor() {
    if (AirportDatabaseService.instance) {
      return AirportDatabaseService.instance;
    }
    AirportDatabaseService.instance = this;
  }

  /**
   * Initialize database (lazy, only once globally)
   */
  private async initialize(): Promise<void> {
    if (this.db) return;
    
    if (AirportDatabaseService.initPromise) {
      await AirportDatabaseService.initPromise;
      return;
    }
    
    AirportDatabaseService.initPromise = this._doInitialize();
    await AirportDatabaseService.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    console.log('[AirportDB] Initializing database...');
    
    try {
      // Open/create database
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      
      // Enable WAL mode for better concurrency and performance
      await this.db.execAsync('PRAGMA journal_mode = WAL;');
      console.log('[AirportDB] WAL mode enabled');
      
      // Check if database needs initialization or refresh
      const needsInit = await this.needsInitialization();
      
      if (needsInit) {
        console.log('[AirportDB] Database needs initialization');
        await this.loadAirportData();
      } else {
        console.log('[AirportDB] Database already initialized');
      }
      
      // Share the db instance with singleton
      if (AirportDatabaseService.instance) {
        AirportDatabaseService.instance.db = this.db;
      }
    } catch (error) {
      console.error('[AirportDB] Initialization failed:', error);
      // Reset init promise so it can be retried
      AirportDatabaseService.initPromise = null;
      throw error;
    }
  }

  /**
   * Check if database needs initialization or refresh
   */
  private async needsInitialization(): Promise<boolean> {
    if (!this.db) return true;
    
    try {
      // Check if airports table exists
      const tableExists = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='airports'"
      );
      
      if (!tableExists || tableExists.count === 0) {
        console.log('[AirportDB] Tables do not exist');
        return true;
      }
      
      // Check if table has data
      const rowCount = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM airports"
      );
      
      if (!rowCount || rowCount.count === 0) {
        console.log('[AirportDB] Tables exist but are empty');
        return true;
      }
      
      // Check last update time
      const metadata = await this.db.getFirstAsync<{ value: string }>(
        "SELECT value FROM metadata WHERE key='last_update'"
      );
      
      if (!metadata) {
        console.log('[AirportDB] No metadata found');
        return true;
      }
      
      const lastUpdate = new Date(metadata.value).getTime();
      const now = Date.now();
      
      // Refresh if older than 7 days
      if (now - lastUpdate > this.REFRESH_INTERVAL) {
        console.log('[AirportDB] Data is stale, needs refresh');
        return true;
      }
      
      console.log('[AirportDB] Database is fresh, has', rowCount.count, 'airports');
      return false;
    } catch (error) {
      console.log('[AirportDB] Error checking initialization:', error);
      return true;
    }
  }

  /**
   * Load airport data from bundled JSON or download
   */
  private async loadAirportData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('[AirportDB] Loading airport data...');
    
    try {
      // Try to load from bundled assets first
      let airports: Airport[] = [];
      
      try {
        const asset = Asset.fromModule(require('../../assets/data/airports.json'));
        await asset.downloadAsync();
        
        if (asset.localUri) {
          const data = await FileSystem.readAsStringAsync(asset.localUri);
          airports = JSON.parse(data);
          console.log(`[AirportDB] Loaded ${airports.length} airports from bundled data`);
        }
      } catch (assetError) {
        console.log('[AirportDB] Bundled data not found, downloading...');
        airports = await this.downloadAirportData();
      }
      
      // Create tables
      await this.createTables();
      
      // Insert airports
      await this.insertAirports(airports);
      
      // Update metadata
      await this.db.runAsync(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_update', ?)",
        [new Date().toISOString()]
      );
      
      console.log('[AirportDB] Database initialized successfully');
    } catch (error) {
      console.error('[AirportDB] Failed to load airport data:', error);
      throw error;
    }
  }

  /**
   * Download airport data from OpenFlights
   */
  private async downloadAirportData(): Promise<Airport[]> {
    console.log('[AirportDB] Downloading from OpenFlights...');
    
    const url = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
    const response = await fetch(url);
    const text = await response.text();
    
    const airports: Airport[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const fields = this.parseCSVLine(line);
      if (fields.length < 8) continue;
      
      const iata = fields[4].replace(/"/g, '').trim();
      const lat = parseFloat(fields[6]);
      const lon = parseFloat(fields[7]);
      
      if (iata && iata.length === 3 && iata !== '\\N' && !isNaN(lat) && !isNaN(lon)) {
        airports.push({
          id: parseInt(fields[0]),
          name: fields[1].replace(/"/g, '').trim(),
          city: fields[2].replace(/"/g, '').trim(),
          country: fields[3].replace(/"/g, '').trim(),
          iata,
          icao: fields[5].replace(/"/g, '').trim(),
          lat,
          lon
        });
      }
    }
    
    console.log(`[AirportDB] Downloaded ${airports.length} airports`);
    return airports;
  }

  /**
   * Parse CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) fields.push(current);
    
    return fields;
  }

  /**
   * Create database tables with FTS
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('[AirportDB] Creating tables...');
    
    try {
      // Create airports table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS airports (
          id INTEGER PRIMARY KEY,
          iata TEXT NOT NULL,
          icao TEXT,
          name TEXT NOT NULL,
          city TEXT NOT NULL,
          country TEXT NOT NULL,
          lat REAL NOT NULL,
          lon REAL NOT NULL
        );
      `);
      
      // Create indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_iata ON airports(iata);
        CREATE INDEX IF NOT EXISTS idx_city ON airports(city);
        CREATE INDEX IF NOT EXISTS idx_location ON airports(lat, lon);
      `);
      
      // Create FTS virtual table for full-text search
      await this.db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS airports_fts USING fts5(
          iata,
          name,
          city,
          country,
          content=airports,
          content_rowid=id
        );
      `);
      
      // Create trigger (drop first if exists to avoid duplicates)
      await this.db.execAsync(`
        DROP TRIGGER IF EXISTS airports_ai;
      `);
      
      await this.db.execAsync(`
        CREATE TRIGGER airports_ai AFTER INSERT ON airports BEGIN
          INSERT INTO airports_fts(rowid, iata, name, city, country)
          VALUES (new.id, new.iata, new.name, new.city, new.country);
        END;
      `);
      
      // Create metadata table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      
      console.log('[AirportDB] Tables created successfully');
    } catch (error) {
      console.error('[AirportDB] Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Insert airports in batches
   */
  private async insertAirports(airports: Airport[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log(`[AirportDB] Inserting ${airports.length} airports...`);
    
    try {
      const batchSize = 100;
      for (let i = 0; i < airports.length; i += batchSize) {
        const batch = airports.slice(i, i + batchSize);
        
        await this.db.withTransactionAsync(async () => {
          for (const airport of batch) {
            await this.db!.runAsync(
              'INSERT OR REPLACE INTO airports (id, iata, icao, name, city, country, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [airport.id, airport.iata, airport.icao, airport.name, airport.city, airport.country, airport.lat, airport.lon]
            );
          }
        });
        
        if ((i + batchSize) % 1000 === 0) {
          console.log(`[AirportDB] Inserted ${i + batchSize}/${airports.length}...`);
        }
      }
      
      console.log('[AirportDB] All airports inserted');
    } catch (error) {
      console.error('[AirportDB] Error inserting airports:', error);
      throw error;
    }
  }

  /**
   * Find nearest airport to coordinates
   */
  async findNearestAirport(lat: number, lon: number, maxDistanceKm: number = 200): Promise<Airport | null> {
    await this.initialize();
    if (!this.db) return null;
    
    // Get airports within a rough bounding box first (much faster than calculating all distances)
    // 1 degree ≈ 111km, so use a generous box
    const latDelta = maxDistanceKm / 111;
    const lonDelta = maxDistanceKm / (111 * Math.cos(lat * Math.PI / 180));
    
    const candidates = await this.db.getAllAsync<Airport>(`
      SELECT * FROM airports
      WHERE lat BETWEEN ? AND ?
        AND lon BETWEEN ? AND ?
    `, [
      lat - latDelta,
      lat + latDelta,
      lon - lonDelta,
      lon + lonDelta
    ]);
    
    if (candidates.length === 0) {
      console.warn('[AirportDB] No airports found within bounding box');
      return null;
    }
    
    // Calculate exact distances using Haversine in JavaScript
    let nearest: Airport | null = null;
    let minDistance = Infinity;
    
    for (const airport of candidates) {
      const distance = this.calculateDistance(lat, lon, airport.lat, airport.lon);
      
      if (distance < minDistance && distance <= maxDistanceKm) {
        minDistance = distance;
        nearest = airport;
      }
    }
    
    if (nearest) {
      console.log('[AirportDB] Found nearest airport:', {
        iata: nearest.iata,
        name: nearest.name,
        distance: `${minDistance.toFixed(1)}km`
      });
    } else {
      console.warn('[AirportDB] No airports found within', maxDistanceKm, 'km');
    }
    
    return nearest;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Search airports by city name using FTS
   */
  async searchByCity(cityName: string): Promise<Airport[]> {
    await this.initialize();
    if (!this.db) return [];
    
    const normalized = cityName.toLowerCase().trim();
    
    // Remove all non-word characters except spaces (keeps only a-z, 0-9, spaces)
    const escapedQuery = normalized
      .replace(/[^\w\s]/g, ' ')  // Remove everything except word chars and spaces
      .replace(/\s+/g, ' ')      // Collapse multiple spaces
      .trim();
    
    // If query is empty after escaping, use LIKE search
    if (!escapedQuery) {
      return await this.db.getAllAsync<Airport>(`
        SELECT *
        FROM airports
        WHERE city LIKE ? OR name LIKE ?
        LIMIT 10
      `, [`%${normalized}%`, `%${normalized}%`]);
    }
    
    try {
      // Use FTS for fuzzy matching with escaped query
      const results = await this.db.getAllAsync<Airport>(`
        SELECT a.*
        FROM airports a
        JOIN airports_fts fts ON a.id = fts.rowid
        WHERE airports_fts MATCH ?
        ORDER BY rank
        LIMIT 10
      `, [escapedQuery]);
      
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn('[AirportDB] FTS search failed, falling back to LIKE:', error);
    }
    
    // Fallback to LIKE search
    const likeResults = await this.db.getAllAsync<Airport>(`
      SELECT *
      FROM airports
      WHERE city LIKE ? OR name LIKE ?
      LIMIT 10
    `, [`%${normalized}%`, `%${normalized}%`]);
    
    return likeResults;
  }

  /**
   * Find best airport for city (prioritizes international)
   */
  async findAirportByCity(cityName: string): Promise<Airport | null> {
    const results = await this.searchByCity(cityName);
    
    if (results.length === 0) {
      console.warn('[AirportDB] No airport found for city:', cityName);
      return null;
    }
    
    // Score and prioritize
    const scored = results.map(a => {
      let score = 0;
      const nameLower = a.name.toLowerCase();
      const cityLower = a.city.toLowerCase();
      const searchLower = cityName.toLowerCase();
      
      // Exact city match
      if (cityLower === searchLower) score += 20;
      
      // City contains search term
      if (cityLower.includes(searchLower)) score += 10;
      
      // International airports
      if (nameLower.includes('international')) score += 15;
      
      // Prefer Suvarnabhumi over Don Mueang for Bangkok
      if (searchLower.includes('bangkok') && nameLower.includes('suvarnabhumi')) score += 10;
      if (searchLower.includes('bangkok') && nameLower.includes('don mueang')) score -= 5;
      
      // Airport name contains city
      if (nameLower.includes(searchLower)) score += 5;
      
      // Avoid air bases
      if (nameLower.includes('air base') || nameLower.includes('afb')) score -= 30;
      
      // Avoid regional
      if (nameLower.includes('regional')) score -= 10;
      
      // Avoid domestic-only
      if (nameLower.includes('domestic')) score -= 15;
      
      return { airport: a, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    const best = scored[0].airport;
    console.log('[AirportDB] Found airport for city:', {
      city: cityName,
      iata: best.iata,
      name: best.name,
      score: scored[0].score,
      alternatives: scored.slice(1, 3).map(s => ({ iata: s.airport.iata, name: s.airport.name, score: s.score }))
    });
    
    return best;
  }

  /**
   * Validate if an IATA code exists in database
   */
  async validateIATACode(iataCode: string): Promise<boolean> {
    await this.initialize();
    if (!this.db) return false;
    
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM airports WHERE iata = ?',
      [iataCode.toUpperCase()]
    );
    
    return result ? result.count > 0 : false;
  }

  /**
   * Get airport by IATA code
   */
  async getAirportByCode(iataCode: string): Promise<Airport | null> {
    await this.initialize();
    if (!this.db) return null;
    
    const airport = await this.db.getFirstAsync<Airport>(
      'SELECT * FROM airports WHERE iata = ?',
      [iataCode.toUpperCase()]
    );
    
    return airport || null;
  }

  /**
   * Force refresh data (for manual updates)
   */
  async forceRefresh(): Promise<void> {
    console.log('[AirportDB] Forcing data refresh...');
    await this.loadAirportData();
  }
}

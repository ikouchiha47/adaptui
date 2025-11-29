#!/usr/bin/env tsx
/**
 * Build Airport Database
 * Downloads OpenFlights data and creates SQLite database with FTS
 * Run this during build or manually: npx tsx scripts/build-airport-db.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../assets/data');
const AIRPORTS_CSV = path.join(DATA_DIR, 'airports.dat');
const COUNTRIES_CSV = path.join(DATA_DIR, 'countries.dat');

interface Airport {
  id: number;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  lat: number;
  lon: number;
}

interface Country {
  name: string;
  iso: string;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) fields.push(current.replace(/^"|"$/g, ''));
  
  return fields;
}

async function buildDatabase() {
  console.log('🛫 Building Airport Database...\n');
  
  // Create data directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Download airports data
  console.log('📥 Downloading airports data...');
  await downloadFile(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
    AIRPORTS_CSV
  );
  console.log('✓ Downloaded airports.dat');
  
  // Download countries data
  console.log('📥 Downloading countries data...');
  await downloadFile(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/countries.dat',
    COUNTRIES_CSV
  );
  console.log('✓ Downloaded countries.dat');
  
  // Parse airports
  console.log('\n📊 Parsing airport data...');
  const airportsText = fs.readFileSync(AIRPORTS_CSV, 'utf-8');
  const airportLines = airportsText.split('\n').filter(l => l.trim());
  
  const airports: Airport[] = [];
  for (const line of airportLines) {
    const fields = parseCSVLine(line);
    if (fields.length < 8) continue;
    
    const iata = fields[4].trim();
    const lat = parseFloat(fields[6]);
    const lon = parseFloat(fields[7]);
    
    // Only include airports with valid IATA codes
    if (iata && iata.length === 3 && iata !== '\\N' && !isNaN(lat) && !isNaN(lon)) {
      airports.push({
        id: parseInt(fields[0]),
        name: fields[1].trim(),
        city: fields[2].trim(),
        country: fields[3].trim(),
        iata,
        icao: fields[5].trim(),
        lat,
        lon
      });
    }
  }
  
  console.log(`✓ Parsed ${airports.length} airports with valid IATA codes`);
  
  // Parse countries
  console.log('📊 Parsing countries data...');
  const countriesText = fs.readFileSync(COUNTRIES_CSV, 'utf-8');
  const countryLines = countriesText.split('\n').filter(l => l.trim());
  
  const countries: Country[] = [];
  for (const line of countryLines) {
    const fields = parseCSVLine(line);
    if (fields.length >= 2) {
      countries.push({
        name: fields[0].trim(),
        iso: fields[1].trim()
      });
    }
  }
  
  console.log(`✓ Parsed ${countries.length} countries`);
  
  // Create JSON files for app to load
  const airportsJson = path.join(DATA_DIR, 'airports.json');
  const countriesJson = path.join(DATA_DIR, 'countries.json');
  
  console.log('\n💾 Writing JSON files...');
  fs.writeFileSync(airportsJson, JSON.stringify(airports, null, 2));
  fs.writeFileSync(countriesJson, JSON.stringify(countries, null, 2));
  
  console.log(`✓ Wrote ${airportsJson}`);
  console.log(`✓ Wrote ${countriesJson}`);
  
  // Create metadata
  const metadata = {
    version: 1,
    buildDate: new Date().toISOString(),
    airportCount: airports.length,
    countryCount: countries.length,
    source: 'OpenFlights (https://github.com/jpatokal/openflights)'
  };
  
  const metadataJson = path.join(DATA_DIR, 'metadata.json');
  fs.writeFileSync(metadataJson, JSON.stringify(metadata, null, 2));
  console.log(`✓ Wrote ${metadataJson}`);
  
  console.log('\n✅ Airport database built successfully!');
  console.log(`   ${airports.length} airports`);
  console.log(`   ${countries.length} countries`);
  console.log(`   Size: ${(fs.statSync(airportsJson).size / 1024).toFixed(0)}KB`);
}

buildDatabase().catch(console.error);

# Airport Database Assets

This directory contains airport and country data from [OpenFlights](https://github.com/jpatokal/openflights).

## Files

### Bundled with App
- `airports.json` (1.2MB) - 6,072 airports with IATA codes
- `countries.json` (13KB) - 261 countries
- `metadata.json` - Build information

### Build Artifacts (not committed)
- `airports.dat` - Raw CSV from OpenFlights
- `countries.dat` - Raw CSV from OpenFlights

## Usage

These files are automatically loaded by `AirportDatabaseService` on first use to populate the SQLite database.

## Updating

To refresh the data:

```bash
npm run build-airport-db
```

This downloads the latest data from OpenFlights and regenerates the JSON files.

## Data Source

- **Source**: https://github.com/jpatokal/openflights
- **License**: Open Database License (ODbL)
- **Last Updated**: See `metadata.json`

## Size

- Total bundled: ~1.2MB
- Compressed in app: ~300KB (gzip)
- SQLite database: ~2MB on device

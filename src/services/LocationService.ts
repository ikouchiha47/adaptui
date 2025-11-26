// Location Service - Get device location and check permissions

import * as Location from 'expo-location';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  address?: string;
}

export interface LocationPermissions {
  foreground: boolean;
  background: boolean;
  canGetLocation: boolean;
}

export class LocationService {
  /**
   * Check location permissions
   */
  static async checkPermissions(): Promise<LocationPermissions> {
    try {
      console.log('🔍 [LocationService] Checking permissions...');
      
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      const permissions = {
        foreground: foreground.status === 'granted',
        background: background.status === 'granted',
        canGetLocation: foreground.status === 'granted'
      };

      console.log('✅ [LocationService] Permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('❌ [LocationService] Permission check error:', error);
      return {
        foreground: false,
        background: false,
        canGetLocation: false
      };
    }
  }

  /**
   * Request location permissions
   */
  static async requestPermissions(): Promise<LocationPermissions> {
    try {
      console.log('📍 [LocationService] Requesting permissions...');
      
      const foreground = await Location.requestForegroundPermissionsAsync();

      if (foreground.status === 'granted') {
        console.log('✅ [LocationService] Foreground permission granted');
        return {
          foreground: true,
          background: false,
          canGetLocation: true
        };
      } else {
        console.warn('⚠️ [LocationService] Permission denied');
        return {
          foreground: false,
          background: false,
          canGetLocation: false
        };
      }
    } catch (error) {
      console.error('❌ [LocationService] Permission request error:', error);
      return {
        foreground: false,
        background: false,
        canGetLocation: false
      };
    }
  }

  /**
   * Get current device location
   */
  static async getCurrentLocation(): Promise<DeviceLocation | null> {
    try {
      console.log('📍 [LocationService] Getting current location...');
      
      const permissions = await this.checkPermissions();
      
      if (!permissions.canGetLocation) {
        console.warn('⚠️ [LocationService] No location permission');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(`✅ [LocationService] Got location: ${location.coords.latitude}, ${location.coords.longitude}`);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('❌ [LocationService] Error getting location:', error);
      return null;
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  static async getAddressFromCoords(latitude: number, longitude: number): Promise<string | null> {
    try {
      console.log(`🗺️ [LocationService] Reverse geocoding: ${latitude}, ${longitude}`);
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const fullAddress = `${addr.city}, ${addr.region}, ${addr.country}`;
        console.log(`✅ [LocationService] Address: ${fullAddress}`);
        return fullAddress;
      }

      return null;
    } catch (error) {
      console.error('❌ [LocationService] Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Get coordinates from address (geocoding)
   */
  static async getCoordsFromAddress(address: string): Promise<DeviceLocation | null> {
    try {
      console.log(`🗺️ [LocationService] Geocoding: ${address}`);
      
      const results = await Location.geocodeAsync(address);

      if (results.length > 0) {
        const result = results[0];
        console.log(`✅ [LocationService] Geocoded: ${result.latitude}, ${result.longitude}`);
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy: 0,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [LocationService] Geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (in km)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

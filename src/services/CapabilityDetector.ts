// Capability Detector - Determine what features are available based on permissions

import { LocationPermissions, LocationService } from './LocationService';

export interface AppCapabilities {
  location: boolean;
  transport: boolean;
  photos: boolean;
  maps: boolean;
  notifications: boolean;
  camera: boolean;
  food: boolean;
  internet: boolean;
  advancedFeatures: boolean;
}

export interface CapabilityContext {
  capabilities: AppCapabilities;
  userLocation?: { latitude: number; longitude: number };
  permissions: LocationPermissions;
}

export class CapabilityDetector {
  /**
   * Detect all available capabilities
   */
  static async detectCapabilities(): Promise<CapabilityContext> {
    console.log('🔍 [CapabilityDetector] Detecting capabilities...');

    // Check location
    const permissions = await LocationService.checkPermissions();
    let userLocation = undefined;

    if (permissions.canGetLocation) {
      userLocation = await LocationService.getCurrentLocation();
    }

    const capabilities: AppCapabilities = {
      location: permissions.canGetLocation,
      transport: true, // ON by default
      photos: true, // Always available (Google Places)
      maps: true, // Always available (react-native-maps)
      notifications: true, // Can be enabled
      camera: false, // Not implemented yet
      food: false, // OFF by default
      internet: false, // OFF by default
      advancedFeatures: true, // ON by default
    };

    console.log('✅ [CapabilityDetector] Capabilities:', capabilities);

    return {
      capabilities,
      userLocation: userLocation || undefined,
      permissions
    };
  }

  /**
   * Request missing capabilities
   */
  static async requestCapabilities(needed: (keyof AppCapabilities)[]): Promise<CapabilityContext> {
    console.log('📍 [CapabilityDetector] Requesting capabilities:', needed);

    if (needed.includes('location') || needed.includes('transport')) {
      const permissions = await LocationService.requestPermissions();
      
      if (permissions.canGetLocation) {
        const userLocation = await LocationService.getCurrentLocation();
        return {
          capabilities: {
            location: true,
            transport: true,
            photos: true,
            maps: true,
            notifications: true,
            camera: false,
            food: false,
            internet: false,
            advancedFeatures: true,
          },
          userLocation: userLocation || undefined,
          permissions
        };
      }
    }

    return this.detectCapabilities();
  }

  /**
   * Get features available based on capabilities
   */
  static getAvailableFeatures(capabilities: AppCapabilities): string[] {
    const features: string[] = [];

    if (capabilities.location) {
      features.push('nearby-places');
      features.push('distance-calculation');
    }

    if (capabilities.transport) {
      features.push('flight-search');
      features.push('bus-search');
      features.push('train-search');
    }

    if (capabilities.photos) {
      features.push('place-photos');
      features.push('destination-images');
    }

    if (capabilities.maps) {
      features.push('map-view');
      features.push('location-markers');
    }

    console.log('✅ [CapabilityDetector] Available features:', features);
    return features;
  }

  /**
   * Generate LLM prompt based on capabilities
   */
  static generateCapabilityPrompt(capabilities: AppCapabilities, userLocation?: any): string {
    let prompt = `You are AdaptUI, an intelligent interface generator.

Available capabilities:
- Location services: ${capabilities.location ? '✅ YES' : '❌ NO'}
- Transport search: ${capabilities.transport ? '✅ YES' : '❌ NO'}
- Place photos: ${capabilities.photos ? '✅ YES' : '❌ NO'}
- Maps: ${capabilities.maps ? '✅ YES' : '❌ NO'}`;

    if (capabilities.location && userLocation) {
      prompt += `\n- User location: ${userLocation.latitude}, ${userLocation.longitude}`;
    }

    prompt += `

Based on these capabilities, generate UI that:
1. Shows location-based features if location is available
2. Includes transport options (flights, buses, trains) if transport is available
3. Displays place photos if available
4. Shows maps if available
5. Gracefully handles missing features`;

    return prompt;
  }
}

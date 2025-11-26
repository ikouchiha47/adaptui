// Street View Service - Get street view images from Google

export interface StreetViewImage {
  url: string;
  heading: number; // 0-360 degrees
  pitch: number; // -90 to 90 degrees
  fov: number; // Field of view
}

export class StreetViewService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/streetview';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get street view image URL
   */
  getStreetViewUrl(
    latitude: number,
    longitude: number,
    heading: number = 0,
    pitch: number = 0,
    fov: number = 90,
    width: number = 400,
    height: number = 300
  ): string {
    return `${this.baseUrl}?location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}&size=${width}x${height}&key=${this.apiKey}`;
  }

  /**
   * Get multiple street view angles
   */
  getMultipleAngles(
    latitude: number,
    longitude: number,
    width: number = 400,
    height: number = 300
  ): StreetViewImage[] {
    return [
      {
        url: this.getStreetViewUrl(latitude, longitude, 0, 0, 90, width, height),
        heading: 0,
        pitch: 0,
        fov: 90
      },
      {
        url: this.getStreetViewUrl(latitude, longitude, 90, 0, 90, width, height),
        heading: 90,
        pitch: 0,
        fov: 90
      },
      {
        url: this.getStreetViewUrl(latitude, longitude, 180, 0, 90, width, height),
        heading: 180,
        pitch: 0,
        fov: 90
      },
      {
        url: this.getStreetViewUrl(latitude, longitude, 270, 0, 90, width, height),
        heading: 270,
        pitch: 0,
        fov: 90
      }
    ];
  }

  /**
   * Get street view with upward angle
   */
  getStreetViewUp(
    latitude: number,
    longitude: number,
    width: number = 400,
    height: number = 300
  ): StreetViewImage {
    return {
      url: this.getStreetViewUrl(latitude, longitude, 0, 45, 90, width, height),
      heading: 0,
      pitch: 45,
      fov: 90
    };
  }

  /**
   * Get street view with downward angle
   */
  getStreetViewDown(
    latitude: number,
    longitude: number,
    width: number = 400,
    height: number = 300
  ): StreetViewImage {
    return {
      url: this.getStreetViewUrl(latitude, longitude, 0, -45, 90, width, height),
      heading: 0,
      pitch: -45,
      fov: 90
    };
  }
}

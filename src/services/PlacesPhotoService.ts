// Google Places Photo Service - Get high-quality images for places
import { GooglePlacesClient } from './GooglePlacesClient';

export interface PlacePhoto {
  url: string;
  attribution: string;
  width: number;
  height: number;
}

export interface PlaceDetails {
  photos: PlacePhoto[];
  rating?: number;
  isOpen?: boolean;
  openingHours?: string[];
}

export class PlacesPhotoService {
  private client: GooglePlacesClient;

  constructor(apiKey: string) {
    this.client = new GooglePlacesClient(apiKey);
  }

  /**
   * Search for a place and get its photo
   */
  async searchPlaceAndGetPhoto(query: string, maxWidth: number = 400): Promise<PlacePhoto | null> {
    try {
      console.log(`📸 [PlacesPhotoService] Searching for photo: ${query}`);
      
      // Text search to find the place
      const results = await this.client.textSearch(query);

      if (!results || results.length === 0) {
        console.warn(`⚠️ [PlacesPhotoService] No results found for: ${query}`);
        return null;
      }

      const place = results[0];
      console.log(`✅ [PlacesPhotoService] Found place: ${place.name}`);

      // Get details to get photos
      if (!place.place_id) {
        return null;
      }

      const details = await this.client.getPlaceDetails(place.place_id);

      if (!details?.photos || details.photos.length === 0) {
        console.warn(`⚠️ [PlacesPhotoService] No photos found for: ${query}`);
        return null;
      }

      const photo = details.photos[0];
      const photoUrl = this.client.getPhotoUrl(photo.photo_reference, maxWidth);

      console.log(`✅ [PlacesPhotoService] Got photo URL for: ${query}`);

      return {
        url: photoUrl,
        attribution: photo.html_attributions?.[0] || 'Google Places',
        width: photo.width,
        height: photo.height
      };
    } catch (error) {
      console.error(`❌ [PlacesPhotoService] Error:`, error);
      return null;
    }
  }

  /**
   * Get multiple photos for a place
   */
  async getPlacePhotos(query: string, maxPhotos: number = 3, maxWidth: number = 400): Promise<PlacePhoto[]> {
    const details = await this.getPlaceDetails(query, maxPhotos, maxWidth);
    return details.photos;
  }

  /**
   * Get place details including photos, rating, and opening hours
   */
  async getPlaceDetails(query: string, maxPhotos: number = 3, maxWidth: number = 400): Promise<PlaceDetails> {
    try {
      console.log(`📍 [PlacesPhotoService] Getting details for: ${query}`);
      
      const results = await this.client.textSearch(query);

      if (!results || results.length === 0) {
        return { photos: [] };
      }

      const place = results[0];
      const details = await this.client.getPlaceDetails(place.place_id);

      if (!details) {
        return { photos: [] };
      }

      const photos = details.photos?.slice(0, maxPhotos).map((photo: any) => ({
        url: this.client.getPhotoUrl(photo.photo_reference, maxWidth),
        attribution: photo.html_attributions?.[0] || 'Google Places',
        width: photo.width,
        height: photo.height
      })) || [];

      console.log(`✅ [PlacesPhotoService] Got ${photos.length} photos, rating: ${details.rating}, open: ${details.opening_hours?.open_now}`);
      
      return {
        photos,
        rating: details.rating,
        isOpen: details.opening_hours?.open_now,
        openingHours: details.opening_hours?.weekday_text
      };
    } catch (error) {
      console.error(`❌ [PlacesPhotoService] Error:`, error);
      return { photos: [] };
    }
  }

  /**
   * Get place details with all info (alias for backward compatibility)
   */
  async getPlaceInfo(query: string) {
    try {
      const results = await this.client.textSearch(query);
      if (!results || results.length === 0) return null;
      
      return await this.client.getPlaceDetails(results[0].place_id);
    } catch (error) {
      console.error(`❌ [PlacesPhotoService] Error:`, error);
      return null;
    }
  }
}

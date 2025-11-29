// Photo Grid Variant Component
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface PhotoGridVariantProps {
  photos: string[];
  variant: 'hero-left' | 'hero-right' | 'equal-row' | 'experimental' | 'horizontal' | 'split' | 'masonry';
  styleOverrides?: { gap?: number; borderRadius?: number; aspectRatio?: number };
}

export function PhotoGridVariant({ photos, variant, styleOverrides }: PhotoGridVariantProps) {
  const hasMore = photos.length > 3;
  
  // 🔍 DETAILED PHOTO URL LOGGING
  console.log('📸 [PhotoGridVariant] ========== START ==========');
  console.log('📸 [PhotoGridVariant] Received photos:', photos);
  console.log('📸 [PhotoGridVariant] Photos count:', photos?.length || 0);
  console.log('📸 [PhotoGridVariant] Variant:', variant);
  
  if (photos && photos.length > 0) {
    photos.forEach((url, idx) => {
      console.log(`📸 [PhotoGridVariant] Photo ${idx + 1}:`, url);
      console.log(`📸 [PhotoGridVariant] Photo ${idx + 1} type:`, typeof url);
      console.log(`📸 [PhotoGridVariant] Photo ${idx + 1} is valid URL:`, url?.startsWith('http'));
    });
  }
  
  // Map old names to new names for backwards compatibility
  const normalizedVariant = variant === 'split' ? 'hero-left' 
    : variant === 'masonry' ? 'hero-right'
    : variant === 'horizontal' ? 'equal-row'
    : variant;
  
  console.log(`📸 [PhotoGrid] Rendering variant: ${normalizedVariant} (${photos.length} photos)${styleOverrides ? ' with custom styles' : ''}`);
  
  if ((normalizedVariant === 'hero-left' || normalizedVariant === 'experimental') && photos.length >= 3) {
    return (
      <View style={styles.photoGridSplit}>
        <View style={styles.photoGridLeft}>
          <Image 
            source={{ uri: photos[0] }} 
            style={styles.photoGridLarge}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.photoGridRight}>
          <Image 
            source={{ uri: photos[1] }} 
            style={styles.photoGridSmall}
            resizeMode="cover"
          />
          <View style={styles.photoGridSmallContainer}>
            <Image 
              source={{ uri: photos[2] }} 
              style={styles.photoGridSmall}
              resizeMode="cover"
            />
            {hasMore && (
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
  
  if (normalizedVariant === 'hero-right' && photos.length >= 3) {
    return (
      <View style={styles.photoGridSplit}>
        <View style={styles.photoGridRight}>
          <Image 
            source={{ uri: photos[0] }} 
            style={styles.photoGridSmall}
            resizeMode="cover"
          />
          <Image 
            source={{ uri: photos[1] }} 
            style={styles.photoGridSmall}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.photoGridLeft}>
          <View style={styles.photoGridSmallContainer}>
            <Image 
              source={{ uri: photos[2] }} 
              style={styles.photoGridLarge}
              resizeMode="cover"
            />
            {hasMore && (
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
  
  // Default: Equal-row layout (3 equal photos)
  const gridStyle = normalizedVariant === 'experimental' && styleOverrides
    ? [styles.destinationPhotoGrid, { gap: styleOverrides.gap || 8 }]
    : styles.destinationPhotoGrid;
    
  return (
    <View style={gridStyle}>
      {photos.slice(0, 3).map((url: string, idx: number) => {
        const isLast = idx === 2;
        
        if (isLast && hasMore) {
          return (
            <View key={idx} style={styles.destinationPhoto}>
              <Image 
                source={{ uri: url }} 
                style={styles.destinationPhotoImage}
                resizeMode="cover"
              />
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            </View>
          );
        }
        
        return (
          <Image 
            key={idx}
            source={{ uri: url }} 
            style={styles.destinationPhoto}
            resizeMode="cover"
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  destinationPhotoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    height: 120,
  },
  destinationPhoto: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  destinationPhotoImage: {
    width: '100%',
    height: '100%',
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  photoGridSplit: {
    flexDirection: 'row',
    gap: 8,
    height: 200,
    marginBottom: 16,
  },
  photoGridLeft: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoGridRight: {
    flex: 1,
    gap: 8,
  },
  photoGridLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoGridSmall: {
    width: '100%',
    height: 96,
    borderRadius: 12,
  },
  photoGridSmallContainer: {
    position: 'relative',
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

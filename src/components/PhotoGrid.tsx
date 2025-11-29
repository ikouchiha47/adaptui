import React from 'react';
import { Dimensions, Image as RNImage, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PhotoGridProps {
  photos: string[];
  theme: any;
  onViewMore?: () => void;
}

const { width } = Dimensions.get('window');

export function PhotoGrid({ photos, theme, onViewMore }: PhotoGridProps) {
  // 🔍 DETAILED PHOTO URL LOGGING
  console.log('📸 [PhotoGrid] Received photos array:', photos);
  console.log('📸 [PhotoGrid] Photos count:', photos?.length || 0);
  if (photos && photos.length > 0) {
    photos.forEach((url, idx) => {
      console.log(`📸 [PhotoGrid] Photo ${idx + 1}:`, url);
      console.log(`📸 [PhotoGrid] Photo ${idx + 1} type:`, typeof url);
      console.log(`📸 [PhotoGrid] Photo ${idx + 1} length:`, url?.length);
    });
  }

  if (!photos || photos.length === 0) {
    console.log('⚠️ [PhotoGrid] No photos to display');
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={{ color: theme.text, opacity: 0.5 }}>📷 No photos available</Text>
      </View>
    );
  }

  // Show max 3 photos in grid
  const displayPhotos = photos.slice(0, 3);
  const remainingCount = photos.length - 3;
  
  console.log('📸 [PhotoGrid] Display photos:', displayPhotos);
  console.log('📸 [PhotoGrid] Remaining count:', remainingCount);

  if (displayPhotos.length === 1) {
    return (
      <View style={styles.container}>
        <RNImage source={{ uri: displayPhotos[0] }} style={styles.full} />
        {remainingCount > 0 && (
          <TouchableOpacity 
            style={[styles.moreButton, { backgroundColor: theme.primary }]} 
            onPress={onViewMore}
          >
            <Text style={styles.moreButtonText}>+{remainingCount} more photos</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (displayPhotos.length === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <RNImage source={{ uri: displayPhotos[0] }} style={styles.half} />
          <RNImage source={{ uri: displayPhotos[1] }} style={styles.half} />
        </View>
        {remainingCount > 0 && (
          <TouchableOpacity 
            style={[styles.moreButton, { backgroundColor: theme.primary }]} 
            onPress={onViewMore}
          >
            <Text style={styles.moreButtonText}>+{remainingCount} more photos</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 3 photos: 1 full + 2 halves
  return (
    <View style={styles.container}>
      <RNImage source={{ uri: displayPhotos[0] }} style={styles.full} />
      <View style={styles.row}>
        <RNImage source={{ uri: displayPhotos[1] }} style={styles.half} />
        <RNImage source={{ uri: displayPhotos[2] }} style={styles.half} />
      </View>
      {remainingCount > 0 && (
        <TouchableOpacity 
          style={[styles.moreButton, { backgroundColor: theme.primary }]} 
          onPress={onViewMore}
        >
          <Text style={styles.moreButtonText}>+{remainingCount} more photos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  full: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  half: {
    flex: 1,
    height: 120,
    resizeMode: 'cover',
  },
  placeholder: {
    height: 250,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  moreButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 2,
    borderRadius: 0,
  },
  moreButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
  },
});

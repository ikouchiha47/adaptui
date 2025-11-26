import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Modal, Image as RNImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PhotoDetailViewProps {
  photos: string[];
  streetViewUrls?: string[];
  theme: any;
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export function PhotoDetailView({ photos, streetViewUrls, theme, visible, onClose }: PhotoDetailViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStreetView, setShowStreetView] = useState(false);

  const allPhotos = showStreetView ? (streetViewUrls || []) : photos;
  const currentPhoto = allPhotos[currentIndex];

  const handleNext = () => {
    if (currentIndex < allPhotos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {showStreetView ? '🗺️ Street View' : '📷 Photos'}
          </Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Photo */}
        <View style={styles.photoContainer}>
          {currentPhoto && (
            <RNImage source={{ uri: currentPhoto }} style={styles.photo} />
          )}
        </View>

        {/* Counter */}
        <View style={[styles.counter, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.text }}>
            {currentIndex + 1} / {allPhotos.length}
          </Text>
        </View>

        {/* Navigation */}
        <View style={[styles.navigation, { backgroundColor: theme.surface }]}>
          <TouchableOpacity 
            onPress={handlePrev} 
            disabled={currentIndex === 0}
            style={styles.navButton}
          >
            <Ionicons 
              name="chevron-back" 
              size={28} 
              color={currentIndex === 0 ? theme.textSecondary : theme.primary} 
            />
          </TouchableOpacity>

          {/* Toggle Street View */}
          {streetViewUrls && streetViewUrls.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setShowStreetView(!showStreetView);
                setCurrentIndex(0);
              }}
              style={[styles.toggleButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.toggleText}>
                {showStreetView ? '📷 Photos' : '🗺️ Street View'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={handleNext}
            disabled={currentIndex === allPhotos.length - 1}
            style={styles.navButton}
          >
            <Ionicons 
              name="chevron-forward" 
              size={28} 
              color={currentIndex === allPhotos.length - 1 ? theme.textSecondary : theme.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Thumbnails */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.thumbnails, { backgroundColor: theme.surface }]}
        >
          {allPhotos.map((photo, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentIndex(idx)}
              style={[
                styles.thumbnail,
                idx === currentIndex && { borderColor: theme.primary, borderWidth: 2 }
              ]}
            >
              <RNImage source={{ uri: photo }} style={styles.thumbnailImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Orbitron_600SemiBold',
  },
  spacer: {
    width: 40,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  counter: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navButton: {
    padding: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Orbitron_600SemiBold',
  },
  thumbnails: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  thumbnail: {
    width: 80,
    height: 80,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

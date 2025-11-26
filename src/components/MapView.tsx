import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapLocation {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  type?: string;
}

interface MapViewComponentProps {
  locations: MapLocation[];
  theme: any;
  onMarkerPress?: (location: MapLocation) => void;
}

export function MapViewComponent({ locations, theme, onMarkerPress }: MapViewComponentProps) {
  const [fullScreenVisible, setFullScreenVisible] = useState(false);

  if (!locations || locations.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Text style={{ color: theme.text }}>📍 No locations to display</Text>
      </View>
    );
  }

  // Calculate region that fits all locations
  const calculateRegion = () => {
    if (locations.length === 1) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lats = locations.map(l => l.latitude);
    const lngs = locations.map(l => l.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.3,
      longitudeDelta: (maxLng - minLng) * 1.3,
    };
  };

  const initialRegion = calculateRegion();

  const MapContent = () => (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
    >
      {locations.map((location, idx) => (
        <Marker
          key={idx}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={location.name}
          description={location.description}
          onPress={() => onMarkerPress?.(location)}
          pinColor={location.type === 'restaurant' ? '#FF6B9D' : '#6366F1'}
        />
      ))}
    </MapView>
  );

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: theme.surface }]}
        onPress={() => setFullScreenVisible(true)}
        activeOpacity={0.9}
      >
        <MapContent />
        <View style={styles.expandButton}>
          <Ionicons name="expand" size={20} color={theme.text} />
        </View>
      </TouchableOpacity>

      {/* Full Screen Map Modal */}
      <Modal visible={fullScreenVisible} transparent animationType="fade">
        <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.fullScreenHeader, { backgroundColor: theme.surface }]}>
            <TouchableOpacity onPress={() => setFullScreenVisible(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: theme.text }]}>
              🗺️ {locations.length} Locations
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <MapContent />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  fullScreenTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_600SemiBold',
  },
});

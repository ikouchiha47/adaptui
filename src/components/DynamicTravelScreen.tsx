import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';
import { ComponentRenderer } from '../ui-engine/ComponentRenderer';

const { width, height } = Dimensions.get('window');

interface DynamicTravelScreenProps {
  theme: any;
  onBack: () => void;
}

export function DynamicTravelScreen({ theme, onBack }: DynamicTravelScreenProps) {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const [location, setLocation] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [uiSchema, setUiSchema] = React.useState<any>(null);
  const [capabilities, setCapabilities] = React.useState<any>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Initialize capabilities
    initCapabilities();
  }, [slideAnim]);

  const initCapabilities = async () => {
    try {
      const { CapabilityDetector } = await import('../services/CapabilityDetector');
      const caps = await CapabilityDetector.detectCapabilities();
      setCapabilities(caps);
      console.log('✅ [DynamicTravelScreen] Capabilities initialized:', caps.capabilities);
    } catch (error) {
      console.error('❌ [DynamicTravelScreen] Failed to init capabilities:', error);
    }
  };

  const handleSearch = async () => {
    if (!location.trim()) return;
    
    setIsSearching(true);
    console.log('🔍 [DynamicTravelScreen] Searching for:', location);
    
    try {
      // Step 1: Get travel recommendations with photos
      console.log('📊 [DynamicTravelScreen] Step 1: Fetching travel data...');
      const { TravelService } = await import('../services/TravelService');
      const travelService = new TravelService();
      
      const recommendations = await travelService.generateRecommendations({
        location: location.trim(),
        useRealData: true // Get photos from Google Places
      });
      
      console.log(`✅ [DynamicTravelScreen] Got ${recommendations.length} recommendations`);
      console.log('📸 [DynamicTravelScreen] Photos:', recommendations[0]?.highlights[0]?.photoUrls?.length || 0);
      
      // Step 2: Generate dynamic UI schema with capability context
      console.log('🎨 [DynamicTravelScreen] Step 2: Generating UI schema...');
      const { UIGenerator } = await import('../ui-engine/UIGenerator');
      const { SchemaValidator } = await import('../ui-engine/SchemaValidator');
      
      const generator = new UIGenerator();
      const validator = new SchemaValidator();
      
      const deviceContext = {
        dimensions: { width, height, scale: 1 },
        platform: 'ios' as const,
        orientation: 'portrait' as const,
        safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
      };
      
      const query = `Show travel recommendations for ${location.trim()} with photos, map, and experiences`;
      
      // Pass capabilities and data to LLM
      const schema = await generator.generateUI(query, deviceContext, capabilities, recommendations);
      const validSchema = validator.validate(schema);
      
      console.log('✅ [DynamicTravelScreen] UI schema generated:', validSchema.id);
      console.log('📊 [DynamicTravelScreen] Components:', validSchema.components.length);
      
      // Step 3: Bind data to schema
      console.log('🔗 [DynamicTravelScreen] Step 3: Binding data to schema...');
      const boundSchema = bindDataToSchema(validSchema, recommendations);
      
      setUiSchema(boundSchema);
      setIsSearching(false);
      
      console.log('✅ [DynamicTravelScreen] Dynamic UI ready!');
      
    } catch (error) {
      console.error('❌ [DynamicTravelScreen] Search error:', error);
      setIsSearching(false);
    }
  };

  const handleAction = (actionId: string, params?: any) => {
    console.log('🎬 [DynamicTravelScreen] Action:', actionId, params);
    // Handle actions like navigation, filtering, etc.
  };

  // Darker background - blend with dark theme
  const bgColor = theme.planets.travel[0];
  const accentColor = theme.planets.travel[1];
  const darkBg = `hsl(200, 40%, 15%)`; // Dark blue-ish

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: darkBg,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* SVG Landscape Background */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Distant Mountains */}
        <Polygon
          points={`0,${height * 0.6} ${width * 0.3},${height * 0.4} ${width * 0.6},${height * 0.6}`}
          fill={accentColor}
          opacity={0.15}
        />
        <Polygon
          points={`${width * 0.4},${height * 0.6} ${width * 0.7},${height * 0.35} ${width},${height * 0.6}`}
          fill={accentColor}
          opacity={0.12}
        />
        
        {/* Rolling Hills */}
        <Path
          d={`M 0 ${height * 0.75} Q ${width * 0.25} ${height * 0.7} ${width * 0.5} ${height * 0.75} T ${width} ${height * 0.75} L ${width} ${height} L 0 ${height} Z`}
          fill={accentColor}
          opacity={0.2}
        />
        <Path
          d={`M 0 ${height * 0.85} Q ${width * 0.3} ${height * 0.8} ${width * 0.6} ${height * 0.85} T ${width} ${height * 0.85} L ${width} ${height} L 0 ${height} Z`}
          fill={accentColor}
          opacity={0.25}
        />
        
        {/* Tree silhouettes */}
        <Polygon
          points={`${width * 0.15},${height * 0.82} ${width * 0.12},${height * 0.75} ${width * 0.18},${height * 0.82}`}
          fill={accentColor}
          opacity={0.3}
        />
        <Polygon
          points={`${width * 0.75},${height * 0.88} ${width * 0.72},${height * 0.8} ${width * 0.78},${height * 0.88}`}
          fill={accentColor}
          opacity={0.3}
        />
        <Polygon
          points={`${width * 0.85},${height * 0.9} ${width * 0.83},${height * 0.84} ${width * 0.87},${height * 0.9}`}
          fill={accentColor}
          opacity={0.25}
        />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.screenContent} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: `${accentColor}30`, borderWidth: 1, borderColor: `${accentColor}50` }]}
          >
            <Text style={[styles.backButtonText, { color: theme.text }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>
              Dynamic Travel UI
            </Text>
            <Text style={[styles.subtitle, { color: `${theme.text}80` }]}>
              LLM-Generated Layout
            </Text>
          </View>
          
          <View style={styles.searchContainer}>
            <Text style={[styles.searchLabel, { color: theme.text, opacity: 0.8 }]}>Where to?</Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}40`,
                    color: theme.text,
                  },
                ]}
                placeholder="Tokyo, Paris, Bali..."
                placeholderTextColor={`${theme.text}60`}
                value={location}
                onChangeText={setLocation}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                onPress={handleSearch}
                disabled={!location.trim() || isSearching}
                activeOpacity={0.7}
                style={[
                  styles.searchButton,
                  {
                    backgroundColor: location.trim() ? `${accentColor}90` : `${accentColor}30`,
                    borderWidth: 1,
                    borderColor: location.trim() ? accentColor : `${accentColor}40`,
                  },
                ]}
              >
                {isSearching ? (
                  <ActivityIndicator color={theme.text} size="small" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color={theme.text} />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick suggestions */}
            <View style={styles.suggestionsRow}>
              {['Tokyo', 'Paris', 'Bali'].map((city) => (
                <TouchableOpacity
                  key={city}
                  onPress={() => setLocation(city)}
                  style={[styles.suggestionChip, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }]}
                >
                  <Text style={[styles.suggestionText, { color: theme.text }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Capability Status */}
          {capabilities && (
            <View style={[styles.capabilityBox, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
              <Text style={[styles.capabilityTitle, { color: theme.text }]}>
                🔧 Available Features
              </Text>
              <View style={styles.capabilityGrid}>
                <CapabilityBadge label="Photos" enabled={capabilities.capabilities.photos} theme={theme} />
                <CapabilityBadge label="Maps" enabled={capabilities.capabilities.maps} theme={theme} />
                <CapabilityBadge label="Location" enabled={capabilities.capabilities.location} theme={theme} />
                <CapabilityBadge label="Transport" enabled={capabilities.capabilities.transport} theme={theme} />
              </View>
            </View>
          )}

          {/* Dynamic UI Rendering */}
          {uiSchema && (
            <View style={styles.dynamicContainer}>
              <ComponentRenderer schema={uiSchema} onAction={handleAction} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

function CapabilityBadge({ label, enabled, theme }: { label: string; enabled: boolean; theme: any }) {
  return (
    <View style={[styles.capabilityBadge, { 
      backgroundColor: enabled ? '#10B98120' : '#EF444420',
      borderColor: enabled ? '#10B981' : '#EF4444'
    }]}>
      <Text style={[styles.capabilityBadgeText, { color: enabled ? '#10B981' : '#EF4444' }]}>
        {enabled ? '✓' : '✗'} {label}
      </Text>
    </View>
  );
}

/**
 * Bind actual data to the schema components
 */
function bindDataToSchema(schema: any, data: any[]): any {
  // Clone schema
  const boundSchema = JSON.parse(JSON.stringify(schema));
  
  // Find list components and bind data
  const bindComponent = (component: any) => {
    if (component.type === 'list' && !component.props.items) {
      component.props.items = data;
    }
    
    // Recursively bind children
    if (component.children) {
      component.children.forEach(bindComponent);
    }
  };
  
  boundSchema.components.forEach(bindComponent);
  
  return boundSchema;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_600SemiBold',
  },
  headerContainer: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 32,
    fontFamily: 'Orbitron_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    marginTop: 4,
  },
  searchContainer: {
    marginTop: 20,
  },
  searchLabel: {
    fontSize: 18,
    fontFamily: 'Orbitron_500Medium',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
    borderWidth: 2,
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Orbitron_500Medium',
  },
  capabilityBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  capabilityTitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
    marginBottom: 12,
  },
  capabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  capabilityBadgeText: {
    fontSize: 12,
    fontFamily: 'Orbitron_600SemiBold',
  },
  dynamicContainer: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

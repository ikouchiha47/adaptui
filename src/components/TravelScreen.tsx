import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';
import { PriceFormatter } from '../utils/priceFormatter';
import { MapViewComponent } from './MapView';
import { PhotoDetailView } from './PhotoDetailView';
import { PhotoGrid } from './PhotoGrid';

const { width, height } = Dimensions.get('window');

interface TravelScreenProps {
  theme: any;
  onBack: () => void;
  initialData?: any[];
  analysis?: any;
}

export function TravelScreen({ theme, onBack, initialData, analysis }: TravelScreenProps) {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const [location, setLocation] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [uiSchema, setUiSchema] = React.useState<any>(null);
  const [photoDetailVisible, setPhotoDetailVisible] = React.useState(false);
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleSearch = async () => {
    if (!location.trim()) return;
    
    setIsSearching(true);
    console.log('Searching for:', location);
    
    try {
      // Step 1: Get travel recommendations
      const { TravelService } = await import('../services/TravelService');
      const travelService = new TravelService();
      
      const recommendations = await travelService.generateRecommendations({
        location: location.trim(),
        useRealData: false
      });
      
      console.log('✅ [TravelScreen] Got recommendations:', recommendations.length);
      
      // Step 2: Generate dynamic UI schema (layout only)
      console.log('🎨 [TravelScreen] Step 2: Generating UI schema...');
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
      
      const query = `Show travel recommendations for ${location.trim()}`;
      const schema = await generator.generateUI(query, deviceContext);
      const validSchema = validator.validate(schema);
      
      console.log('✅ [TravelScreen] UI schema generated:', validSchema.id);
      console.log('📊 [TravelScreen] Schema is layout-only (no data)');
      
      // Step 3: Combine schema (layout) + data (recommendations with photos)
      console.log('🔗 [TravelScreen] Step 3: Binding data to schema...');
      console.log(`📸 [TravelScreen] ${recommendations.length} recommendations ready`);
      
      setUiSchema({ schema: validSchema, data: recommendations });
      setIsSearching(false);
      
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
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

          <Text style={[styles.screenTitle, { color: theme.text }]}>
            Plan Your Trip
          </Text>
          
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

          {/* Results */}
          {uiSchema?.data && uiSchema.data.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsTitle, { color: theme.text }]}>
                {location}
              </Text>
              
              {uiSchema.data.map((rec: any, idx: number) => (
                <View 
                  key={idx}
                  style={[
                    styles.resultCard,
                    { 
                      backgroundColor: '#1E293B',
                      borderColor: '#334155',
                    }
                  ]}
                >
                  {/* Destination Header */}
                  <View style={styles.cardHeader}>
                    <Text style={[styles.destinationName, { color: '#F1F5F9' }]}>
                      📍 {rec.destination}
                    </Text>
                    <Text style={[styles.vibe, { color: '#94A3B8' }]}>
                      {rec.vibe}
                    </Text>
                  </View>

                  {/* Map with all restaurant markers */}
                  {rec.highlights.length > 0 && (
                    <MapViewComponent
                      locations={rec.highlights
                        .filter((h: any) => h.latitude && h.longitude)
                        .map((h: any) => ({
                          name: h.name,
                          latitude: h.latitude,
                          longitude: h.longitude,
                          description: h.type,
                          type: 'restaurant'
                        }))}
                      theme={theme}
                    />
                  )}

                  {/* Photos from Google Places or Placeholder */}
                  {rec.highlights[0]?.photoUrls && rec.highlights[0].photoUrls.length > 0 ? (
                    <PhotoGrid 
                      photos={rec.highlights[0].photoUrls} 
                      theme={theme}
                      onViewMore={() => {
                        setSelectedPhotos(rec.highlights[0].photoUrls);
                        setPhotoDetailVisible(true);
                      }}
                    />
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: '#0F172A' }]}>
                      <Text style={{ color: '#64748B', fontSize: 14 }}>
                        🖼️ {rec.destination}
                      </Text>
                      <Text style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
                        Loading images...
                      </Text>
                    </View>
                  )}

                  {/* Best Time */}
                  {rec.bestTime && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: '#64748B' }]}>Best Time:</Text>
                      <Text style={[styles.infoValue, { color: '#F1F5F9' }]}>
                        {rec.bestTime}
                      </Text>
                    </View>
                  )}
                  
                  {/* Highlights */}
                  <Text style={[styles.sectionTitle, { color: '#F1F5F9' }]}>
                    Top Experiences
                  </Text>
                  
                  <View style={styles.highlightsContainer}>
                    {rec.highlights.slice(0, 4).map((highlight: any, hIdx: number) => (
                      <View key={hIdx} style={[styles.highlight, { backgroundColor: '#0F172A', borderColor: '#334155' }]}>
                        <View style={styles.highlightHeader}>
                          <View style={[styles.typeBadge, { 
                            backgroundColor: highlight.type === 'luxury' ? '#8B5CF6' :
                                           highlight.type === 'budget' ? '#10B981' :
                                           highlight.type === 'touristy' ? '#F59E0B' :
                                           highlight.type === 'hidden-gem' ? '#EC4899' : '#6366F1'
                          }]}>
                            <Text style={[styles.typeText, { color: '#FFF' }]}>
                              {highlight.type.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={[styles.cost, { color: '#10B981' }]} numberOfLines={1}>
                            {PriceFormatter.format(highlight.estimatedCost || '')}
                          </Text>
                        </View>
                        
                        <Text style={[styles.highlightName, { color: '#F1F5F9' }]}>
                          {highlight.name}
                        </Text>
                        <Text style={[styles.highlightDesc, { color: '#94A3B8' }]}>
                          {highlight.description}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Local Tip */}
                  {rec.localTip && (
                    <View style={[styles.tipBox, { backgroundColor: '#0F172A', borderColor: '#6366F1' }]}>
                      <Text style={[styles.tipLabel, { color: '#6366F1' }]}>💡 Local Tip</Text>
                      <Text style={[styles.localTip, { color: '#E2E8F0' }]}>
                        {rec.localTip}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Photo Detail View Modal */}
      <PhotoDetailView
        photos={selectedPhotos}
        theme={theme}
        visible={photoDetailVisible}
        onClose={() => setPhotoDetailVisible(false)}
      />
    </Animated.View>
  );
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
  screenTitle: {
    fontSize: 32,
    fontFamily: 'Orbitron_700Bold',
    marginBottom: 30,
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
  resultsContainer: {
    marginTop: 30,
  },
  resultsTitle: {
    fontSize: 28,
    fontFamily: 'Orbitron_700Bold',
    marginBottom: 20,
  },
  resultCard: {
    padding: 0,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  destinationName: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    marginBottom: 8,
  },
  vibe: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 20,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_600SemiBold',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  highlightsContainer: {
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  highlight: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
  },
  highlightName: {
    fontSize: 16,
    fontFamily: 'Orbitron_600SemiBold',
    lineHeight: 22,
  },
  highlightDesc: {
    fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 19,
  },
  cost: {
    fontSize: 15,
    fontFamily: 'Orbitron_700Bold',
  },
  tipBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 4,
  },
  tipLabel: {
    fontSize: 13,
    fontFamily: 'Orbitron_700Bold',
    marginBottom: 6,
  },
  localTip: {
    fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 19,
  },
  mapButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  destinationImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
});

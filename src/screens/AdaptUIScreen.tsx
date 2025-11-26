// AdaptUI Screen - Main integration of all systems

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { Header } from '../components/Header';
import { TravelScreen } from '../components/TravelScreen';
import { CapabilityDetector } from '../services/CapabilityDetector';
import { DataEnrichmentService } from '../services/DataEnrichmentService';
import { QueryAnalysisService } from '../services/QueryAnalysisService';
import { TravelService } from '../services/TravelService';
import { UIGenerationService } from '../services/UIGenerationService';
import { ComponentRenderer } from '../ui-engine/ComponentRenderer';
import { UIMode } from './ModeSelectorScreen';

const { width, height } = Dimensions.get('window');

interface AdaptUIScreenProps {
  theme: any;
  onBack: () => void;
}

export function AdaptUIScreen({ theme, onBack }: AdaptUIScreenProps) {
  const [mode, setMode] = useState<UIMode>('hybrid'); // Default to hybrid mode
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilitiesExpanded, setCapabilitiesExpanded] = useState(true); // Expanded by default
  
  // Results
  const [analysis, setAnalysis] = useState<any>(null);
  const [enrichedData, setEnrichedData] = useState<any[]>([]);
  const [uiSchema, setUiSchema] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<any>(null);

  useEffect(() => {
    initCapabilities();
  }, []);

  const initCapabilities = async () => {
    try {
      const caps = await CapabilityDetector.detectCapabilities();
      setCapabilities(caps);
      console.log('✅ [AdaptUI] Capabilities initialized');
    } catch (error) {
      console.error('❌ [AdaptUI] Capability init error:', error);
    }
  };

  const toggleCapability = (key: string) => {
    if (!capabilities) return;
    
    const currentValue = (capabilities.capabilities as any)[key];
    
    setCapabilities({
      ...capabilities,
      capabilities: {
        ...capabilities.capabilities,
        [key]: !currentValue
      }
    });
    
    console.log(`🔧 [AdaptUI] Toggled ${key}:`, !currentValue);
  };

  const handleModeSelect = (selectedMode: UIMode) => {
    console.log('🎯 [AdaptUI] Mode selected:', selectedMode);
    setMode(selectedMode);
  };

  const handleSearch = async () => {
    if (!query.trim() || !mode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 [AdaptUI] Starting search flow...');
      console.log('📝 Query:', query);
      console.log('🎯 Mode:', mode);
      
      // Phase 1: Analyze query
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('PHASE 1: Query Analysis');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const analysisService = new QueryAnalysisService();
      const queryAnalysis = await analysisService.analyzeQuery(query);
      setAnalysis(queryAnalysis);
      
      console.log('✅ Analysis complete:', {
        intent: queryAnalysis.intent,
        categories: queryAnalysis.categories,
        emotion: queryAnalysis.sentiment.emotion,
        time: queryAnalysis.temporal.suggestedTimeOfDay
      });
      
      // Fetch data based on parameters
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('DATA LAYER: Fetching Places');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const travelService = new TravelService();
      const places = await travelService.generateRecommendations({
        location: queryAnalysis.parameters.destination,
        feeling: queryAnalysis.sentiment.emotion,
        useRealData: false // Use consistent mock data, not LLM-generated
      });
      
      console.log(`✅ Fetched ${places.length} places`);
      
      // Enrich with real-time data
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('DATA ENRICHMENT: Adding Real-Time Data');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const enrichmentService = new DataEnrichmentService();
      const enriched = await enrichmentService.enrichPlaces(places, queryAnalysis);
      setEnrichedData(enriched);
      
      console.log('✅ Enrichment complete');
      
      // Generate UI based on mode
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`PHASE 2: UI Generation (${mode.toUpperCase()} mode)`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (mode === 'static') {
        // Use existing TravelScreen - no schema needed
        console.log('📱 Using static TravelScreen');
        setUiSchema(null);
      } else {
        // Generate dynamic/hybrid UI
        const uiService = new UIGenerationService();
        const deviceContext = {
          dimensions: { width, height, scale: 1 },
          platform: 'ios' as const,
          orientation: 'portrait' as const,
          safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
        };
        
        console.log('🔧 [AdaptUI] Passing capabilities to UI service:', capabilities);
        
        const schema = await uiService.generateUI(
          mode,
          queryAnalysis,
          enriched,
          deviceContext,
          capabilities
        );
        
        setUiSchema(schema);
        console.log('✅ UI schema generated');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ COMPLETE - Ready to render');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } catch (err: any) {
      console.error('❌ [AdaptUI] Search error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (enrichedData.length > 0) {
      // Clear results
      setEnrichedData([]);
      setUiSchema(null);
      setAnalysis(null);
      setQuery('');
    } else {
      // Back to main app
      onBack();
    }
  };

  // Results screen
  if (enrichedData.length > 0) {
    if (mode === 'static') {
      // Use existing TravelScreen
      return (
        <TravelScreen 
          theme={theme} 
          onBack={handleBackPress}
          initialData={enrichedData}
          analysis={analysis}
        />
      );
    } else {
      // Render dynamic/hybrid UI with beautiful background
      const bgColor = theme.planets?.travel?.[0] || theme.background;
      const accentColor = theme.planets?.travel?.[1] || theme.primary;
      const darkBg = `hsl(200, 40%, 15%)`;
      
      return (
        <View style={[styles.container, { backgroundColor: darkBg }]}>
          {/* SVG Landscape Background */}
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
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
          </Svg>
          
          <View style={styles.safeArea}>
            <Header 
              title="Travel" 
              onBack={handleBackPress} 
              theme={theme}
            />

            {/* Search bar */}
            <View style={styles.searchContainerResults}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: `${accentColor}20`,
                      borderColor: `${accentColor}40`,
                      color: theme.text,
                    }
                  ]}
                  placeholder="romantic restaurants in Bali..."
                  placeholderTextColor={`${theme.text}60`}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
                
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={!query.trim() || loading}
                  activeOpacity={0.7}
                  style={[
                    styles.searchButton,
                    {
                      backgroundColor: query.trim() ? `${accentColor}90` : `${accentColor}30`,
                      borderWidth: 1,
                      borderColor: query.trim() ? accentColor : `${accentColor}40`,
                    }
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.text} size="small" />
                  ) : (
                    <Ionicons name="search" size={24} color={theme.text} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.resultsWrapper}>
              <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
              >
                {uiSchema && (
                    <ComponentRenderer 
                    schema={uiSchema} 
                    onAction={(actionId, params) => {
                      console.log('🎬 Action:', actionId, params);
                    }}
                  />
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      );
    }
  }

  // Search screen with beautiful background
  const bgColor = theme.planets?.travel?.[0] || theme.background;
  const accentColor = theme.planets?.travel?.[1] || theme.primary;
  const darkBg = `hsl(200, 40%, 15%)`;
  
  return (
    <View style={[styles.container, { backgroundColor: darkBg }]}>
      {/* SVG Landscape Background */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
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
      </Svg>
      
      <View style={styles.safeArea}>
        <Header 
          title="Travel" 
          onBack={handleBackPress} 
          theme={theme}
          backgroundColor="rgba(0, 0, 0, 0.2)"
          borderColor="rgba(255, 255, 255, 0.1)"
        />

        <ScrollView contentContainerStyle={styles.searchContent}>
          <View style={styles.searchContainer}>
            <Text style={[styles.searchLabel, { color: theme.text }]}>
              What are you looking for?
            </Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}40`,
                    color: theme.text,
                  }
                ]}
                placeholder="romantic restaurants in Bali..."
                placeholderTextColor={`${theme.text}60`}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="sentences"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                onPress={handleSearch}
                disabled={!query.trim() || loading}
                activeOpacity={0.7}
                style={[
                  styles.searchButton,
                  {
                    backgroundColor: query.trim() ? `${accentColor}90` : `${accentColor}30`,
                    borderWidth: 1,
                    borderColor: query.trim() ? accentColor : `${accentColor}40`,
                  }
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={theme.text} size="small" />
                ) : (
                  <Ionicons name="search" size={24} color={theme.text} />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick suggestions */}
            <View style={styles.suggestionsRow}>
              {['romantic restaurants in Bali', 'fun bars in Bangkok', 'peaceful temples in Kyoto'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => setQuery(suggestion)}
                  style={[styles.suggestionChip, { 
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}40`
                  }]}
                >
                  <Text style={[styles.suggestionText, { color: theme.text }]} numberOfLines={1}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: `#EF444420`, borderColor: '#EF4444' }]}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={[styles.errorText, { color: '#EF4444' }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Capability Status - Collapseable */}
            {capabilities && (
              <View style={[styles.capabilityBox, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
                <TouchableOpacity 
                  onPress={() => setCapabilitiesExpanded(!capabilitiesExpanded)}
                  style={styles.capabilityHeader}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.capabilityTitle, { color: theme.text }]}>
                    🔧 Available Features
                  </Text>
                  <Ionicons 
                    name={capabilitiesExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.text} 
                  />
                </TouchableOpacity>
                
                {capabilitiesExpanded && (
                  <View style={styles.capabilityGrid}>
                    <CapabilityToggle label="Advanced Features" enabled={capabilities.capabilities.advancedFeatures} onToggle={() => toggleCapability('advancedFeatures')} theme={theme} accentColor={accentColor} />
                    <CapabilityToggle label="Transport" enabled={capabilities.capabilities.transport} onToggle={() => toggleCapability('transport')} theme={theme} accentColor={accentColor} />
                    <CapabilityToggle label="Food" enabled={capabilities.capabilities.food} onToggle={() => toggleCapability('food')} theme={theme} accentColor={accentColor} />
                    <CapabilityToggle label="Internet" enabled={capabilities.capabilities.internet} onToggle={() => toggleCapability('internet')} theme={theme} accentColor={accentColor} />
                    <CapabilityBadge label="Photos" enabled={capabilities.capabilities.photos} theme={theme} accentColor={accentColor} />
                    <CapabilityBadge label="Maps" enabled={capabilities.capabilities.maps} theme={theme} accentColor={accentColor} />
                    <CapabilityBadge label="Location" enabled={capabilities.capabilities.location} theme={theme} accentColor={accentColor} />
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function CapabilityBadge({ label, enabled, theme, accentColor }: { label: string; enabled: boolean; theme: any; accentColor: string }) {
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

function CapabilityToggle({ label, enabled, onToggle, theme, accentColor }: { label: string; enabled: boolean; onToggle: () => void; theme: any; accentColor: string }) {
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={[styles.capabilityBadge, { 
        backgroundColor: enabled ? '#10B98120' : '#EF444420',
        borderColor: enabled ? '#10B981' : '#EF4444'
      }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.capabilityBadgeText, { color: enabled ? '#10B981' : '#EF4444' }]}>
        {enabled ? '✓' : '✗'} {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  resultsWrapper: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
  },
  searchContent: {
    padding: 16,
  },
  searchContainer: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchContainerResults: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  searchLabel: {
    fontSize: 22, // Slightly larger for hierarchy (Contrast)
    fontFamily: 'Orbitron_600SemiBold',
    marginBottom: 4, // Proximity to input
    letterSpacing: 0.5, // Better readability
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    borderWidth: 1,
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsRow: {
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    flex: 1,
    lineHeight: 20,
  },
  capabilityBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  capabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capabilityTitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
  },
  capabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
});

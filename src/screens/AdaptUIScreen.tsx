// AdaptUI Screen - Main integration of all systems

import { SearchProgressIndicator } from '@/components/SearchProgressIndicator';
import { ModularComponentRenderer } from '@/ui-engine';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { Header } from '../components/Header';
import { HiddenWebViewScraper } from '../components/HiddenWebViewScraper';
import { Tab, TabBar } from '../components/TabBar';
import { TravelScreen } from '../components/TravelScreen';
import { pluginRegistry } from '../plugins/PluginSystem';
import { CacheService } from '../services/CacheService';
import { CapabilityDetector } from '../services/CapabilityDetector';
import { DataEnrichmentService } from '../services/DataEnrichmentService';
import { QueryAnalysisService } from '../services/QueryAnalysisService';
import { TravelService } from '../services/TravelService';
import { UIGenerationService } from '../services/UIGenerationService.simplified';
import { UIMode } from './ModeSelectorScreen';

const { width, height } = Dimensions.get('window');

interface AdaptUIScreenProps {
  theme: any;
  onBack: () => void;
}

// Helper: Get tabs based on capabilities
function getTabs(capabilities: any): Tab[] {
  const tabs: Tab[] = [
    { id: 'results', label: 'Results' },
  ];
  
  if (capabilities?.capabilities?.maps) {
    tabs.push({ id: 'map', label: 'Map' });
  }
  
  // Note: transport and food are now plugins, not hardcoded tabs
  
  // Add plugin tabs
  try {
    const pluginTabs = pluginRegistry.getPluginsWithTabs();
    console.log('[getTabs] Plugin tabs available:', pluginTabs.length);
    
    pluginTabs.forEach((plugin: any) => {
      const isEnabled = capabilities?.capabilities?.[plugin.capability.id];
      console.log('[getTabs] Plugin tab check:', {
        id: plugin.capability.id,
        label: plugin.capability.tabLabel,
        isEnabled,
        willAdd: isEnabled
      });
      
      if (isEnabled) {
        tabs.push({ 
          id: plugin.capability.id, 
          label: plugin.capability.tabLabel || plugin.name,
          icon: plugin.capability.icon
        });
      }
    });
  } catch (error) {
    console.log('[getTabs] Plugin tabs error:', error);
  }
  
  return tabs;
}

// Helper: Render transport tickets
function renderTransportTickets(tickets: any[], theme: any, accentColor: string, userLocation: any) {
  if (!tickets || tickets.length === 0) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Text style={{ color: `${theme.text}60`, fontSize: 16, fontFamily: 'Orbitron_400Regular' }}>
          No transport options available
        </Text>
      </View>
    );
  }
  
  // Get user location from first ticket
  const userCity = tickets[0]?.from || 'Your Location';
  
  return (
    <View style={{ gap: 16 }}>
      {/* User Location Header */}
      <View style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: `${accentColor}20`,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${accentColor}30`,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Ionicons name="location" size={20} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            color: `${theme.text}80`, 
            fontSize: 12, 
            fontFamily: 'Orbitron_500Medium',
            marginBottom: 4
          }}>
            FROM
          </Text>
          <Text style={{ 
            color: theme.text, 
            fontSize: 16, 
            fontFamily: 'Orbitron_600SemiBold'
          }}>
            {userCity}
          </Text>
        </View>
      </View>
      
      {/* Transport Options */}
      {tickets.map((ticket: any, index: number) => (
        <TouchableOpacity
          key={index}
          onPress={async () => {
            if (ticket.deepLink) {
              console.log('[Transport] Opening booking URL:', ticket.deepLink);
              try {
                await Linking.openURL(ticket.deepLink);
              } catch (error) {
                console.error('[Transport] Failed to open URL:', error);
              }
            }
          }}
          activeOpacity={0.7}
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: `${accentColor}30`,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons 
                name={
                  ticket.type === 'flight' ? 'airplane' :
                  ticket.type === 'bus' ? 'bus' :
                  ticket.type === 'train' ? 'train' :
                  'car'
                } 
                size={18} 
                color={accentColor} 
              />
              <View style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: `${accentColor}20`,
              }}>
                <Text style={{ 
                  color: accentColor, 
                  fontSize: 11, 
                  fontFamily: 'Orbitron_700Bold',
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  {ticket.type}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ 
                color: `${theme.text}80`, 
                fontSize: 13, 
                fontFamily: 'Orbitron_600SemiBold' 
              }}>
                Tap to search
              </Text>
              <Ionicons name="open-outline" size={16} color={`${theme.text}80`} />
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ 
              color: theme.text, 
              fontSize: 14, 
              fontFamily: 'Orbitron_500Medium',
              flex: 1
            }}>
              {ticket.to}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: `${accentColor}20` }}>
            <View>
              <Text style={{ color: `${theme.text}60`, fontSize: 11, fontFamily: 'Orbitron_400Regular', marginBottom: 4 }}>
                DURATION
              </Text>
              <Text style={{ color: theme.text, fontSize: 13, fontFamily: 'Orbitron_600SemiBold' }}>
                {ticket.duration}
              </Text>
            </View>
            <View>
              <Text style={{ color: `${theme.text}60`, fontSize: 11, fontFamily: 'Orbitron_400Regular', marginBottom: 4 }}>
                PROVIDER
              </Text>
              <Text style={{ color: theme.text, fontSize: 13, fontFamily: 'Orbitron_600SemiBold' }}>
                {ticket.provider}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function AdaptUIScreen({ theme, onBack }: AdaptUIScreenProps) {
  const [mode, setMode] = useState<UIMode>('hybrid'); // Default to hybrid mode
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [useCache, setUseCache] = useState(true); // Toggle for cache usage
  const [error, setError] = useState<string | null>(null);
  const [capabilitiesExpanded, setCapabilitiesExpanded] = useState(true); // Expanded by default
  const [activeTab, setActiveTab] = useState('results'); // Tab state
  
  // Results
  const [analysis, setAnalysis] = useState<any>(null);
  const [enrichedData, setEnrichedData] = useState<any[]>([]);
  const [uiSchema, setUiSchema] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [transportTickets, setTransportTickets] = useState<any[]>([]);
  
  // Transport research
  const [transportResearching, setTransportResearching] = useState(false);
  const [researchSteps, setResearchSteps] = useState<any[]>([]);
  
  // WebView scraping
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewCallback, setWebViewCallback] = useState<((html: string) => void) | null>(null);

  useEffect(() => {
    initCapabilities();
    initWebViewHandler();
  }, []);

  const initCapabilities = async () => {
    try {
      const caps = await CapabilityDetector.detectCapabilities();
      setCapabilities(caps);
      console.log('[AdaptUI] Capabilities initialized');
    } catch (error) {
      console.error('[AdaptUI] Capability init error:', error);
    }
  };

  const initWebViewHandler = () => {
    // WebView handlers removed - not needed since scrapers use regular fetch
    // DDG and other scrapers work fine without WebView bypass
    console.log('[AdaptUI] WebView handlers skipped (not needed)');
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

  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId);
    
    // Trigger transport research when Transport tab is clicked
    if (tabId === 'transport' && transportTickets.length === 0 && !transportResearching) {
      await startTransportResearch();
    }
  };

  const startTransportResearch = async () => {
    if (!enrichedData || enrichedData.length === 0) return;
    
    setTransportResearching(true);
    setResearchSteps([]);
    
    try {
      const { TransportResearchAgent } = await import('../services/TransportResearchAgent');
      const agent = new TransportResearchAgent();
      
      // Get nearest airport from lat/long using Google Places API
      const fromAirport = capabilities?.userLocation 
        ? await agent.getNearestAirport(capabilities.userLocation.latitude, capabilities.userLocation.longitude)
        : 'BLR';
      
      const destinationCity = enrichedData[0]?.destination || 'Destination';
      const toAirport = await agent.getDestinationCode(destinationCity);
      
      console.log('[AdaptUI] Starting transport research:', { from: fromAirport, to: toAirport, city: destinationCity });
      
      // Research flights
      const result = await agent.research(
        `flights from ${fromAirport} to ${toAirport}`,
        { from: fromAirport, to: toAirport, transportType: 'flight' },
        (step) => {
          setResearchSteps(prev => {
            const existing = prev.find(s => s.site === step.site);
            if (existing) {
              return prev.map(s => s.site === step.site ? step : s);
            }
            return [...prev, step];
          });
        }
      );
      
      // Convert research results to transport tickets
      const tickets = result.steps
        .filter(step => step.status === 'complete' && step.url)
        .map((step, index) => ({
          id: `research-${index}`,
          type: 'flight' as const,
          from: fromAirport,
          to: `${toAirport} (${destinationCity})`,
          departureTime: 'Search',
          arrivalTime: 'Available',
          duration: result.summary.estimatedDuration || 'Varies',
          price: 0,
          currency: 'USD',
          provider: step.site,
          seats: 0,
          deepLink: step.url,
          searchQuery: `flights from ${fromAirport} to ${toAirport}`
        }));
      
      setTransportTickets(tickets);
      console.log('[AdaptUI] Research complete:', { optionsFound: tickets.length });
    } catch (error) {
      console.error('[AdaptUI] Transport research error:', error);
    } finally {
      setTransportResearching(false);
    }
  };

  const handleModeSelect = (selectedMode: UIMode) => {
    console.log('🎯 [AdaptUI] Mode selected:', selectedMode);
    setMode(selectedMode);
  };

  const handleSearch = async () => {
    if (!query.trim() || !mode) return;
    
    setLoading(true);
    setError(null);
    
    // Clear cache if toggle is off
    if (!useCache) {
      console.log('🔄 [AdaptUI] Cache disabled - clearing cache');
      await CacheService.clear('travel_recommendations');
    }
    
    try {
      console.log('🚀 [AdaptUI] Starting search flow...');
      console.log('📝 Query:', query);
      console.log('🎯 Mode:', mode);
      console.log('⚡ Cache:', useCache ? 'enabled' : 'disabled');
      
      // Initialize progress tracking
      const { SearchProgressTracker } = await import('../services/SearchProgressTracker');
      SearchProgressTracker.startSearch(3); // 3 main phases
      
      // Phase 1: Analyze query
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('PHASE 1: Query Analysis');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      SearchProgressTracker.updateStep(1, 'Analyzing query...', 0);
      
      const analysisService = new QueryAnalysisService();
      const queryAnalysis = await analysisService.analyzeQuery(query, undefined, capabilities);
      setAnalysis(queryAnalysis);
      
      console.log('[AdaptUI] Analysis complete:', {
        intent: queryAnalysis.intent,
        categories: queryAnalysis.categories,
        emotion: queryAnalysis.sentiment.emotion,
        time: queryAnalysis.temporal.suggestedTimeOfDay
      });
      
      // Fetch data based on parameters
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('DATA LAYER: Fetching Places');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      SearchProgressTracker.updateStep(2, 'Fetching places...', 0);
      
      const travelService = new TravelService();
      const places = await travelService.generateRecommendations({
        originalQuery: query, // Pass the actual user query: "fun bars in Bangkok"
        location: queryAnalysis.parameters.destination,
        feeling: queryAnalysis.sentiment.emotion, // Deprecated, kept for backward compatibility
        keywords: queryAnalysis.parameters.keywords, // Pass keywords from QueryAnalysis
        establishments: queryAnalysis.parameters.establishments, // Pass establishments from QueryAnalysis
        useRealData: true, // Use real Google Places data
        advancedMode: true, // Use query expansion + parallel place searches
      });
      
      console.log('[AdaptUI] Fetched places:', { count: places.length });
      
      // Enrich with real-time data
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('DATA ENRICHMENT: Adding Real-Time Data');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      SearchProgressTracker.updateStep(3, 'Enriching data...', places.length);
      
      const enrichmentService = new DataEnrichmentService();
      const enriched = await enrichmentService.enrichPlaces(places, queryAnalysis);
      setEnrichedData(enriched);
      
      // Complete progress
      SearchProgressTracker.completeSearch(enriched.length);
      
      // Store search results in shared context for plugins
      const { searchContext } = await import('../services/SearchContext');
      
      // Calculate center location from results
      console.log('🔍 [AdaptUI] Checking coordinates for', enriched.length, 'places');
      
      // Log what we received
      enriched.forEach((p: any, i: number) => {
        console.log(`   Place ${i + 1}: ${p.destination}`);
        console.log(`      Has coordinates: ${!!p.coordinates}`);
        console.log(`      Highlights: ${p.highlights?.length || 0}`);
        if (p.highlights && p.highlights.length > 0) {
          const withCoords = p.highlights.filter((h: any) => h.latitude && h.longitude).length;
          console.log(`      Highlights with coords: ${withCoords}/${p.highlights.length}`);
        }
      });
      
      // Extract coordinates from highlights if place doesn't have them
      const placesWithCoords = enriched.map((p: any) => {
        if (p.coordinates) {
          console.log(`✅ [AdaptUI] ${p.destination} already has coordinates`);
          return p;
        }
        
        // Find first highlight with coordinates
        const highlightWithCoords = p.highlights?.find((h: any) => h.latitude && h.longitude);
        if (highlightWithCoords) {
          console.log(`🔄 [AdaptUI] Copying coordinates from highlight to ${p.destination}`);
          return {
            ...p,
            coordinates: {
              latitude: highlightWithCoords.latitude,
              longitude: highlightWithCoords.longitude
            }
          };
        }
        console.warn(`⚠️ [AdaptUI] ${p.destination} has NO coordinates anywhere!`);
        return p;
      });
      
      const validPlaces = placesWithCoords.filter((p: any) => p.coordinates);
      
      console.log(`📊 [AdaptUI] Valid places with coordinates: ${validPlaces.length}/${enriched.length}`);
      
      if (validPlaces.length === 0) {
        console.error('❌ [AdaptUI] CRITICAL: No places with coordinates found!');
        console.error('❌ [AdaptUI] This means Google Places API returned no coordinates for any highlight.');
        console.error('❌ [AdaptUI] Check TravelService logs above for coordinate extraction');
        throw new Error('No coordinates available - Google Places API failed');
      }
      
      const centerLat = validPlaces.reduce((sum: number, p: any) => sum + p.coordinates.latitude, 0) / validPlaces.length;
      const centerLng = validPlaces.reduce((sum: number, p: any) => sum + p.coordinates.longitude, 0) / validPlaces.length;
      
      console.log(`✅ [AdaptUI] Center location: (${centerLat.toFixed(4)}, ${centerLng.toFixed(4)})`);
      
      // Clear old plugin caches since this is a new search
      searchContext.clearPluginCaches();
      
      searchContext.setContext({
        query,
        analysis: queryAnalysis,
        results: enriched,
        destination: queryAnalysis.parameters.destination,
        destinationAirports: queryAnalysis.parameters.destinationAirports,
        centerLocation: { lat: centerLat, lng: centerLng },
        userLocation: capabilities?.userLocation
      });
      
      console.log('[AdaptUI] ✅ Enrichment complete - Context stored, old caches cleared');
      
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
        
        // Update progress: UI generation starting
        SearchProgressTracker.updateProgress({
          currentStep: 11,
          totalSteps: 12,
          currentTask: 'Generating UI layout...',
          status: 'searching',
          results: enriched.length
        });
        
        // External instruction for testing photo grid variants
        // TODO: Make this dynamic via UI control
        const externalInstruction = "Use 'hero-left' photo grid variant for ALL highlights to showcase the masonry-style layout with one large hero image on the left and two smaller images stacked on the right.";
        
        const schema = await uiService.generateUI(
          mode,
          queryAnalysis,
          enriched,
          deviceContext,
          capabilities,
          externalInstruction
        );
        
        // Update progress: UI generation complete
        SearchProgressTracker.updateProgress({
          currentStep: 12,
          totalSteps: 12,
          currentTask: 'UI ready!',
          status: 'complete',
          results: enriched.length
        });
        
        // Inject orbital theme colors into schema
        if (schema) {
          const bgColor = theme.planets?.travel?.[0] || theme.background;
          const accentColor = theme.planets?.travel?.[1] || theme.primary;
          
          const enhancedSchema = {
            ...schema,
            theme: {
              ...schema.theme,
              colors: {
                ...schema.theme.colors,
                primary: accentColor,
                secondary: accentColor,
                accent: accentColor,
                background: bgColor,
                text: theme.text,
                textSecondary: theme.muted,
                surface: theme.cardBg,
                border: theme.borderWidth > 2 ? theme.text : schema.theme.colors.border,
              },
              // Inject ALL orbital theme properties for styling
              cardBg: theme.cardBg,
              borderWidth: theme.borderWidth,
              borderRadius: theme.borderRadius,
              shadowColor: theme.shadowColor,
              shadowOffset: theme.shadowOffset,
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: theme.shadowRadius,
              useHardShadow: theme.useHardShadow,
              badges: theme.badges,
              semantic: theme.semantic,
              badgeStyle: theme.badgeStyle,
              // Local Tip styling
              localTipBg: theme.localTipBg,
              localTipBorder: theme.localTipBorder,
              localTipLabel: theme.localTipLabel,
              localTipText: theme.localTipText,
            }
          };
          
          setUiSchema(enhancedSchema);
          console.log('[AdaptUI] UI schema generated with orbital theme:', { bgColor, accentColor, borderWidth: theme.borderWidth });
        } else {
          setUiSchema(null);
          console.warn('[AdaptUI] No schema generated');
        }
      }
      
      console.log('='.repeat(60));
      console.log('[AdaptUI] COMPLETE - Ready to render');
      console.log('='.repeat(60));
      
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
      
      return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
          {/* SVG Landscape Background */}
          {theme.showSvgBackground && (
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
          )}
          
          <View style={styles.safeArea}>
            <Header 
              title="Travel" 
              onBack={handleBackPress} 
              theme={theme}
              backgroundColor={theme.headerBg}
              borderColor={theme.headerBorder}
            />

            {/* Search bar */}
            <View style={styles.searchContainerResults}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    }
                  ]}
                  placeholder="romantic restaurants in Bali..."
                  placeholderTextColor={theme.muted}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
                
                <TouchableOpacity
                  onPress={async () => {
                    console.log('🗑️ [AdaptUI] Clearing travel cache...');
                    await CacheService.clearAll();
                    console.log('✅ [AdaptUI] Cache cleared, re-searching...');
                    handleSearch();
                  }}
                  disabled={loading}
                  activeOpacity={0.7}
                  style={[
                    styles.searchButton,
                    {
                      backgroundColor: `${accentColor}30`,
                      borderWidth: 1,
                      borderColor: `${accentColor}40`,
                      marginRight: 8,
                    }
                  ]}
                >
                  <Ionicons name="refresh" size={20} color={theme.text} />
                </TouchableOpacity>
                
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
                    <ActivityIndicator color={theme.arrowColor || theme.text} size="small" />
                  ) : (
                    <Ionicons name="search" size={24} color={theme.arrowColor || theme.text} style={{ transform: [{ scaleX: -1 }] }} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Search Progress Indicator */}
            {loading && <SearchProgressIndicator theme={theme} />}
            
            {/* Tabs */}
            <TabBar
              tabs={getTabs(capabilities)}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              theme={theme}
              accentColor={accentColor}
            />
            
            {/* Tab Content */}
            <View style={[styles.resultsWrapper, { backgroundColor: theme.resultsBg }]}>
              {activeTab === 'results' && (
                <ScrollView 
                  style={styles.content}
                  contentContainerStyle={styles.contentContainer}
                >
                  {!uiSchema ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
                      <ActivityIndicator size="large" color={accentColor} />
                      <Text style={{ color: theme.text, marginTop: 16, fontSize: 16 }}>
                        Generating UI layout...
                      </Text>
                    </View>
                  ) : (
                    <ModularComponentRenderer 
                      schema={uiSchema} 
                      onAction={async (actionId, params) => {
                        console.log('🎬 Action:', actionId, params);
                        
                        // Handle airport selection
                        if (actionId === 'select-airport' && params?.value) {
                          console.log('✈️ [AdaptUI] Airport selected:', params.value);
                          
                          // Update search context with selected airport
                          const { searchContext } = await import('../services/SearchContext');
                          const context = searchContext.getContext();
                          
                          if (context) {
                            searchContext.setContext({
                              ...context,
                              selectedAirport: params.value
                            });
                            
                            // Clear transport plugin cache to trigger re-fetch
                            searchContext.clearPluginCache('transport');
                            
                            console.log('✅ [AdaptUI] Context updated, transport cache cleared');
                            
                            // If on transport tab, trigger refresh
                            if (activeTab === 'transport' as string) {
                              // The PluginTabContent will auto-refresh on next render
                              setActiveTab('results'); // Force re-render
                              setTimeout(() => setActiveTab('transport' as any), 0);
                            }
                          }
                        }
                      }}
                    />
                  )}
                </ScrollView>
              )}
              
              {/* Old transport tab removed - now using TransportPlugin */}
              
              {activeTab === 'map' && (
                <View style={styles.content}>
                  <Text style={[styles.placeholderText, { color: theme.text }]}>
                    Map view coming soon...
                  </Text>
                </View>
              )}
              
              {/* Plugin tabs */}
              {(() => {
                try {
                  const plugin = pluginRegistry.getPluginsWithTabs().find((p: any) => p.capability.id === activeTab);
                  if (plugin) {
                    return (
                      <PluginTabContent
                        plugin={plugin}
                        enrichedData={enrichedData}
                        analysis={analysis}
                        capabilities={capabilities}
                        theme={theme}
                        accentColor={accentColor}
                      />
                    );
                  }
                } catch (error) {
                  console.error('[AdaptUI] Plugin tab render error:', error);
                }
                return null;
              })()}
            </View>
          </View>
        </View>
      );
    }
  }

  // Search screen with beautiful background
  const bgColor = theme.planets?.travel?.[0] || theme.bg;
  const accentColor = theme.planets?.travel?.[1] || theme.accent;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* SVG Landscape Background */}
      {theme.showSvgBackground && (
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
      )}
      
      <View style={styles.safeArea}>
        <Header 
          title="Travel" 
          onBack={handleBackPress} 
          theme={theme}
          backgroundColor={theme.headerBg}
          borderColor={theme.headerBorder}
        />

        <ScrollView contentContainerStyle={styles.searchContent}>
          <View style={styles.searchContainer}>
            <Text style={[styles.searchLabel, { color: theme.text }]}>
              What do you need?
            </Text>
            
            {/* Cache Toggle - Right Aligned */}
            <View style={{ marginBottom: 8, alignItems: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => setUseCache(!useCache)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: theme.borderRadius,
                  backgroundColor: theme.borderWidth > 2 
                    ? (useCache ? theme.planets.quick[0] : theme.planets.travel[0])
                    : (useCache ? `${accentColor}15` : '#ff6b6b15'),
                  borderWidth: theme.borderWidth,
                  borderColor: theme.borderWidth > 2 ? '#000000' : (useCache ? `${accentColor}50` : '#ff6b6b50'),
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  shadowColor: theme.shadowColor,
                  shadowOffset: theme.shadowOffset,
                  shadowOpacity: theme.borderWidth > 2 ? theme.shadowOpacity : (useCache ? 0 : theme.shadowOpacity),
                  shadowRadius: theme.shadowRadius,
                }}
              >
                <Ionicons 
                  name={useCache ? "flash" : "flash-off"} 
                  size={14} 
                  color={theme.borderWidth > 2 ? '#000000' : (useCache ? accentColor : '#ff6b6b')} 
                />
                <Text style={{ 
                  color: theme.borderWidth > 2 ? '#000000' : (useCache ? accentColor : '#ff6b6b'),
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  {useCache ? 'Cache' : 'Fresh'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    borderWidth: theme.borderWidth,
                    borderRadius: theme.borderRadius,
                    color: theme.text,
                  }
                ]}
                placeholder="romantic restaurants in Bali..."
                placeholderTextColor={theme.muted}
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
                    backgroundColor: query.trim() ? bgColor : `${bgColor}30`,
                    borderWidth: theme.borderWidth,
                    borderColor: theme.borderWidth > 2 ? '#000000' : (query.trim() ? accentColor : `${accentColor}40`),
                    borderRadius: theme.borderRadius,
                    shadowColor: theme.shadowColor,
                    shadowOffset: theme.shadowOffset,
                    shadowOpacity: theme.shadowOpacity,
                    shadowRadius: theme.shadowRadius,
                  }
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={theme.arrowColor || theme.text} size="small" />
                ) : (
                  <Ionicons name="search" size={24} color={theme.arrowColor || theme.text} />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Progress Indicator */}
            {loading && <SearchProgressIndicator theme={theme} />}

            {/* Quick suggestions */}
            <View style={styles.suggestionsRow}>
              {['romantic restaurants in Bali', 'fun bars in Bangkok', 'peaceful temples in Kyoto'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => setQuery(suggestion)}
                  style={[styles.suggestionChip, { 
                    backgroundColor: `${accentColor}20`,
                    borderColor: theme.borderWidth > 2 ? '#000000' : `${accentColor}40`,
                    borderWidth: theme.borderWidth,
                    borderRadius: theme.borderRadius,
                    shadowColor: theme.shadowColor,
                    shadowOffset: theme.shadowOffset,
                    shadowOpacity: theme.shadowOpacity * 0.5,
                    shadowRadius: theme.shadowRadius,
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
              <View style={[styles.capabilityBox, { 
                backgroundColor: `${accentColor}15`, 
                borderColor: theme.borderWidth > 2 ? '#000000' : `${accentColor}30`,
                borderWidth: theme.borderWidth,
                borderRadius: theme.borderRadius,
                shadowColor: theme.shadowColor,
                shadowOffset: theme.shadowOffset,
                shadowOpacity: theme.shadowOpacity * 0.3,
                shadowRadius: theme.shadowRadius,
              }]}>
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
                    {/* Plugin capabilities (Transport, Neighborhood, etc.) */}
                    {(() => {
                      try {
                        return pluginRegistry.getAllPlugins().map((plugin: any) => (
                          <CapabilityToggle 
                            key={plugin.id}
                            label={plugin.capability.label} 
                            enabled={capabilities.capabilities[plugin.capability.id] || false} 
                            onToggle={() => toggleCapability(plugin.capability.id)} 
                            theme={theme} 
                            accentColor={accentColor}
                            icon={plugin.capability.icon}
                          />
                        ));
                      } catch (error) {
                        console.error('[CapabilityGrid] Plugin error:', error);
                        return null;
                      }
                    })()}
                    
                    {/* Core toggleable capabilities */}
                    <CapabilityToggle label="Food" enabled={capabilities.capabilities.food} onToggle={() => toggleCapability('food')} theme={theme} accentColor={accentColor} />
                    <CapabilityToggle label="Internet" enabled={capabilities.capabilities.internet} onToggle={() => toggleCapability('internet')} theme={theme} accentColor={accentColor} />
                    
                    {/* Core fixed capabilities */}
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
      
      {/* Hidden WebView for scraping */}
      {webViewUrl && webViewCallback && (
        <HiddenWebViewScraper
          url={webViewUrl}
          onContentReceived={(content: any) => {
            console.log('[AdaptUI] WebView content received:', {
              url: content.url,
              title: content.title,
              bodyTextLength: content.bodyText.length
            });
            webViewCallback(content);
            setWebViewUrl(null);
            setWebViewCallback(null);
          }}
          onHTMLReceived={(html: string) => {
            console.log('[AdaptUI] WebView HTML received (legacy), length:', html.length);
            webViewCallback(html);
            setWebViewUrl(null);
            setWebViewCallback(null);
          }}
          onError={(error: string) => {
            console.error('[AdaptUI] WebView error:', error);
            setWebViewUrl(null);
            setWebViewCallback(null);
          }}
        />
      )}
    </View>
  );
}

function PluginTabContent({ plugin, enrichedData, analysis, capabilities, theme, accentColor }: any) {
  const [pluginData, setPluginData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    fetchPluginData();
  }, [plugin.id]);
  
  const fetchPluginData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[PluginTabContent] Loading plugin:', plugin.id, forceRefresh ? '(force refresh)' : '');
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const { searchContext } = await import('../services/SearchContext');
        const cached = searchContext.getPluginCache(plugin.id);
        
        if (cached) {
          console.log('[PluginTabContent] Using cached data for:', plugin.id);
          setPluginData(cached);
          setLoading(false);
          return;
        }
      }
      
      // Fetch fresh data
      console.log('[PluginTabContent] Fetching fresh data for:', plugin.id);
      const data = await plugin.dataProvider.fetch({});
      
      // Cache the data
      const { searchContext } = await import('../services/SearchContext');
      const ttl = plugin.dataProvider.cache?.ttl || 3600; // Default 1 hour
      searchContext.setPluginCache(plugin.id, data, ttl * 1000);
      
      console.log('[PluginTabContent] Data fetched and cached:', plugin.id);
      setPluginData(data);
    } catch (err: any) {
      console.error('[PluginTabContent] Fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      {/* Sticky refresh button - top right */}
      {!loading && pluginData && (
        <View style={{ 
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
        }}>
          <TouchableOpacity
            onPress={() => fetchPluginData(true)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: `${accentColor}30`,
              borderWidth: 1,
              borderColor: `${accentColor}60`,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="refresh" size={20} color={accentColor} />
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading && plugin.components.loading && (
          <plugin.components.loading theme={theme} />
        )}
        
        {error && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#EF4444', fontSize: 14, fontFamily: 'Orbitron_500Medium', textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchPluginData(false)}
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: `${accentColor}30`,
                borderWidth: 1,
                borderColor: accentColor,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'Orbitron_600SemiBold' }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!loading && !error && pluginData && plugin.components.card && (
          <plugin.components.card 
            data={pluginData} 
            theme={theme} 
            accentColor={accentColor}
          />
        )}
      </ScrollView>
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

function CapabilityToggle({ label, enabled, onToggle, theme, accentColor, icon }: { label: string; enabled: boolean; onToggle: () => void; theme: any; accentColor: string; icon?: string }) {
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={[styles.capabilityBadge, { 
        backgroundColor: enabled ? '#10B98120' : '#EF444420',
        borderColor: enabled ? '#10B981' : '#EF4444'
      }]}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons 
          name={icon as any} 
          size={14} 
          color={enabled ? '#10B981' : '#EF4444'} 
          style={{ marginRight: 4 }}
        />
      )}
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
  cacheToggle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  capabilityBadgeText: {
    fontSize: 12,
    fontFamily: 'Orbitron_600SemiBold',
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    padding: 40,
    opacity: 0.6,
  },
});

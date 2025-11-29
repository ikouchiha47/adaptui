// Transport Plugin - Flight/bus/train options + local transport (Grab/Uber)

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebViewModal } from '../components/WebViewModal';
import { TransportResearchAgent } from '../services/TransportResearchAgent';
import { AdaptUIPlugin, PluginBuilder } from './PluginSystem';

interface TransportOption {
  type: 'flight' | 'bus' | 'train' | 'local';
  provider: string;
  from: string;
  to: string;
  duration?: string;
  price?: number;
  currency?: string;
  deepLink?: string;
  description?: string;
}

interface TransportData {
  longDistance: TransportOption[];
  local: TransportOption[];
}

const TransportCard: React.FC<{ data: TransportData; theme: any; accentColor?: string }> = ({ 
  data, 
  theme, 
  accentColor = '#60A5FA' 
}) => {
  const [webViewVisible, setWebViewVisible] = React.useState(false);
  const [selectedUrl, setSelectedUrl] = React.useState('');
  
  // Extract FROM location from first option
  const fromLocation = data.longDistance[0]?.from || 'Your Location';
  const toLocation = data.longDistance[0]?.to?.split('(')[0]?.trim() || '';
  
  // Get unique destination airports
  const uniqueAirports = Array.from(new Set(
    data.longDistance.map(opt => opt.to.split('(')[0].trim())
  ));
  const hasMultipleAirports = uniqueAirports.length > 1;
  
  const handleOpenLink = (url: string) => {
    setSelectedUrl(url);
    setWebViewVisible(true);
  };
  
  return (
    <>
      <WebViewModal
        visible={webViewVisible}
        url={selectedUrl}
        onClose={() => setWebViewVisible(false)}
        theme={theme}
        accentColor={accentColor}
      />
      
      <View style={styles.container}>
        {/* Sticky Route Header */}
        <View style={[styles.routeHeader, { 
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderBottomWidth: 2,
          borderBottomColor: accentColor,
        }]}>
          <View style={styles.routeRow}>
            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>FROM</Text>
              <Text style={styles.locationCode}>{fromLocation}</Text>
            </View>
            
            <Ionicons name="arrow-forward" size={24} color={accentColor} />
            
            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>TO</Text>
              <Text style={styles.locationCode}>{toLocation || 'Destination'}</Text>
            </View>
          </View>
          
          {/* Multiple airports indicator */}
          {hasMultipleAirports && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: `${accentColor}30` }}>
              <Text style={{ 
                fontSize: 11, 
                fontFamily: 'Orbitron_500Medium',
                color: 'rgba(148, 163, 184, 1)',
                marginBottom: 6
              }}>
                {uniqueAirports.length} AIRPORTS AVAILABLE
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {uniqueAirports.map((airport, i) => (
                  <View key={i} style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: i === 0 ? `${accentColor}30` : `${accentColor}15`,
                    borderWidth: 1,
                    borderColor: i === 0 ? accentColor : `${accentColor}30`,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontFamily: 'Orbitron_600SemiBold',
                      color: i === 0 ? accentColor : 'rgba(148, 163, 184, 1)',
                    }}>
                      {airport} {i === 0 ? '(Primary)' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Long Distance Transport */}
        {data.longDistance.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="airplane" size={20} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: accentColor }]}>Getting There</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Book flights, trains, or buses to your destination
            </Text>
            
            {data.longDistance.map((option, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => option.deepLink && handleOpenLink(option.deepLink)}
                style={[styles.optionCard, { 
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderLeftWidth: 3,
                  borderLeftColor: accentColor,
                }]}
              >
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionType, { color: accentColor }]}>
                    {option.type.toUpperCase()}
                  </Text>
                  <Text style={styles.optionProvider}>{option.provider}</Text>
                </View>
                <Text style={styles.optionRoute}>
                  {option.from} → {option.to}
                </Text>
                {option.deepLink && (
                  <Text style={[styles.tapHint, { color: accentColor }]}>
                    Tap to search →
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Local Transport */}
        {data.local.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={20} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: accentColor }]}>Getting Around</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Local ride-hailing and transport options
            </Text>
            
            {data.local.map((option, i) => (
              <View key={i} style={[styles.localCard, { 
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderLeftWidth: 3,
                borderLeftColor: `${accentColor}60`,
              }]}>
                <Text style={styles.localProvider}>{option.provider}</Text>
                <Text style={styles.localDescription}>{option.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
};

const TransportLoading: React.FC<{ theme: any }> = ({ theme }) => {
  return (
    <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
      <Text style={styles.loadingText}>Researching transport options...</Text>
    </View>
  );
};

export function createTransportPlugin(): AdaptUIPlugin {
  const agent = new TransportResearchAgent();

  return new PluginBuilder()
    .setBasicInfo('transport', 'Transport Options', '1.0.0')
    .setCapability({
      id: 'transport',
      label: 'Transport',
      defaultEnabled: true,
      requiresTab: true,
      tabLabel: 'Transport',
      icon: 'airplane'
    })
    .setComponents({
      card: TransportCard,
      loading: TransportLoading,
    })
    .setDataProvider({
      fetch: async (params) => {
        // Get data from shared search context
        const { searchContext } = await import('../services/SearchContext');
        const context = searchContext.getContext();

        if (!context) {
          throw new Error('No search results available');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✈️ [TransportPlugin] Researching Transport');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Query:', context.query);
        console.log('From:', context.userLocation ? `User location (${context.userLocation.latitude}, ${context.userLocation.longitude})` : 'Unknown');
        console.log('To:', context.destination);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Research long-distance transport
        const longDistance: TransportOption[] = [];
        
        if (context.userLocation) {
          // Get nearest airport from user location
          const fromAirport = await agent.getNearestAirport(
            context.userLocation.latitude,
            context.userLocation.longitude
          );
          
          // Get validated destination airports from context
          let destinationAirports = context.destinationAirports || [];
          
          if (destinationAirports.length === 0) {
            console.error('[TransportPlugin] No destination airports in context');
            throw new Error('No destination airports available');
          }
          
          console.log('[TransportPlugin] Using validated airports:', destinationAirports);
          
          // If user selected a specific airport, prioritize it
          if (context.selectedAirport && destinationAirports.includes(context.selectedAirport)) {
            // Move selected airport to front
            destinationAirports = [
              context.selectedAirport,
              ...destinationAirports.filter(code => code !== context.selectedAirport)
            ];
            console.log('[TransportPlugin] ✅ User selected airport prioritized:', context.selectedAirport);
          }
          
          // Research top 3 airports only (selected airport will be first if specified)
          const airportsToResearch = destinationAirports.slice(0, 3);
          console.log('[TransportPlugin] Researching transport to:', {
            from: fromAirport,
            destinations: airportsToResearch,
            total: destinationAirports.length,
            researching: airportsToResearch.length
          });
          console.log('[TransportPlugin] Researching multiple transport types...');
          
          // Research flights for all top 3 airports in parallel
          const allResearchPromises = airportsToResearch.flatMap(toAirport => [
            agent.research(
              `flights from ${fromAirport} to ${toAirport}`,
              { from: fromAirport, to: toAirport, transportType: 'flight' }
            ).catch((err: any) => {
              console.error(`[TransportPlugin] Flight research failed for ${toAirport}:`, err);
              return { steps: [], summary: {}, airport: toAirport };
            }),
            agent.research(
              `buses from ${fromAirport} to ${context.destination}`,
              { from: fromAirport, to: context.destination, transportType: 'bus' }
            ).catch((err: any) => {
              console.error('[TransportPlugin] Bus research failed:', err);
              return { steps: [], summary: {} };
            }),
            agent.research(
              `trains from ${fromAirport} to ${context.destination}`,
              { from: fromAirport, to: context.destination, transportType: 'train' }
            ).catch((err: any) => {
              console.error('[TransportPlugin] Train research failed:', err);
              return { steps: [], summary: {} };
            })
          ]);
          
          const allResults = await Promise.all(allResearchPromises);
          
          // Process all results
          allResults.forEach((result: any, index: number) => {
            const resultType = index % 3; // 0=flight, 1=bus, 2=train
            const airportIndex = Math.floor(index / 3);
            const toAirport = airportsToResearch[airportIndex];
            
            if (resultType === 0) {
              // Flight results
              result.steps
                ?.filter((step: any) => step.status === 'complete' && step.url)
                .forEach((step: any) => {
                  longDistance.push({
                    type: 'flight',
                    provider: step.site,
                    from: fromAirport,
                    to: `${toAirport} (${context.destination})`,
                    deepLink: step.url
                  });
                });
            } else if (resultType === 1) {
              // Bus results
              result.steps
                ?.filter((step: any) => step.status === 'complete' && step.url)
                .forEach((step: any) => {
                  longDistance.push({
                    type: 'bus',
                    provider: step.site,
                    from: fromAirport,
                    to: context.destination,
                    deepLink: step.url
                  });
                });
            } else {
              // Train results
              result.steps
                ?.filter((step: any) => step.status === 'complete' && step.url)
                .forEach((step: any) => {
                  longDistance.push({
                    type: 'train',
                    provider: step.site,
                    from: fromAirport,
                    to: context.destination,
                    deepLink: step.url
                  });
                });
            }
          });
          
          // Add remaining airports (4-5) as informational options
          const remainingAirports = destinationAirports.slice(3, 5);
          if (remainingAirports.length > 0) {
            console.log('[TransportPlugin] Additional airports available:', remainingAirports);
            remainingAirports.forEach(code => {
              longDistance.push({
                type: 'flight',
                provider: 'Alternative Airport',
                from: fromAirport,
                to: `${code} (${context.destination})`,
                description: 'Alternative airport - tap to search manually'
              });
            });
          }
          
          console.log('[TransportPlugin] Research complete:', {
            airportsResearched: airportsToResearch.length,
            airportsAvailable: destinationAirports.length,
            totalOptions: longDistance.length
          });
        }

        // Research local transport options
        const local: TransportOption[] = [
          {
            type: 'local',
            provider: 'Grab',
            from: '',
            to: '',
            description: 'Ride-hailing app available in most Asian cities. Book rides in-app with upfront pricing.'
          },
          {
            type: 'local',
            provider: 'Uber',
            from: '',
            to: '',
            description: 'Available in select cities. Check app for availability in your destination.'
          }
        ];

        return {
          longDistance,
          local
        };
      },
      cache: {
        enabled: true,
        ttl: 1800, // 30 minutes
        key: (params) => {
          const { searchContext } = require('../services/SearchContext');
          const context = searchContext.getContext();
          return `transport_${context?.destination}_${context?.userLocation?.latitude}`;
        }
      }
    })
    .setMetadata({
      author: 'AdaptUI Team',
      description: 'Provides transport options including flights, trains, buses, and local ride-hailing services',
      icon: 'airplane',
      tags: ['transport', 'flights', 'trains', 'buses', 'grab', 'uber'],
    })
    .build();
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  routeHeader: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  locationBox: {
    flex: 1,
    gap: 4,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: 'Orbitron_500Medium',
    color: 'rgba(148, 163, 184, 1)',
    letterSpacing: 1,
  },
  locationCode: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: 'rgba(248, 250, 252, 1)',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
    color: 'rgba(148, 163, 184, 1)',
    marginBottom: 8,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionType: {
    fontSize: 11,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1,
  },
  optionProvider: {
    fontSize: 13,
    fontFamily: 'Orbitron_600SemiBold',
    color: 'rgba(203, 213, 225, 1)',
  },
  optionRoute: {
    fontSize: 15,
    fontFamily: 'Orbitron_600SemiBold',
    color: 'rgba(248, 250, 252, 1)',
  },
  tapHint: {
    fontSize: 12,
    fontFamily: 'Orbitron_500Medium',
    marginTop: 4,
  },
  localCard: {
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  localProvider: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
    color: 'rgba(248, 250, 252, 1)',
  },
  localDescription: {
    fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
    color: 'rgba(148, 163, 184, 1)',
    lineHeight: 19,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    padding: 20,
    color: 'rgba(148, 163, 184, 1)',
  },
});

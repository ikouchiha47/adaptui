// Neighborhood Plugin - Local insights and area analysis

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NeighborhoodAgent, NeighborhoodInsight } from '../services/research/NeighborhoodAgent';
import { AdaptUIPlugin, PluginBuilder } from './PluginSystem';

/**
 * Neighborhood Card Component
 */
const NeighborhoodCard: React.FC<{ data: NeighborhoodInsight; theme: any }> = ({ data, theme }) => {
  return (
    <View style={styles.cardContainer}>
      {/* Vibe - Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
        <Text style={styles.heroLabel}>AREA VIBE</Text>
        <Text style={styles.heroText}>{data.vibe}</Text>
      </View>
      
      {/* Transport */}
      {data.transport && (
        <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
          <Text style={styles.sectionTitle}>Transport</Text>
          <View style={styles.row}>
            {data.transport.busStops && (
              <View style={[styles.badgeContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Text style={styles.badgeText}>
                  Bus: {data.transport.busStops} stops
                </Text>
              </View>
            )}
            {data.transport.metroStations && (
              <View style={[styles.badgeContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Text style={styles.badgeText}>
                  Metro: {data.transport.metroStations} stations
                </Text>
              </View>
            )}
            {data.transport.trainStations && (
              <View style={[styles.badgeContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Text style={styles.badgeText}>
                  Train: {data.transport.trainStations} stations
                </Text>
              </View>
            )}
            {data.transport.walkability && (
              <View style={[styles.badgeContainer, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: 'rgba(74, 222, 128, 1)' }]}>
                  Walkability: {data.transport.walkability}/10
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Food Culture */}
      <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
        <Text style={[styles.sectionTitle, { color: 'rgba(226, 232, 240, 1)' }]}>Food Culture</Text>
        <View style={styles.row}>
          {data.foodCulture.vegFriendly && (
            <View style={[styles.badgeContainer, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: 'rgba(74, 222, 128, 1)' }]}>
                Veg Friendly
              </Text>
            </View>
          )}
          {data.foodCulture.nonVegOptions && (
            <View style={[styles.badgeContainer, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: 'rgba(251, 146, 60, 1)' }]}>
                Non-Veg Available
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Establishments */}
      <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
        <Text style={[styles.sectionTitle, { color: 'rgba(226, 232, 240, 1)' }]}>Establishments</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: 'rgba(248, 250, 252, 1)' }]}>
              {data.establishments.restaurants}
            </Text>
            <Text style={[styles.statLabel, { color: 'rgba(148, 163, 184, 1)' }]}>Restaurants</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: 'rgba(248, 250, 252, 1)' }]}>
              {data.establishments.cafes}
            </Text>
            <Text style={[styles.statLabel, { color: 'rgba(148, 163, 184, 1)' }]}>Cafes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: 'rgba(248, 250, 252, 1)' }]}>
              {data.establishments.shops}
            </Text>
            <Text style={[styles.statLabel, { color: 'rgba(148, 163, 184, 1)' }]}>Shops</Text>
          </View>
        </View>
      </View>
      
      {/* Popularity */}
      <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
        <Text style={[styles.sectionTitle, { color: 'rgba(226, 232, 240, 1)' }]}>Popularity</Text>
        <View style={[styles.badgeContainer, { 
          backgroundColor: data.popularity.crowdLevel === 'very busy' ? 'rgba(239, 68, 68, 0.15)' : 
                          data.popularity.crowdLevel === 'busy' ? 'rgba(251, 146, 60, 0.15)' : 
                          data.popularity.crowdLevel === 'moderate' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(34, 197, 94, 0.15)'
        }]}>
          <Text style={[styles.badgeText, { 
            color: data.popularity.crowdLevel === 'very busy' ? 'rgba(248, 113, 113, 1)' : 
                   data.popularity.crowdLevel === 'busy' ? 'rgba(251, 146, 60, 1)' : 
                   data.popularity.crowdLevel === 'moderate' ? 'rgba(129, 140, 248, 1)' : 'rgba(74, 222, 128, 1)'
          }]}>
            {data.popularity.crowdLevel.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* Price Negotiation */}
      {data.priceNegotiation.common && (
        <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
          <Text style={[styles.sectionTitle, { color: 'rgba(226, 232, 240, 1)' }]}>Negotiation Tips</Text>
          <View style={styles.tipsContainer}>
            {data.priceNegotiation.tips.slice(0, 2).map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <Text style={[styles.tipBullet, { color: 'rgba(96, 165, 250, 1)' }]}>•</Text>
                <Text style={[styles.tipText, { color: 'rgba(203, 213, 225, 1)' }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Local Tips */}
      {data.localTips && data.localTips.length > 0 && (
        <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
          <Text style={styles.sectionTitle}>Local Tips</Text>
          <View style={styles.localTipsContainer}>
            {data.localTips.slice(0, 3).map((tip: any, i: number) => (
              <View key={i} style={styles.localTipCard}>
                <View style={[styles.categoryBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Text style={styles.categoryText}>
                    {tip.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.localTipTitle}>
                  {tip.tip}
                </Text>
                <Text style={styles.localTipDetails}>
                  {tip.details}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Compact Variant
 */
const NeighborhoodCompact: React.FC<{ data: NeighborhoodInsight; theme: any }> = ({ data, theme }) => {
  return (
    <View style={[styles.compact, { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderColor: `${theme.primary}20` }]}>
      <Text style={[styles.compactTitle, { color: theme.text }]}>{data.vibe}</Text>
      <View style={styles.row}>
        <Text style={[styles.compactBadge, { color: `${theme.text}80` }]}>
          🚶 {data.transport.walkability}/10
        </Text>
        <Text style={[styles.compactBadge, { color: `${theme.text}80` }]}>
          {data.popularity.crowdLevel}
        </Text>
      </View>
    </View>
  );
};

/**
 * Loading State
 */
const NeighborhoodLoading: React.FC<{ theme: any }> = ({ theme }) => {
  return (
    <View style={[styles.section, { backgroundColor: 'rgba(30, 41, 59, 0.95)' }]}>
      <Text style={styles.loadingText}>
        Analyzing neighborhood...
      </Text>
    </View>
  );
};

/**
 * Create the plugin
 */
export function createNeighborhoodPlugin(): AdaptUIPlugin {
  const agent = new NeighborhoodAgent();
  
  return new PluginBuilder()
    .setBasicInfo('neighborhood', 'Neighborhood Insights', '1.0.0')
    .setCapability({
      id: 'neighborhood',
      label: 'Neighborhood',
      defaultEnabled: true, // Enable by default
      requiresTab: true,
      tabLabel: 'Area',
      icon: 'business' // Ionicons name
    })
    .setComponents({
      card: NeighborhoodCard,
      variants: {
        compact: NeighborhoodCompact,
        detailed: NeighborhoodCard,
      },
      loading: NeighborhoodLoading,
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
        console.log('🏘️ [NeighborhoodPlugin] Analyzing Area');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Query:', context.query);
        console.log('Destination:', context.destination);
        console.log('Analyzing:', context.results.length, 'search results');
        console.log('Center:', `${context.centerLocation.lat}, ${context.centerLocation.lng}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return await agent.analyzeNeighborhood(
          context.centerLocation.lat,
          context.centerLocation.lng,
          context.destination,
          context.results
        );
      },
      cache: {
        enabled: true,
        ttl: 3600, // 1 hour
        key: (params) => `neighborhood_${params.location?.lat}_${params.location?.lng}`
      }
    })
    .setLLMIntegration({
      enabled: true,
      promptTemplate: `
Neighborhood Insights:
- Analyze area vibe and atmosphere
- Assess transport connectivity (buses, trains, walkability)
- Evaluate food culture (veg/non-veg, local cuisine)
- Count establishments (restaurants, cafes, shops)
- Determine price negotiation culture
- Assess popularity and crowd levels

Use this to provide local context and recommendations.
      `.trim(),
      componentSchema: {
        type: 'neighborhood-card',
        props: {
          vibe: 'string',
          transport: 'object',
          foodCulture: 'object',
          establishments: 'object',
          priceNegotiation: 'object',
          popularity: 'object'
        },
        description: 'Displays comprehensive neighborhood insights including vibe, transport, food, and local tips'
      }
    })
    .setMetadata({
      author: 'AdaptUI Team',
      description: 'Provides deep insights into neighborhoods including vibe, transport connectivity, food culture, and local tips',
      icon: 'business',
      tags: ['neighborhood', 'local', 'insights', 'area', 'transport', 'food'],
      homepage: 'https://adaptui.dev/plugins/neighborhood'
    })
    .setHooks({
      onEnable: async () => {
        console.log('🏘️ Neighborhood plugin enabled');
      },
      onDisable: async () => {
        console.log('⏸️ Neighborhood plugin disabled');
      }
    })
    .build();
}

const styles = StyleSheet.create({
  cardContainer: {
    gap: 12,
  },
  heroSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: 'Orbitron_600SemiBold',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
    color: 'rgba(148, 163, 184, 1)',
  },
  heroText: {
    fontSize: 18,
    fontFamily: 'Orbitron_600SemiBold',
    lineHeight: 26,
    color: 'rgba(248, 250, 252, 1)',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Orbitron_600SemiBold',
    marginBottom: 4,
    letterSpacing: 0.5,
    color: 'rgba(226, 232, 240, 1)',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Orbitron_600SemiBold',
    letterSpacing: 0.3,
    color: 'rgba(96, 165, 250, 1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
    color: 'rgba(248, 250, 252, 1)',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Orbitron_500Medium',
    letterSpacing: 0.5,
    color: 'rgba(148, 163, 184, 1)',
  },
  tipsContainer: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    marginTop: 2,
    color: 'rgba(96, 165, 250, 1)',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 20,
    color: 'rgba(203, 213, 225, 1)',
  },
  localTipsContainer: {
    gap: 12,
  },
  localTipCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1,
    color: 'rgba(96, 165, 250, 1)',
  },
  localTipTitle: {
    fontSize: 15,
    fontFamily: 'Orbitron_600SemiBold',
    lineHeight: 22,
    color: 'rgba(248, 250, 252, 1)',
  },
  localTipDetails: {
    fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 19,
    color: 'rgba(148, 163, 184, 1)',
  },
  compact: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Orbitron_600SemiBold',
  },
  compactBadge: {
    fontSize: 11,
    fontFamily: 'Orbitron_400Regular',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    padding: 20,
    color: 'rgba(148, 163, 184, 1)',
  },
});

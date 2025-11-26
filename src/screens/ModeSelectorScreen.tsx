// Mode Selector Screen - Choose between Static, Dynamic, or Hybrid UI

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';

export type UIMode = 'static' | 'dynamic' | 'hybrid';

interface ModeSelectorScreenProps {
  onModeSelect: (mode: UIMode) => void;
  theme: any;
  onBack?: () => void;
}

export function ModeSelectorScreen({ onModeSelect, theme, onBack }: ModeSelectorScreenProps) {
  const [selectedMode, setSelectedMode] = useState<UIMode | null>(null);

  const modes = [
    {
      id: 'static' as UIMode,
      title: 'Static UI',
      icon: 'grid-outline',
      description: 'Pre-built travel screen with fixed layout',
      features: [
        'Fast and reliable',
        'Consistent experience',
        'No LLM calls needed',
        'Best for production'
      ],
      color: '#10B981',
      recommended: false
    },
    {
      id: 'dynamic' as UIMode,
      title: 'Dynamic UI',
      icon: 'sparkles-outline',
      description: 'Fully LLM-generated UI with intelligent layout',
      features: [
        'Adapts to any query',
        'Smart layout decisions',
        'Emotion-aware design',
        'Real-time data integration'
      ],
      color: '#6366F1',
      recommended: true
    },
    {
      id: 'hybrid' as UIMode,
      title: 'Hybrid UI',
      icon: 'layers-outline',
      description: 'LLM-composed UI using pre-built components',
      features: [
        'Best of both worlds',
        'Component variants',
        'Flexible composition',
        'Balanced performance'
      ],
      color: '#8B5CF6',
      recommended: false
    }
  ];

  const handleContinue = () => {
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  // Use same beautiful background as DynamicTravelScreen
  const bgColor = theme.planets?.travel?.[0] || theme.background;
  const accentColor = theme.planets?.travel?.[1] || theme.primary;
  const darkBg = `hsl(200, 40%, 15%)`; // Dark blue-ish

  return (
    <View style={[styles.container, { backgroundColor: darkBg }]}>
      {/* SVG Landscape Background - same as DynamicTravelScreen */}
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
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { 
                backgroundColor: `${accentColor}30`, 
                borderWidth: 1, 
                borderColor: `${accentColor}50` 
              }]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
              <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Choose UI Mode
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select how you want the travel UI to be generated
          </Text>
        </View>

        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeCard,
              { 
                backgroundColor: theme.surface,
                borderColor: selectedMode === mode.id ? mode.color : theme.border,
                borderWidth: selectedMode === mode.id ? 2 : 1
              }
            ]}
            onPress={() => setSelectedMode(mode.id)}
            activeOpacity={0.7}
          >
            {mode.recommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: mode.color }]}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
            )}

            <View style={styles.modeHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${mode.color}20` }]}>
                <Ionicons name={mode.icon as any} size={32} color={mode.color} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={[styles.modeTitle, { color: theme.text }]}>
                  {mode.title}
                </Text>
                <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
                  {mode.description}
                </Text>
              </View>
            </View>

            <View style={styles.features}>
              {mode.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={mode.color} />
                  <Text style={[styles.featureText, { color: theme.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {selectedMode === mode.id && (
              <View style={[styles.selectedIndicator, { backgroundColor: mode.color }]}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.selectedText}>Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedMode 
                ? modes.find(m => m.id === selectedMode)?.color 
                : theme.border,
              opacity: selectedMode ? 1 : 0.5
            }
          ]}
          onPress={handleContinue}
          disabled={!selectedMode}
        >
          <Text style={styles.continueButtonText}>
            Continue with {selectedMode ? modes.find(m => m.id === selectedMode)?.title : 'Selected Mode'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          💡 You can change the mode anytime from settings
        </Text>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_600SemiBold',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Orbitron_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 24,
  },
  modeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron_600SemiBold',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    lineHeight: 20,
  },
  features: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    flex: 1,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
    color: '#FFFFFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_600SemiBold',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});

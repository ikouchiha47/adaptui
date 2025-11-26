import { Audiowide_400Regular } from '@expo-google-fonts/audiowide';
import { Orbitron_400Regular, Orbitron_500Medium, Orbitron_600SemiBold, Orbitron_700Bold, useFonts } from '@expo-google-fonts/orbitron';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Theme Definitions
const THEMES = {
  aurora: {
    name: 'Aurora',
    bg: '#071521',
    accent: '#6ee7b7',
    muted: '#b2c6d3',
    text: '#ffffff',
    planets: {
      travel: ['#64d3ff', '#3fbaff'],
      local: ['#7bffc8', '#3ef5aa'],
      research: ['#8ab4ff', '#4f7cff'],
      quick: ['#ff90d0', '#ff5ca8'],
    },
    cardBg: 'rgba(255,255,255,0.08)',
  },
  solar: {
    name: 'Solar Forge',
    bg: '#181512',
    accent: '#ffb34f',
    muted: '#d3c2aa',
    text: '#ffffff',
    planets: {
      travel: ['#ff8c3a', '#ff6a00'],
      local: ['#ffd364', '#ffae00'],
      research: ['#ffe69c', '#ffd862'],
      quick: ['#fca5a5', '#f87171'],
    },
    cardBg: 'rgba(255,255,255,0.06)',
  },
} as const;

type ThemeKey = keyof typeof THEMES;
type Theme = typeof THEMES[ThemeKey];

// Planet Component - uses calculated x/y positions, minimal absolute positioning
interface PlanetProps {
  label: string;
  colors: readonly string[];
  x: number;
  y: number;
  onPress: () => void;
  delay: number;
}

function Planet({ label, colors, x, y, onPress, delay }: PlanetProps) {
  const bounceAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();
  }, [delay]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - 42,
        top: y - 42,
        transform: [
          { translateY: bounceAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          styles.planetInner,
          {
            backgroundColor: colors[0],
            shadowColor: colors[1],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        <Text style={styles.planetText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Central Orb
interface CentralOrbProps {
  theme: Theme;
  x: number;
  y: number;
}

function CentralOrb({ theme, x, y }: CentralOrbProps) {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - 80,
        top: y - 80,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.cardBg,
        opacity: 0.95,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 2,
        borderColor: `${theme.accent}40`,
        transform: [{ scale: pulseAnim }],
      }}
    >
      {/* Inner glow effect */}
      <View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: `${theme.accent}15`,
        }}
      />
      <Text style={[styles.orbText, { color: theme.text }]}>Discover</Text>
    </Animated.View>
  );
}

// Orb Scene - SVG for background, calculated positions for planets
interface OrbSceneProps {
  theme: Theme;
  onSelectCategory: (category: string) => void;
}

function OrbScene({ theme, onSelectCategory }: OrbSceneProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const colorFillAnim = new Animated.Value(0);
  
  // Center relative to the container (which uses flex)
  const centerX = width / 2;
  const centerY = height / 2;

  const handlePlanetPress = (planetId: string) => {
    setSelectedPlanet(planetId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Animated.timing(colorFillAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start(() => {
      onSelectCategory(planetId);
      colorFillAnim.setValue(0);
      setSelectedPlanet(null);
    });
  };

  // Calculate planet positions from center
  const planets = [
    { id: 'travel', label: 'Travel', angle: 20, radius: 160, delay: 0 },
    { id: 'local', label: 'Local', angle: 110, radius: 140, delay: 300 },
    { id: 'research', label: 'Compare', angle: 200, radius: 160, delay: 600 },
    { id: 'quick', label: 'Quick', angle: 290, radius: 140, delay: 900 },
  ].map(p => {
    const rad = (p.angle * Math.PI) / 180;
    return {
      ...p,
      x: centerX + p.radius * Math.cos(rad),
      y: centerY + p.radius * Math.sin(rad),
    };
  });
  
  const selectedColor = selectedPlanet 
    ? theme.planets[selectedPlanet as keyof typeof theme.planets][0] 
    : 'transparent';

  // Generate radial dots from center - fewer dots near center, more as it expands
  const radialDots = [];
  const numRings = 15;
  for (let ring = 1; ring <= numRings; ring++) {
    const ringRadius = ring * 35;
    // Start with very few dots near center, increase as rings expand
    const numDotsPerRing = Math.floor(8 + ring * 2.5);
    for (let i = 0; i < numDotsPerRing; i++) {
      const angle = (i / numDotsPerRing) * 360;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + ringRadius * Math.cos(rad);
      const y = centerY + ringRadius * Math.sin(rad);
      const size = 2.2 - ring * 0.06;
      // Very low opacity near center, increases outward
      const opacity = Math.min(0.05 + ring * 0.015, 0.3);
      radialDots.push({ x, y, size, opacity, key: `${ring}-${i}` });
    }
  }

  return (
    <View style={styles.orbSceneContainer}>
      <View style={styles.orbScene}>
        {/* Circular Color Fill Animation - expands from center */}
        {selectedPlanet && (
          <Animated.View
            style={{
              position: 'absolute',
              left: centerX,
              top: centerY,
              width: colorFillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(width, height) * 2],
              }),
              height: colorFillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(width, height) * 2],
              }),
              borderRadius: Math.max(width, height),
              backgroundColor: selectedColor,
              opacity: colorFillAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 0.5, 0.4],
              }),
              transform: [
                { translateX: colorFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -Math.max(width, height)],
                })},
                { translateY: colorFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -Math.max(width, height)],
                })},
              ],
            }}
          />
        )}
        
        {/* SVG Background Layer - all decorative elements */}
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          {/* Radial Dots */}
          {radialDots.map((dot) => (
            <Circle
              key={dot.key}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={theme.accent}
              opacity={dot.opacity}
            />
          ))}

          {/* Orbital Rings */}
          <Circle
            cx={centerX}
            cy={centerY}
            r="140"
            stroke={theme.accent}
            strokeWidth="1"
            fill="none"
            opacity="0.15"
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r="160"
            stroke={theme.accent}
            strokeWidth="1"
            fill="none"
            opacity="0.12"
          />
        </Svg>

        {/* Central Orb */}
        <CentralOrb theme={theme} x={centerX} y={centerY} />

        {/* Planets */}
        {planets.map((planet) => (
          <Planet
            key={planet.id}
            label={planet.label}
            colors={theme.planets[planet.id as keyof typeof theme.planets]}
            x={planet.x}
            y={planet.y}
            delay={planet.delay}
            onPress={() => handlePlanetPress(planet.id)}
          />
        ))}
      </View>
    </View>
  );
}

// Travel Screen with SVG Landscape
interface TravelScreenProps {
  theme: Theme;
  onBack: () => void;
}

function TravelScreen({ theme, onBack }: TravelScreenProps) {
  const slideAnim = new Animated.Value(height);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Subtle gradient background using theme colors
  const bgColor = theme.planets.travel[0];
  const accentColor = theme.planets.travel[1];

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: bgColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* SVG Landscape Background - Subtle and minimal */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Distant Mountains - using Polygon for actual triangular shapes */}
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
        
        {/* Rolling Hills - subtle curves at bottom */}
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
        
        {/* Simple tree silhouettes - triangles */}
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
        <View style={styles.screenContent}>
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
            {/* Add search inputs here */}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// Theme Picker
interface ThemePickerProps {
  currentTheme: ThemeKey;
  onChangeTheme: (theme: ThemeKey) => void;
  theme: Theme;
}

function ThemePicker({ currentTheme, onChangeTheme, theme }: ThemePickerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.themePicker}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setVisible(!visible);
        }}
        style={[
          styles.themeButton,
          { backgroundColor: theme.cardBg, borderColor: theme.accent },
        ]}
      >
        <Text style={[styles.themeButtonText, { color: theme.text }]}>
          {THEMES[currentTheme].name}
        </Text>
      </TouchableOpacity>

      {visible && (
        <View style={[styles.themeDropdown, { backgroundColor: theme.cardBg }]}>
          {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onChangeTheme(key);
                setVisible(false);
              }}
              style={styles.themeOption}
            >
              <Text style={[styles.themeOptionText, { color: theme.text }]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Main App
export default function AdaptUI() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('aurora');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Audiowide_400Regular,
  });

  const theme = THEMES[themeKey];

  if (!fontsLoaded) {
    return null;
  }

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
  };

  const handleBack = () => {
    setActiveCategory(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safeArea}>
        {!activeCategory && (
          <ThemePicker
            currentTheme={themeKey}
            onChangeTheme={setThemeKey}
            theme={theme}
          />
        )}

        {!activeCategory && (
          <OrbScene theme={theme} onSelectCategory={handleSelectCategory} />
        )}

        {activeCategory === 'travel' && (
          <TravelScreen theme={theme} onBack={handleBack} />
        )}
      </SafeAreaView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  themePicker: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
  },
  themeDropdown: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  themeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: 'Orbitron_500Medium',
  },
  orbSceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbScene: {
    width: width,
    height: height,
    position: 'relative',
  },
  planetInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetText: {
    fontSize: 14,
    fontFamily: 'Audiowide_400Regular',
    color: '#0a0d12',
  },
  orbText: {
    fontSize: 22,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2,
  },
  screenContent: {
    flex: 1,
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
    marginBottom: 10,
  },
});

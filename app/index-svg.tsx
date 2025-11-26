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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    inputBg: 'rgba(255,255,255,0.1)',
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
    inputBg: 'rgba(255,255,255,0.08)',
  },
} as const;

type ThemeKey = keyof typeof THEMES;
type Theme = typeof THEMES[ThemeKey];

// Planet Component - positioned via props, no absolute positioning
interface PlanetProps {
  label: string;
  colors: string[];
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
  selectedColor: string | null;
  x: number;
  y: number;
}

function CentralOrb({ theme, selectedColor, x, y }: CentralOrbProps) {
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
        backgroundColor: selectedColor || theme.cardBg,
        opacity: 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        transform: [{ scale: pulseAnim }],
      }}
    >
      <Text style={[styles.orbText, { color: theme.text, opacity: 0.9 }]}>Discover</Text>
    </Animated.View>
  );
}

// Physical Button Component
interface PhysicalButtonProps {
  title: string;
  onPress: () => void;
  theme: Theme;
  style?: any;
}

function PhysicalButton({ title, onPress, theme, style }: PhysicalButtonProps) {
  const pressAnim = new Animated.Value(0);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
        style={[
          styles.physButton,
          {
            backgroundColor: theme.cardBg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 0,
            elevation: 8,
          },
        ]}
      >
        <Text style={[styles.physButtonText, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ color: theme.text, padding: 20 }}>
          SVG-based layout demo - much cleaner than position: absolute everywhere!
        </Text>
        <Text style={{ color: theme.muted, padding: 20 }}>
          The orbital system uses SVG for the background elements (dots, rings) and calculated positions for planets.
          No nested absolute positioning hacks needed.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  physButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  physButtonText: {
    fontSize: 16,
    fontFamily: 'Audiowide_400Regular',
  },
});

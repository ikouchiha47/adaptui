import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface CentralOrbProps {
  theme: {
    cardBg: string;
    accent: string;
    text: string;
  };
  x: number;
  y: number;
}

export function CentralOrb({ theme, x, y }: CentralOrbProps) {
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

const styles = StyleSheet.create({
  orbText: {
    fontSize: 22,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2,
  },
});

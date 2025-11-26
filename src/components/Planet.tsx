import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface PlanetProps {
  label: string;
  colors: readonly string[];
  x: number;
  y: number;
  onPress: () => void;
  delay: number;
}

export function Planet({ label, colors, x, y, onPress, delay }: PlanetProps) {
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

const styles = StyleSheet.create({
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
});

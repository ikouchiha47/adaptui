import { useTheme } from '@/theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ThemeToggle: React.FC = () => {
  const { theme, themeType, toggleTheme } = useTheme();
  const rotation = useSharedValue(0);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rotation.value = withSpring(rotation.value + 180);
    toggleTheme();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const containerStyle = themeType === 'brutal' 
    ? [
        styles.brutalContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOffset: theme.effects.shadowOffset,
        }
      ]
    : [
        styles.glassContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.full,
        }
      ];

  return (
    <AnimatedTouchable
      onPress={handleToggle}
      style={[containerStyle, animatedStyle]}
      activeOpacity={0.8}
    >
      <Text style={[styles.icon, { color: theme.colors.text }]}>
        {themeType === 'glass' ? '✨' : '⚡'}
      </Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  brutalContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  icon: {
    fontSize: 24,
  },
});

import { useTheme } from '@/theme/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, delay = 0 }) => {
  const { theme, themeType } = useTheme();

  if (themeType === 'brutal') {
    return (
      <Animated.View
        entering={FadeInDown.delay(delay).springify()}
        style={[
          styles.brutalCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: theme.effects.shadowOffset,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.glassContainer, style]}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={[
          styles.glassCard,
          {
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        <View style={styles.glassContent}>{children}</View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    overflow: 'hidden',
  },
  glassCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassContent: {
    padding: 20,
  },
  brutalCard: {
    borderWidth: 3,
    padding: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});

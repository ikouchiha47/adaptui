import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEMES, Theme, ThemeKey } from '../theme/orbitalThemes';

interface ThemePickerProps {
  currentTheme: ThemeKey;
  onChangeTheme: (theme: ThemeKey) => void;
  theme: Theme;
}

export function ThemePicker({ currentTheme, onChangeTheme, theme }: ThemePickerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.themePickerContainer}>
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

const styles = StyleSheet.create({
  themePickerContainer: {
    position: 'relative',
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
    position: 'absolute',
    top: '100%', // Right below the button (percentage-based)
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
    zIndex: 1001, // Above everything
  },
  themeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: 'Orbitron_500Medium',
  },
});

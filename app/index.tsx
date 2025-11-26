import { Audiowide_400Regular } from '@expo-google-fonts/audiowide';
import { Orbitron_400Regular, Orbitron_500Medium, Orbitron_600SemiBold, Orbitron_700Bold, useFonts } from '@expo-google-fonts/orbitron';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrbScene } from '../src/components/OrbScene';
import { ThemePicker } from '../src/components/ThemePicker';
import { TravelScreen } from '../src/components/TravelScreen';
import { AdaptUIScreen } from '../src/screens/AdaptUIScreen';
import { CacheService } from '../src/services/CacheService';
import { THEMES, ThemeKey } from '../src/theme/orbitalThemes';

export default function AdaptUI() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('aurora');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [useAdaptUI, setUseAdaptUI] = useState(true); // Toggle between Static and AdaptUI (default: AdaptUI)

  // Initialize cache and location on app start
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize cache
      await CacheService.init();
      
      // Request location permission for transport tickets
      console.log('📍 [App] Requesting location permission...');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          console.log('✅ [App] Location permission granted');
        } else {
          console.log('⚠️ [App] Location permission denied - transport features unavailable');
        }
      } catch (error) {
        console.error('❌ [App] Location permission error:', error);
      }
    };
    
    initializeApp();
  }, []);

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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {!activeCategory ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setUseAdaptUI(!useAdaptUI)}
                style={[styles.toggleButton, { 
                  backgroundColor: useAdaptUI ? '#8B5CF6' : '#334155',
                  borderColor: useAdaptUI ? '#A78BFA' : '#475569'
                }]}
              >
                <Text style={[styles.toggleText, { color: theme.text }]}>
                  {useAdaptUI ? '✨ AdaptUI' : '📱 Static UI'}
                </Text>
              </TouchableOpacity>

              <ThemePicker
                currentTheme={themeKey}
                onChangeTheme={setThemeKey}
                theme={theme}
              />
            </View>

            {/* Body */}
            <View style={styles.body}>
              <OrbScene theme={theme} onSelectCategory={handleSelectCategory} />
            </View>
          </>
        ) : null}

        {activeCategory === 'travel' && useAdaptUI && (
          <AdaptUIScreen theme={theme} onBack={handleBack} />
        )}

        {activeCategory === 'travel' && !useAdaptUI && (
          <TravelScreen theme={theme} onBack={handleBack} />
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  body: {
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Orbitron_600SemiBold',
  },
});

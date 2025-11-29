import { SearchProgress, SearchProgressTracker } from '@/services/SearchProgressTracker';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface SearchProgressIndicatorProps {
  theme?: any;
}

export const SearchProgressIndicator: React.FC<SearchProgressIndicatorProps> = ({ theme }) => {
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [progressAnim] = useState(new Animated.Value(0));
  
  // Theme values with defaults
  const themeAny = theme as any;
  const bgColor = themeAny?.progressBg || themeAny?.inputBg || themeAny?.cardBg || '#fff';
  const textColor = themeAny?.text || '#333';
  const accentColor = themeAny?.planets?.travel?.[0] || '#007AFF';
  const borderWidth = themeAny?.badgeBorderWidth || themeAny?.borderWidth || 1;
  const borderColor = themeAny?.badgeStyle?.borderColor || themeAny?.accent || '#000';
  const borderRadius = themeAny?.borderRadius ?? 12;
  const useHardShadow = themeAny?.useHardShadow || false;

  useEffect(() => {
    console.log('🎯 [SearchProgressIndicator] Component mounted');
    
    // Subscribe to progress updates
    const unsubscribe = SearchProgressTracker.subscribe((newProgress) => {
      console.log('📊 [SearchProgressIndicator] Progress update:', newProgress);
      setProgress(newProgress);
      
      // Animate progress bar
      const percentage = (newProgress.currentStep / newProgress.totalSteps) * 100;
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      console.log('🎯 [SearchProgressIndicator] Component unmounting');
      unsubscribe();
    };
  }, []);

  console.log('🎯 [SearchProgressIndicator] Render - progress:', progress);

  // Don't show if no progress or complete
  if (!progress || progress.status === 'complete') {
    return null;
  }

  const percentage = Math.round((progress.currentStep / progress.totalSteps) * 100);

  return (
    <View style={{ position: 'relative', marginHorizontal: 16, marginVertical: 8 }}>
      {/* Hard shadow for neobrutal */}
      {useHardShadow && (
        <View style={[styles.containerCompact, {
          position: 'absolute',
          top: 2,
          left: 2,
          backgroundColor: '#000000',
          borderWidth,
          borderColor,
          borderRadius,
        }]} />
      )}
      
      {/* Main container - more compact */}
      <View style={[styles.containerCompact, {
        backgroundColor: bgColor,
        borderWidth,
        borderColor,
        borderRadius,
        ...(!useHardShadow && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }),
      }]}>
        <View style={styles.headerCompact}>
          <Text style={[styles.titleCompact, { color: textColor }]} numberOfLines={1}>
            {progress.currentTask}
          </Text>
          <Text style={[styles.percentageCompact, { color: accentColor }]}>{percentage}%</Text>
        </View>
        
        <View style={[styles.progressBarContainer, {
          backgroundColor: `${accentColor}20`,
          borderRadius: borderRadius > 0 ? 2 : 0,
        }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: accentColor,
                borderRadius: borderRadius > 0 ? 2 : 0,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        
        <Text style={[styles.statsCompact, { color: textColor, opacity: 0.5 }]}>
          Step {progress.currentStep} of {progress.totalSteps}
          {progress.results !== undefined && ` • ${progress.results} results`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  percentageCompact: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
  },
  statsCompact: {
    fontSize: 11,
  },
});

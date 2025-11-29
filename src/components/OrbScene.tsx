import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CentralOrb } from './CentralOrb';
import { Planet } from './Planet';

const { width, height } = Dimensions.get('window');

interface OrbSceneProps {
  theme: any;
  onSelectCategory: (category: string) => void;
}

export function OrbScene({ theme, onSelectCategory }: OrbSceneProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: width, height: height });
  const colorFillAnim = React.useRef(new Animated.Value(0)).current;
  
  const centerX = containerDimensions.width / 2;
  const centerY = containerDimensions.height / 2;

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

  const radialDots = [];
  const numRings = 15;
  for (let ring = 1; ring <= numRings; ring++) {
    const ringRadius = ring * 35;
    const numDotsPerRing = Math.floor(8 + ring * 2.5);
    for (let i = 0; i < numDotsPerRing; i++) {
      const angle = (i / numDotsPerRing) * 360;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + ringRadius * Math.cos(rad);
      const y = centerY + ringRadius * Math.sin(rad);
      const size = 2.2 - ring * 0.06;
      const opacity = Math.min(0.05 + ring * 0.015, 0.3);
      radialDots.push({ x, y, size, opacity, key: `${ring}-${i}` });
    }
  }

  return (
    <View 
      style={styles.orbSceneContainer} 
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setContainerDimensions({ width: w, height: h });
      }}
    >
      <View style={styles.orbScene}>
        {/* Circular Color Fill Animation */}
        {selectedPlanet && (
          <Animated.View
            style={{
              position: 'absolute',
              left: centerX,
              top: centerY,
              width: colorFillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(containerDimensions.width, containerDimensions.height) * 2],
              }),
              height: colorFillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(containerDimensions.width, containerDimensions.height) * 2],
              }),
              borderRadius: Math.max(containerDimensions.width, containerDimensions.height),
              backgroundColor: selectedColor,
              opacity: colorFillAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 0.5, 0.4],
              }),
              transform: [
                { translateX: colorFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -Math.max(containerDimensions.width, containerDimensions.height)],
                })},
                { translateY: colorFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -Math.max(containerDimensions.width, containerDimensions.height)],
                })},
              ],
            }}
          />
        )}
        
        <Svg width={containerDimensions.width} height={containerDimensions.height} style={StyleSheet.absoluteFill}>
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

        <CentralOrb theme={theme} x={centerX} y={centerY} />

        {planets.map((planet) => (
          <Planet
            key={planet.id}
            label={planet.label}
            colors={theme.planets[planet.id as keyof typeof theme.planets]}
            x={planet.x}
            y={planet.y}
            delay={planet.delay}
            onPress={() => handlePlanetPress(planet.id)}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbSceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbScene: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
});

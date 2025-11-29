// Chip Group Renderer
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UIComponent, UISchema } from '../../types/ui-schema';

interface ChipGroupRendererProps {
  component: UIComponent;
  theme: UISchema['theme'];
  onAction: (actionId?: string, params?: any) => void;
  combinedStyle: any;
}

export function ChipGroupRenderer({ component, theme, onAction, combinedStyle }: ChipGroupRendererProps) {
  const props = component.props as any;
  
  if (!props || !props.options) {
    console.warn('⚠️ [ComponentRenderer] chip-group missing options');
    return null;
  }
  
  const { backgroundColor, ...containerStyle } = combinedStyle;
  
  return (
    <View style={[styles.chipGroup, styles.chipGroupContainer, containerStyle]}>
      {props.options.map((option: any, index: number) => {
        const isSelected = props.selectedValue === option.value || 
                         (props.selectedValue === undefined && index === 0);
        
        return (
          <TouchableOpacity
            key={option.id || option.value}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected 
                  ? `${theme.colors.primary}40`
                  : (props.variant === 'filled' ? theme.colors.primary : 'transparent'),
                borderColor: isSelected ? theme.colors.primary : `${theme.colors.primary}60`,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => {
              if (component.interaction?.hapticFeedback) {
                const feedbackMap: Record<string, any> = {
                  light: Haptics.ImpactFeedbackStyle.Light,
                  medium: Haptics.ImpactFeedbackStyle.Medium,
                  heavy: Haptics.ImpactFeedbackStyle.Heavy,
                };
                Haptics.impactAsync(feedbackMap[component.interaction.hapticFeedback] || Haptics.ImpactFeedbackStyle.Medium);
              }
              onAction(component.interaction?.onPress, option);
            }}
          >
            {option.icon && (
              <Ionicons name={option.icon as any} size={16} color={theme.colors.text} style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.chipText, { 
              color: theme.colors.text,
              fontWeight: isSelected ? '600' : '400'
            }]}>
              {option.label}
            </Text>
            {option.badge && (
              <View style={{
                marginLeft: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: `${theme.colors.primary}30`
              }}>
                <Text style={{ fontSize: 10, color: theme.colors.text }}>
                  {option.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipGroupContainer: {
    marginBottom: 24,
    maxWidth: '100%',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 150,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

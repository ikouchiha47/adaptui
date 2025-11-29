// Button Renderer
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { UIComponent, UISchema } from '../../types/ui-schema';

interface ButtonRendererProps {
  component: UIComponent;
  theme: UISchema['theme'];
  onPress: () => void;
  combinedStyle: any;
}

export function ButtonRenderer({ component, theme, onPress, combinedStyle }: ButtonRendererProps) {
  const props = component.props as any;
  const isDisabled = component.interaction?.disabled || component.interaction?.loading;
  
  return (
    <TouchableOpacity
      style={[styles.button, combinedStyle, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {component.interaction?.loading ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : (
        <>
          {props.icon && props.iconPosition === 'left' && (
            <Ionicons name={props.icon as any} size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
          )}
          {props.text && (
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              {props.text}
            </Text>
          )}
          {props.icon && (!props.iconPosition || props.iconPosition === 'right') && (
            <Ionicons name={props.icon as any} size={20} color={theme.colors.text} style={{ marginLeft: 8 }} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

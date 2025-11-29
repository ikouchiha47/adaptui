// Input Renderer
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { UIComponent, UISchema } from '../../types/ui-schema';

interface InputRendererProps {
  component: UIComponent;
  theme: UISchema['theme'];
  combinedStyle: any;
}

export function InputRenderer({ component, theme, combinedStyle }: InputRendererProps) {
  const props = component.props as any;
  
  return (
    <View style={[styles.inputContainer, combinedStyle]}>
      {props.icon && props.iconPosition === 'left' && (
        <Ionicons name={props.icon as any} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
      )}
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        placeholder={props.placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={props.value}
        multiline={props.multiline}
        maxLength={props.maxLength}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        autoCorrect={props.autoCorrect}
        secureTextEntry={props.secureTextEntry}
      />
      {props.icon && props.iconPosition === 'right' && (
        <Ionicons name={props.icon as any} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputIcon: {
    marginHorizontal: 8,
  },
});

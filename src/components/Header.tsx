import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  title: string;
  onBack: () => void;
  theme: any;
  backgroundColor?: string;
  borderColor?: string;
}

export function Header({ title, onBack, theme, backgroundColor, borderColor }: HeaderProps) {
  const isBrutal = theme.borderWidth && theme.borderWidth > 2;
  
  return (
    <View style={[
      styles.header,
      {
        backgroundColor: backgroundColor || 'rgba(0, 0, 0, 0.3)',
        borderBottomColor: borderColor || 'rgba(255, 255, 255, 0.1)',
        borderBottomWidth: theme.borderWidth || 1,
        borderTopWidth: isBrutal ? theme.borderWidth : 0,
        borderTopColor: isBrutal ? borderColor : 'transparent',
      }
    ]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: theme.text }]}>
        {title}
      </Text>
      
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    textAlign: 'center',
  },
  spacer: {
    width: 48,
  },
});

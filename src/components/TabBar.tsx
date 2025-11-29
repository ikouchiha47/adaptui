import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  theme: any;
  accentColor?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, theme, accentColor = '#6366F1' }: TabBarProps) {
  return (
    <View style={[
      styles.container, 
      { 
        borderBottomColor: theme.tabBarBorder,
        borderBottomWidth: theme.borderWidth || 1,
        backgroundColor: theme.tabBarBg,
      }
    ]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.tab,
                isActive && { 
                  borderBottomColor: theme.tabBarBorder,
                  borderBottomWidth: theme.borderWidth || 2,
                  backgroundColor: theme.tabActiveBg,
                }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: isActive ? theme.tabActiveText : theme.tabInactiveText },
                isActive && { fontWeight: '600' }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Orbitron_500Medium',
    letterSpacing: 0.5,
  },
});

// List Renderer
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { UIComponent, UISchema } from '../../types/ui-schema';

interface ListRendererProps {
  component: UIComponent;
  theme: UISchema['theme'];
  combinedStyle: any;
  renderChild: (child: UIComponent, data: any) => React.ReactNode;
}

export function ListRenderer({ component, theme, combinedStyle, renderChild }: ListRendererProps) {
  const props = component.props as any;
  
  if (props.loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} style={combinedStyle} />;
  }
  
  return (
    <FlatList
      data={props.items}
      renderItem={({ item }) => (
        component.children?.[0] ? renderChild(component.children[0], item) : null
      )}
      ItemSeparatorComponent={props.separator ? () => <View style={{ height: 1, backgroundColor: theme.colors.border }} /> : undefined}
      ListEmptyComponent={
        props.emptyMessage ? (
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 20 }}>
            {props.emptyMessage}
          </Text>
        ) : null
      }
      style={combinedStyle}
      nestedScrollEnabled={true}
      scrollEnabled={false}
    />
  );
}

// Modular Component Renderer: Refactored version with separated components
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { UIComponent, UISchema } from '../types/ui-schema';
import {
    BadgeRenderer,
    ButtonRenderer,
    CardRenderer,
    ChipGroupRenderer,
    ImageRenderer,
    InputRenderer,
    ListRenderer,
    PhotoGridRenderer,
    StackRenderer,
    TextRenderer,
    TransportTicketsRenderer,
    convertLayoutToStyle,
    convertStyleToRN,
    convertTypographyToStyle
} from './components';

interface ModularComponentRendererProps {
  schema: UISchema;
  onAction?: (actionId: string, params?: any) => void;
}

export function ModularComponentRenderer({ schema, onAction }: ModularComponentRendererProps) {
  const handleAction = (actionId?: string, params?: any) => {
    if (!actionId) return;
    
    const action = schema.actions?.[actionId];
    if (action && onAction) {
      onAction(actionId, { ...action.params, ...params });
    }
  };

  return (
    <View style={styles.container}>
      {schema.components.map((component) => (
        <RenderComponent
          key={component.id}
          component={component}
          theme={schema.theme}
          onAction={handleAction}
        />
      ))}
    </View>
  );
}

interface RenderComponentProps {
  component: UIComponent;
  theme: UISchema['theme'];
  onAction: (actionId?: string, params?: any) => void;
  data?: any;
}

function RenderComponent({ component, theme, onAction, data }: RenderComponentProps) {
  // Convert schema layout to React Native style
  const layoutStyle = convertLayoutToStyle(component.layout);
  const customStyle = convertStyleToRN(component.style);
  const combinedStyle = { ...layoutStyle, ...customStyle };
  
  // Merge data into props if provided (for list items)
  const mergedProps = data ? { ...component.props, ...data } : component.props;
  
  // Create a new component with merged props
  const componentWithData = data ? { ...component, props: mergedProps } : component;

  // Handle haptic feedback
  const handlePress = () => {
    if (component.interaction?.hapticFeedback) {
      const feedbackMap: Record<string, any> = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(feedbackMap[component.interaction.hapticFeedback] || Haptics.ImpactFeedbackStyle.Medium);
    }
    onAction(component.interaction?.onPress, data);
  };

  // Render child component helper
  const renderChild = (child: UIComponent, childData?: any) => (
    <RenderComponent
      key={child.id}
      component={child}
      theme={theme}
      onAction={onAction}
      data={childData}
    />
  );

  switch (component.type as any) {
    case 'text':
      return (
        <TextRenderer
          component={component}
          theme={theme}
          combinedStyle={combinedStyle}
          typographyStyle={convertTypographyToStyle(component.style?.typography)}
        />
      );

    case 'input':
      return (
        <InputRenderer
          component={component}
          theme={theme}
          combinedStyle={combinedStyle}
        />
      );

    case 'button':
      return (
        <ButtonRenderer
          component={component}
          theme={theme}
          onPress={handlePress}
          combinedStyle={combinedStyle}
        />
      );

    case 'card':
      return (
        <CardRenderer
          component={componentWithData}
          theme={theme}
          onPress={component.interaction?.onPress ? handlePress : undefined}
          combinedStyle={combinedStyle}
        />
      );

    case 'list':
      return (
        <ListRenderer
          component={component}
          theme={theme}
          combinedStyle={combinedStyle}
          renderChild={renderChild}
        />
      );

    case 'chip-group':
      return (
        <ChipGroupRenderer
          component={component}
          theme={theme}
          onAction={onAction}
          combinedStyle={combinedStyle}
        />
      );

    case 'image':
      return (
        <ImageRenderer
          component={component}
          theme={theme}
          combinedStyle={combinedStyle}
        />
      );

    case 'stack':
      return (
        <StackRenderer
          component={component}
          combinedStyle={combinedStyle}
          renderChild={renderChild}
        />
      );

    case 'badge':
      return (
        <BadgeRenderer
          component={component}
          theme={theme}
          combinedStyle={combinedStyle}
        />
      );

    case 'photo-grid':
      return <PhotoGridRenderer component={component} />;

    case 'transport-tickets':
      return <TransportTicketsRenderer component={component} theme={theme} />;

    default:
      console.warn(`⚠️ [ModularComponentRenderer] Unknown component type: ${component.type}`);
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

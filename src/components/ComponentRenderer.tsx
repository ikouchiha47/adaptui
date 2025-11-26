import { ComponentStyle, UIComponent } from '@/types';
import React from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ComponentRendererProps {
  component: UIComponent;
  onComponentInteraction?: (componentId: string, action: string, data?: any) => void;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({ 
  component, 
  onComponentInteraction 
}) => {
  const renderComponent = () => {
    switch (component.type) {
      case 'text':
        return <TextComponent component={component} />;
      case 'button':
        return <ButtonComponent component={component} onPress={onComponentInteraction} />;
      case 'card':
        return <CardComponent component={component} onInteraction={onComponentInteraction} />;
      case 'list':
        return <ListComponent component={component} onItemPress={onComponentInteraction} />;
      case 'image':
        return <ImageComponent component={component} />;
      case 'input':
        return <InputComponent component={component} onChange={onComponentInteraction} />;
      case 'webview':
        return <WebViewComponent component={component} />;
      default:
        return <TextComponent component={component} />;
    }
  };

  return (
    <View style={[getBaseStyle(component.style), component.style]}>
      {renderComponent()}
    </View>
  );
};

const TextComponent: React.FC<{ component: UIComponent }> = ({ component }) => {
  const { text, variant = 'body', color } = component.props;
  
  const getTextStyle = () => {
    switch (variant) {
      case 'title':
        return { fontSize: 24, fontWeight: 'bold' as const };
      case 'subtitle':
        return { fontSize: 18, fontWeight: '600' as const };
      case 'caption':
        return { fontSize: 12, color: '#6B7280' };
      default:
        return { fontSize: 16 };
    }
  };

  return (
    <Text style={[getTextStyle(), color && { color }]}>
      {text}
    </Text>
  );
};

const ButtonComponent: React.FC<{ 
  component: UIComponent; 
  onPress?: (id: string, action: string, data?: any) => void;
}> = ({ component, onPress }) => {
  const { text, variant = 'primary', disabled = false, loading = false } = component.props;
  
  const getButtonStyle = () => {
    const baseStyle = {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    switch (variant) {
      case 'primary':
        return [baseStyle, { backgroundColor: '#3B82F6' }];
      case 'secondary':
        return [baseStyle, { backgroundColor: '#E5E7EB' }];
      case 'outline':
        return [baseStyle, { 
          backgroundColor: 'transparent', 
          borderWidth: 1, 
          borderColor: '#3B82F6' 
        }];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: '#FFFFFF', fontWeight: '600' as const };
      case 'secondary':
        return { color: '#1F2937', fontWeight: '600' as const };
      case 'outline':
        return { color: '#3B82F6', fontWeight: '600' as const };
      default:
        return { color: '#FFFFFF' };
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={() => onPress?.(component.id, 'button_press', component.props)}
      disabled={disabled || loading}
    >
      {loading ? (
        <Text style={getTextStyle()}>Loading...</Text>
      ) : (
        <Text style={getTextStyle()}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const CardComponent: React.FC<{ 
  component: UIComponent; 
  onInteraction?: (id: string, action: string, data?: any) => void;
}> = ({ component, onInteraction }) => {
  const { title, subtitle, content, image, actions = [] } = component.props;
  
  return (
    <View style={styles.card}>
      {image && (
        <Image source={{ uri: image }} style={styles.cardImage} />
      )}
      
      <View style={styles.cardContent}>
        {title && <Text style={styles.cardTitle}>{title}</Text>}
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        {content && <Text style={styles.cardText}>{content}</Text>}
        
        {actions.length > 0 && (
          <View style={styles.cardActions}>
            {actions.map((action: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.cardAction}
                onPress={() => onInteraction?.(component.id, action.id, action.data)}
              >
                <Text style={styles.cardActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const ListComponent: React.FC<{ 
  component: UIComponent; 
  onItemPress?: (id: string, action: string, data?: any) => void;
}> = ({ component, onItemPress }) => {
  const { items, itemStyle = 'default' } = component.props;
  
  const renderItem = (item: any, index: number) => {
    const handlePress = () => {
      onItemPress?.(component.id, 'list_item_press', { item, index });
    };

    switch (itemStyle) {
      case 'card':
        return (
          <TouchableOpacity key={index} style={styles.listCardItem} onPress={handlePress}>
            <CardComponent component={{ 
              id: `list-item-${index}`, 
              type: 'card', 
              props: item 
            }} />
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity key={index} style={styles.listItem} onPress={handlePress}>
            <Text style={styles.listItemText}>{item.title || item.text || item.name}</Text>
            {item.subtitle && (
              <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
            )}
          </TouchableOpacity>
        );
    }
  };

  return (
    <ScrollView style={styles.listContainer}>
      {items.map(renderItem)}
    </ScrollView>
  );
};

const ImageComponent: React.FC<{ component: UIComponent }> = ({ component }) => {
  const { source, width, height, resizeMode = 'cover' } = component.props;
  
  return (
    <Image 
      source={{ uri: source }} 
      style={[{ width, height }, styles.image]}
      resizeMode={resizeMode}
    />
  );
};

const InputComponent: React.FC<{ 
  component: UIComponent; 
  onChange?: (id: string, action: string, data?: any) => void;
}> = ({ component, onChange }) => {
  const { placeholder, value, keyboardType = 'default', multiline = false } = component.props;
  
  return (
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      placeholder={placeholder}
      value={value}
      onChangeText={(text) => onChange?.(component.id, 'input_change', { value: text })}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  );
};

const WebViewComponent: React.FC<{ component: UIComponent }> = ({ component }) => {
  const { url, title } = component.props;
  
  // For now, we'll show a placeholder
  // In a real implementation, you'd use react-native-webview
  return (
    <View style={styles.webviewContainer}>
      <Text style={styles.webviewTitle}>{title || 'Web Content'}</Text>
      <Text style={styles.webviewUrl}>{url}</Text>
      <Text style={styles.webviewPlaceholder}>
        Web content would be displayed here
      </Text>
    </View>
  );
};

const getBaseStyle = (style?: ComponentStyle) => {
  return {
    margin: style?.margin || 8,
    padding: style?.padding || 12,
    backgroundColor: style?.backgroundColor,
    borderRadius: style?.borderRadius || 8,
  };
};

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%' as any,
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    marginTop: 12,
  },
  cardAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardActionText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listContainer: {
    maxHeight: 300,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listCardItem: {
    marginBottom: 12,
  },
  listItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500' as const,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  image: {
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  webviewContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  webviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  webviewUrl: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  webviewPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic' as const,
  },
};

export default ComponentRenderer;
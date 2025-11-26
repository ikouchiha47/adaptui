// Complete integration example: Query → Schema → Rendered UI

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, PixelRatio, Platform, View } from 'react-native';
import { DeviceContext, UISchema } from '../../types/ui-schema';
import { ComponentRenderer } from '../ComponentRenderer';
import { SchemaValidator } from '../SchemaValidator';
import { UIGenerator } from '../UIGenerator';

interface DynamicUIScreenProps {
  query: string;
  onAction?: (actionId: string, params: any) => void;
}

export function DynamicUIScreen({ query, onAction }: DynamicUIScreenProps) {
  const [schema, setSchema] = useState<UISchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateUI();
  }, [query]);

  const generateUI = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get device context
      const { width, height } = Dimensions.get('window');
      const deviceContext: DeviceContext = {
        dimensions: {
          width,
          height,
          scale: PixelRatio.get()
        },
        platform: Platform.OS as 'ios' | 'android',
        orientation: width > height ? 'landscape' : 'portrait',
        safeArea: {
          top: Platform.OS === 'ios' ? 44 : 0,
          bottom: Platform.OS === 'ios' ? 34 : 0,
          left: 0,
          right: 0
        }
      };

      // 2. Generate UI schema
      const generator = new UIGenerator();
      const rawSchema = await generator.generateUI(query, deviceContext);

      // 3. Validate schema
      const validator = new SchemaValidator();
      const validSchema = validator.validate(rawSchema);

      // 4. Set schema (triggers render)
      setSchema(validSchema);
      setLoading(false);

    } catch (err) {
      console.error('UI generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleAction = (actionId: string, params: any) => {
    console.log('Action triggered:', actionId, params);
    
    // Handle built-in actions
    if (actionId === 'refresh') {
      generateUI();
      return;
    }

    // Pass to parent handler
    if (onAction) {
      onAction(actionId, params);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  // Render dynamic UI
  if (!schema) {
    return null;
  }

  return <ComponentRenderer schema={schema} onAction={handleAction} />;
}

// Example usage in your app
export function ExampleUsage() {
  const [currentQuery, setCurrentQuery] = useState('Find romantic restaurants in Paris');

  const handleAction = (actionId: string, params: any) => {
    switch (actionId) {
      case 'search':
        setCurrentQuery(params.query);
        break;
      
      case 'navigate':
        // Navigate to another screen
        console.log('Navigate to:', params.screen);
        break;
      
      case 'filter':
        // Apply filters
        console.log('Apply filters:', params);
        break;
      
      default:
        console.log('Unknown action:', actionId);
    }
  };

  return (
    <DynamicUIScreen 
      query={currentQuery}
      onAction={handleAction}
    />
  );
}

// Multiple queries example
export function MultiQueryExample() {
  const queries = [
    'Find romantic restaurants in Paris under $50',
    'Show me nearby coffee shops',
    'Book a flight to Tokyo',
    'Create a new task list',
    'Show weather forecast for next week'
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <DynamicUIScreen 
        query={queries[currentIndex]}
        onAction={(actionId, params) => {
          if (actionId === 'next') {
            setCurrentIndex((currentIndex + 1) % queries.length);
          }
        }}
      />
    </View>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { LLMResponse } from '@/types';
import ComponentRenderer from '@/components/ComponentRenderer';

export default function Index() {
  const [query, setQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    processQuery,
    responses,
    isLoading,
    error,
    currentQuery,
    initializeApp,
    clearError
  } = useAppStore();

  useEffect(() => {
    // Initialize app with a placeholder API key for now
    // In production, this would be securely stored
    if (!isInitialized) {
      initializeApp('YOUR_GEMINI_API_KEY_HERE').then(() => {
        setIsInitialized(true);
      }).catch((err: any) => {
        console.error('Failed to initialize app:', err);
      });
    }
  }, [isInitialized, initializeApp]);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    clearError();
    await processQuery(query.trim());
    setQuery('');
  };

  const renderResponse = (response: LLMResponse) => {
    // Special handling for different categories in MVP
    const getCategorySpecificUI = () => {
      switch (response.category.id) {
        case 'text-search':
          return renderTextSearchUI(response);
        case 'maps-locations':
          return renderMapsLocationUI(response);
        case 'food':
          return renderFoodUI(response);
        default:
          return renderGenericUI(response);
      }
    };

    return (
      <View key={response.id} style={styles.responseContainer}>
        <View style={styles.responseHeader}>
          <Text style={styles.categoryText}>
            {response.category.icon} {response.category.name}
          </Text>
          <Text style={styles.confidenceText}>
            {Math.round(response.confidence * 100)}% confidence
          </Text>
        </View>
        
        {getCategorySpecificUI()}
        
        {response.reasoning && (
          <Text style={styles.reasoningText}>
            Reasoning: {response.reasoning}
          </Text>
        )}
      </View>
    );
  };

  const renderTextSearchUI = (response: LLMResponse) => {
    return (
      <View style={styles.categorySpecificContainer}>
        <Text style={styles.categoryTitle}>Search Results</Text>
        {response.components.map((component: any) => (
          <ComponentRenderer 
            key={component.id} 
            component={component}
            onComponentInteraction={handleComponentInteraction}
          />
        ))}
      </View>
    );
  };

  const renderMapsLocationUI = (response: LLMResponse) => {
    return (
      <View style={styles.categorySpecificContainer}>
        <Text style={styles.categoryTitle}>Location Information</Text>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>🗺️ Map View</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Location data would be displayed here
          </Text>
        </View>
        {response.components.map((component: any) => (
          <ComponentRenderer 
            key={component.id} 
            component={component}
            onComponentInteraction={handleComponentInteraction}
          />
        ))}
      </View>
    );
  };

  const renderFoodUI = (response: LLMResponse) => {
    return (
      <View style={styles.categorySpecificContainer}>
        <Text style={styles.categoryTitle}>Food & Restaurants</Text>
        {response.components.map((component: any) => (
          <ComponentRenderer 
            key={component.id} 
            component={component}
            onComponentInteraction={handleComponentInteraction}
          />
        ))}
      </View>
    );
  };

  const renderGenericUI = (response: LLMResponse) => {
    return (
      <View style={styles.componentsContainer}>
        {response.components.map((component: any) => (
          <ComponentRenderer 
            key={component.id} 
            component={component}
            onComponentInteraction={handleComponentInteraction}
          />
        ))}
      </View>
    );
  };

  const handleComponentInteraction = (componentId: string, action: string, data?: any) => {
    console.log(`Component interaction: ${componentId}, Action: ${action}, Data:`, data);
    
    // Handle different component interactions
    switch (action) {
      case 'button_press':
        Alert.alert('Button Pressed', `Component ${componentId} was pressed`);
        break;
      case 'list_item_press':
        Alert.alert('Item Selected', `Selected: ${data?.item?.title || 'Unknown item'}`);
        break;
      case 'input_change':
        console.log(`Input changed in ${componentId}:`, data?.value);
        break;
      default:
        console.log('Unknown interaction:', action);
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Initializing AdaptUI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AdaptUI</Text>
            <Text style={styles.subtitle}>
              Your intelligent, adaptive interface
            </Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ask me anything..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchButtonText}>→</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Current Query */}
          {currentQuery && (
            <View style={styles.currentQueryContainer}>
              <Text style={styles.currentQueryLabel}>You asked:</Text>
              <Text style={styles.currentQueryText}>{currentQuery.query}</Text>
            </View>
          )}

          {/* Responses */}
          <View style={styles.responsesContainer}>
            {responses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Welcome to AdaptUI</Text>
                <Text style={styles.emptyStateText}>
                  Ask anything and I'll create a custom interface just for you.
                  {'\n'}Try: "Find Italian restaurants near me" or "What's the weather like?"
                </Text>
              </View>
            ) : (
              responses.map(renderResponse)
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButton: {
    marginLeft: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  currentQueryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentQueryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentQueryText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  responsesContainer: {
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  responseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  componentsContainer: {
    marginBottom: 16,
  },
  componentContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  componentType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  componentContent: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  reasoningText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  categorySpecificContainer: {
    marginTop: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  mapPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  mapPlaceholderText: {
    fontSize: 24,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});

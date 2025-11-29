// WebView Modal - In-app browser for booking links

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewModalProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  theme: any;
  accentColor: string;
}

export const WebViewModal: React.FC<WebViewModalProps> = ({
  visible,
  url,
  onClose,
  theme,
  accentColor
}) => {
  const [loading, setLoading] = React.useState(true);
  const [canGoBack, setCanGoBack] = React.useState(false);
  const webViewRef = React.useRef<WebView>(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderBottomColor: accentColor,
        }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.headerButton, { backgroundColor: `${accentColor}20` }]}
            >
              <Ionicons name="close" size={24} color={accentColor} />
            </TouchableOpacity>
            
            {canGoBack && (
              <TouchableOpacity
                onPress={() => webViewRef.current?.goBack()}
                style={[styles.headerButton, { backgroundColor: `${accentColor}20` }]}
              >
                <Ionicons name="arrow-back" size={24} color={accentColor} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Booking
          </Text>

          <TouchableOpacity
            onPress={() => webViewRef.current?.reload()}
            style={[styles.headerButton, { backgroundColor: `${accentColor}20` }]}
          >
            <Ionicons name="refresh" size={20} color={accentColor} />
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading...
            </Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          // Inject custom CSS for dark theme
          injectedJavaScript={`
            (function() {
              const style = document.createElement('style');
              style.textContent = \`
                * {
                  scrollbar-width: thin;
                  scrollbar-color: ${accentColor} rgba(0,0,0,0.2);
                }
                ::-webkit-scrollbar {
                  width: 8px;
                }
                ::-webkit-scrollbar-track {
                  background: rgba(0,0,0,0.2);
                }
                ::-webkit-scrollbar-thumb {
                  background: ${accentColor};
                  border-radius: 4px;
                }
              \`;
              document.head.appendChild(style);
            })();
            true;
          `}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 2,
    fontSize: 16,
    fontFamily: 'Orbitron_600SemiBold',
    color: 'rgba(248, 250, 252, 1)',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Orbitron_500Medium',
  },
  webview: {
    flex: 1,
  },
});

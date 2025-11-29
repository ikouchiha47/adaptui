// Hidden WebView for scraping DDG (bypasses CAPTCHA)
import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ScrapedContent {
  url: string;
  title: string;
  bodyText: string;
  bodyHTML: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  fullHTML?: string;
  timestamp: number;
}

interface HiddenWebViewScraperProps {
  url: string;
  onContentReceived?: (content: ScrapedContent) => void;
  onHTMLReceived?: (html: string) => void; // Legacy support
  onError: (error: string) => void;
}

export function HiddenWebViewScraper({ url, onContentReceived, onHTMLReceived, onError }: HiddenWebViewScraperProps) {
  const webViewRef = useRef<WebView>(null);

  const injectedJavaScript = `
    (function() {
      // Wait for page to load
      setTimeout(() => {
        try {
          // Get the full HTML
          const html = document.documentElement.outerHTML;
          
          // Extract clean body content (no scripts/styles)
          const body = document.body.cloneNode(true);
          
          // Remove script and style tags
          const scripts = body.querySelectorAll('script, style, noscript');
          scripts.forEach(el => el.remove());
          
          // Get text content
          const bodyText = body.textContent || body.innerText || '';
          
          // Get HTML content (cleaned)
          const bodyHTML = body.innerHTML;
          
          // Extract metadata
          const title = document.title || '';
          const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
          const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
          const author = document.querySelector('meta[name="author"]')?.getAttribute('content') || '';
          
          // Send back to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'content',
            url: window.location.href,
            title: title,
            bodyText: bodyText.trim(),
            bodyHTML: bodyHTML,
            metadata: {
              description: description,
              keywords: keywords,
              author: author
            },
            fullHTML: html,
            timestamp: Date.now()
          }));
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: error.toString(),
            url: window.location.href
          }));
        }
      }, 3000); // Wait 3 seconds for page to fully load
      
      true; // Required for iOS
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      console.log('[WebViewScraper] Message received:', {
        type: data.type,
        url: data.url,
        titleLength: data.title?.length,
        bodyTextLength: data.bodyText?.length,
        bodyHTMLLength: data.bodyHTML?.length
      });
      
      if (data.type === 'content') {
        // New content extraction format
        if (onContentReceived) {
          onContentReceived(data as ScrapedContent);
        }
        // Legacy support
        if (onHTMLReceived && data.fullHTML) {
          onHTMLReceived(data.fullHTML);
        }
      } else if (data.type === 'html' && data.html) {
        // Legacy format
        if (onHTMLReceived) {
          onHTMLReceived(data.html);
        }
      } else if (data.type === 'error') {
        console.error('[WebViewScraper] WebView error:', data.error);
        onError(data.error);
      }
    } catch (error) {
      console.error('[WebViewScraper] Parse error:', error);
      onError(String(error));
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[WebViewScraper] WebView error:', nativeEvent);
    onError(nativeEvent.description || 'WebView error');
  };

  const handleLoadEnd = () => {
    console.log('[WebViewScraper] Page loaded:', url);
  };

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
}

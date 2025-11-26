// Configuration manager for API keys and settings
import config from '../../config.json';

export interface AppConfig {
  apiKeys: {
    gemini: string;
    googlePlaces: string;
    openai: string;
    anthropic: string;
  };
  settings: {
    useRealData: boolean;
    defaultLLMProvider: 'gemini' | 'openai' | 'anthropic';
    geminiModel?: string;
    openaiModel?: string;
    cacheEnabled: boolean;
    debugMode: boolean;
  };
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = config as AppConfig;
    this.validateConfig();
  }

  private validateConfig() {
    if (this.config.settings.debugMode) {
      console.log('🔧 Config loaded:', {
        hasGeminiKey: !!this.config.apiKeys.gemini,
        hasGooglePlacesKey: !!this.config.apiKeys.googlePlaces,
        useRealData: this.config.settings.useRealData,
      });
    }

    // Warn if keys are missing
    if (!this.config.apiKeys.gemini) {
      console.warn('⚠️ Gemini API key not configured. Add it to config.json');
    }

    if (this.config.settings.useRealData && !this.config.apiKeys.googlePlaces) {
      console.warn('⚠️ Google Places API key not configured. Real data features will use mock data.');
    }
  }

  getApiKey(service: keyof AppConfig['apiKeys']): string {
    const key = this.config.apiKeys[service];
    if (!key) {
      throw new Error(`API key for ${service} not configured. Please add it to config.json`);
    }
    return key;
  }

  getApiKeyOrNull(service: keyof AppConfig['apiKeys']): string | null {
    return this.config.apiKeys[service] || null;
  }

  getSetting<K extends keyof AppConfig['settings']>(key: K): AppConfig['settings'][K] {
    return this.config.settings[key];
  }

  isDebugMode(): boolean {
    return this.config.settings.debugMode;
  }

  shouldUseRealData(): boolean {
    return this.config.settings.useRealData;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getModelName(): string {
    return this.config.settings.geminiModel || 'gemini-2.5-flash';
  }

  getOpenAIModel(): string {
    return this.config.settings.openaiModel || 'gpt-4-turbo';
  }
}

// Singleton instance
export const configManager = new ConfigManager();

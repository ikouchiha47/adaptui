import { configManager } from '../config/ConfigManager';
import { GeminiCore } from './GeminiCore';
import { OpenAICore } from './OpenAICore';

export type LLMProvider = GeminiCore | OpenAICore;

export class LLMProviderFactory {
  /**
   * Get LLM provider based on defaultLLMProvider config setting
   * Respects user's preference and falls back intelligently
   */
  static getProvider(): LLMProvider {
    const defaultProvider = configManager.getSetting('defaultLLMProvider') || 'gemini';
    
    if (defaultProvider === 'gemini') {
      const geminiKey = configManager.getApiKeyOrNull('gemini');
      if (geminiKey) {
        return new GeminiCore(geminiKey, configManager.getModelName());
      }
    } else if (defaultProvider === 'openai') {
      const openaiKey = configManager.getApiKeyOrNull('openai');
      if (openaiKey) {
        return new OpenAICore(openaiKey, configManager.getOpenAIModel());
      }
    }
    
    // Fallback: try any available key
    const openaiKey = configManager.getApiKeyOrNull('openai');
    const geminiKey = configManager.getApiKeyOrNull('gemini');
    
    if (openaiKey) {
      console.warn('⚠️ Falling back to OpenAI (default provider key not available)');
      return new OpenAICore(openaiKey, configManager.getOpenAIModel());
    } else if (geminiKey) {
      console.warn('⚠️ Falling back to Gemini (no OpenAI key available)');
      return new GeminiCore(geminiKey, configManager.getModelName());
    }
    
    throw new Error('No LLM API keys configured. Please add OpenAI or Gemini key to config.json');
  }
}

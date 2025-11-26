// LLM Provider Interface - Unified interface for all LLM providers

export interface LLMProvider {
  /**
   * Generate content with optional JSON mode
   */
  generateContent(prompt: string, jsonSchema?: any): Promise<string>;
  
  /**
   * Generate minimal hybrid UI structure
   */
  generateHybridStructure(prompt: string): Promise<string>;
}

import {
  Category,
  LLMResponse,
  QueryRequest
} from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { zodToJsonSchema } from "zod-to-json-schema";
import { reasoningService } from '../services/ReasoningService';
import { toolService } from '../services/ToolService';
import { HybridUIStructureSchema } from '../types/hybrid-ui.zod';
import { LLMProvider } from './LLMProvider';


export class GeminiCore implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  public model: any; // Public for direct access in services

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  async processQuery(query: QueryRequest, category: Category): Promise<LLMResponse> {
    const pattern = reasoningService.selectReasoningPattern(query, category);
    const reasoningResult = await this.executeReasoning(query, pattern);
    
    return {
      id: query.id,
      category,
      components: reasoningResult.components,
      reasoning: reasoningResult.reasoning,
      confidence: reasoningResult.confidence,
      metadata: reasoningResult.metadata
    };
  }

  private async executeReasoning(query: QueryRequest, pattern: any): Promise<any> {
    const prompt = reasoningService.buildReasoningPrompt(query, pattern);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response to extract components and reasoning
      return reasoningService.parseLLMResponse(text, query);
    } catch (error) {
      console.error('LLM processing error:', error);
      throw new Error(`Failed to process query: ${error}`);
    }
  }

  // Tool calling functionality - delegates to ToolService
  async callTool(toolName: string, parameters: any): Promise<any> {
    return await toolService.callTool(toolName, parameters);
  }

  /**
   * Generate content with optional JSON mode
   */
  async generateContent(prompt: string, jsonSchema?: any): Promise<string> {
    const genConfig: any = {
      temperature: 0.7,
      responseMimeType: jsonSchema ? 'application/json' : 'text/plain',
    };

    if (jsonSchema) {
      genConfig.responseSchema = zodToJsonSchema(jsonSchema, {
        $refStrategy: 'none'
      });
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: genConfig,
    });

    return await result.response.text();
  }

  /**
   * Generate minimal hybrid UI structure
   */
  async generateHybridStructure(prompt: string): Promise<string> {
    const jsonSchema = zodToJsonSchema(HybridUIStructureSchema as any, {
      name: 'HybridUIStructure',
      $refStrategy: 'none'
    });

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        responseSchema: jsonSchema,
      },
    });
    return await result.response.text();
  }
}

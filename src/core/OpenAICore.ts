// OpenAI Core - LLM integration with better JSON support
import OpenAI from 'openai';
import { zodTextFormat } from "openai/helpers/zod";
import { HybridUIStructureSchema } from '../types/hybrid-ui.zod';
import { LLMProvider } from './LLMProvider';

export class OpenAICore implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';
  private client?: OpenAI;

  constructor(apiKey: string, model: string = 'gpt-4-turbo') {
    this.apiKey = apiKey;
    this.model = model;
    // Initialize official OpenAI SDK client (reserved for future use)
    try {
      this.client = new OpenAI({ apiKey: this.apiKey });
    } catch (e) {
      console.warn('⚠️ [OpenAICore] Failed to initialize OpenAI SDK client; continuing with fetch-based calls.');
    }
  }

  /**
   * Generate content with JSON mode
   */
  async generateContent(prompt: string, jsonSchema?: any): Promise<string> {
    try {
      console.log(`🤖 [OpenAICore] Calling ${this.model}...`);
      const startTime = Date.now();

      // Use Responses API for GPT-5 models with structured output
      const isGpt5 = this.model.includes('gpt-5');
      // const data = await response.json();
      const duration = Date.now() - startTime;

      console.log(`✅ [OpenAICore] Response received (${duration}ms)`);
      return await this.generateStructuredResponse(
        prompt,
        jsonSchema ? zodTextFormat(jsonSchema, "output_schema") : null);

      // return data.choices[0].message.content;
    } catch (error) {
      console.error('❌ [OpenAICore] Error:', error);
      throw error;
    }
  }

  /**
   * Generate minimal hybrid UI structure for the hybrid flow.
   * Uses chat completions JSON mode; structure is validated with Zod
   * on the client side in UIGenerator.generateHybridFromPrompt.
   */
  async generateHybridStructure(prompt: string): Promise<string> {
    try {
      console.log('🔧 [OpenAICore] Using chat completions JSON mode for HYBRID structure...');
      console.dir(zodTextFormat(HybridUIStructureSchema, "ui_schema"))

      // const response = await fetch(`${this.baseUrl}/v1/responses`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`
      //   },
      //   body: JSON.stringify({
      //     model: this.model,
      //     input: [
      //       {role: 'system', content: "You are an expert UX and creative UI designs"},
      //       { role: 'user', content: prompt }
      //     ],
      //     temperature: 0.7,
      //     text: {
      //       format: zodTextFormat(HybridUIStructureSchema, "ui_schema")
      //      },
      //     // max_completion_tokens: 1024,
      //   })
      // });

      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(`OpenAI API error (hybrid): ${error.error?.message || response.statusText}`);
      // }

      // const data = await response.json();
      // const text = data.choices[0].message.content;
      // if (typeof text !== 'string') {
      //   throw new Error('Hybrid response was not text');
      // }

      const response = await this.client?.responses.parse({
        model: "gpt-4.1",
        input: [
          { role: 'system', content: "You are an expert UX and creative UI designs. Convert the information into UI using the provided base components." },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        text: {
          format: zodTextFormat(HybridUIStructureSchema, "ui")
        },
      })

      if (response?.status === "failed" || response?.status == "cancelled") {
        throw new Error(`OpenAI API error (hybrid): ${response.error}`);
      }

      const text = JSON.stringify(response?.output_parsed)
      console.log('📝 [OpenAICore] Hybrid JSON preview:', text);
      return text;
    } catch (error) {
      console.error('❌ [OpenAICore] Hybrid generation error:', error);
      throw error;
    }
  }

  /**
   * Generate structured response using Responses API (GPT-5)
   * Uses a manual JSON Schema object that we know the API accepts.
   */
  private async generateStructuredResponse(prompt: string, jsonSchema?: any): Promise<string> {
    const timeout = 90000; // 90 second timeout for complex schemas
    
    try {
      console.log('🔧 [OpenAICore] Using Responses API for structured output...');
      const startTime = Date.now();

      console.log('📋 [OpenAICore] Using simplified JSON schema');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ [OpenAICore] Responses API timeout, aborting...');
        controller.abort();
      }, timeout);

      const response = await this.client?.responses.parse({
        model: this.model,
          reasoning: { effort: 'low' },
          input: [
            {
              role: 'user',
              content: prompt
            }
          ],
          text: {
            format: jsonSchema ? jsonSchema : { type: 'json_object' }
          },
      }, {signal: controller.signal})

      // const response = await fetch(`${this.baseUrl}/responses`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`
      //   },
      //   body: JSON.stringify({
      //     model: this.model,
      //     reasoning: { effort: 'low' },
      //     input: [
      //       {
      //         role: 'user',
      //         content: prompt
      //       }
      //     ],
      //     text: {
      //       format: jsonSchema ? jsonSchema : { type: 'json_object' }
      //     }
      //   }),
      //   signal: controller.signal
      // });

      clearTimeout(timeoutId);

      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(`OpenAI Responses API error: ${error.error?.message || response.statusText}`);
      // }

      if(response?.status == "failed" || response?.status == "cancelled") {
        throw new Error(`OpenAI Responses API error: ${response?.error}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [OpenAICore] Structured response received (${duration}ms)`);

      if(!jsonSchema) {
        return response?.output_text || ""
      }

      const data = response?.output_parsed;

      // Extract the JSON content from the response
      // const messageOutput = data.output?.find((o: any) => o.type === 'message');
      // const textOutput = messageOutput?.content?.find((c: any) => c.type === 'output_text');
      // const jsonText = textOutput?.text;
      
      // if (!jsonText) {
      //   console.error('❌ [OpenAICore] Could not extract JSON from response');
      //   console.log('Response structure:', JSON.stringify(data).substring(0, 500));
      //   throw new Error('Invalid response structure from Responses API');
      // }
      
      const jsonText = JSON.stringify(data)
      console.log('📝 [OpenAICore] Extracted JSON:', jsonText.substring(0, 200));
      
      return jsonText;
    } catch (error) {
      console.error('❌ [OpenAICore] Responses API error:', error);
      throw error;

      // console.log('🔄 [OpenAICore] Falling back to chat completions...');
      
      // Fallback to regular chat completions
      // const response = await fetch(`${this.baseUrl}/chat/completions`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`
      //   },
      //   body: JSON.stringify({
      //     model: this.model,
      //     messages: [{ role: 'user', content: prompt }],
      //     temperature: 1,
      //     response_format: { type: 'json_object' },
      //     max_completion_tokens: 4096
      //   })
      // });

      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      // }

      // const data = await response.json();
      // return data.choices[0].message.content;
    }
  }

  /**
   * Generate JSON content
   */
  async generateJSON<T>(prompt: string): Promise<T> {
    try {
      const content = await this.generateContent(prompt, true);
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ [OpenAICore] JSON parsing error:', error);
      throw error;
    }
  }
}

// Reasoning Service - Provider-agnostic reasoning patterns and prompt building

import { Category, QueryRequest, ReasoningPattern } from '@/types';

export class ReasoningService {
  private reasoningPatterns: Map<string, ReasoningPattern>;

  constructor() {
    this.reasoningPatterns = new Map();
    this.initializeReasoningPatterns();
  }

  private initializeReasoningPatterns() {
    // Tree of Thought (ToT)
    this.reasoningPatterns.set('tree-of-thought', {
      name: 'Tree of Thought',
      description: 'Explore multiple reasoning paths and evaluate them',
      steps: [
        { id: '1', type: 'thought', content: 'Generate multiple possible approaches' },
        { id: '2', type: 'thought', content: 'Evaluate each approach for feasibility' },
        { id: '3', type: 'thought', content: 'Select the most promising path' },
        { id: '4', type: 'action', content: 'Execute the chosen approach' },
        { id: '5', type: 'reflection', content: 'Analyze results and improve' }
      ],
      maxIterations: 3
    });

    // ReAct (Reasoning + Acting)
    this.reasoningPatterns.set('react', {
      name: 'ReAct',
      description: 'Alternate between reasoning and acting',
      steps: [
        { id: '1', type: 'thought', content: 'Analyze the current situation' },
        { id: '2', type: 'action', content: 'Take an action based on analysis' },
        { id: '3', type: 'observation', content: 'Observe the results' },
        { id: '4', type: 'thought', content: 'Adjust strategy based on observations' }
      ]
    });

    // Self-Reflection
    this.reasoningPatterns.set('self-reflection', {
      name: 'Self-Reflection',
      description: 'Critically examine and improve reasoning',
      steps: [
        { id: '1', type: 'thought', content: 'Initial reasoning and solution' },
        { id: '2', type: 'reflection', content: 'Critically examine the reasoning' },
        { id: '3', type: 'thought', content: 'Identify flaws and improvements' },
        { id: '4', type: 'action', content: 'Apply improvements' }
      ]
    });

    // Step-back Reasoning
    this.reasoningPatterns.set('step-back', {
      name: 'Step-back Reasoning',
      description: 'Take a broader perspective before diving into details',
      steps: [
        { id: '1', type: 'thought', content: 'Identify the core principle or concept' },
        { id: '2', type: 'thought', content: 'Step back to see the bigger picture' },
        { id: '3', type: 'thought', content: 'Apply the broader understanding' },
        { id: '4', type: 'action', content: 'Solve with enhanced perspective' }
      ]
    });

    // Chain of Thought
    this.reasoningPatterns.set('chain-of-thought', {
      name: 'Chain of Thought',
      description: 'Step-by-step reasoning process',
      steps: [
        { id: '1', type: 'thought', content: 'Break down the problem into steps' },
        { id: '2', type: 'thought', content: 'Solve each step sequentially' },
        { id: '3', type: 'thought', content: 'Combine the results' }
      ]
    });
  }

  /**
   * Select appropriate reasoning pattern based on query
   */
  selectReasoningPattern(query: QueryRequest, category?: Category): ReasoningPattern {
    const queryLower = query.query.toLowerCase();
    
    // Complex queries benefit from Tree of Thought
    if (queryLower.includes('compare') || queryLower.includes('analyze') || queryLower.includes('evaluate')) {
      return this.reasoningPatterns.get('tree-of-thought')!;
    }
    
    // Action-oriented queries use ReAct
    if (queryLower.includes('find') || queryLower.includes('search') || queryLower.includes('get')) {
      return this.reasoningPatterns.get('react')!;
    }
    
    // Reflective queries
    if (queryLower.includes('why') || queryLower.includes('explain') || queryLower.includes('reason')) {
      return this.reasoningPatterns.get('self-reflection')!;
    }
    
    // Broad questions
    if (queryLower.includes('what is') || queryLower.includes('how does')) {
      return this.reasoningPatterns.get('step-back')!;
    }
    
    // Default to Chain of Thought
    return this.reasoningPatterns.get('chain-of-thought')!;
  }

  /**
   * Build reasoning prompt for UI generation
   */
  buildReasoningPrompt(query: QueryRequest, pattern: ReasoningPattern): string {
    return `
You are AdaptUI, an intelligent interface generator. Follow this reasoning pattern: ${pattern.name}

Query: "${query.query}"

Follow these steps:
${pattern.steps.map(step => `${step.id}. ${step.type.toUpperCase()}: ${step.content}`).join('\n')}

Generate a JSON response with:
1. reasoning: Your step-by-step thought process
2. confidence: Confidence score (0-1)
3. components: Array of UI components to display
4. metadata: Additional context

Each component should have:
- type: text, button, card, list, map, image, input, chart, webview, custom
- props: Component-specific properties
- style: Styling properties
- children: Nested components (if any)

Respond only with valid JSON.`;
  }

  /**
   * Parse LLM response and extract structured data
   */
  parseLLMResponse(text: string, query: QueryRequest): any {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.components || !Array.isArray(parsed.components)) {
        throw new Error('Invalid response format: missing components array');
      }
      
      return {
        components: parsed.components,
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: parsed.confidence || 0.5,
        metadata: parsed.metadata || {}
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      // Return a fallback response
      return {
        components: [{
          id: 'fallback',
          type: 'text',
          props: { text: text }
        }],
        reasoning: 'Fallback response due to parsing error',
        confidence: 0.1,
        metadata: { error: String(error) }
      };
    }
  }
}

// Export singleton instance
export const reasoningService = new ReasoningService();

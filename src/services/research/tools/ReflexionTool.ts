// Reflexion Tool - Self-critique and reasoning correction
// Allows agent to reflect on its progress and adjust strategy

import { LLMProvider } from '@/core/LLMProvider';
import { AgentContext, Tool } from '../ReActAgent';

export class ReflexionTool implements Tool {
  name = 'reflect';
  description = 'Reflect on your progress and reasoning. Input: question about your approach (e.g., "Am I on the right track?")';

  constructor(private llm: LLMProvider) {}

  async execute(input: string, context: AgentContext): Promise<string> {
    try {
      // Get recent context
      const recentContext = await context.memory.getRecentContext(context.agentId, 10);
      
      if (recentContext.length === 0) {
        return 'No context to reflect on yet.';
      }

      const prompt = `You are reflecting on your research progress.

RECENT ACTIONS:
${recentContext.join('\n')}

REFLECTION QUESTION: ${input}

Analyze your progress:
1. Are you making progress toward the goal?
2. Is your current approach working?
3. What should you do differently?
4. What information are you still missing?

Provide a brief, actionable reflection (2-3 sentences):`;

      const reflection = await this.llm.generateContent(prompt);
      
      // Store reflection in memory
      await context.memory.set(context.agentId, `reflection_${Date.now()}`, reflection, 'thought');
      
      return reflection;

    } catch (error: any) {
      return `Reflection error: ${error.message}`;
    }
  }
}

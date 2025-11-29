// ReAct Agent - Reasoning + Acting with multi-turn LLM calls
// Inspired by CrewAI's agent architecture with tools and iterative reasoning

import { LLMProvider } from '@/core/LLMProvider';
import { SharedTempMemory } from './SharedTempMemory';
import { TaskManager } from './TaskManager';

/**
 * Tool interface - Each tool the agent can use
 */
export interface Tool {
  name: string;
  description: string;
  execute: (input: string, context: AgentContext) => Promise<string>;
}

/**
 * Agent context passed to tools
 */
export interface AgentContext {
  agentId: string;
  taskManager: TaskManager;
  memory: typeof SharedTempMemory;
  availableUrls: string[]; // URLs from search results - agent can only choose from these
}

/**
 * Thought-Action-Observation cycle
 */
export interface ReActStep {
  iteration: number;
  thought: string;
  action: string;
  actionInput: string;
  observation: string;
  timestamp: number;
}

/**
 * Agent result with reasoning trace
 */
export interface AgentResult {
  finalAnswer: string;
  steps: ReActStep[];
  iterations: number;
  success: boolean;
  confidence: number;
}

/**
 * ReAct Agent - Multi-turn reasoning with tool usage
 */
export class ReActAgent {
  private llm: LLMProvider;
  private tools: Map<string, Tool>;
  private maxIterations: number;
  private agentId: string;
  private taskManager: TaskManager;
  private memory: typeof SharedTempMemory;

  constructor(
    llm: LLMProvider,
    tools: Tool[],
    taskManager: TaskManager,
    memory: typeof SharedTempMemory,
    maxIterations: number = 5
  ) {
    this.llm = llm;
    this.tools = new Map(tools.map(t => [t.name, t]));
    this.maxIterations = maxIterations;
    this.agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.taskManager = taskManager;
    this.memory = memory;
  }

  /**
   * Run the agent with ReAct loop
   */
  async run(task: string): Promise<AgentResult> {
    console.log(`🤖 [ReActAgent ${this.agentId}] Starting task:`, task);
    
    await this.memory.init();
    await this.memory.set(this.agentId, 'task', task, 'thought');

    const steps: ReActStep[] = [];
    const context: AgentContext = {
      agentId: this.agentId,
      taskManager: this.taskManager,
      memory: this.memory,
      availableUrls: []
    };

    let currentIteration = 0;
    let finalAnswer = '';
    let success = false;

    // ReAct loop: Thought → Action → Observation
    while (currentIteration < this.maxIterations) {
      currentIteration++;
      console.log(`\n🔄 Iteration ${currentIteration}/${this.maxIterations}`);

      try {
        // Get recent context from memory
        const recentContext = await this.memory.getRecentContext(this.agentId, 5);

        // Step 1: THINK - Generate thought and action
        const { thought, action, actionInput } = await this.think(task, steps, recentContext, context.availableUrls);
        
        console.log(`💭 Thought: ${thought}`);
        console.log(`🎯 Action: ${action}`);
        console.log(`📝 Input: ${actionInput}`);

        // Store thought in memory
        await this.memory.set(this.agentId, `thought_${currentIteration}`, thought, 'thought');

        // Check if agent wants to finish
        if (action === 'FINISH') {
          finalAnswer = actionInput;
          success = true;
          steps.push({
            iteration: currentIteration,
            thought,
            action,
            actionInput,
            observation: 'Task completed',
            timestamp: Date.now()
          });
          break;
        }

        // Step 2: ACT - Execute the tool
        const observation = await this.act(action, actionInput, context);
        
        console.log(`👁️ Observation: ${observation.substring(0, 200)}...`);

        // Store observation in memory
        await this.memory.set(this.agentId, `observation_${currentIteration}`, observation, 'observation');

        // Step 3: OBSERVE - Record the result
        steps.push({
          iteration: currentIteration,
          thought,
          action,
          actionInput,
          observation,
          timestamp: Date.now()
        });

      } catch (error: any) {
        console.error(`❌ [ReActAgent] Error in iteration ${currentIteration}:`, error);
        steps.push({
          iteration: currentIteration,
          thought: 'Error occurred',
          action: 'ERROR',
          actionInput: '',
          observation: error.message,
          timestamp: Date.now()
        });
        break;
      }
    }

    // If max iterations reached without finishing
    if (!success && currentIteration >= this.maxIterations) {
      console.warn('⚠️ [ReActAgent] Max iterations reached, synthesizing answer...');
      finalAnswer = await this.synthesizeFinalAnswer(task, steps);
    }

    const confidence = this.calculateConfidence(steps, success);

    console.log(`\n✅ Task completed in ${currentIteration} iterations`);
    console.log(`📊 Confidence: ${(confidence * 100).toFixed(1)}%`);

    // Cleanup memory after task
    await this.memory.clear(this.agentId);

    return {
      finalAnswer,
      steps,
      iterations: currentIteration,
      success,
      confidence
    };
  }

  /**
   * THINK: Generate thought and decide next action with context awareness
   */
  private async think(
    task: string,
    previousSteps: ReActStep[],
    recentContext: string[],
    availableUrls: string[]
  ): Promise<{ thought: string; action: string; actionInput: string }> {
    const toolDescriptions = Array.from(this.tools.values())
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    const previousStepsText = previousSteps.length > 0
      ? previousSteps.slice(-3).map(s => // Last 3 steps only
          `Iteration ${s.iteration}:\nThought: ${s.thought}\nAction: ${s.action}(${s.actionInput})\nObservation: ${s.observation.substring(0, 300)}`
        ).join('\n\n')
      : 'No previous steps';

    const urlContext = availableUrls.length > 0
      ? `\nAVAILABLE URLs (you can only use these):\n${availableUrls.slice(0, 5).map((u, i) => `${i + 1}. ${u}`).join('\n')}`
      : '';

    const memoryContext = recentContext.length > 0
      ? `\nRECENT MEMORY:\n${recentContext.join('\n')}`
      : '';

    const prompt = `You are a research agent using ReAct (Reasoning + Acting).

TASK: ${task}

TOOLS:
${toolDescriptions}
- FINISH: Call when you have the final answer. Input should be the final answer as JSON.

PREVIOUS STEPS:
${previousStepsText}
${memoryContext}
${urlContext}

IMPORTANT RULES:
1. For scrape_url, you MUST use a URL from the AVAILABLE URLs list above
2. Do NOT make up or hallucinate URLs
3. Think step-by-step about what information you still need
4. When you have enough data, call FINISH with structured JSON

Respond in JSON:
{
  "thought": "Your reasoning about what to do next",
  "action": "Tool name (or FINISH)",
  "actionInput": "Input for the tool"
}`;

    const response = await this.llm.generateJSON(prompt, 0.7);
    const parsed = JSON.parse(response);

    return {
      thought: parsed.thought || 'Continuing',
      action: parsed.action || 'FINISH',
      actionInput: parsed.actionInput || ''
    };
  }

  /**
   * ACT: Execute the chosen tool with context
   */
  private async act(action: string, input: string, context: AgentContext): Promise<string> {
    const tool = this.tools.get(action);
    
    if (!tool) {
      throw new Error(`Unknown tool: ${action}. Available: ${Array.from(this.tools.keys()).join(', ')}`);
    }

    try {
      const result = await tool.execute(input, context);
      return result;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Synthesize final answer from observations
   */
  private async synthesizeFinalAnswer(task: string, steps: ReActStep[]): Promise<string> {
    const observations = steps
      .filter(s => s.observation && s.observation.length > 50)
      .map(s => `${s.action}: ${s.observation.substring(0, 500)}`)
      .join('\n\n');

    const prompt = `Based on the research, provide a final answer as JSON.

TASK: ${task}

RESEARCH:
${observations}

Return JSON with extracted information (price, rating, hours, etc.):`;

    return await this.llm.generateJSON(prompt, 0.3);
  }

  /**
   * Calculate confidence based on steps and success
   */
  private calculateConfidence(steps: ReActStep[], success: boolean): number {
    if (!success) return 0.3;
    
    const successfulSteps = steps.filter(s => 
      s.action !== 'ERROR' && 
      s.observation.length > 50 &&
      !s.observation.includes('Error')
    );

    return Math.min((successfulSteps.length / Math.max(steps.length, 1)) * 0.7 + 0.3, 1.0);
  }

  /**
   * Clear memory
   */
  async clearMemory(): Promise<void> {
    await this.memory.clear(this.agentId);
  }
}

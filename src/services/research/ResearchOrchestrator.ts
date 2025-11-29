// Research Orchestrator - Manages multi-turn research with LLM

import { LLMProviderFactory } from '../../core/LLMProviderFactory';
import { BaseResearchAgent, ResearchResult } from './BaseResearchAgent';

export interface OrchestrationStep {
  iteration: number;
  action: 'search' | 'analyze' | 'complete';
  query?: string;
  result?: ResearchResult;
  llmDecision?: {
    shouldContinue: boolean;
    reason: string;
    nextQuery?: string;
  };
}

export interface OrchestrationResult {
  steps: OrchestrationStep[];
  finalAnswer: string;
  confidence: number;
  totalIterations: number;
}

import { LLMProvider } from '../../core/LLMProvider';

export class ResearchOrchestrator {
  private llm: LLMProvider;
  private maxIterations: number = 3;
  
  constructor(maxIterations: number = 3) {
    this.llm = LLMProviderFactory.getProvider();
    this.maxIterations = maxIterations;
  }
  
  /**
   * Orchestrate multi-turn research with LLM decision-making
   */
  async orchestrate(
    initialQuery: string,
    agent: BaseResearchAgent,
    params?: any,
    onProgress?: (step: OrchestrationStep) => void
  ): Promise<OrchestrationResult> {
    console.log(`🎭 [Orchestrator] Starting orchestration: ${initialQuery}`);
    
    const steps: OrchestrationStep[] = [];
    let currentQuery = initialQuery;
    let iteration = 0;
    let finalAnswer = '';
    let totalConfidence = 0;
    
    while (iteration < this.maxIterations) {
      iteration++;
      console.log(`🔄 [Orchestrator] Iteration ${iteration}/${this.maxIterations}`);
      
      // Step 1: Search
      const searchStep: OrchestrationStep = {
        iteration,
        action: 'search',
        query: currentQuery
      };
      steps.push(searchStep);
      onProgress?.(searchStep);
      
      const result = await agent.research(currentQuery, params, (researchStep) => {
        // Forward research progress
        onProgress?.({
          iteration,
          action: 'search',
          query: currentQuery,
          result: { ...result, steps: [researchStep] } as any
        });
      });
      
      searchStep.result = result;
      totalConfidence += result.confidence;
      
      // Step 2: Analyze with LLM
      const analyzeStep: OrchestrationStep = {
        iteration,
        action: 'analyze'
      };
      steps.push(analyzeStep);
      onProgress?.(analyzeStep);
      
      const llmDecision = await this.askLLM(initialQuery, result, iteration);
      analyzeStep.llmDecision = llmDecision;
      
      // Step 3: Decide next action
      if (!llmDecision.shouldContinue || iteration >= this.maxIterations) {
        // Complete
        finalAnswer = await this.generateFinalAnswer(initialQuery, steps);
        
        const completeStep: OrchestrationStep = {
          iteration,
          action: 'complete'
        };
        steps.push(completeStep);
        onProgress?.(completeStep);
        
        break;
      } else {
        // Continue with refined query
        currentQuery = llmDecision.nextQuery || currentQuery;
        console.log(`🔄 [Orchestrator] Continuing with: ${currentQuery}`);
      }
    }
    
    return {
      steps,
      finalAnswer,
      confidence: totalConfidence / iteration,
      totalIterations: iteration
    };
  }
  
  /**
   * Ask LLM to analyze results and decide next action
   */
  private async askLLM(
    originalQuery: string,
    result: ResearchResult,
    iteration: number
  ): Promise<{ shouldContinue: boolean; reason: string; nextQuery?: string }> {
    const successfulSteps = result.steps.filter(s => s.status === 'complete');
    const dataPoints = successfulSteps.map(s => ({
      site: s.site,
      url: s.url,
      hasData: !!s.data
    }));
    
    const prompt = `You are a research analyst. Analyze these search results and decide if we need more research.

Original Query: "${originalQuery}"
Current Iteration: ${iteration}/3
Confidence: ${(result.confidence * 100).toFixed(0)}%

Search Results:
${JSON.stringify(dataPoints, null, 2)}

Summary:
${JSON.stringify(result.summary, null, 2)}

Decide:
1. Do we have enough information to answer the query?
2. If not, what specific information is missing?
3. What should be the next search query?

Return JSON:
{
  "shouldContinue": boolean,
  "reason": "explanation",
  "nextQuery": "refined search query if continuing"
}`;

    try {
      const text = await this.llm.generateJSON(prompt, 0.3);
      const decision = JSON.parse(text);
      
      console.log(`🤖 [Orchestrator] LLM Decision:`, decision);
      return decision;
    } catch (error) {
      console.error('❌ [Orchestrator] LLM error:', error);
      return {
        shouldContinue: false,
        reason: 'Error analyzing results'
      };
    }
  }
  
  /**
   * Generate final answer from all research steps
   */
  private async generateFinalAnswer(
    query: string,
    steps: OrchestrationStep[]
  ): Promise<string> {
    const allResults = steps
      .filter(s => s.action === 'search' && s.result)
      .map(s => s.result);
    
    const prompt = `Synthesize a final answer from these research results.

Original Query: "${query}"

Research Results:
${JSON.stringify(allResults, null, 2)}

Provide a clear, concise answer that:
1. Directly answers the query
2. Cites specific sources
3. Mentions confidence level
4. Suggests next steps if needed

Keep it under 200 words.`;

    try {
      return await this.llm.generateText(prompt);
    } catch (error) {
      console.error('❌ [Orchestrator] Final answer error:', error);
      return 'Unable to generate final answer. Please review the research results above.';
    }
  }
}

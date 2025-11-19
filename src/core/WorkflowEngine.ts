import { Workflow, WorkflowNode, WorkflowEdge } from '@/types';

export class WorkflowEngine {
  private workflows: Map<string, Workflow>;
  private activeExecutions: Map<string, WorkflowExecution>;

  constructor() {
    this.workflows = new Map();
    this.activeExecutions = new Map();
  }

  // Graph traversal algorithms
  async executeDFS(workflowId: string, startNodeId?: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const execution = new WorkflowExecution(workflow, 'DFS', startNodeId);
    this.activeExecutions.set(execution.id, execution);

    try {
      const result = await this.dfsTraversal(execution);
      execution.complete(result);
      return result;
    } catch (error) {
      execution.fail(error);
      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  async executeBFS(workflowId: string, startNodeId?: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const execution = new WorkflowExecution(workflow, 'BFS', startNodeId);
    this.activeExecutions.set(execution.id, execution);

    try {
      const result = await this.bfsTraversal(execution);
      execution.complete(result);
      return result;
    } catch (error) {
      execution.fail(error);
      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  async executeAStar(workflowId: string, startNodeId: string, goalNodeId: string, heuristic: (node: WorkflowNode) => number): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const execution = new WorkflowExecution(workflow, 'A*', startNodeId);
    execution.setGoal(goalNodeId);
    this.activeExecutions.set(execution.id, execution);

    try {
      const result = await this.aStarTraversal(execution, heuristic);
      execution.complete(result);
      return result;
    } catch (error) {
      execution.fail(error);
      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  private async dfsTraversal(execution: WorkflowExecution): Promise<any> {
    const visited = new Set<string>();
    const results: any[] = [];

    const dfs = async (nodeId: string): Promise<void> => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = execution.workflow.nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Execute node
      const result = await this.executeNode(node, execution);
      results.push(result);

      // Visit all unvisited neighbors
      const neighbors = this.getNeighbors(nodeId, execution.workflow);
      for (const neighbor of neighbors) {
        await dfs(neighbor.id);
      }
    };

    await dfs(execution.startNodeId);
    return results;
  }

  private async bfsTraversal(execution: WorkflowExecution): Promise<any> {
    const visited = new Set<string>();
    const queue: string[] = [execution.startNodeId];
    const results: any[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = execution.workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Execute node
      const result = await this.executeNode(node, execution);
      results.push(result);

      // Add unvisited neighbors to queue
      const neighbors = this.getNeighbors(nodeId, execution.workflow);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          queue.push(neighbor.id);
        }
      }
    }

    return results;
  }

  private async aStarTraversal(execution: WorkflowExecution, heuristic: (node: WorkflowNode) => number): Promise<any> {
    const openSet: AStarNode[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    // Initialize scores
    execution.workflow.nodes.forEach(node => {
      gScore.set(node.id, Infinity);
      fScore.set(node.id, Infinity);
    });

    const startNode = execution.workflow.nodes.find(n => n.id === execution.startNodeId)!;
    gScore.set(startNode.id, 0);
    fScore.set(startNode.id, heuristic(startNode));
    openSet.push({ node: startNode, fScore: heuristic(startNode) });

    const results: any[] = [];

    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;

      if (current.node.id === execution.goalNodeId) {
        // Reconstruct path and execute nodes in order
        const path = this.reconstructPath(cameFrom, current.node.id);
        for (const nodeId of path) {
          const node = execution.workflow.nodes.find(n => n.id === nodeId)!;
          const result = await this.executeNode(node, execution);
          results.push(result);
        }
        return results;
      }

      closedSet.add(current.node.id);

      // Execute current node
      const result = await this.executeNode(current.node, execution);
      results.push(result);

      // Explore neighbors
      const neighbors = this.getNeighbors(current.node.id, execution.workflow);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.id)) continue;

        const tentativeGScore = (gScore.get(current.node.id) || 0) + 1; // Assuming uniform cost

        if (tentativeGScore < (gScore.get(neighbor.id) || Infinity)) {
          cameFrom.set(neighbor.id, current.node.id);
          gScore.set(neighbor.id, tentativeGScore);
          const f = tentativeGScore + heuristic(neighbor);
          fScore.set(neighbor.id, f);

          if (!openSet.some(n => n.node.id === neighbor.id)) {
            openSet.push({ node: neighbor, fScore: f });
          }
        }
      }
    }

    throw new Error('No path found to goal');
  }

  private async executeNode(node: WorkflowNode, execution: WorkflowExecution): Promise<any> {
    console.log(`Executing node: ${node.id} (${node.type})`);
    
    // Update node status
    node.status = 'running';
    
    try {
      // Execute based on node type
      const result = await this.executeNodeByType(node, execution);
      
      node.status = 'completed';
      return result;
    } catch (error) {
      node.status = 'failed';
      throw error;
    }
  }

  private async executeNodeByType(node: WorkflowNode, execution: WorkflowExecution): Promise<any> {
    switch (node.type) {
      case 'llm_request':
        return await this.executeLLMRequest(node.data);
      case 'web_scraping':
        return await this.executeWebScraping(node.data);
      case 'data_processing':
        return await this.executeDataProcessing(node.data);
      case 'condition':
        return await this.executeCondition(node.data, execution);
      case 'delay':
        return await this.executeDelay(node.data);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async executeLLMRequest(data: any): Promise<any> {
    // Simulate LLM request
    await this.delay(1000);
    return { 
      type: 'llm_response', 
      content: `LLM response for: ${data.prompt}`,
      timestamp: new Date().toISOString()
    };
  }

  private async executeWebScraping(data: any): Promise<any> {
    // Simulate web scraping
    await this.delay(2000);
    return { 
      type: 'web_data', 
      url: data.url,
      content: `Scraped content from ${data.url}`,
      timestamp: new Date().toISOString()
    };
  }

  private async executeDataProcessing(data: any): Promise<any> {
    // Simulate data processing
    await this.delay(500);
    return { 
      type: 'processed_data', 
      input: data.input,
      output: `Processed: ${data.input}`,
      timestamp: new Date().toISOString()
    };
  }

  private async executeCondition(data: any, execution: WorkflowExecution): Promise<any> {
    // Evaluate condition and determine next path
    const condition = data.condition;
    const result = Math.random() > 0.5; // Simulate condition evaluation
    
    return { 
      type: 'condition_result', 
      condition,
      result,
      timestamp: new Date().toISOString()
    };
  }

  private async executeDelay(data: any): Promise<any> {
    await this.delay(data.duration || 1000);
    return { 
      type: 'delay_complete', 
      duration: data.duration || 1000,
      timestamp: new Date().toISOString()
    };
  }

  private getNeighbors(nodeId: string, workflow: Workflow): WorkflowNode[] {
    const neighborIds = workflow.edges
      .filter(edge => edge.from === nodeId)
      .map(edge => edge.to);
    
    return workflow.nodes.filter(node => neighborIds.includes(node.id));
  }

  private reconstructPath(cameFrom: Map<string, string>, current: string): string[] {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }
    return path;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Workflow management
  addWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  removeWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  pauseExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.pause();
      return true;
    }
    return false;
  }

  resumeExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.resume();
      return true;
    }
    return false;
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.cancel();
      this.activeExecutions.delete(executionId);
      return true;
    }
    return false;
  }
}

class WorkflowExecution {
  id: string;
  workflow: Workflow;
  algorithm: string;
  startNodeId: string;
  goalNodeId?: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: Error;
  startTime: Date;
  endTime?: Date;

  constructor(workflow: Workflow, algorithm: string, startNodeId?: string) {
    this.id = `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.workflow = workflow;
    this.algorithm = algorithm;
    this.startNodeId = startNodeId || workflow.nodes[0]?.id || 'start';
    this.status = 'running';
    this.startTime = new Date();
  }

  setGoal(goalNodeId: string): void {
    this.goalNodeId = goalNodeId;
  }

  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  cancel(): void {
    this.status = 'cancelled';
    this.endTime = new Date();
  }

  complete(result: any): void {
    this.status = 'completed';
    this.result = result;
    this.endTime = new Date();
  }

  fail(error: Error): void {
    this.status = 'failed';
    this.error = error;
    this.endTime = new Date();
  }

  getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }
}

interface AStarNode {
  node: WorkflowNode;
  fScore: number;
}
import { Workflow, WorkflowEdge, WorkflowNode } from '@/types';

export class WorkflowEngine {
  private workflows: Map<string, Workflow>;

  constructor() {
    this.workflows = new Map();
  }

  createWorkflow(name: string, nodes: WorkflowNode[], edges: WorkflowEdge[]): Workflow {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      nodes,
      edges,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    workflow.updatedAt = new Date();

    try {
      // Execute nodes in dependency order (topological sort)
      const executionOrder = this.topologicalSort(workflow.nodes, workflow.edges);
      
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        node.status = 'running';
        
        try {
          await this.executeNode(node);
          node.status = 'completed';
        } catch (error) {
          node.status = 'failed';
          throw error;
        }
      }

      workflow.status = 'completed';
    } catch (error) {
      workflow.status = 'failed';
      throw error;
    } finally {
      workflow.updatedAt = new Date();
    }
  }

  private async executeNode(node: WorkflowNode): Promise<void> {
    // Simulate node execution
    // In a real implementation, this would execute the actual node logic
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Executed node: ${node.id}`);
        resolve();
      }, 100);
    });
  }

  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build graph
    edges.forEach(edge => {
      graph.get(edge.from)?.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // Find nodes with no dependencies
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = graph.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (result.length !== nodes.length) {
      throw new Error('Workflow contains a cycle');
    }

    return result;
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  cancelWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'cancelled';
      workflow.updatedAt = new Date();
    }
  }
}

// Task Manager - Throttles and queues research tasks

interface Task {
  id: string;
  type: 'search' | 'scrape' | 'extract';
  input: string;
  priority: number;
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: any;
  error?: string;
  timestamp: number;
}

export class TaskManager {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private maxConcurrent: number;
  private searchThrottle: number; // ms between searches
  private lastSearchTime: number = 0;
  private lastBatchTime: number = 0; // Track when last batch completed
  private currentBatchSize: number = 0; // Track how many tasks started in current batch

  constructor(maxConcurrent: number = 2, searchThrottleMs: number = 1000) {
    this.maxConcurrent = maxConcurrent;
    this.searchThrottle = searchThrottleMs;
  }

  /**
   * Add task to queue
   */
  addTask(type: Task['type'], input: string, priority: number = 5): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: Task = {
      id,
      type,
      input,
      priority,
      status: 'pending',
      timestamp: Date.now()
    };

    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

    console.log(`[TaskManager] Added task ${id} (${type}) - Queue: ${this.queue.length}`);
    
    return id;
  }

  /**
   * Execute next task from queue
   */
  async executeNext(
    executor: (task: Task) => Promise<any>
  ): Promise<Task | null> {
    // Check if we can run more tasks
    if (this.running.size >= this.maxConcurrent) {
      return null;
    }

    // Get next pending task
    const task = this.queue.find(t => t.status === 'pending');
    if (!task) {
      return null;
    }

    // Batch gap logic: Wait between batches, not individual tasks
    // If we're starting a new batch (no tasks running), enforce gap from last batch
    if (this.running.size === 0 && this.currentBatchSize > 0) {
      const batchGap = task.type === 'search' ? this.searchThrottle : 1000; // 1s gap between batches
      const timeSinceLastBatch = Date.now() - this.lastBatchTime;
      
      if (timeSinceLastBatch < batchGap) {
        const waitTime = batchGap - timeSinceLastBatch;
        console.log(`[TaskManager] Batch gap: waiting ${waitTime}ms before next batch`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Reset batch counter
      this.currentBatchSize = 0;
    }
    
    // Track batch
    this.currentBatchSize++;
    if (task.type === 'search') {
      this.lastSearchTime = Date.now();
    }

    // Mark as running
    task.status = 'running';
    this.running.set(task.id, task);

    console.log(`[TaskManager] Executing task ${task.id} (${task.type}) [Batch: ${this.currentBatchSize}/${this.maxConcurrent}]`);

    try {
      const result = await executor(task);
      task.result = result;
      task.status = 'complete';
      console.log(`[TaskManager] Task ${task.id} completed`);
    } catch (error: any) {
      task.error = error.message;
      task.status = 'error';
      console.error(`[TaskManager] Task ${task.id} failed:`, error.message);
    }

    // Remove from running
    this.running.delete(task.id);
    
    // If this was the last task in the batch, record batch completion time
    if (this.running.size === 0) {
      this.lastBatchTime = Date.now();
      console.log(`[TaskManager] Batch completed (${this.currentBatchSize} tasks)`);
    }
    
    // Remove from queue
    this.queue = this.queue.filter(t => t.id !== task.id);

    return task;
  }

  /**
   * Get task result
   */
  getTask(id: string): Task | undefined {
    return this.queue.find(t => t.id === id) || this.running.get(id);
  }

  /**
   * Wait for task completion
   */
  async waitForTask(id: string, timeoutMs: number = 30000): Promise<Task> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const task = this.getTask(id);
      
      if (!task) {
        throw new Error(`Task ${id} not found`);
      }

      if (task.status === 'complete' || task.status === 'error') {
        return task;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Task ${id} timeout after ${timeoutMs}ms`);
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      running: this.running.size,
      total: this.queue.length
    };
  }

  /**
   * Clear completed tasks
   */
  cleanup() {
    const before = this.queue.length;
    this.queue = this.queue.filter(t => t.status === 'pending' || t.status === 'running');
    const removed = before - this.queue.length;
    if (removed > 0) {
      console.log(`[TaskManager] Cleaned up ${removed} completed tasks`);
    }
  }
}

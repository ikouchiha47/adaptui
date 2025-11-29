/**
 * Search Progress Tracker
 * Tracks progress of sequential search operations for UI display
 */

export interface SearchProgress {
  currentStep: number;
  totalSteps: number;
  currentTask: string;
  status: 'searching' | 'complete' | 'error';
  results?: number; // Number of results found so far
}

type ProgressCallback = (progress: SearchProgress) => void;

export class SearchProgressTracker {
  private static listeners: Set<ProgressCallback> = new Set();
  private static currentProgress: SearchProgress | null = null;

  /**
   * Subscribe to progress updates
   */
  static subscribe(callback: ProgressCallback): () => void {
    this.listeners.add(callback);
    
    // Send current progress immediately if available
    if (this.currentProgress) {
      callback(this.currentProgress);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update progress and notify all listeners
   */
  static updateProgress(progress: SearchProgress): void {
    this.currentProgress = progress;
    this.listeners.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  /**
   * Start tracking a new search
   */
  static startSearch(totalSteps: number): void {
    this.updateProgress({
      currentStep: 0,
      totalSteps,
      currentTask: 'Initializing search...',
      status: 'searching',
      results: 0,
    });
  }

  /**
   * Update current step
   */
  static updateStep(step: number, task: string, results?: number): void {
    if (!this.currentProgress) return;
    
    this.updateProgress({
      ...this.currentProgress,
      currentStep: step,
      currentTask: task,
      results: results ?? this.currentProgress.results,
      status: 'searching',
    });
  }

  /**
   * Mark search as complete
   */
  static completeSearch(totalResults: number): void {
    if (!this.currentProgress) return;
    
    this.updateProgress({
      ...this.currentProgress,
      currentStep: this.currentProgress.totalSteps,
      currentTask: 'Search complete',
      status: 'complete',
      results: totalResults,
    });
  }

  /**
   * Mark search as error
   */
  static errorSearch(error: string): void {
    if (!this.currentProgress) return;
    
    this.updateProgress({
      ...this.currentProgress,
      currentTask: `Error: ${error}`,
      status: 'error',
    });
  }

  /**
   * Clear all listeners (useful for cleanup)
   */
  static clearListeners(): void {
    this.listeners.clear();
    this.currentProgress = null;
  }

  /**
   * Get current progress (for polling if needed)
   */
  static getCurrentProgress(): SearchProgress | null {
    return this.currentProgress;
  }
}

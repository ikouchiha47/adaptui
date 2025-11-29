/**
 * Task Executor - Executes sub-queries from query decomposition
 * Stores results in SearchContext for reuse across the pipeline
 */

export interface Task {
  id: string;
  query: string;
  purpose: string;
  priority: number;
  dataSource?: string; // Hint about which service to use
}

export interface TaskResult {
  taskId: string;
  data: any;
  source: string;
  timestamp: Date;
}

export class TaskExecutor {
  /**
   * Execute a task based on its query and purpose
   */
  static async executeTask(task: Task): Promise<TaskResult> {
    console.log(`🔧 [TaskExecutor] Executing: ${task.query}`);

    // Pattern matching to route to appropriate service
    if (task.query.includes('airport') && task.query.includes('IATA')) {
      return this.findAirports(task);
    }
    
    if (task.query.includes('flight options') || task.query.includes('flights from')) {
      return this.findFlights(task);
    }
    
    // Places search - match "find X near/in/within Y" pattern
    if (task.query.match(/find .+ (near|in|within)/i) || 
        task.query.includes('search for') ||
        task.query.includes('look for')) {
      return this.findPlaces(task);
    }

    // Default: store the query for later LLM processing
    return {
      taskId: task.id,
      data: { query: task.query, purpose: task.purpose },
      source: 'pending',
      timestamp: new Date(),
    };
  }

  /**
   * Find airports using AirportDatabaseService
   */
  private static async findAirports(task: Task): Promise<TaskResult> {
    const { AirportDatabaseService } = await import('./AirportDatabaseService');
    const airportService = AirportDatabaseService.getInstance();
    
    // Extract city name from query
    const cityMatch = task.query.match(/serving ([^,]+)/i) || task.query.match(/near ([^,]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : '';

    if (!city) {
      return {
        taskId: task.id,
        data: { error: 'Could not extract city from query' },
        source: 'airports_db',
        timestamp: new Date(),
      };
    }

    const airports = await airportService.findAirportsByCity(city);
    
    console.log(`✅ [TaskExecutor] Found ${airports.length} airports for ${city}`);
    
    return {
      taskId: task.id,
      data: { city, airports },
      source: 'airports_db',
      timestamp: new Date(),
    };
  }

  /**
   * Find flight options (placeholder - would integrate with flight API)
   */
  private static async findFlights(task: Task): Promise<TaskResult> {
    // This would integrate with a flight search API
    // For now, return placeholder
    return {
      taskId: task.id,
      data: { message: 'Flight search not yet implemented', query: task.query },
      source: 'flight_search',
      timestamp: new Date(),
    };
  }

  /**
   * Find places using PlacesInsightsService (fast nearby search with Gemini summaries)
   */
  private static async findPlaces(task: Task): Promise<TaskResult> {
    try {
      const { PlacesInsightsService } = await import('./PlacesInsightsService');
      const placesService = new PlacesInsightsService();

      // Extract search terms and location from query
      const searchMatch = task.query.match(/find (.+?) (within|near|in) (.+)/i);
      const searchTerm = searchMatch ? searchMatch[1].trim() : task.query;
      const locationName = searchMatch ? searchMatch[3].trim() : '';

      // Get location coordinates if we have a location name
      let location: { lat: number; lng: number } | undefined;
      if (locationName) {
        const { GooglePlacesClient } = await import('./GooglePlacesClient');
        const { configManager } = await import('../config/ConfigManager');
        const apiKey = configManager.getApiKeyOrNull('googlePlaces');
        if (apiKey) {
          const client = new GooglePlacesClient(apiKey);
          location = await client.geocodeCity(locationName) || undefined;
        }
      }

      // Use PlacesInsightsService for fast search with Gemini summaries
      const results = await placesService.getGenerativeSummary(searchTerm, location);

      console.log(`✅ [TaskExecutor] Found ${results.length} places for "${searchTerm}"`);

      return {
        taskId: task.id,
        data: { 
          searchTerm, 
          location: locationName,
          coordinates: location,
          places: results,
          count: results.length
        },
        source: 'places_insights',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ [TaskExecutor] Places search error:', error);
      return {
        taskId: task.id,
        data: { error: String(error), query: task.query },
        source: 'places_insights',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute multiple tasks and store results in SearchContext
   */
  static async executeTasks(tasks: Task[]): Promise<Map<string, TaskResult>> {
    console.log(`🚀 [TaskExecutor] Executing ${tasks.length} tasks...`);

    // Sort by priority (higher first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    const results = new Map<string, TaskResult>();

    // Execute high-priority tasks first (priority >= 4)
    const highPriority = sortedTasks.filter(t => t.priority >= 4);
    for (const task of highPriority) {
      const result = await this.executeTask(task);
      results.set(task.id, result);
      
      // Store in SearchContext for reuse
      try {
        const { searchContext } = await import('./SearchContext');
        searchContext.setTaskResult(task.id, result);
      } catch (e) {
        console.log('⚠️ SearchContext not available in CLI mode');
      }
    }

    console.log(`✅ [TaskExecutor] Completed ${results.size} high-priority tasks`);

    return results;
  }

  /**
   * Execute multiple place searches using TaskManager for better throttling
   * Uses TaskManager to queue and throttle searches, avoiding rate limits
   */
  static async executeParallelPlaceSearches(
    searchTerms: string[],
    location: { lat: number; lng: number } | string
  ): Promise<Map<string, any[]>> {
    console.log(`🔄 [TaskExecutor] TaskManager-based search for ${searchTerms.length} terms...`);

    try {
      const { PlacesInsightsService } = await import('./PlacesInsightsService');
      const { TaskManager } = await import('./research/TaskManager');
      const placesService = new PlacesInsightsService();
      
      // Initialize TaskManager with 1 concurrent task and 2 second throttle
      const taskManager = new TaskManager(1, 2000); // Slower to avoid DDG errors
      
      // Initialize progress tracking
      let SearchProgressTracker: any = null;
      try {
        const module = await import('./SearchProgressTracker');
        SearchProgressTracker = module.SearchProgressTracker;
        console.log('✅ [TaskExecutor] SearchProgressTracker loaded');
        SearchProgressTracker.startSearch(searchTerms.length);
      } catch (error) {
        console.warn('⚠️ [TaskExecutor] SearchProgressTracker not available:', error);
      }

      // Resolve location to coordinates if it's a string
      let coords: { lat: number; lng: number } | undefined;
      if (typeof location === 'string') {
        const { GooglePlacesClient } = await import('./GooglePlacesClient');
        const { configManager } = await import('../config/ConfigManager');
        const apiKey = configManager.getApiKeyOrNull('googlePlaces');
        if (apiKey) {
          const client = new GooglePlacesClient(apiKey);
          coords = await client.geocodeCity(location) || undefined;
        }
      } else {
        coords = location;
      }

      // Add all searches to TaskManager queue
      const taskIds: string[] = [];
      for (const term of searchTerms) {
        const taskId = taskManager.addTask('search', term, 5);
        taskIds.push(taskId);
      }

      // Execute tasks one by one using TaskManager
      const resultsMap = new Map<string, any[]>();
      let totalResults = 0;
      let completedCount = 0;
      
      for (const taskId of taskIds) {
        const task = await taskManager.executeNext(async (t) => {
          // Update progress
          if (SearchProgressTracker) {
            SearchProgressTracker.updateStep(
              completedCount + 1,
              `Searching: ${t.input}`,
              totalResults
            );
          }
          
          console.log(`   [${completedCount + 1}/${searchTerms.length}] Searching: "${t.input}"`);
          
          // Execute the search
          const results = await placesService.getGenerativeSummary(t.input, coords);
          console.log(`   ✓ "${t.input}": ${results.length} places`);
          
          return results;
        });

        if (task) {
          completedCount++;
          if (task.status === 'complete' && task.result) {
            resultsMap.set(task.input, task.result);
            totalResults += task.result.length;
          } else if (task.status === 'error') {
            console.error(`   ❌ Search failed for "${task.input}":`, task.error);
            resultsMap.set(task.input, []);
          }
        }
      }

      // Mark as complete
      if (SearchProgressTracker) {
        SearchProgressTracker.completeSearch(totalResults);
      }
      console.log(`✅ [TaskExecutor] Completed ${resultsMap.size} TaskManager searches`);
      
      return resultsMap;
    } catch (error) {
      console.error('❌ [TaskExecutor] TaskManager search error:', error);
      return new Map();
    }
  }
}

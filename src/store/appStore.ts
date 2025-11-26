import { CategoryManager } from '@/core/CategoryManager';
import { GeminiCore } from '@/core/GeminiCore';
import { DatabaseService } from '@/services/DatabaseService';
import {
    BackgroundJob,
    Category,
    DeviceInfo,
    LLMResponse,
    QueryRequest,
    UserPreferences
} from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppState {
  // Core services
  llmCore: LLMCore | null;
  categoryManager: CategoryManager;
  databaseService: DatabaseService;
  
  // UI state
  currentQuery: QueryRequest | null;
  responses: LLMResponse[];
  isLoading: boolean;
  error: string | null;
  
  // Categories
  categories: Category[];
  selectedCategory: Category | null;
  
  // Background jobs
  activeJobs: BackgroundJob[];
  completedJobs: BackgroundJob[];
  
  // User preferences
  userPreferences: UserPreferences;
  deviceInfo: DeviceInfo | null;
  
  // Actions
  initializeApp: (apiKey: string) => Promise<void>;
  processQuery: (query: string) => Promise<void>;
  setSelectedCategory: (category: Category | null) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  addBackgroundJob: (job: BackgroundJob) => void;
  updateJobStatus: (jobId: string, status: string) => void;
  clearError: () => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState & { getState: () => AppState }>()(
  persist(
    (set, get) => ({
      // Initial state
      llmCore: null,
      categoryManager: new CategoryManager(),
      databaseService: DatabaseService.getInstance(),
      
      currentQuery: null,
      responses: [],
      isLoading: false,
      error: null,
      
      categories: [],
      selectedCategory: null,
      
      activeJobs: [],
      completedJobs: [],
      
      userPreferences: {
        theme: 'auto',
        preferredCategories: [],
        language: 'en'
      },
      
      deviceInfo: null,
      
      // Actions
      initializeApp: async (apiKey: string) => {
        const { databaseService, categoryManager } = get();
        
        try {
          // Initialize database
          await databaseService.initialize();
          
          // Initialize LLM core
          const llmCore = new GeminiCore(apiKey);
          
          // Load categories
          const categories = categoryManager.getAllCategories();
          
          // Load user preferences from database
          const savedTheme = await databaseService.getUserPreference('theme');
          const savedLanguage = await databaseService.getUserPreference('language');
          const savedPreferredCategories = await databaseService.getUserPreference('preferredCategories');
          
          set({
            llmCore,
            categories,
            userPreferences: {
              theme: savedTheme || 'auto',
              language: savedLanguage || 'en',
              preferredCategories: savedPreferredCategories || []
            }
          });
          
          console.log('App initialized successfully');
        } catch (error) {
          console.error('Failed to initialize app:', error);
          set({ error: `Failed to initialize app: ${error}` });
        }
      },
      
      processQuery: async (query: string) => {
        const { llmCore, categoryManager, databaseService, userPreferences, responses } = get();
        
        if (!llmCore) {
          set({ error: 'LLM core not initialized' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Create query request
          const queryRequest: QueryRequest = {
            id: `query-${Date.now()}`,
            query,
            timestamp: new Date(),
            context: {
              previousQueries: [], // Context from previous queries
              userPreferences
            }
          };
          
          set({ currentQuery: queryRequest });
          
          // Categorize query
          const categories = await categoryManager.categorizeWithContext(queryRequest, {
            preferredCategories: userPreferences.preferredCategories
          });
          
          if (categories.length === 0) {
            throw new Error('No categories matched the query');
          }
          
          // Process with the best matching category
          const primaryCategory = categories[0];
          const response = await llmCore.processQuery(queryRequest, primaryCategory);
          
          // Save to database
          await databaseService.saveQuery(query, primaryCategory.name, response);
          
          // Update state
          set({
            responses: [response, ...responses],
            isLoading: false,
            selectedCategory: primaryCategory
          });
          
        } catch (error) {
          console.error('Query processing error:', error);
          set({
            error: `Failed to process query: ${error}`,
            isLoading: false
          });
        }
      },
      
      setSelectedCategory: (category: Category | null) => {
        set({ selectedCategory: category });
      },
      
      updateUserPreferences: async (preferences: Partial<UserPreferences>) => {
        const { userPreferences, databaseService } = get();
        const updatedPreferences = { ...userPreferences, ...preferences };
        
        set({ userPreferences: updatedPreferences });
        
        // Save to database
        try {
          await databaseService.setUserPreference('theme', updatedPreferences.theme);
          await databaseService.setUserPreference('language', updatedPreferences.language);
          await databaseService.setUserPreference('preferredCategories', updatedPreferences.preferredCategories);
        } catch (error) {
          console.error('Failed to save preferences:', error);
        }
      },
      
      addBackgroundJob: (job: BackgroundJob) => {
        const { activeJobs } = get();
        set({ activeJobs: [...activeJobs, job] });
      },
      
      updateJobStatus: (jobId: string, status: string) => {
        const { activeJobs, completedJobs } = get();
        
        const jobIndex = activeJobs.findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
          const job = activeJobs[jobIndex];
          const updatedJob = { ...job, status: status as any };
          
          const newActiveJobs = activeJobs.filter(job => job.id !== jobId);
          
          if (status === 'completed' || status === 'failed') {
            set({
              activeJobs: newActiveJobs,
              completedJobs: [updatedJob as any, ...completedJobs]
            });
          } else {
            set({
              activeJobs: [...newActiveJobs, updatedJob as any]
            });
          }
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      clearHistory: async () => {
        const { databaseService } = get();
        
        try {
          // Clear query history from database
          // This is a simplified version - in production, you'd have a proper method
          set({ responses: [] });
          console.log('History cleared');
        } catch (error) {
          console.error('Failed to clear history:', error);
        }
      }
    }),
    {
      name: 'adaptui-store',
      storage: createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          try {
            const state = useAppStore.getState() as any;
            const result = await state.databaseService.getUserPreference(name);
            return result ? JSON.stringify(result) : null;
          } catch {
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          try {
            const { databaseService } = useAppStore.getState();
            await databaseService.setUserPreference(name, value);
          } catch (error) {
            console.error('Failed to persist store:', error);
          }
        },
        removeItem: async (name: string) => {
          try {
            const { databaseService } = useAppStore.getState();
            // Implementation for removing preferences
          } catch (error) {
            console.error('Failed to remove store item:', error);
          }
        }
      })),
      partialize: (state) => ({
        userPreferences: state.userPreferences,
        responses: state.responses.slice(0, 10) // Only keep last 10 responses
      })
    }
  )
);
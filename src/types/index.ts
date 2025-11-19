// Core types for AdaptUI

export interface QueryRequest {
  id: string;
  query: string;
  timestamp: Date;
  context?: QueryContext;
}

export interface QueryContext {
  previousQueries?: QueryRequest[];
  userPreferences?: UserPreferences;
  deviceInfo?: DeviceInfo;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  preferredCategories: string[];
  location?: Location;
  language: string;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  screenSize: { width: number; height: number };
  isTablet: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  promptSuffix?: string;
  isUserDefined: boolean;
  config?: CategoryConfig;
}

export interface CategoryConfig {
  apiEndpoint?: string;
  authData?: Record<string, string>;
  customPrompts?: Record<string, string>;
}

export interface UIComponent {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  style?: ComponentStyle;
  children?: UIComponent[];
}

export type ComponentType = 
  | 'text'
  | 'button'
  | 'card'
  | 'list'
  | 'map'
  | 'image'
  | 'input'
  | 'chart'
  | 'webview'
  | 'custom';

export interface ComponentStyle {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
}

export interface LLMResponse {
  id: string;
  category: Category;
  components: UIComponent[];
  reasoning: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  data: any;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  maxRetries: number;
}

export type JobType = 'llm_request' | 'web_scraping' | 'data_processing' | 'workflow_execution';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface ReasoningPattern {
  name: string;
  description: string;
  steps: ReasoningStep[];
  maxIterations?: number;
}

export interface ReasoningStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'reflection';
  content: string;
  metadata?: Record<string, any>;
}
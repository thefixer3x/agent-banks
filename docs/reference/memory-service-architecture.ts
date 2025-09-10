// memory-service/src/types/api.ts
export interface MemoryServiceConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  redis: {
    url: string;
    password?: string;
  };
  authentication: {
    apiKeyHeader: string;
    jwtSecret: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface ClientTenant {
  id: string;
  name: string;
  apiKey: string;
  namespace: string;
  subscription: 'free' | 'pro' | 'enterprise';
  limits: {
    maxMemories: number;
    maxRequests: number;
    maxRetentionDays: number;
  };
  createdAt: string;
  lastActive: string;
}

export interface MemoryNamespace {
  tenantId: string;
  namespace: string;
  context: string;
  isolated: boolean;
}

export interface MemoryOperation {
  operation: 'create' | 'read' | 'update' | 'delete' | 'search';
  namespace: string;
  context: string;
  data?: any;
  filters?: any;
}

export interface ToolOperation {
  tool: 'clickup' | 'zapier' | 'telegram' | 'database';
  action: string;
  namespace: string;
  parameters: Record<string, any>;
}

// Core API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    execution?: {
      duration: number;
      cached: boolean;
    };
  };
}

export interface MemorySearchRequest {
  query: string;
  namespace: string;
  context?: string;
  filters?: {
    topicId?: string;
    memoryType?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  options?: {
    limit?: number;
    threshold?: number;
    includeContent?: boolean;
  };
}

export interface MemoryCreateRequest {
  namespace: string;
  context: string;
  title: string;
  content: string;
  summary?: string;
  memoryType: 'conversation' | 'knowledge' | 'project' | 'context' | 'reference';
  topicId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  tenantId: string;
  namespace: string;
  conversationId: string;
  participants: string[];
  model: string;
  settings: {
    memoryEnabled: boolean;
    contextWindow: number;
    autoSummarize: boolean;
  };
}

export interface ToolExecutionRequest {
  namespace: string;
  context: string;
  tool: string;
  action: string;
  parameters: Record<string, any>;
  async?: boolean;
}

export interface MemoryStats {
  namespace: string;
  totalMemories: number;
  memoryTypes: Record<string, number>;
  storageUsed: number;
  lastActivity: string;
  topTopics: Array<{
    name: string;
    count: number;
  }>;
}

export interface RealtimeSubscription {
  tenantId: string;
  namespace: string;
  events: string[];
  webhookUrl?: string;
  channels: string[];
}
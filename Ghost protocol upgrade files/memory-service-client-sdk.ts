// memory-service-sdk/src/MemoryServiceClient.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import EventSource from 'eventsource';
import { 
  MemoryCreateRequest, 
  MemorySearchRequest, 
  ToolExecutionRequest,
  APIResponse,
  ConversationContext,
  MemoryStats
} from './types';

export interface MemoryServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export class MemoryServiceClient {
  private http: AxiosInstance;
  private config: MemoryServiceConfig;
  private eventSource: EventSource | null = null;

  constructor(config: MemoryServiceConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging and retries
    this.http.interceptors.request.use(
      (config) => {
        console.debug(`[MemoryService] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config: requestConfig, response } = error;
        
        if (response?.status >= 500 && requestConfig.retryCount < (this.config.retries || 3)) {
          requestConfig.retryCount = (requestConfig.retryCount || 0) + 1;
          await new Promise(resolve => setTimeout(resolve, 1000 * requestConfig.retryCount));
          return this.http.request(requestConfig);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Memory Management Methods
  async createMemory(request: MemoryCreateRequest): Promise<APIResponse> {
    const response = await this.http.post('/api/v1/memory', request);
    return response.data;
  }

  async searchMemories(request: MemorySearchRequest): Promise<APIResponse> {
    const response = await this.http.get('/api/v1/memory/search', { params: request });
    return response.data;
  }

  async getMemory(id: string): Promise<APIResponse> {
    const response = await this.http.get(`/api/v1/memory/${id}`);
    return response.data;
  }

  async updateMemory(id: string, updates: Partial<MemoryCreateRequest>): Promise<APIResponse> {
    const response = await this.http.put(`/api/v1/memory/${id}`, updates);
    return response.data;
  }

  async deleteMemory(id: string): Promise<APIResponse> {
    const response = await this.http.delete(`/api/v1/memory/${id}`);
    return response.data;
  }

  async listMemories(namespace: string, options?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<APIResponse> {
    const response = await this.http.get('/api/v1/memory', {
      params: { namespace, ...options }
    });
    return response.data;
  }

  // Conversation Management
  async createConversation(context: Partial<ConversationContext>): Promise<APIResponse> {
    const response = await this.http.post('/api/v1/conversations', context);
    return response.data;
  }

  async getConversation(id: string): Promise<APIResponse> {
    const response = await this.http.get(`/api/v1/conversations/${id}`);
    return response.data;
  }

  async addMessage(conversationId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
  }): Promise<APIResponse> {
    const response = await this.http.post(`/api/v1/conversations/${conversationId}/messages`, message);
    return response.data;
  }

  async getConversationContext(conversationId: string, options?: {
    limit?: number;
    threshold?: number;
  }): Promise<APIResponse> {
    const response = await this.http.get(`/api/v1/conversations/${conversationId}/context`, {
      params: options
    });
    return response.data;
  }

  // Tool Orchestration
  async executeTool(request: ToolExecutionRequest): Promise<APIResponse> {
    const response = await this.http.post('/api/v1/tools/execute', request);
    return response.data;
  }

  async getExecutionStatus(executionId: string): Promise<APIResponse> {
    const response = await this.http.get(`/api/v1/tools/status/${executionId}`);
    return response.data;
  }

  async getAvailableTools(): Promise<APIResponse> {
    const response = await this.http.get('/api/v1/tools/available');
    return response.data;
  }

  async getExecutionHistory(namespace: string, options?: {
    page?: number;
    limit?: number;
    tool?: string;
  }): Promise<APIResponse> {
    const response = await this.http.get('/api/v1/tools/history', {
      params: { namespace, ...options }
    });
    return response.data;
  }

  // Tenant Management
  async getStats(): Promise<APIResponse<MemoryStats>> {
    const response = await this.http.get('/api/v1/tenant/stats');
    return response.data;
  }

  async updateSettings(settings: Record<string, any>): Promise<APIResponse> {
    const response = await this.http.put('/api/v1/tenant/settings', settings);
    return response.data;
  }

  async getUsage(): Promise<APIResponse> {
    const response = await this.http.get('/api/v1/tenant/usage');
    return response.data;
  }

  async getNamespaces(): Promise<APIResponse> {
    const response = await this.http.get('/api/v1/tenant/namespaces');
    return response.data;
  }

  async createNamespace(namespace: {
    name: string;
    description?: string;
    isolated?: boolean;
  }): Promise<APIResponse> {
    const response = await this.http.post('/api/v1/tenant/namespaces', namespace);
    return response.data;
  }

  // Real-time Subscriptions
  subscribeToUpdates(namespace: string, events: string[], callback: (event: any) => void): () => void {
    const url = `${this.config.baseUrl}/api/v1/subscriptions/stream?namespace=${namespace}&events=${events.join(',')}`;
    
    this.eventSource = new EventSource(url, {
      headers: { 'X-API-Key': this.config.apiKey }
    });

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    // Return unsubscribe function
    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  // Utility Methods
  async health(): Promise<APIResponse> {
    const response = await this.http.get('/health');
    return response.data;
  }

  async getDocs(): Promise<APIResponse> {
    const response = await this.http.get('/docs');
    return response.data;
  }

  // High-level convenience methods
  async smartSearch(query: string, namespace: string, options?: {
    includeConversations?: boolean;
    contextLimit?: number;
    threshold?: number;
  }): Promise<{ memories: any[]; conversations?: any[] }> {
    const searchRequest: MemorySearchRequest = {
      query,
      namespace,
      options: {
        limit: options?.contextLimit || 10,
        threshold: options?.threshold || 0.7,
        includeContent: true,
      },
    };

    const result = await this.searchMemories(searchRequest);
    
    const response: any = { memories: result.data || [] };

    if (options?.includeConversations) {
      // Search for relevant conversations too
      const convSearchRequest: MemorySearchRequest = {
        query,
        namespace,
        filters: { memoryType: 'conversation' },
        options: { limit: 5, threshold: 0.6 },
      };
      
      const convResult = await this.searchMemories(convSearchRequest);
      response.conversations = convResult.data || [];
    }

    return response;
  }

  async createConversationMemory(
    conversationId: string,
    namespace: string,
    messages: Array<{ role: string; content: string }>,
    summary?: string
  ): Promise<APIResponse> {
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    return this.createMemory({
      namespace,
      context: `conversation:${conversationId}`,
      title: `Conversation ${conversationId.slice(-8)}`,
      content,
      summary: summary || `Conversation with ${messages.length} messages`,
      memoryType: 'conversation',
      tags: ['conversation', 'auto-generated'],
      metadata: {
        conversationId,
        messageCount: messages.length,
        participants: [...new Set(messages.map(m => m.role))],
      },
    });
  }

  // Batch operations
  async batchCreateMemories(memories: MemoryCreateRequest[]): Promise<APIResponse[]> {
    const promises = memories.map(memory => this.createMemory(memory));
    return Promise.all(promises);
  }

  async batchExecuteTools(requests: ToolExecutionRequest[]): Promise<APIResponse[]> {
    const promises = requests.map(request => this.executeTool(request));
    return Promise.all(promises);
  }
}

// memory-service-sdk/src/MemoryNamespace.ts - Namespace-specific client
export class MemoryNamespace {
  constructor(
    private client: MemoryServiceClient,
    private namespace: string
  ) {}

  // Scoped memory operations
  async create(memory: Omit<MemoryCreateRequest, 'namespace'>): Promise<APIResponse> {
    return this.client.createMemory({ ...memory, namespace: this.namespace });
  }

  async search(query: string, options?: any): Promise<APIResponse> {
    return this.client.searchMemories({ query, namespace: this.namespace, ...options });
  }

  async list(options?: any): Promise<APIResponse> {
    return this.client.listMemories(this.namespace, options);
  }

  // Scoped tool operations
  async executeTool(tool: string, action: string, parameters: any, async = false): Promise<APIResponse> {
    return this.client.executeTool({
      namespace: this.namespace,
      context: 'default',
      tool,
      action,
      parameters,
      async,
    });
  }

  // Scoped conversations
  async createConversation(context?: any): Promise<APIResponse> {
    return this.client.createConversation({
      namespace: this.namespace,
      ...context,
    });
  }

  // Real-time updates for this namespace
  subscribe(events: string[], callback: (event: any) => void): () => void {
    return this.client.subscribeToUpdates(this.namespace, events, callback);
  }
}

// memory-service-sdk/src/index.ts - Main export
export { MemoryServiceClient, MemoryNamespace };
export * from './types';

// Factory function for easy setup
export function createMemoryClient(config: MemoryServiceConfig): MemoryServiceClient {
  return new MemoryServiceClient(config);
}

export function createNamespaceClient(
  config: MemoryServiceConfig, 
  namespace: string
): MemoryNamespace {
  const client = new MemoryServiceClient(config);
  return new MemoryNamespace(client, namespace);
}

// React hooks for easy integration
export function useMemoryService(config: MemoryServiceConfig) {
  const [client] = React.useState(() => new MemoryServiceClient(config));
  
  return {
    client,
    createMemory: client.createMemory.bind(client),
    searchMemories: client.searchMemories.bind(client),
    executeTool: client.executeTool.bind(client),
    subscribe: client.subscribeToUpdates.bind(client),
  };
}

export function useMemoryNamespace(config: MemoryServiceConfig, namespace: string) {
  const [namespaceClient] = React.useState(() => 
    new MemoryNamespace(new MemoryServiceClient(config), namespace)
  );
  
  return namespaceClient;
}
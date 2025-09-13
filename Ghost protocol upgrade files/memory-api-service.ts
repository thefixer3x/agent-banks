// memory-service/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { MemoryServiceConfig, APIResponse } from './types/api';
import { MemoryController } from './controllers/MemoryController';
import { ToolController } from './controllers/ToolController';
import { TenantController } from './controllers/TenantController';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { TenantMiddleware } from './middleware/TenantMiddleware';
import { ErrorHandler } from './middleware/ErrorHandler';

export class MemoryAPIService {
  private app: express.Application;
  private config: MemoryServiceConfig;
  private supabase: any;
  private redis: Redis;
  private memoryController: MemoryController;
  private toolController: ToolController;
  private tenantController: TenantController;

  constructor(config: MemoryServiceConfig) {
    this.config = config;
    this.app = express();
    this.initializeInfrastructure();
    this.initializeMiddleware();
    this.initializeControllers();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeInfrastructure() {
    // Initialize Supabase
    this.supabase = createClient(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey
    );

    // Initialize Redis
    this.redis = new Redis(this.config.redis.url, {
      password: this.config.redis.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  private initializeMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.maxRequests,
      message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Custom middleware
    this.app.use(new AuthMiddleware(this.config).middleware);
    this.app.use(new TenantMiddleware(this.supabase).middleware);
  }

  private initializeControllers() {
    this.memoryController = new MemoryController(this.supabase, this.redis);
    this.toolController = new ToolController(this.supabase, this.redis);
    this.tenantController = new TenantController(this.supabase, this.redis);
  }

  private initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
        },
      });
    });

    // API Documentation
    this.app.get('/docs', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'Memory-as-a-Service API',
          version: '1.0.0',
          endpoints: {
            memory: [
              'POST /api/v1/memory',
              'GET /api/v1/memory/search',
              'GET /api/v1/memory/:id',
              'PUT /api/v1/memory/:id',
              'DELETE /api/v1/memory/:id',
            ],
            tools: [
              'POST /api/v1/tools/execute',
              'GET /api/v1/tools/status/:executionId',
              'GET /api/v1/tools/available',
            ],
            tenants: [
              'GET /api/v1/tenant/stats',
              'PUT /api/v1/tenant/settings',
              'GET /api/v1/tenant/usage',
            ],
          },
        },
      });
    });

    // API Routes
    const apiV1 = express.Router();

    // Memory Management Routes
    apiV1.post('/memory', this.memoryController.createMemory.bind(this.memoryController));
    apiV1.get('/memory/search', this.memoryController.searchMemories.bind(this.memoryController));
    apiV1.get('/memory/:id', this.memoryController.getMemory.bind(this.memoryController));
    apiV1.put('/memory/:id', this.memoryController.updateMemory.bind(this.memoryController));
    apiV1.delete('/memory/:id', this.memoryController.deleteMemory.bind(this.memoryController));
    apiV1.get('/memory', this.memoryController.listMemories.bind(this.memoryController));

    // Conversation Management Routes
    apiV1.post('/conversations', this.memoryController.createConversation.bind(this.memoryController));
    apiV1.get('/conversations/:id', this.memoryController.getConversation.bind(this.memoryController));
    apiV1.post('/conversations/:id/messages', this.memoryController.addMessage.bind(this.memoryController));
    apiV1.get('/conversations/:id/context', this.memoryController.getConversationContext.bind(this.memoryController));

    // Tool Orchestration Routes
    apiV1.post('/tools/execute', this.toolController.executeTool.bind(this.toolController));
    apiV1.get('/tools/status/:executionId', this.toolController.getExecutionStatus.bind(this.toolController));
    apiV1.get('/tools/available', this.toolController.getAvailableTools.bind(this.toolController));
    apiV1.get('/tools/history', this.toolController.getExecutionHistory.bind(this.toolController));

    // Tenant Management Routes
    apiV1.get('/tenant/stats', this.tenantController.getStats.bind(this.tenantController));
    apiV1.put('/tenant/settings', this.tenantController.updateSettings.bind(this.tenantController));
    apiV1.get('/tenant/usage', this.tenantController.getUsage.bind(this.tenantController));
    apiV1.get('/tenant/namespaces', this.tenantController.getNamespaces.bind(this.tenantController));
    apiV1.post('/tenant/namespaces', this.tenantController.createNamespace.bind(this.tenantController));

    // Real-time Subscription Routes
    apiV1.post('/subscriptions', this.memoryController.createSubscription.bind(this.memoryController));
    apiV1.delete('/subscriptions/:id', this.memoryController.deleteSubscription.bind(this.memoryController));
    apiV1.get('/subscriptions', this.memoryController.getSubscriptions.bind(this.memoryController));

    this.app.use('/api/v1', apiV1);
  }

  private initializeErrorHandling() {
    this.app.use(new ErrorHandler().middleware);
  }

  public start(port: number = 3001): void {
    this.app.listen(port, () => {
      console.log(`🧠 Memory-as-a-Service API running on port ${port}`);
      console.log(`📊 Health: http://localhost:${port}/health`);
      console.log(`📖 Docs: http://localhost:${port}/docs`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// memory-service/src/controllers/MemoryController.ts
import { Request, Response } from 'express';
import { MemoryCreateRequest, MemorySearchRequest, APIResponse } from '../types/api';

export class MemoryController {
  constructor(private supabase: any, private redis: any) {}

  async createMemory(req: Request, res: Response) {
    try {
      const tenant = (req as any).tenant;
      const memoryData: MemoryCreateRequest = req.body;

      // Validate namespace belongs to tenant
      const fullNamespace = `${tenant.id}:${memoryData.namespace}`;

      // Generate embedding
      const { data: embeddingData, error: embeddingError } = await this.supabase.functions.invoke('generate-embedding', {
        body: { text: `${memoryData.title}\n${memoryData.content}` }
      });

      if (embeddingError) throw embeddingError;

      // Create memory with tenant isolation
      const { data: memory, error } = await this.supabase
        .from('memory_entries')
        .insert({
          ...memoryData,
          namespace: fullNamespace,
          tenant_id: tenant.id,
          embedding: embeddingData.embedding,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Cache recent memory for faster access
      await this.redis.setex(
        `memory:${tenant.id}:${memory.id}`,
        3600, // 1 hour
        JSON.stringify(memory)
      );

      // Publish real-time update
      await this.redis.publish(
        `tenant:${tenant.id}:memories`,
        JSON.stringify({ action: 'created', memory })
      );

      const response: APIResponse = {
        success: true,
        data: memory,
        meta: {
          execution: {
            duration: Date.now() - (req as any).startTime,
            cached: false,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'MEMORY_CREATE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async searchMemories(req: Request, res: Response) {
    try {
      const tenant = (req as any).tenant;
      const searchRequest: MemorySearchRequest = req.query as any;

      const fullNamespace = `${tenant.id}:${searchRequest.namespace}`;
      const cacheKey = `search:${tenant.id}:${Buffer.from(JSON.stringify(searchRequest)).toString('base64')}`;

      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          meta: { execution: { cached: true } },
        });
      }

      // Generate embedding for search query
      const { data: embeddingData, error: embeddingError } = await this.supabase.functions.invoke('generate-embedding', {
        body: { text: searchRequest.query }
      });

      if (embeddingError) throw embeddingError;

      // Search with tenant isolation
      const { data: results, error } = await this.supabase.rpc('search_memories', {
        query_embedding: embeddingData.embedding,
        match_threshold: searchRequest.options?.threshold || 0.7,
        match_count: searchRequest.options?.limit || 10,
        filter_project_ref: fullNamespace,
      });

      if (error) throw error;

      // Cache results for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(results));

      res.json({
        success: true,
        data: results,
        meta: {
          execution: {
            duration: Date.now() - (req as any).startTime,
            cached: false,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'MEMORY_SEARCH_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getConversationContext(req: Request, res: Response) {
    try {
      const tenant = (req as any).tenant;
      const { id: conversationId } = req.params;
      const { limit = 5, threshold = 0.7 } = req.query;

      // Get recent messages from conversation
      const { data: messages, error } = await this.supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string));

      if (error) throw error;

      // Generate context summary for memory search
      const contextText = messages.map(m => m.content).join('\n');
      
      if (contextText) {
        const { data: embeddingData } = await this.supabase.functions.invoke('generate-embedding', {
          body: { text: contextText }
        });

        // Find relevant memories
        const { data: relevantMemories } = await this.supabase.rpc('search_memories', {
          query_embedding: embeddingData.embedding,
          match_threshold: parseFloat(threshold as string),
          match_count: parseInt(limit as string),
          filter_project_ref: `${tenant.id}:conversation:${conversationId}`,
        });

        res.json({
          success: true,
          data: {
            messages,
            relevantMemories: relevantMemories || [],
            conversationId,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            messages,
            relevantMemories: [],
            conversationId,
          },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CONTEXT_RETRIEVAL_FAILED',
          message: error.message,
        },
      });
    }
  }

  // Additional methods: getMemory, updateMemory, deleteMemory, listMemories, etc.
  // [Implementation continues with full CRUD operations]
}
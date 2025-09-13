// memory-service/src/controllers/ToolController.ts
import { Request, Response } from 'express';
import { ToolExecutionRequest, APIResponse } from '../types/api';

export class ToolController {
  private executionQueue: Map<string, any> = new Map();

  constructor(private supabase: any, private redis: any) {}

  async executeTool(req: Request, res: Response) {
    try {
      const tenant = (req as any).tenant;
      const toolRequest: ToolExecutionRequest = req.body;
      
      const executionId = `exec_${tenant.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullNamespace = `${tenant.id}:${toolRequest.namespace}`;

      // Validate tool access for tenant
      const hasAccess = await this.validateToolAccess(tenant, toolRequest.tool);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TOOL_ACCESS_DENIED',
            message: `Tool ${toolRequest.tool} not available for tenant ${tenant.name}`,
          },
        });
      }

      // Create execution record
      const execution = {
        id: executionId,
        tenantId: tenant.id,
        namespace: fullNamespace,
        tool: toolRequest.tool,
        action: toolRequest.action,
        parameters: toolRequest.parameters,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      this.executionQueue.set(executionId, execution);

      // Execute tool asynchronously if requested
      if (toolRequest.async) {
        this.executeToolAsync(executionId, toolRequest, tenant);
        
        return res.status(202).json({
          success: true,
          data: {
            executionId,
            status: 'pending',
            estimatedCompletion: new Date(Date.now() + 30000).toISOString(),
          },
        });
      }

      // Execute tool synchronously
      const result = await this.executeToolSync(toolRequest, tenant, fullNamespace);

      // Store execution result
      await this.supabase
        .from('tool_executions')
        .insert({
          id: executionId,
          tenant_id: tenant.id,
          namespace: fullNamespace,
          tool: toolRequest.tool,
          action: toolRequest.action,
          parameters: toolRequest.parameters,
          result,
          status: 'completed',
          duration: Date.now() - (req as any).startTime,
        });

      res.json({
        success: true,
        data: {
          executionId,
          result,
          status: 'completed',
        },
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
          code: 'TOOL_EXECUTION_FAILED',
          message: error.message,
        },
      });
    }
  }

  private async executeToolSync(request: ToolExecutionRequest, tenant: any, namespace: string) {
    switch (request.tool) {
      case 'clickup':
        return await this.executeClickUpTool(request.action, request.parameters, tenant);
      
      case 'zapier':
        return await this.executeZapierTool(request.action, request.parameters, tenant);
      
      case 'telegram':
        return await this.executeTelegramTool(request.action, request.parameters, tenant);
      
      case 'database':
        return await this.executeDatabaseTool(request.action, request.parameters, tenant, namespace);
      
      default:
        throw new Error(`Unknown tool: ${request.tool}`);
    }
  }

  private async executeClickUpTool(action: string, params: any, tenant: any) {
    const clickupToken = await this.getTenantSecret(tenant.id, 'CLICKUP_TOKEN');
    if (!clickupToken) {
      throw new Error('ClickUp token not configured for tenant');
    }

    const baseUrl = 'https://api.clickup.com/api/v2';
    
    switch (action) {
      case 'create_task':
        const response = await fetch(`${baseUrl}/list/${params.list_id}/task`, {
          method: 'POST',
          headers: {
            'Authorization': clickupToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            assignees: params.assignees || [],
            priority: params.priority || 3,
          }),
        });
        
        if (!response.ok) throw new Error(`ClickUp API error: ${response.statusText}`);
        return await response.json();
      
      case 'get_tasks':
        const tasksResponse = await fetch(`${baseUrl}/list/${params.list_id}/task`, {
          headers: { 'Authorization': clickupToken },
        });
        
        if (!tasksResponse.ok) throw new Error(`ClickUp API error: ${tasksResponse.statusText}`);
        return await tasksResponse.json();
      
      default:
        throw new Error(`Unknown ClickUp action: ${action}`);
    }
  }

  private async executeZapierTool(action: string, params: any, tenant: any) {
    const zapierWebhookUrl = await this.getTenantSecret(tenant.id, 'ZAPIER_WEBHOOK_URL');
    if (!zapierWebhookUrl) {
      throw new Error('Zapier webhook URL not configured for tenant');
    }

    const response = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        parameters: params,
        tenant: tenant.id,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`Zapier webhook error: ${response.statusText}`);
    return await response.json();
  }

  private async executeDatabaseTool(action: string, params: any, tenant: any, namespace: string) {
    switch (action) {
      case 'search_memories':
        const { data: embeddingData } = await this.supabase.functions.invoke('generate-embedding', {
          body: { text: params.query }
        });

        const { data: memories } = await this.supabase.rpc('search_memories', {
          query_embedding: embeddingData.embedding,
          match_threshold: params.threshold || 0.7,
          match_count: params.limit || 5,
          filter_project_ref: namespace,
        });

        return { memories, count: memories?.length || 0 };
      
      case 'create_memory':
        const { data: newMemory } = await this.supabase
          .from('memory_entries')
          .insert({
            title: params.title,
            content: params.content,
            memory_type: params.memory_type || 'knowledge',
            namespace,
            tenant_id: tenant.id,
            status: 'active',
          })
          .select()
          .single();

        return newMemory;
      
      default:
        throw new Error(`Unknown database action: ${action}`);
    }
  }

  private async getTenantSecret(tenantId: string, secretName: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('tenant_secrets')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('name', secretName)
      .single();

    return data?.value || null;
  }

  async getExecutionStatus(req: Request, res: Response) {
    try {
      const { executionId } = req.params;
      const tenant = (req as any).tenant;

      // Check in-memory queue first
      const queuedExecution = this.executionQueue.get(executionId);
      if (queuedExecution) {
        return res.json({
          success: true,
          data: queuedExecution,
        });
      }

      // Check database
      const { data: execution } = await this.supabase
        .from('tool_executions')
        .select('*')
        .eq('id', executionId)
        .eq('tenant_id', tenant.id)
        .single();

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EXECUTION_NOT_FOUND',
            message: 'Execution not found',
          },
        });
      }

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getAvailableTools(req: Request, res: Response) {
    try {
      const tenant = (req as any).tenant;

      // Get tenant's tool access permissions
      const { data: permissions } = await this.supabase
        .from('tenant_tool_permissions')
        .select('tool, actions, limits')
        .eq('tenant_id', tenant.id);

      const availableTools = permissions || [];

      res.json({
        success: true,
        data: {
          tools: availableTools,
          subscription: tenant.subscription,
          limits: tenant.limits,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TOOLS_LIST_FAILED',
          message: error.message,
        },
      });
    }
  }

  private async validateToolAccess(tenant: any, tool: string): Promise<boolean> {
    const { data: permission } = await this.supabase
      .from('tenant_tool_permissions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('tool', tool)
      .single();

    return !!permission;
  }

  private async executeToolAsync(executionId: string, request: ToolExecutionRequest, tenant: any) {
    try {
      const execution = this.executionQueue.get(executionId);
      execution.status = 'running';
      
      // Execute the tool
      const result = await this.executeToolSync(request, tenant, `${tenant.id}:${request.namespace}`);
      
      // Update execution
      execution.status = 'completed';
      execution.result = result;
      execution.completedAt = new Date().toISOString();

      // Store in database
      await this.supabase
        .from('tool_executions')
        .insert({
          id: executionId,
          tenant_id: tenant.id,
          namespace: `${tenant.id}:${request.namespace}`,
          tool: request.tool,
          action: request.action,
          parameters: request.parameters,
          result,
          status: 'completed',
        });

      // Publish completion event
      await this.redis.publish(
        `tenant:${tenant.id}:executions`,
        JSON.stringify({ executionId, status: 'completed', result })
      );

      // Clean up from queue after 1 hour
      setTimeout(() => {
        this.executionQueue.delete(executionId);
      }, 3600000);

    } catch (error) {
      const execution = this.executionQueue.get(executionId);
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date().toISOString();

      // Publish error event
      await this.redis.publish(
        `tenant:${tenant.id}:executions`,
        JSON.stringify({ executionId, status: 'failed', error: error.message })
      );
    }
  }
}

// memory-service/src/middleware/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { MemoryServiceConfig } from '../types/api';

export class AuthMiddleware {
  constructor(private config: MemoryServiceConfig) {}

  middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip auth for health check and docs
      if (['/health', '/docs'].includes(req.path)) {
        return next();
      }

      // Get API key from header
      const apiKey = req.headers[this.config.authentication.apiKeyHeader] as string;
      const authHeader = req.headers.authorization;

      let token: string | null = null;

      // Extract token from authorization header or API key
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (apiKey) {
        token = apiKey;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_AUTH',
            message: 'API key or JWT token required',
          },
        });
      }

      // Verify JWT or API key
      try {
        const decoded = jwt.verify(token, this.config.authentication.jwtSecret);
        (req as any).auth = decoded;
      } catch (jwtError) {
        // Fallback to API key validation
        // This would typically check against a database of valid API keys
        (req as any).auth = { apiKey: token };
      }

      // Add request start time for performance tracking
      (req as any).startTime = Date.now();

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Authentication failed',
        },
      });
    }
  };
}

// memory-service/src/middleware/TenantMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export class TenantMiddleware {
  constructor(private supabase: any) {}

  middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip for non-API routes
      if (!req.path.startsWith('/api/')) {
        return next();
      }

      const auth = (req as any).auth;
      
      // Get tenant information based on API key or JWT
      let tenantId: string;
      
      if (auth.apiKey) {
        // Look up tenant by API key
        const { data: tenant, error } = await this.supabase
          .from('tenants')
          .select('*')
          .eq('api_key', auth.apiKey)
          .eq('status', 'active')
          .single();

        if (error || !tenant) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_API_KEY',
              message: 'Invalid or inactive API key',
            },
          });
        }

        (req as any).tenant = tenant;
      } else if (auth.sub) {
        // Look up tenant by JWT subject
        const { data: tenant, error } = await this.supabase
          .from('tenants')
          .select('*')
          .eq('user_id', auth.sub)
          .eq('status', 'active')
          .single();

        if (error || !tenant) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'TENANT_NOT_FOUND',
              message: 'Tenant not found or inactive',
            },
          });
        }

        (req as any).tenant = tenant;
      } else {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TENANT_IDENTIFICATION_FAILED',
            message: 'Unable to identify tenant',
          },
        });
      }

      // Update last activity
      await this.supabase
        .from('tenants')
        .update({ last_active: new Date().toISOString() })
        .eq('id', (req as any).tenant.id);

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_MIDDLEWARE_ERROR',
          message: error.message,
        },
      });
    }
  };
}
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ServiceAction {
  id: string;
  service: 'clickup' | 'telegram' | 'database' | 'picaos';
  action: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: Date;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: string;
  assignees: any[];
  priority: number;
  due_date?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  text?: string;
  date: number;
}

export interface PicaosTool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: any;
  version: string;
}

export interface PicaosWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: any[];
  status: string;
  created_at: string;
}

export interface PicaosExecution {
  id: string;
  workflow_id?: string;
  tool_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  started_at: string;
  completed_at?: string;
}

export function useServiceIntegration() {
  const [serviceActions, setServiceActions] = useState<ServiceAction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Execute MCP tool via the enhanced handler
  const executeMCPTool = useCallback(async (toolName: string, args: Record<string, any> = {}) => {
    setIsExecuting(true);
    
    const actionId = crypto.randomUUID();
    const service = toolName.split('_')[0] as 'clickup' | 'telegram' | 'database' | 'picaos';
    
    const newAction: ServiceAction = {
      id: actionId,
      service,
      action: toolName,
      args,
      timestamp: new Date()
    };
    
    setServiceActions(prev => [newAction, ...prev]);
    
    try {
      const { data, error } = await supabase.functions.invoke('mcp-handler', {
        body: {
          tool_name: toolName,
          tool_args: args
        }
      });
      
      if (error) throw error;
      
      // Update the action with the result
      setServiceActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, result: data }
            : action
        )
      );
      
      toast({
        title: "Action Completed",
        description: `Successfully executed ${toolName}`,
      });
      
      return data;
    } catch (error) {
      console.error(`Error executing ${toolName}:`, error);
      
      // Update the action with the error
      setServiceActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, error: error.message }
            : action
        )
      );
      
      toast({
        title: "Action Failed",
        description: error.message || `Failed to execute ${toolName}`,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // ClickUp specific actions
  const clickup = {
    createTask: async (listId: string, name: string, description?: string, assignees?: number[], priority?: number) => {
      return executeMCPTool('clickup_create_task', {
        list_id: listId,
        name,
        description,
        assignees,
        priority
      });
    },
    
    getTasks: async (listId: string, assignee?: number) => {
      return executeMCPTool('clickup_get_tasks', {
        list_id: listId,
        assignee
      });
    },
    
    updateTask: async (taskId: string, updates: Partial<ClickUpTask>) => {
      return executeMCPTool('clickup_update_task', {
        task_id: taskId,
        updates
      });
    },
    
    getLists: async (spaceId: string) => {
      return executeMCPTool('clickup_get_lists', {
        space_id: spaceId
      });
    }
  };

  // Telegram specific actions
  const telegram = {
    sendMessage: async (chatId: string | number, text: string, parseMode: string = 'HTML') => {
      return executeMCPTool('telegram_send_message', {
        chat_id: chatId,
        text,
        parse_mode: parseMode
      });
    },
    
    getUpdates: async (offset?: number, limit: number = 100) => {
      return executeMCPTool('telegram_get_updates', {
        offset,
        limit
      });
    },
    
    sendPhoto: async (chatId: string | number, photo: string, caption?: string) => {
      return executeMCPTool('telegram_send_photo', {
        chat_id: chatId,
        photo,
        caption
      });
    }
  };

  // Picaos specific actions
  const picaos = {
    listTools: async (category?: string, search?: string) => {
      return executeMCPTool('picaos_list_tools', {
        category,
        search
      });
    },
    
    getToolSchema: async (toolName: string) => {
      return executeMCPTool('picaos_get_tool_schema', {
        tool_name: toolName
      });
    },
    
    executeTool: async (toolName: string, parameters: Record<string, any>, workflowId?: string) => {
      return executeMCPTool('picaos_execute_tool', {
        tool_name: toolName,
        parameters,
        workflow_id: workflowId
      });
    },
    
    searchTools: async (query: string, limit: number = 20) => {
      return executeMCPTool('picaos_search_tools', {
        query,
        limit
      });
    },
    
    createWorkflow: async (workflowName: string, steps: any[], description?: string) => {
      return executeMCPTool('picaos_create_workflow', {
        workflow_name: workflowName,
        steps,
        description
      });
    },
    
    executeWorkflow: async (workflowId: string, inputData?: Record<string, any>) => {
      return executeMCPTool('picaos_execute_workflow', {
        workflow_id: workflowId,
        input_data: inputData
      });
    },
    
    getExecutionStatus: async (executionId: string) => {
      return executeMCPTool('picaos_get_execution_status', {
        execution_id: executionId
      });
    }
  };

  // Database specific actions
  const database = {
    searchMemories: async (query: string, limit: number = 5, threshold: number = 0.7) => {
      return executeMCPTool('database_search_memories', {
        query,
        limit,
        threshold
      });
    },
    
    createMemory: async (title: string, content: string, memoryType: string = 'knowledge', projectRef: string = 'ai-chat') => {
      return executeMCPTool('database_create_memory', {
        title,
        content,
        memory_type: memoryType,
        project_ref: projectRef
      });
    },
    
    updateMemory: async (memoryId: string, updates: Record<string, any>) => {
      return executeMCPTool('database_update_memory', {
        memory_id: memoryId,
        updates
      });
    },
    
    getMemoryStats: async (userId: string) => {
      return executeMCPTool('database_get_memory_stats', {
        user_id: userId
      });
    }
  };

  // Clear action history
  const clearActions = useCallback(() => {
    setServiceActions([]);
  }, []);

  return {
    serviceActions,
    isExecuting,
    clickup,
    telegram,
    picaos,
    database,
    executeMCPTool,
    clearActions
  };
}

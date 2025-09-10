
import { getAPIKeys, isValidApiKey } from './environment';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

export type AIModel = 'free' | 'openai' | 'anthropic' | 'perplexity' | 'gemini' | 'deepseek' | 'mistral' | 'openrouter';

export interface ModelCapability {
  text: boolean;
  vision?: boolean;
  function_calling?: boolean;
  web_search?: boolean;
  code?: boolean;
  reasoning?: boolean;
  multimodal?: boolean;
  real_time?: boolean;
}

export interface ModelConfig {
  id: AIModel;
  name: string;
  description: string;
  apiKeyName: string;
  isAvailable: boolean;
  capabilities: ModelCapability;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
}

// Cache for API keys
let cachedApiKeys: Record<string, string | null> | null = null;
let lastCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getAvailableModels = async (): Promise<ModelConfig[]> => {
  // Get fresh keys or use cached ones
  const keys = await getCachedAPIKeys();
  
  return [
    {
      id: 'free',
      name: 'Ghost AI',
      description: 'Free intelligent assistant powered by advanced AI - no API key required',
      apiKeyName: 'NONE',
      isAvailable: true, // Always available
      capabilities: { 
        text: true, 
        code: true, 
        reasoning: true 
      },
      maxTokens: 4000,
      costTier: 'low'
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4o',
      description: 'Powered by GPT-4o models with vision capabilities',
      apiKeyName: 'OPENAI_API_KEY',
      isAvailable: isValidApiKey(keys.openaiApiKey),
      capabilities: { text: true, vision: true, function_calling: true },
      maxTokens: 4096,
      costTier: 'medium'
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Powered by Claude models with advanced reasoning',
      apiKeyName: 'CLAUDE_API_KEY',
      isAvailable: isValidApiKey(keys.claudeApiKey),
      capabilities: { text: true, vision: true, reasoning: true },
      maxTokens: 4096,
      costTier: 'medium'
    },
    {
      id: 'perplexity',
      name: 'Perplexity AI',
      description: 'Powered by Llama models with real-time web search',
      apiKeyName: 'PERPLEXITY_API_KEY',
      isAvailable: isValidApiKey(keys.perplexityApiKey),
      capabilities: { text: true, web_search: true, real_time: true },
      maxTokens: 1000,
      costTier: 'low'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      description: 'Access multiple AI models through a single API',
      apiKeyName: 'OPENROUTER_API_KEY',
      isAvailable: isValidApiKey(keys.openrouterApiKey),
      capabilities: { 
        text: true, 
        vision: true, 
        function_calling: true,
        model_routing: true,
        cost_tracking: true 
      },
      maxTokens: 4000,
      costTier: 'medium'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Powered by Gemini Pro with multimodal capabilities',
      apiKeyName: 'GEMINI_API_KEY',
      isAvailable: isValidApiKey(keys.geminiApiKey),
      capabilities: { text: true, vision: true, multimodal: true },
      maxTokens: 1000,
      costTier: 'low'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek Coder',
      description: 'Powered by DeepSeek-Coder for code and reasoning',
      apiKeyName: 'DEEPSEEK_API_KEY',
      isAvailable: isValidApiKey(keys.deepseekApiKey),
      capabilities: { text: true, code: true, reasoning: true },
      maxTokens: 1000,
      costTier: 'low'
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'Powered by Mistral Large with function calling',
      apiKeyName: 'MISTRAL_API_KEY',
      isAvailable: isValidApiKey(keys.mistralApiKey),
      capabilities: { text: true, function_calling: true, reasoning: true },
      maxTokens: 1000,
      costTier: 'medium'
    }
  ];
};

// Helper to get API keys with caching
const getCachedAPIKeys = async () => {
  const now = Date.now();
  
  // If we have cached keys that aren't expired, use them
  if (cachedApiKeys && (now - lastCacheTime) < CACHE_TTL) {
    return {
      projectRef: 'nbmomsntbamfthxfdnme',
      openaiApiKey: cachedApiKeys.OPENAI_API_KEY,
      claudeApiKey: cachedApiKeys.CLAUDE_API_KEY,
      perplexityApiKey: cachedApiKeys.PERPLEXITY_API_KEY,
      openrouterApiKey: cachedApiKeys.OPENROUTER_API_KEY,
      geminiApiKey: cachedApiKeys.GEMINI_API_KEY,
      deepseekApiKey: cachedApiKeys.DEEPSEEK_API_KEY,
      mistralApiKey: cachedApiKeys.MISTRAL_API_KEY
    };
  }
  
  // Otherwise fetch fresh keys
  try {
    const keys = await getAPIKeys();
    
    // Update the cache
    cachedApiKeys = {
      OPENAI_API_KEY: keys.openaiApiKey,
      CLAUDE_API_KEY: keys.claudeApiKey,
      PERPLEXITY_API_KEY: keys.perplexityApiKey,
      OPENROUTER_API_KEY: keys.openrouterApiKey,
      GEMINI_API_KEY: keys.geminiApiKey,
      DEEPSEEK_API_KEY: keys.deepseekApiKey,
      MISTRAL_API_KEY: keys.mistralApiKey
    };
    lastCacheTime = now;
    
    return keys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    toast({
      title: "API Key Error",
      description: "Failed to retrieve API keys. Some features may be limited.",
      variant: "destructive",
    });
    
    // Return empty keys on error
    return {
      projectRef: 'nbmomsntbamfthxfdnme',
      openaiApiKey: null,
      claudeApiKey: null,
      perplexityApiKey: null,
      openrouterApiKey: null,
      geminiApiKey: null,
      deepseekApiKey: null,
      mistralApiKey: null
    };
  }
};

export interface MessagePayload {
  content: string;
  modelId: AIModel;
  taskType?: 'general' | 'code' | 'analysis' | 'creative' | 'search';
  context?: any[];
}

export interface ModelResponse {
  id: string;
  content: string;
  modelId: AIModel;
  timestamp: string;
  capabilities?: ModelCapability;
}

/**
 * Select the best model for a given task type
 */
export const selectOptimalModel = async (taskType: string, availableModels?: ModelConfig[]): Promise<AIModel> => {
  if (!availableModels) {
    availableModels = await getAvailableModels();
  }
  
  const available = availableModels.filter(m => m.isAvailable);
  
  switch (taskType) {
    case 'code':
      return available.find(m => m.capabilities.code)?.id || 'deepseek';
    case 'search':
      return available.find(m => m.capabilities.web_search)?.id || 'perplexity';
    case 'vision':
      return available.find(m => m.capabilities.vision)?.id || 'openai';
    case 'reasoning':
      return available.find(m => m.capabilities.reasoning)?.id || 'anthropic';
    case 'function_calling':
      return available.find(m => m.capabilities.function_calling)?.id || 'openrouter';
    case 'model_routing':
      return available.find(m => m.capabilities.model_routing)?.id || 'openrouter';
    default:
      return available[0]?.id || 'free';
  }
};

/**
 * Send a message to an AI model through the MCP protocol
 */
export const sendMessageToModel = async (payload: MessagePayload): Promise<ModelResponse> => {
  const { content, modelId, taskType = 'general', context = [] } = payload;
  const keys = await getCachedAPIKeys();
  
  try {
    // For demo mode, return a mock response if using placeholder keys
    const modelKeyMap = {
      free: 'FREE_MODEL_NO_KEY_REQUIRED',
      openai: keys.openaiApiKey,
      anthropic: keys.claudeApiKey,
      perplexity: keys.perplexityApiKey,
      openrouter: keys.openrouterApiKey,
      gemini: keys.geminiApiKey,
      deepseek: keys.deepseekApiKey,
      mistral: keys.mistralApiKey
    };
    
    if (!isValidApiKey(modelKeyMap[modelId] as string) && modelId !== 'free') {
      console.log(`Using demo mode for ${modelId} as no valid API key is provided`);
      return {
        id: Date.now().toString(),
        content: `This is a demo response. To get real responses from ${modelId}, please add a valid API key in your environment settings.`,
        modelId,
        timestamp: new Date().toISOString()
      };
    }
    
    // Call the Supabase Edge Function with the appropriate model
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message: content,
        model: modelId,
        apiKeys: {
          free: 'FREE_MODEL_NO_KEY_REQUIRED',
          openai: keys.openaiApiKey,
          anthropic: keys.claudeApiKey,
          perplexity: keys.perplexityApiKey,
          openrouter: keys.openrouterApiKey,
          gemini: keys.geminiApiKey,
          deepseek: keys.deepseekApiKey,
          mistral: keys.mistralApiKey
        },
        protocol: 'mcp',
        format: 'json',
        taskType,
        context
      }
    });
    
    if (error) {
      console.error(`Error from edge function:`, error);
      throw new Error(`Failed to get response from ${modelId}: ${error.message}`);
    }
    
    if (data.error) {
      throw new Error(`${modelId} error: ${data.error}`);
    }
    
    return {
      id: Date.now().toString(),
      content: data.response || data.tool_responses?.[0]?.response || "No response received",
      modelId,
      timestamp: new Date().toISOString(),
      capabilities: data.model_config?.capabilities
    };
  } catch (error) {
    console.error(`Error sending message to ${modelId}:`, error);
    throw error;
  }
};

// MCP Protocol functions - these map to MCP client operations
export const mcpFunctions = {
  // Query database through MCP server
  executeQuery: async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mcp-handler', {
        body: {
          tool_name: 'execute_sql',
          tool_args: { query }
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error executing query:', error);
      // Return mock data for demo purposes
      return {
        data: [{ message: 'Demo query result (no MCP connection)' }],
        success: true
      };
    }
  },
  
  // List available tables
  listTables: async (schema = 'public') => {
    try {
      const { data, error } = await supabase.functions.invoke('mcp-handler', {
        body: {
          tool_name: 'list_tables',
          tool_args: { schema }
        }
      });
      
      if (error) throw error;
      return data.tables;
    } catch (error) {
      console.error('Error listing tables:', error);
      // Return mock data for demo purposes
      return ['users', 'products', 'orders'];
    }
  },
  
  // Get schema for a table
  getTableSchema: async (tableName: string, schemaName = 'public') => {
    try {
      const { data, error } = await supabase.functions.invoke('mcp-handler', {
        body: {
          tool_name: 'get_table_schema',
          tool_args: { tableName, schemaName }
        }
      });
      
      if (error) throw error;
      return data.schema;
    } catch (error) {
      console.error('Error getting table schema:', error);
      // Return mock data for demo purposes
      return [
        { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
        { column_name: 'name', data_type: 'text', is_nullable: 'NO' },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES' }
      ];
    }
  },
  
  // Subscribe to changes on a table
  subscribeToChanges: async (table: string, schema = 'public', event?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mcp-handler', {
        body: {
          tool_name: 'subscribe_to_changes',
          tool_args: { table, schema, event }
        }
      });
      
      if (error) throw error;
      return data.subscription;
    } catch (error) {
      console.error('Error subscribing to changes:', error);
      // Return mock data for demo purposes
      return {
        id: `${schema}-${table}-${event || '*'}-${Date.now()}`,
        channel: 'table-changes',
        table
      };
    }
  },
  
  // Get secrets (API keys)
  getSecrets: async (keys: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('mcp-handler', {
        body: {
          tool_name: 'get_secrets',
          tool_args: { keys }
        }
      });
      
      if (error) throw error;
      return data.secrets;
    } catch (error) {
      console.error('Error getting secrets:', error);
      return {};
    }
  }
};

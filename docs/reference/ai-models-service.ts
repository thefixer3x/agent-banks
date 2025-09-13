// src/services/aiModels.ts
import { supabase } from '@/integrations/supabase/client';

export type AIModel = 'openai' | 'anthropic' | 'perplexity' | 'gemini' | 'deepseek' | 'mistral';

export interface AIModelConfig {
  id: AIModel;
  name: string;
  description: string;
  isAvailable: boolean;
  capabilities: string[];
  requiresApiKey: boolean;
}

export interface SendMessageOptions {
  content: string;
  modelId: AIModel;
  context?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  memoryContext?: any[];
}

export interface AIResponse {
  id: string;
  content: string;
  model: AIModel;
  timestamp: Date;
  memoryContextsUsed?: number;
}

// Get user's API keys from secure storage
async function getUserApiKeys(): Promise<Record<string, string>> {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('api_keys')
    .single();
  
  return settings?.api_keys || {};
}

// Send message to AI model through edge function
export async function sendMessageToModel(options: SendMessageOptions): Promise<AIResponse> {
  const { content, modelId, context = [], memoryContext = [] } = options;
  
  // Get user's API keys
  const apiKeys = await getUserApiKeys();
  
  // Call the edge function with memory context
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      message: content,
      model: modelId,
      apiKeys,
      context,
      memoryContext, // Pass memory context to edge function
      protocol: 'mcp', // Use MCP protocol for enhanced features
      format: 'text'
    }
  });

  if (error) {
    console.error('AI Chat Error:', error);
    throw new Error(error.message || 'Failed to get AI response');
  }

  // Extract response based on protocol
  const responseContent = data.tool_responses?.[0]?.response || data.response;
  
  return {
    id: crypto.randomUUID(),
    content: responseContent,
    model: modelId,
    timestamp: new Date(),
    memoryContextsUsed: data.memory_contexts_used
  };
}

// Get available AI models
export async function getAvailableModels(): Promise<AIModelConfig[]> {
  const models: AIModelConfig[] = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      description: 'Most capable model for complex tasks',
      isAvailable: true,
      capabilities: ['chat', 'code', 'analysis', 'creative'],
      requiresApiKey: true
    },
    {
      id: 'anthropic',
      name: 'Claude 3',
      description: 'Excellent for analysis and writing',
      isAvailable: true,
      capabilities: ['chat', 'code', 'analysis', 'writing'],
      requiresApiKey: true
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'Best for research and fact-checking',
      isAvailable: true,
      capabilities: ['research', 'facts', 'citations'],
      requiresApiKey: true
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Google\'s multimodal AI',
      isAvailable: true,
      capabilities: ['chat', 'vision', 'code'],
      requiresApiKey: true
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Specialized in coding tasks',
      isAvailable: true,
      capabilities: ['code', 'debugging', 'optimization'],
      requiresApiKey: true
    },
    {
      id: 'mistral',
      name: 'Mistral',
      description: 'Fast and efficient model',
      isAvailable: true,
      capabilities: ['chat', 'code', 'multilingual'],
      requiresApiKey: true
    }
  ];

  // Check which models have API keys configured
  const apiKeys = await getUserApiKeys();
  
  return models.map(model => ({
    ...model,
    isAvailable: !model.requiresApiKey || !!apiKeys[model.id]
  }));
}
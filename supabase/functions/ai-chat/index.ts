// XHR polyfill for Deno environment
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// Import Deno HTTP server module - using stable version
// Use import with literal URL to ensure Deno can resolve it properly
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Ensure TypeScript recognizes Deno namespace
// Using const instead of var for ESLint
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Define TypeScript interfaces
interface ApiKeyMap {
  openai?: string;
  anthropic?: string;
  perplexity?: string;
  gemini?: string;
  deepseek?: string;
  mistral?: string;
  openrouter?: string;
  [key: string]: string | undefined;
}

interface ModelConfig {
  name: string;
  endpoint: string;
  defaultModel: string;
  maxTokens: number;
  capabilities: string[];
  isFree?: boolean;
  backendProvider?: string;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  requiresKey?: boolean;
  supportedModels?: string[];
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

interface MemoryContext {
  content: string;
  topic_name?: string;
  title?: string;
  similarity?: number;
  [key: string]: unknown;
}

interface SearchMemoriesParams {
  query: string;
  limit?: number;
}

interface CreateMemoryParams {
  title: string;
  content: string;
  tags?: string[];
}

interface AnalyzeContextParams {
  focus_area: string;
}

interface ToolCallFunctionArgs {
  [key: string]: unknown;
}

interface ToolCallResult {
  [key: string]: unknown;
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolCallExecution {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp?: string;
}

interface OpenRouterOptions {
  topP?: number;
  topK?: number;
  temperature?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  seed?: number;
  logit_bias?: Record<string, number>;
  response_format?: { type: string };
  fallbackModels?: string[];
  route?: string;
  customOptions?: Record<string, unknown>;
  referer?: string;
  title?: string;
  userId?: string;
  [key: string]: unknown;
}

interface ChatMessage {
  role: string;
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  name?: string;
  [key: string]: unknown;
}

interface MemoryContext {
  topic_name: string;
  content: string;
}

interface RequestBody {
  messages?: ChatMessage[];
  message?: string;
  model: string;
  apiKeys: ApiKeyMap;
  protocol?: string;
  format?: string;
  context?: ChatMessage[];
  taskType?: string;
  memoryContext?: MemoryContext[];
  conversationId?: string;
  toolOrchestration?: boolean;
  preferredOpenRouterModel?: string;
  openRouterOptions?: OpenRouterOptions;
  streamResponse?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configurations
const MODEL_CONFIGS = {
  free: {
    name: "Ghost AI",
    endpoint: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    maxTokens: 4000,
    capabilities: ["chat", "code", "analysis", "reasoning", "problem-solving"],
    isFree: true,
    backendProvider: "deepseek"
  },
  openrouter: {
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "openai/gpt-4",
    maxTokens: 4000,
    capabilities: ["chat", "code", "analysis", "creative", "vision", "function_calling", "model_routing", "cost_tracking"],
    requiresKey: true,
    supportedModels: [
      "openai/gpt-4-turbo-preview",
      "openai/gpt-4",
      "openai/gpt-3.5-turbo",
      "anthropic/claude-3-opus",
      "anthropic/claude-3-sonnet",
      "anthropic/claude-3-haiku",
      "google/gemini-pro",
      "google/gemini-pro-vision",
      "meta-llama/llama-2-70b-chat",
      "mistralai/mistral-medium"
    ],
    features: {
      streaming: true,
      tools: true,
      vision: true,
      costTracking: true,
      providerRouting: true,
      fallbacks: true
    }
  },
  openai: {
    name: "OpenAI GPT-4",
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    maxTokens: 4000,
    capabilities: ["chat", "code", "analysis", "creative"]
  },
  anthropic: {
    name: "Claude 3",
    endpoint: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-haiku-20240307",
    maxTokens: 4000,
    capabilities: ["chat", "code", "analysis", "writing"]
  },
  perplexity: {
    name: "Perplexity",
    endpoint: "https://api.perplexity.ai/chat/completions",
    defaultModel: "llama-3.1-sonar-small-128k-online",
    maxTokens: 4000,
    capabilities: ["research", "facts", "citations"]
  },
  gemini: {
    name: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
    defaultModel: "gemini-1.5-flash",
    maxTokens: 4000,
    capabilities: ["chat", "vision", "code"]
  },
  deepseek: {
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    maxTokens: 4000,
    capabilities: ["code", "debugging", "optimization"]
  },
  mistral: {
    name: "Mistral",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-large-latest",
    maxTokens: 4000,
    capabilities: ["chat", "code", "multilingual"]
  }
};

// Enhanced system prompt that acknowledges memory context
const MEMORY_AWARE_SYSTEM_PROMPT = `You are a helpful assistant with access to a comprehensive memory system that stores past conversations, knowledge, and context.

When provided with memory context, you should:
1. Reference relevant past interactions and stored knowledge naturally
2. Maintain consistency with previous conversations
3. Build upon existing knowledge rather than starting fresh
4. Acknowledge when you're using remembered information when relevant
5. Provide more personalized responses based on conversation history

Your responses should feel continuous and aware of the user's history and preferences while remaining helpful and accurate.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with proper typing
    const requestBody = await req.json() as RequestBody;
    
    const { 
      messages = [],  // ✅ Full conversation history
      message,  // Legacy support
      model, 
      apiKeys, 
      protocol = "standard", 
      format = "text", 
      context = [], 
      taskType = "general",
      memoryContext = [],
      conversationId,
      toolOrchestration = false,
      // OpenRouter specific options
      preferredOpenRouterModel,
      openRouterOptions = {},
      streamResponse = false
    } = await req.json();
    
    // Support both new (messages array) and legacy (single message) formats
    if (!messages.length && !message) {
      throw new Error('No message or messages provided');
    }

    const modelConfig = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }
    
    console.log(`Processing ${model} request with ${memoryContext.length} memory contexts`);
    
    // Get API keys from environment variables (Supabase secrets)
    // Validate and normalize API keys
    const apiKeyMap = Object.fromEntries(
      Object.entries({
        openai: Deno.env.get('OPENAI_API_KEY') || apiKeys?.openai,
        anthropic: Deno.env.get('CLAUDE_API_KEY') || apiKeys?.anthropic,
        perplexity: Deno.env.get('PERPLEXITY_API_KEY') || apiKeys?.perplexity,
        gemini: Deno.env.get('GEMINI_API_KEY') || apiKeys?.gemini,
        deepseek: Deno.env.get('DEEPSEEK_API_KEY') || apiKeys?.deepseek,
        mistral: Deno.env.get('MISTRAL_API_KEY') || apiKeys?.mistral,
        openrouter: Deno.env.get('OPENROUTER_API_KEY') || apiKeys?.openrouter
      }).map(([key, value]) => [key, value?.trim()])
    );

    // Validate memory context structure
    if (memoryContext && memoryContext.length > 0) {
      const isValidMemory = memoryContext.every((memory: any) => 
        memory && typeof memory === 'object' && 'content' in memory
      );
      if (!isValidMemory) {
        throw new Error('Invalid memory context structure');
      }
    }
    
    // Enhance context with memory information
    const enhancedContext = [...context];
    
    // Add memory context if available
    if (memoryContext && memoryContext.length > 0) {
      // Group memories by topic for better organization
      const memoriesByTopic = memoryContext.reduce<Record<string, string[]>>((acc, memory) => {
        const topic = memory.topic_name || 'General Knowledge';
        if (!acc[topic]) acc[topic] = [];
        acc[topic].push(memory.content);
        return acc;
      }, {} as Record<string, string[]>);

      // Add organized memory context
      Object.entries(memoriesByTopic).forEach((entry) => {
        const topic = entry[0];
        const memories = entry[1] as string[];
        enhancedContext.push({
          role: 'system',
          content: `[Memory Context - ${topic}]:
${memories.map((m: string) => 
            `• ${m}
`
          ).join('\n')}`
        });
      });
    }

    // Define available tools for tool orchestration
    const tools = [
      {
        type: "function",
        function: {
          name: "searchMemories",
          description: "Search through the memory database for relevant information",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query for memories" },
              limit: { type: "number", description: "Maximum number of results", default: 5 }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_memory",
          description: "Store important information in memory for future reference",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Memory title" },
              content: { type: "string", description: "Memory content" },
              tags: { type: "array", items: { type: "string" }, description: "Relevant tags" }
            },
            required: ["title", "content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_conversation_context",
          description: "Analyze the conversation flow and context for better responses",
          parameters: {
            type: "object",
            properties: {
              focus_area: { type: "string", description: "Area to focus analysis on" }
            },
            required: ["focus_area"]
          }
        }
      }
    ];

    // Tool function implementations
    const searchMemoriesFunction = async (args: Record<string, unknown>): Promise<unknown> => {
      console.log("Searching memories:", args);
      // Placeholder implementation
      return {
        results: ["Sample memory result for " + args.query],
        count: 1
      };
    };

    const createMemoryFunction = async (args: Record<string, unknown>): Promise<unknown> => {
      console.log("Creating memory:", args);
      // Placeholder implementation
      return {
        success: true,
        memory_id: "mem_" + Date.now(),
        title: args.title
      };
    };

    const analyzeContextFunction = async (args: Record<string, unknown>): Promise<unknown> => {
      console.log("Analyzing context:", args);
      // Placeholder implementation
      return {
        focus_area: args.focus_area,
        analysis: "Context analysis complete",
        suggestions: ["Consider asking about X", "User might be interested in Y"]
      };
    };
    
    // Map tool names to functions
    const TOOL_MAPPING: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
      "search_memories": searchMemoriesFunction,
      "create_memory": createMemoryFunction,
      "analyze_conversation_context": analyzeContextFunction
    };

    // Define and initialize local variables for tool orchestration
    // Using const and mutable array pattern instead of reassigning the variable
    const currentMessages: ChatMessage[] = [...enhancedContext]; // Use the already formatted messages
    const toolCallsExecuted: ToolCallExecution[] = [];
    let iteration = 0;
    const MAX_ITERATIONS = 5;
    
    // Create a proper ModelConfig object
    const aiModelConfig: ModelConfig = {
      name: MODEL_CONFIGS[model].name,
      endpoint: MODEL_CONFIGS[model].endpoint,
      defaultModel: MODEL_CONFIGS[model].defaultModel,
      maxTokens: MODEL_CONFIGS[model].maxTokens,
      capabilities: MODEL_CONFIGS[model].capabilities,
      tools: tools
    };
    
    // Get initial AI response
    let aiResponse = await callAI(currentMessages, model, apiKeys, aiModelConfig);
    
    // Start tool orchestration loop
    while (iteration < MAX_ITERATIONS) {
      // Check if there are tool calls to execute
      if (!aiResponse.tool_calls || aiResponse.tool_calls.length === 0) {
        break; // No more tool calls, exit the loop
      }
      
      // Process each tool call
      for (const toolCall of aiResponse.tool_calls) {
        // Use type assertion with unknown first for safety
        const toolCallFunction = toolCall.function as unknown as { name: string; arguments: string } | undefined;
        const toolName = toolCallFunction?.name;
        
        if (!toolName || !TOOL_MAPPING[toolName]) {
          console.error(`Tool ${toolName} not found`);
          continue;
        }
        
        try {
          // Parse arguments from tool call
          const args = JSON.parse(toolCallFunction?.arguments || '{}') as Record<string, unknown>;
          
          // Execute the tool
          const result = await TOOL_MAPPING[toolName](args);
          
          // Add tool result to messages
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id || '',
            content: JSON.stringify(result)
          });
          
          // Track executed tool calls
          toolCallsExecuted.push({
            toolName,
            args,
            result
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error executing tool ${toolName}:`, error);
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id || '',
            content: JSON.stringify({ error: `Tool execution failed: ${errorMessage}` })
          });
        }
      }
      
      // Increment iteration counter
      iteration++;
      
      // Make another API call with updated messages that include tool results
      aiResponse = await callAI(currentMessages, model, apiKeys, aiModelConfig);
    }
    
    // Final response is the last AI response
    const finalResponse = aiResponse;

    // Max iterations reached
    if (iteration === MAX_ITERATIONS) {
      return {
        response: finalResponse.content,
        toolCallsExecuted: toolCallsExecuted,
        totalIterations: iteration,
        maxIterationsReached: true
      };
    }

    // Return final response
    return {
      response: finalResponse.content,
      toolCallsExecuted: toolCallsExecuted,
      totalIterations: iteration
    };
  } catch (error: any) {
    console.error('Error processing request:', error);
    return {
      error: error.message
    };
  }
});

// Helper function to call AI models with proper error handling
async function callAI(messages: ChatMessage[], model: string, apiKeys: ApiKeyMap, modelConfig: ModelConfig) {
  try {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS.free;
    const endpoint = config.endpoint;
    const apiKey = apiKeys[config.backendProvider];
    
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${config.backendProvider}`);
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Set appropriate authorization header based on provider
    if (config.backendProvider === 'openai') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (config.backendProvider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const requestBody: Record<string, any> = {
      messages,
      max_tokens: config.maxTokens || 4000,
      temperature: 0.7,
    };
    
    // Add model parameter for providers that require it
    if (['openai', 'deepseek', 'mistral', 'openrouter'].includes(config.backendProvider)) {
      requestBody.model = config.defaultModel;
    }
    
    // Add tools if provided
    if (modelConfig.tools && modelConfig.tools.length > 0) {
      requestBody.tools = modelConfig.tools;
      requestBody.tool_choice = 'auto';
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract content based on provider response format
    if (config.backendProvider === 'anthropic') {
      return {
        content: data.content?.[0]?.text || '',
        tool_calls: data.content?.[0]?.tool_calls || []
      };
    } else {
      return {
        content: data.choices?.[0]?.message?.content || '',
        tool_calls: data.choices?.[0]?.message?.tool_calls || []
      };
    }
  } catch (error: any) {
    console.error('Error calling AI model:', error);
    return { content: `Error: ${error.message}`, tool_calls: [] };
  }
}

// Tool execution functions
async function searchMemoriesFunction(args: Record<string, unknown>) {
  // Simulate memory search - replace with actual Supabase query
  return {
    results: [
      {
        id: "mem_1",
        title: "Previous conversation context",
        content: `Relevant information about ${args.query}`,
        similarity: 0.85
      }
    ]
  };
}

async function createMemoryFunction(args: any) {
  // Simulate memory creation - replace with actual Supabase insert
  return {
    id: "mem_" + Date.now(),
    title: args.title,
    content: args.content,
    tags: args.tags || [],
    created_at: new Date().toISOString()
  };
}

async function analyzeContextFunction(args: any) {
  return {
    analysis: `Context analysis for ${args.focus_area}`,
    insights: ["User is asking for technical implementation", "Conversation involves tool orchestration"],
    recommendations: ["Provide detailed technical examples", "Reference previous discussion points"]
  };
}

// Enhanced LLM calling function with tool support
async function callLLMWithTools(messages: ChatMessage[], model: string, apiKeyMap: ApiKeyMap, tools: Array<{ type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }>, modelConfig: ModelConfig) {
  const apiKey = apiKeyMap[model];
  if (!apiKey) {
    return { content: `No API key found for ${model}. Using mock response.` };
  }

  try {
    switch (model) {
      case 'openai':
        return await callOpenAIWithTools(messages, apiKey, tools, modelConfig);
      case 'anthropic':
        return await callAnthropicWithTools(messages, apiKey, tools, modelConfig);
      case 'openrouter':
        return await callOpenRouterWithTools(messages, apiKey, tools, modelConfig);
      default: {
        // For models without tool support, call normally
        const userMessage = messages[messages.length - 1]?.content || '';
        const response = await callOpenAI(userMessage, apiKey, [], modelConfig, MEMORY_AWARE_SYSTEM_PROMPT);
        return { content: response };
      }
    }
  } catch (error) {
    console.error(`Error calling ${model}:`, error);
    return { content: `Error: ${error.message}` };
  }
}

async function callOpenAIWithTools(messages: ChatMessage[], apiKey: string, tools: Array<{ type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }>, modelConfig: ModelConfig) {
  const response = await fetch(modelConfig.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.defaultModel,
      messages: [
        { role: 'system', content: MEMORY_AWARE_SYSTEM_PROMPT },
        ...messages
      ],
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0.7,
      max_tokens: modelConfig.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;
  
  return {
    content: message.content,
    tool_calls: message.tool_calls
  };
}

async function callOpenRouterWithTools(messages: ChatMessage[], apiKey: string, tools: Array<{ type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }>, modelConfig: ModelConfig) {
  const response = await fetch(modelConfig.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ghostprotocol.ai',
      'X-Title': 'Ghost Protocol'
    },
    body: JSON.stringify({
      model: modelConfig.defaultModel,
      messages: [
        { role: 'system', content: MEMORY_AWARE_SYSTEM_PROMPT },
        ...messages
      ],
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0.7,
      max_tokens: modelConfig.maxTokens,
      // OpenRouter specific for tools
      provider: {
        order: ["OpenAI", "Anthropic"],
        require_parameters: true
      },
      // Include usage in response
      stream_options: { include_usage: true }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;
  
  return {
    content: message.content,
    tool_calls: message.tool_calls,
    model_used: data.model,
    provider_used: data.provider,
    total_cost: data.usage?.total_cost
  };
}

async function callAnthropicWithTools(messages: ChatMessage[], apiKey: string, tools: Array<{ type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }>, modelConfig: ModelConfig) {
  // Anthropic tool calling implementation
  const response = await fetch(modelConfig.endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.defaultModel,
      max_tokens: modelConfig.maxTokens,
      temperature: 0.7,
      system: MEMORY_AWARE_SYSTEM_PROMPT,
      messages: messages,
      tools: tools.length > 0 ? tools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters
      })) : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API Error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Convert Anthropic format to OpenAI-compatible format
  const content = data.content?.[0]?.text || '';
  const tool_calls = data.content?.filter(c => c.type === 'tool_use').map(tool => ({
    id: tool.id,
    type: 'function',
    function: {
      name: tool.name,
      arguments: JSON.stringify(tool.input)
    }
  }));

  return {
    content,
    tool_calls
  };
}

// Enhanced model functions with memory-aware system prompts
async function callOpenAI(message: string, apiKey: string, context: ChatMessage[] = [], modelConfig: ModelConfig, systemPrompt: string) {
  if (!apiKey) {
    return "This model requires an API key. Please configure API keys in settings to access this model.";
  }

  try {
    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };
    
    const messages = [systemMessage];
    
    // Add context including memory context
    if (context && context.length > 0) {
      messages.push(...context);
    }
    
    messages.push({ role: 'user', content: message });
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.defaultModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: modelConfig.maxTokens,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    throw error;
  }
}

async function callAnthropic(message: string, apiKey: string, context: ChatMessage[] = [], modelConfig: ModelConfig, systemPrompt: string) {
  if (!apiKey) {
    return "This model requires an API key. Please configure API keys in settings to access this model.";
  }

  try {
    let fullSystemPrompt = systemPrompt;
    const messages: Array<{ role: string; content: string }> = [];
    
    // Process memory context and other context
    if (context && context.length > 0) {
      for (const msg of context) {
        if (msg.role === 'system') {
          fullSystemPrompt += '\n\n' + msg.content;
        } else if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      }
    }
    
    // Add the current user message
    messages.push({ role: 'user', content: message });
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.defaultModel,
        max_tokens: modelConfig.maxTokens,
        temperature: 0.7,
        system: fullSystemPrompt,
        messages: messages,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Anthropic API call failed:", error);
    throw error;
  }
}

async function callPerplexity(message: string, apiKey: string, context: any[] = [], modelConfig: any, systemPrompt: string) {
  if (!apiKey) {
    return "This model requires an API key. Please configure API keys in settings to access this model.";
  }

  try {
    const systemMessage = { role: 'system', content: systemPrompt };
    const messages = [systemMessage];
    
    if (context && context.length > 0) {
      messages.push(...context);
    }
    
    messages.push({ role: 'user', content: message });
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.defaultModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: modelConfig.maxTokens,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Perplexity API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Perplexity API call failed:", error);
    throw error;
  }
}

async function callGemini(message: string, apiKey: string, context: any[] = [], modelConfig: any, systemPrompt: string) {
  if (!apiKey) {
    return "This model requires an API key. Please configure API keys in settings to access this model.";
  }

  try {
    const parts = [{ text: systemPrompt + '\n\n' + message }];
    
    const response = await fetch(`${modelConfig.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: modelConfig.maxTokens,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
}

async function callDeepSeek(message: string, apiKey: string, context: any[] = [], modelConfig: any, systemPrompt: string) {
  if (!apiKey) {
    return "This model requires an API key. Please configure API keys in settings to access this model.";
  }

  try {
    const systemMessage = { role: 'system', content: systemPrompt };
    const messages = [systemMessage];
    
    if (context && context.length > 0) {
      messages.push(...context);
    }
    
    messages.push({ role: 'user', content: message });
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.defaultModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: modelConfig.maxTokens,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API call failed:", error);
    throw error;
  }
}

async function callOpenRouter(message: string, apiKey: string, context: ChatMessage[] = [], modelConfig: ModelConfig, systemPrompt: string, options: OpenRouterOptions = {}) {
  if (!apiKey) {
    return "This model requires an API key. Please configure OpenRouter API key in settings.";
  }

  try {
    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };
    
    const messages = [systemMessage];
    
    if (context && context.length > 0) {
      messages.push(...context);
    }
    
    messages.push({ role: 'user', content: message });
    
    // Enhanced OpenRouter configuration
    const requestBody = {
      model: options.preferredModel || modelConfig.defaultModel,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      // OpenRouter specific features
      stream: options.stream || false,
      stream_options: options.stream ? { include_usage: true } : undefined,
      // Provider preferences
      providers: options.providers || {
        order: ["OpenAI", "Anthropic", "Google"],
        require_parameters: true,
        allow_fallbacks: true
      },
      // Advanced parameters
      top_p: options.top_p || 1,
      top_k: options.top_k,
      frequency_penalty: options.frequency_penalty || 0,
      presence_penalty: options.presence_penalty || 0,
      repetition_penalty: options.repetition_penalty,
      seed: options.seed,
      logit_bias: options.logit_bias,
      // Response format
      response_format: options.response_format,
      // Fallback models
      models: options.fallbackModels || [modelConfig.defaultModel],
      route: options.route || "fallback",
      // Custom options from request
      ...options.customOptions
    };
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': options.referer || 'https://ghostprotocol.ai',
        'X-Title': options.title || 'Ghost Protocol',
        // Optional user tracking
        ...(options.userId && { 'X-User-Id': options.userId })
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Return enhanced response with routing info
    return {
      content: data.choices[0].message.content,
      model_used: data.model,
      provider: data.provider,
      usage: data.usage,
      total_cost: data.usage?.total_cost,
      id: data.id,
      created: data.created
    };
  } catch (error) {
    console.error("OpenRouter API call failed:", error);
    throw error;
  }
}

async function callMistral(message: string, apiKey: string, context: any[] = [], modelConfig: any, systemPrompt: string) {
  if (!apiKey) {
    return "This model requires an API key. Please configure API keys in settings to access this model.";
  }

  try {
    const systemMessage = { role: 'system', content: systemPrompt };
    const messages = [systemMessage];
    
    if (context && context.length > 0) {
      messages.push(...context);
    }
    
    messages.push({ role: 'user', content: message });
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.defaultModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: modelConfig.maxTokens,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Mistral API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Mistral API call failed:", error);
    throw error;
  }
}

// Enhanced free model using DeepSeek backend
async function callFreeModel(message: string, context: any[] = [], modelConfig: any, systemPrompt: string) {
  // Try to get DeepSeek API key from environment (for the free tier)
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY') || Deno.env.get('deepseek_api_keys');
  
  if (deepseekApiKey && deepseekApiKey.trim() !== '' && !deepseekApiKey.includes('your-')) {
    // Use DeepSeek API for enhanced free experience
    try {
      const ghostSystemPrompt = `You are Ghost AI, a helpful and intelligent assistant for the Ghost Protocol project. You are project-aware and understand that this is an advanced AI system with memory capabilities, multiple model integrations, and sophisticated conversation management.

You provide thoughtful, accurate responses while being concise and engaging. You can help with:
- General questions and conversations
- Code explanation and programming concepts (especially JavaScript/TypeScript, React, Supabase)
- Problem-solving and analysis
- Creative tasks and brainstorming
- Educational content and explanations
- Ghost Protocol project assistance and guidance

Project Context: You're assisting users of the Ghost Protocol system, which features:
- Memory-aware conversations with context retrieval
- Multiple AI model integrations (OpenAI, Anthropic, Perplexity, OpenRouter, etc.)
- Advanced chat functionality with tool orchestration
- VPS deployment capabilities with Hostinger integration
- MCP (Model Context Protocol) support

Be helpful, friendly, and informative in your responses. You have access to memory context from previous conversations and should reference relevant project knowledge when appropriate.

${systemPrompt}`;

      const systemMessage = { role: 'system', content: ghostSystemPrompt };
      const messages = [systemMessage];
      
      if (context && context.length > 0) {
        messages.push(...context);
      }
      
      messages.push({ role: 'user', content: message });
      
      const response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.defaultModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: modelConfig.maxTokens,
        }),
      });
      
      if (!response.ok) {
        console.log("DeepSeek API call failed, falling back to mock response");
        throw new Error('DeepSeek API call failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error("DeepSeek API call failed for free model:", error);
      // Fall through to mock response
    }
  }
  
  // Fallback: Enhanced mock response (when no API key or API fails)
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const hasContext = context && context.length > 0;
    
    let response = "";
    
    // Improved pattern matching for better responses
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey')) {
      response = `Hello! I'm Ghost AI, your intelligent assistant for the Ghost Protocol project. I'm here to help you with questions, development tasks, and project guidance. What can I assist you with today?`;
    } 
    else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('what can you do')) {
      response = `As Ghost AI for the Ghost Protocol project, I can help you with:
• Ghost Protocol development and architecture questions
• JavaScript/TypeScript, React, and Supabase guidance
• Memory-aware conversation explanations
• Model integration and MCP protocol assistance
• VPS deployment and Hostinger setup
• General coding concepts and problem-solving
• Creative writing and brainstorming

For more advanced features like real-time data, complex code generation, or specialized analysis, consider upgrading to our premium models with your own API keys.`;
    }
    else if (message.toLowerCase().includes('code') || message.toLowerCase().includes('program') || message.toLowerCase().includes('javascript') || message.toLowerCase().includes('python') || message.toLowerCase().includes('react') || message.toLowerCase().includes('supabase')) {
      response = `I can help with Ghost Protocol development and programming concepts! I'm familiar with the project's tech stack including JavaScript/TypeScript, React, Supabase, and the various integrations.

While I can discuss coding principles and help with understanding the Ghost Protocol architecture, for detailed code generation and debugging, our premium models (OpenAI, Claude, etc.) with your API key will give you much more comprehensive assistance.

Feel free to ask about specific Ghost Protocol components, architecture decisions, or programming concepts - I'm here to help!`;
    }
    else if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('upgrade') || message.toLowerCase().includes('premium')) {
      response = `To unlock premium features, add your API keys in Settings for models like:
• OpenAI GPT-4 - Advanced reasoning and code generation
• Anthropic Claude - Superior writing and analysis  
• Perplexity - Real-time web search
• OpenRouter - Access to multiple models

This gives you unlimited usage and advanced capabilities beyond what I can offer in the free tier.`;
    }
    else {
      // Intelligent response based on message content
      const messageLength = message.length;
      const isQuestion = message.includes('?') || message.toLowerCase().startsWith('what') || message.toLowerCase().startsWith('how') || message.toLowerCase().startsWith('why');
      
      if (isQuestion) {
        response = `That's an interesting question! While I can provide some guidance as Ghost AI, for detailed and comprehensive answers, especially on complex topics, our premium models would give you much more thorough responses.

Your question: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"

I'd be happy to try giving you a basic response, but for the best experience, consider trying one of our premium models!`;
      } else {
        response = `I understand you're asking about "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}". 

As Ghost AI, I can provide helpful guidance on many topics! For the most comprehensive and detailed assistance, especially for complex requests, our premium models with your API keys will give you exceptional results.

Is there something specific I can help clarify or would you like guidance on getting started with premium features?`;
      }
    }
    
    // Add context awareness
    if (hasContext) {
      response += `\n\n💭 I can see we have conversation history, which helps me understand your needs better. Premium models can utilize this context much more effectively for personalized responses.`;
    }
    
    // Add encouraging note
    response += `\n\n🚀 Today is ${currentDate}. I'm here to help however I can!`;
    
    return response;
  } catch (error) {
    console.error("Free model response generation failed:", error);
    return "Hello! I'm Ghost AI. I'm experiencing some technical difficulties right now, but I'm here to help! Please try again, or consider using our premium models for the most reliable experience.";
  }
}

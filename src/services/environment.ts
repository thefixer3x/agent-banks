
import { supabase } from "@/integrations/supabase/client";

export interface APIKeys {
  projectRef: string;
  openaiApiKey: string | null;
  claudeApiKey: string | null;
  perplexityApiKey: string | null;
  geminiApiKey: string | null;
  deepseekApiKey: string | null;
  mistralApiKey: string | null;
}

// Cache for secrets
let secretsCache: Record<string, string | null> | null = null;
let lastSecretsCacheTime: number = 0;
const SECRETS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getAPIKeys = async (): Promise<APIKeys> => {
  const now = Date.now();
  
  // Check if we have cached secrets that aren't expired
  if (secretsCache && (now - lastSecretsCacheTime) < SECRETS_CACHE_TTL) {
    return {
      projectRef: 'nbmomsntbamfthxfdnme',
      openaiApiKey: secretsCache.OPENAI_API_KEY || secretsCache.OpenAI_thefixer,
      claudeApiKey: secretsCache.CLAUDE_API_KEY || secretsCache.ClaudeAI_Key_thefixer,
      perplexityApiKey: secretsCache.PERPLEXITY_API_KEY || secretsCache.perplexity_doyen,
      geminiApiKey: secretsCache.GEMINI_API_KEY,
      deepseekApiKey: secretsCache.DEEPSEEK_API_KEY || secretsCache.deepseek_api_keys,
      mistralApiKey: secretsCache.MISTRAL_API_KEY
    };
  }

  try {
    // Call the MCP handler to get secrets
    const { data, error } = await supabase.functions.invoke('mcp-handler', {
      body: {
        tool_name: 'get_secrets',
        tool_args: {
          keys: [
            'OPENAI_API_KEY', 'OpenAI_thefixer',
            'CLAUDE_API_KEY', 'ClaudeAI_Key_thefixer', 
            'PERPLEXITY_API_KEY', 'perplexity_doyen',
            'GEMINI_API_KEY',
            'DEEPSEEK_API_KEY', 'deepseek_api_keys',
            'MISTRAL_API_KEY'
          ]
        }
      }
    });

    if (error) {
      console.error("Error fetching secrets:", error);
      throw error;
    }

    // Update cache
    secretsCache = data?.secrets || {};
    lastSecretsCacheTime = now;

    return {
      projectRef: 'nbmomsntbamfthxfdnme',
      openaiApiKey: secretsCache.OPENAI_API_KEY || secretsCache.OpenAI_thefixer,
      claudeApiKey: secretsCache.CLAUDE_API_KEY || secretsCache.ClaudeAI_Key_thefixer,
      perplexityApiKey: secretsCache.PERPLEXITY_API_KEY || secretsCache.perplexity_doyen,
      geminiApiKey: secretsCache.GEMINI_API_KEY,
      deepseekApiKey: secretsCache.DEEPSEEK_API_KEY || secretsCache.deepseek_api_keys,
      mistralApiKey: secretsCache.MISTRAL_API_KEY
    };
  } catch (error) {
    console.error("Failed to get API keys:", error);
    
    // Return defaults on error
    return {
      projectRef: 'nbmomsntbamfthxfdnme',
      openaiApiKey: null,
      claudeApiKey: null,
      perplexityApiKey: null,
      geminiApiKey: null,
      deepseekApiKey: null,
      mistralApiKey: null
    };
  }
};

export const isValidApiKey = (key: string | null): boolean => {
  if (!key) return false;
  
  // Check for placeholder values that indicate demo mode
  const placeholders = [
    'demo-key',
    'placeholder',
    'your-api-key',
    'sk-placeholder',
    'test-key'
  ];
  
  return !placeholders.some(placeholder => 
    key.toLowerCase().includes(placeholder.toLowerCase())
  ) && key.length > 10;
};

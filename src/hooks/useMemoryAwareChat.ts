
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { vpsApiService, type VPSChatRequest } from '@/services/vpsApiService';

export interface MemoryContext {
  id: string;
  title: string;
  content: string;
  summary?: string;
  similarity: number;
  memory_type: string;
  topic_name?: string;
  relevance_score: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  memoryContext?: MemoryContext[];
  memoryContextUsed?: number;
  toolCallsExecuted?: any[];
}

export type AIModel = 'free' | 'openai' | 'anthropic' | 'perplexity' | 'openrouter' | 'gemini' | 'deepseek' | 'mistral';

export interface AIModelConfig {
  id: AIModel;
  name: string;
  description: string;
  isAvailable: boolean;
  capabilities: string[];
  requiresApiKey: boolean;
}

export function useMemoryAwareChat() {
  const { user, authError, recoverSession } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('free'); // Default to free model
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const conversationIdRef = useRef<string>(crypto.randomUUID());
  const [sessionPersisted, setSessionPersisted] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<'banks' | 'bella'>('banks');
  const [vpsConnectionStatus, setVpsConnectionStatus] = useState<boolean | null>(null);
  const [useVPS, setUseVPS] = useState(false); // Toggle between Supabase and VPS
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Test VPS connection on initialization
  useEffect(() => {
    const testVPSConnection = async () => {
      try {
        const isConnected = await vpsApiService.testConnection();
        setVpsConnectionStatus(isConnected);
        
        if (isConnected) {
          console.log('✅ VPS services available');
          // Auto-enable VPS if connection is good
          setUseVPS(true);
        } else {
          console.log('⚠️ VPS services unavailable, using Supabase only');
          setUseVPS(false);
        }
      } catch (error) {
        console.error('VPS connection test failed:', error);
        setVpsConnectionStatus(false);
        setUseVPS(false);
      }
    };

    testVPSConnection();
  }, []);

  // Get user's API keys from the database
  const getUserApiKeys = async (): Promise<Record<string, string>> => {
    try {
      const { data, error } = await supabase.rpc('get_user_api_keys');
      if (error) throw error;
      
      // Safely handle the returned data which could be various JSON types
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Convert all values to strings for the Record<string, string> type
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            result[key] = value;
          } else if (value !== null && value !== undefined) {
            result[key] = String(value);
          }
        }
        return result;
      }
      return {};
    } catch (error) {
      console.error('Error getting API keys:', error);
      return {};
    }
  };

  // Retrieve relevant memory context using vector search (hybrid VPS + Supabase)
  const retrieveMemoryContext = async (query: string): Promise<MemoryContext[]> => {
    try {
      console.log('Retrieving memory context for:', query, useVPS ? '(via VPS)' : '(via Supabase)');
      
      if (useVPS && vpsConnectionStatus) {
        // Try VPS memory search first
        try {
          const vpsResults = await vpsApiService.searchMemories({
            query,
            limit: 5,
            threshold: 0.7
          });
          
          if (vpsResults.memories && vpsResults.memories.length > 0) {
            console.log('✅ VPS memory search successful:', vpsResults.memories.length, 'results');
            return vpsResults.memories.map((memory: any) => ({
              id: memory.id || crypto.randomUUID(),
              title: memory.title || memory.text?.substring(0, 50) + '...' || 'Memory',
              content: memory.text || memory.content || '',
              summary: memory.summary || '',
              similarity: memory.similarity || 0.8,
              memory_type: memory.memory_type || 'conversation',
              topic_name: memory.topic_name || '',
              relevance_score: memory.relevance_score || memory.similarity || 0.8,
              created_at: memory.created_at || new Date().toISOString()
            }));
          }
        } catch (vpsError) {
          console.warn('VPS memory search failed, falling back to Supabase:', vpsError);
        }
      }
      
      // Fallback to Supabase memory search
      console.log('Using Supabase memory search...');
      
      // Generate embedding for the query
      const { data: embeddingResponse, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
        body: { text: query }
      });

      if (embeddingError) {
        console.error('Error generating embedding:', embeddingError);
        return [];
      }

      console.log('Generated embedding, searching memories...');

      // Search for relevant memories using the enhanced function
      const { data: searchResults, error: searchError } = await supabase.rpc('search_memories', {
        query_embedding: embeddingResponse.embedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_project_ref: 'ai-chat'
      });

      if (searchError) {
        console.error('Error searching memories:', searchError);
        return [];
      }

      console.log('Found memories:', searchResults?.length || 0);
      return searchResults || [];
    } catch (error) {
      console.error('Error retrieving memory context:', error);
      return [];
    }
  };

  // Store interaction in memory for future reference
  const storeInteractionInMemory = async (userMessage: string, aiResponse: string, context: MemoryContext[]) => {
    try {
      console.log('Storing interaction in memory...');
      
      // Create a memory entry for this conversation
      const { error } = await supabase.from('memory_entries').insert({
        title: `Chat: ${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}`,
        content: `User: ${userMessage}\n\nAssistant (${selectedModel}): ${aiResponse}`,
        summary: `AI conversation using ${selectedModel} about: ${userMessage.slice(0, 100)}`,
        memory_type: 'conversation',
        status: 'active',
        relevance_score: 1.0,
        tags: ['ai-chat', selectedModel, 'conversation'],
        metadata: {
          model_used: selectedModel,
          context_used: context.map(c => ({ id: c.id, title: c.title, similarity: c.similarity })),
          conversation_id: conversationIdRef.current,
          timestamp: new Date().toISOString()
        },
        project_ref: 'ai-chat'
      });

      if (error) {
        console.error('Error storing interaction:', error);
      } else {
        console.log('Interaction stored successfully');
      }
    } catch (error) {
      console.error('Error storing interaction in memory:', error);
    }
  };

  // Send message with complete context management
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to conversation
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Step 1: Retrieve relevant memory context
      const memoryContext = await retrieveMemoryContext(content);
      console.log('Memory context retrieved:', memoryContext.length, 'memories');
      
      // Step 2: Get user's API keys
      const apiKeys = await getUserApiKeys();
      
      // Step 3: Build complete conversation context
      const conversationMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.model && { model: msg.model }),
        ...(msg.memoryContext && { memoryContext: msg.memoryContext })
      }));

      // Step 4: Send to AI with hybrid VPS + Supabase approach
      let responseContent: string;
      let toolCallsUsed: any[] = [];
      let responseSource = 'supabase';

      if (useVPS && vpsConnectionStatus) {
        // Try VPS first for better performance and direct execution
        try {
          console.log('🚀 Sending to VPS AI service...');
          const vpsRequest: VPSChatRequest = {
            message: content,
            persona: selectedPersona,
            conversation_history: conversationMessages
          };

          const vpsResponse = await vpsApiService.sendChatMessage(vpsRequest);
          responseContent = vpsResponse.response;
          toolCallsUsed = vpsResponse.tool_calls_executed || [];
          responseSource = 'vps';
          
          console.log('✅ VPS response received successfully');
        } catch (vpsError) {
          console.warn('VPS failed, falling back to Supabase:', vpsError);
          
          // Fallback to Supabase
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: {
              messages: conversationMessages,  // ✅ Full conversation history
              model: selectedModel,
              apiKeys,
              memoryContext: memoryContext,
              conversationId: conversationIdRef.current,  // ✅ Session tracking
              protocol: 'mcp',
              format: 'text',
              enableToolOrchestration: true  // ✅ Enable agentic loop
            }
          });

          if (error) throw error;
          responseContent = data.tool_responses?.[0]?.response || data.response;
          toolCallsUsed = data.tool_calls_executed || [];
          responseSource = 'supabase_fallback';
        }
      } else {
        // Use Supabase directly
        console.log('📡 Sending to Supabase AI service...');
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            messages: conversationMessages,  // ✅ Full conversation history
            model: selectedModel,
            apiKeys,
            memoryContext: memoryContext,
            conversationId: conversationIdRef.current,  // ✅ Session tracking
            protocol: 'mcp',
            format: 'text',
            enableToolOrchestration: true  // ✅ Enable agentic loop
          }
        });

        if (error) throw error;
        responseContent = data.tool_responses?.[0]?.response || data.response;
        toolCallsUsed = data.tool_calls_executed || [];
        responseSource = 'supabase';
      }
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        model: selectedModel,
        memoryContext: memoryContext.length > 0 ? memoryContext : undefined,
        memoryContextUsed: memoryContext.length,
        toolCallsExecuted: toolCallsUsed  // ✅ Track tool usage
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Step 5: Persist session for continuity
      await persistSession([...updatedMessages, assistantMessage]);

      // Step 6: Store the interaction in memory for future use
      await storeInteractionInMemory(content, responseContent, memoryContext);

      // Update memory access counts for used contexts
      for (const memory of memoryContext) {
        await supabase.rpc('update_memory_access', { memory_id: memory.id });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedModel, user, messages]);  // ✅ Add messages dependency

  // Load available models and check API key availability
  const refreshModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const apiKeys = await getUserApiKeys();
      
      const models: AIModelConfig[] = [
        {
          id: 'free',
          name: 'Ghost Basic',
          description: 'Free basic assistant with limited capabilities',
          isAvailable: true, // Always available
          capabilities: ['chat', 'simple-tasks'],
          requiresApiKey: false
        },
        {
          id: 'openai',
          name: 'OpenAI GPT-4',
          description: 'Most capable model for complex tasks',
          isAvailable: !!apiKeys.openai,
          capabilities: ['chat', 'code', 'analysis', 'creative'],
          requiresApiKey: true
        },
        {
          id: 'anthropic',
          name: 'Claude 3',
          description: 'Excellent for analysis and writing',
          isAvailable: !!apiKeys.anthropic,
          capabilities: ['chat', 'code', 'analysis', 'writing'],
          requiresApiKey: true
        },
        {
          id: 'perplexity',
          name: 'Perplexity',
          description: 'Best for research and fact-checking',
          isAvailable: !!apiKeys.perplexity,
          capabilities: ['research', 'facts', 'citations'],
          requiresApiKey: true
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'Google\'s multimodal AI',
          isAvailable: !!apiKeys.gemini,
          capabilities: ['chat', 'vision', 'code'],
          requiresApiKey: true
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          description: 'Specialized in coding tasks',
          isAvailable: !!apiKeys.deepseek,
          capabilities: ['code', 'debugging', 'optimization'],
          requiresApiKey: true
        },
        {
          id: 'mistral',
          name: 'Mistral',
          description: 'Fast and efficient model',
          isAvailable: !!apiKeys.mistral,
          capabilities: ['chat', 'code', 'multilingual'],
          requiresApiKey: true
        }
      ];

      setAvailableModels(models);
      
      // If current model is unavailable, select the first available premium model or default to free
      const currentModelAvailable = models.find(m => m.id === selectedModel)?.isAvailable;
      if (!currentModelAvailable) {
        // First try to find any available premium model
        const firstAvailablePremium = models.find(m => m.isAvailable && m.id !== 'free');
        if (firstAvailablePremium) {
          setSelectedModel(firstAvailablePremium.id);
        } else {
          // Default to free model if no premium models are available
          setSelectedModel('free');
        }
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  // Enhanced session persistence with offline support
  const persistSession = async (sessionMessages: ChatMessage[]) => {
    try {
      // Always save to localStorage first (works offline)
      const sessionData = {
        conversationId: conversationIdRef.current,
        messages: sessionMessages,
        timestamp: new Date().toISOString(),
        model: selectedModel,
        offlineMode: !user || !!authError
      };
      localStorage.setItem('ghost-protocol-session', JSON.stringify(sessionData));
      
      // Try to save to Supabase if user is authenticated
      if (user && !authError) {
        try {
          await supabase.from('chat_sessions').upsert({
            id: conversationIdRef.current,
            user_id: user.id,
            messages: sessionMessages,
            last_message_at: new Date().toISOString(),
            model_used: selectedModel
          });
          setOfflineMode(false);
        } catch (dbError) {
          console.warn('Database save failed, continuing in offline mode:', dbError);
          setOfflineMode(true);
        }
      } else {
        setOfflineMode(true);
      }
      
      setSessionPersisted(true);
    } catch (error) {
      console.error('Failed to persist session:', error);
      toast({
        title: 'Save Warning',
        description: 'Unable to save session. Your conversation may be lost.',
        variant: 'destructive',
      });
    }
  };

  const restoreSession = async () => {
    try {
      // Always try localStorage first (works offline)
      const stored = localStorage.getItem('ghost-protocol-session');
      if (stored) {
        const sessionData = JSON.parse(stored);
        setMessages(sessionData.messages || []);
        conversationIdRef.current = sessionData.conversationId || crypto.randomUUID();
        setSelectedModel(sessionData.model || 'openai');
        setOfflineMode(sessionData.offlineMode || false);
        setSessionPersisted(true);
        
        console.log('Session restored from localStorage');
        return;
      }

      // Try Supabase only if user is authenticated
      if (user && !authError) {
        try {
          const { data: latestSession } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('last_message_at', { ascending: false })
            .limit(1)
            .single();

          if (latestSession) {
            setMessages(latestSession.messages || []);
            conversationIdRef.current = latestSession.id;
            setSelectedModel(latestSession.model_used || 'openai');
            setOfflineMode(false);
            setSessionPersisted(true);
            
            console.log('Session restored from Supabase');
          }
        } catch (dbError) {
          console.warn('Failed to restore from Supabase, continuing in offline mode:', dbError);
          setOfflineMode(true);
        }
      } else {
        console.log('No authenticated user, starting fresh session');
        setOfflineMode(true);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      setOfflineMode(true);
    }
  };

  // Enhanced conversation clearing with cleanup
  const clearConversation = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = crypto.randomUUID();
    localStorage.removeItem('ghost-protocol-session');
    setSessionPersisted(false);
    setOfflineMode(!user || !!authError);
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    
    console.log('Conversation cleared');
  }, [user, authError]);
  
  // Auto-save functionality
  const scheduleAutoSave = useCallback((messages: ChatMessage[]) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    const autoSaveInterval = parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL || '30000');
    autoSaveTimeoutRef.current = setTimeout(() => {
      persistSession(messages);
    }, autoSaveInterval);
  }, [persistSession]);
  
  // Session cleanup on auth events
  useEffect(() => {
    const handleAuthEvents = (event: CustomEvent) => {
      switch (event.type) {
        case 'auth-session-cleanup':
          console.log('Cleaning up session on auth change');
          clearConversation();
          break;
        case 'auth-auto-save':
          if (messages.length > 0) {
            persistSession(messages);
          }
          break;
      }
    };
    
    window.addEventListener('auth-session-cleanup', handleAuthEvents as EventListener);
    window.addEventListener('auth-auto-save', handleAuthEvents as EventListener);
    
    return () => {
      window.removeEventListener('auth-session-cleanup', handleAuthEvents as EventListener);
      window.removeEventListener('auth-auto-save', handleAuthEvents as EventListener);
    };
  }, [messages, persistSession, clearConversation]);

  const changeModel = useCallback((modelId: AIModel) => {
    setSelectedModel(modelId);
  }, []);

  // Switch persona
  const switchPersona = useCallback((persona: 'banks' | 'bella') => {
    setSelectedPersona(persona);
    
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `Switched to ${persona === 'banks' ? 'Banks (Professional)' : 'Bella (Creative)'} persona`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // Toggle VPS usage
  const toggleVPS = useCallback(() => {
    setUseVPS(prev => !prev);
    toast({
      title: useVPS ? "Switched to Supabase" : "Switched to VPS",
      description: useVPS ? "Now using Supabase Edge Functions" : "Now using VPS services for better performance",
    });
  }, [useVPS]);

  // Load models and restore session on mount
  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  // Restore session on mount
  useEffect(() => {
    if (user && !sessionPersisted) {
      restoreSession();
    }
  }, [user, sessionPersisted]);

  // Auto-save session when messages change
  useEffect(() => {
    if (messages.length > 0 && sessionPersisted) {
      const timeoutId = setTimeout(() => {
        persistSession(messages);
      }, 1000); // Debounce saves
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, sessionPersisted, selectedModel, user]);

  return {
    messages,
    isLoading,
    selectedModel,
    availableModels,
    isLoadingModels,
    sendMessage,
    changeModel,
    clearConversation,
    refreshModels,
    sessionPersisted,
    conversationId: conversationIdRef.current,
    restoreSession,
    // New VPS integration features
    selectedPersona,
    switchPersona,
    vpsConnectionStatus,
    useVPS,
    toggleVPS,
    offlineMode
  };
}

/**
 * VPS Memory Aware Chat Hook
 * Connects React frontend to VPS backend services instead of Supabase
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
  persona?: string;
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

export function useVPSMemoryAwareChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('anthropic');
  const [selectedPersona, setSelectedPersona] = useState<'banks' | 'bella'>('banks');
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const conversationIdRef = useRef<string>(crypto.randomUUID());
  const [sessionPersisted, setSessionPersisted] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [vpsConnectionStatus, setVpsConnectionStatus] = useState<boolean | null>(null);

  // Test VPS connection on initialization
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await vpsApiService.testConnection();
      setVpsConnectionStatus(isConnected);
      
      if (!isConnected) {
        toast({
          title: "VPS Connection Failed",
          description: "Unable to connect to VPS services. Check your connection.",
          variant: "destructive",
        });
      }
    };

    testConnection();
  }, []);

  // Load session from localStorage
  useEffect(() => {
    const loadSession = () => {
      try {
        const savedSession = localStorage.getItem('vps-ghost-protocol-session');
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          if (sessionData.messages && Array.isArray(sessionData.messages)) {
            const loadedMessages = sessionData.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(loadedMessages);
            conversationIdRef.current = sessionData.conversationId || crypto.randomUUID();
            setSessionPersisted(true);
            console.log('Session restored from localStorage:', loadedMessages.length, 'messages');
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadSession();
  }, []);

  // Persist session to localStorage
  const persistSession = useCallback(async (sessionMessages: ChatMessage[]) => {
    try {
      const sessionData = {
        conversationId: conversationIdRef.current,
        messages: sessionMessages,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        model: selectedModel,
        persona: selectedPersona
      };

      localStorage.setItem('vps-ghost-protocol-session', JSON.stringify(sessionData));
      setSessionPersisted(true);
      console.log('Session persisted to localStorage');
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }, [user?.id, selectedModel, selectedPersona]);

  // Retrieve memory context from VPS
  const retrieveMemoryContext = useCallback(async (query: string): Promise<MemoryContext[]> => {
    try {
      const memoryResults = await vpsApiService.searchMemories({
        query,
        limit: 5,
        threshold: 0.7
      });

      return memoryResults.memories || [];
    } catch (error) {
      console.error('Memory context retrieval failed:', error);
      return [];
    }
  }, []);

  // Store conversation in VPS memory
  const storeConversationMemory = useCallback(async (userMessage: string, aiResponse: string) => {
    try {
      await vpsApiService.storeMemory({
        text: `User: ${userMessage}\nAssistant: ${aiResponse}`,
        metadata: {
          conversation_id: conversationIdRef.current,
          model: selectedModel,
          persona: selectedPersona,
          timestamp: new Date().toISOString()
        },
        memory_type: 'conversation',
        topic_name: `Conversation with ${selectedPersona}`
      });
    } catch (error) {
      console.error('Failed to store conversation memory:', error);
    }
  }, [selectedModel, selectedPersona]);

  // Send message with VPS integration
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Check VPS connection
    if (vpsConnectionStatus === false) {
      toast({
        title: "VPS Connection Error",
        description: "Cannot send message - VPS services unavailable",
        variant: "destructive",
      });
      return;
    }

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
      
      // Step 2: Build conversation history for VPS
      const conversationHistory = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        model: msg.model,
        memoryContext: msg.memoryContext
      }));

      // Step 3: Send to VPS chat service
      const vpsRequest: VPSChatRequest = {
        message: content,
        persona: selectedPersona,
        conversation_history: conversationHistory
      };

      const vpsResponse = await vpsApiService.sendChatMessage(vpsRequest);

      // Step 4: Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: vpsResponse.response,
        timestamp: new Date(),
        model: selectedModel,
        memoryContext: memoryContext,
        memoryContextUsed: memoryContext.length,
        toolCallsExecuted: vpsResponse.tool_calls_executed || [],
        persona: vpsResponse.persona || selectedPersona
      };

      // Step 5: Update messages and persist session
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      await persistSession(finalMessages);

      // Step 6: Store conversation in memory for future context
      await storeConversationMemory(content, vpsResponse.response);

      console.log('Message sent successfully via VPS');
      
    } catch (error) {
      console.error('Error sending message via VPS:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I apologize, but I encountered an error communicating with the VPS services: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Message Failed",
        description: "Failed to send message to VPS. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    content, 
    isLoading, 
    vpsConnectionStatus, 
    messages, 
    selectedPersona, 
    selectedModel, 
    retrieveMemoryContext, 
    persistSession, 
    storeConversationMemory
  ]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = crypto.randomUUID();
    localStorage.removeItem('vps-ghost-protocol-session');
    setSessionPersisted(false);
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

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    selectedModel,
    setSelectedModel,
    selectedPersona,
    switchPersona,
    availableModels,
    isLoadingModels,
    sessionPersisted,
    offlineMode,
    vpsConnectionStatus,
    conversationId: conversationIdRef.current,
  };
}
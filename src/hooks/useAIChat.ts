
import { useState, useCallback, useEffect } from 'react';
import { AIModel, ModelConfig, ModelResponse, sendMessageToModel, getAvailableModels } from '@/services/aiModels';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: AIModel;
  timestamp: Date;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'system', 
      content: 'Welcome! You can now chat with different AI models. Choose a model from the toggle above.', 
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('openai');
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const models = await getAvailableModels();
        setAvailableModels(models);
        
        // Find first available model and select it
        const firstAvailable = models.find(m => m.isAvailable);
        if (firstAvailable) {
          setSelectedModel(firstAvailable.id);
        }
      } catch (error) {
        console.error("Error loading models:", error);
        toast({
          title: "Error",
          description: "Failed to load AI models. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    loadModels();
  }, []);
  
  // Get conversation history for the model
  const getModelConversationHistory = useCallback(() => {
    return messages.filter(msg => 
      msg.role !== 'system' && 
      (msg.modelId === selectedModel || !msg.modelId)
    );
  }, [messages, selectedModel]);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      modelId: selectedModel,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Send to AI model
      const modelResponse = await sendMessageToModel({
        content,
        modelId: selectedModel,
      });
      
      // Add response to messages
      const assistantMessage: ChatMessage = {
        id: modelResponse.id,
        role: 'assistant',
        content: modelResponse.content,
        modelId: selectedModel,
        timestamp: new Date(modelResponse.timestamp),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      toast({
        title: "Message Error",
        description: error.message || "Failed to get a response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);
  
  const changeModel = useCallback((modelId: AIModel) => {
    setSelectedModel(modelId);
    
    // Add a system message about model change
    const modelName = availableModels.find(m => m.id === modelId)?.name || modelId;
    const systemMessage: ChatMessage = {
      id: `model-change-${Date.now()}`,
      role: 'system',
      content: `Switched to ${modelName} model`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, systemMessage]);
  }, [availableModels]);
  
  const clearConversation = useCallback(() => {
    const confirmMessage: ChatMessage = {
      id: `clear-${Date.now()}`,
      role: 'system',
      content: 'Conversation cleared',
      timestamp: new Date(),
    };
    
    setMessages([confirmMessage]);
  }, []);
  
  // Refresh models list
  const refreshModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      const models = await getAvailableModels();
      setAvailableModels(models);
      
      toast({
        title: "Models Refreshed",
        description: "Available AI models have been updated",
      });
    } catch (error) {
      console.error("Error refreshing models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);
  
  return {
    messages,
    isLoading,
    selectedModel,
    availableModels,
    isLoadingModels,
    sendMessage,
    changeModel,
    clearConversation,
    getModelConversationHistory,
    refreshModels
  };
}

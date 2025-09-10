
import React from 'react';
import { Card } from '@/components/ui/card';
import { useMemoryAwareChat } from '@/hooks/useMemoryAwareChat';
import ChatHeader from './chat/ChatHeader';
import ChatMessageList from './chat/ChatMessageList';
import ChatInput from './chat/ChatInput';

const AIChatInterface: React.FC = () => {
  const {
    messages,
    isLoading,
    selectedModel,
    availableModels,
    isLoadingModels,
    sendMessage,
    changeModel,
    clearConversation,
    refreshModels
  } = useMemoryAwareChat();
  
  const getModelName = (modelId?: string) => {
    if (!modelId) return '';
    const model = availableModels.find(m => m.id === modelId);
    return model ? model.name : '';
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Memory-Aware AI Chat
              </h2>
              <p className="text-muted-foreground">AI with persistent memory and context awareness</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedModel}
                onChange={(e) => changeModel(e.target.value as any)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingModels}
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id} disabled={!model.isAvailable}>
                    {model.name} {!model.isAvailable ? '(Setup Required)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={refreshModels}
                disabled={isLoadingModels}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoadingModels ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="border border-border/50 bg-card shadow-lg flex flex-col h-[600px]">
        <ChatHeader 
          modelName={getModelName(selectedModel)}
          selectedModel={selectedModel}
          onClearConversation={clearConversation}
        />
        
        <ChatMessageList 
          messages={messages}
          isLoading={isLoading}
          selectedModel={selectedModel}
          getModelName={getModelName}
        />
        
        <div className="p-4 border-t border-border/20">
          <ChatInput 
            isLoading={isLoading}
            onSendMessage={sendMessage}
            placeholder={isLoading 
              ? "Waiting for response..." 
              : `Send a message to ${getModelName(selectedModel)}...`
            }
          />
        </div>
      </Card>
    </div>
  );
};

export default AIChatInterface;

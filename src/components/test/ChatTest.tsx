import React from 'react';
import { MemoryAwareChat } from '@/components/chat/MemoryAwareChat';
import { useMemoryAwareChat } from '@/hooks/useMemoryAwareChat';

export function ChatTest() {
  const {
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
    conversationId
  } = useMemoryAwareChat();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Chat System Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Session ID:</strong> {conversationId}
            </div>
            <div>
              <strong>Session Persisted:</strong> {sessionPersisted ? '✅' : '❌'}
            </div>
            <div>
              <strong>Messages Count:</strong> {messages.length}
            </div>
            <div>
              <strong>Selected Model:</strong> {selectedModel}
            </div>
            <div>
              <strong>Available Models:</strong> {availableModels.filter(m => m.isAvailable).length}/{availableModels.length}
            </div>
            <div>
              <strong>Loading:</strong> {isLoading ? '⏳' : '✅'}
            </div>
          </div>
        </div>
        
        <MemoryAwareChat
          messages={messages}
          isLoading={isLoading}
          selectedModel={selectedModel}
          availableModels={availableModels}
          isLoadingModels={isLoadingModels}
          sendMessage={sendMessage}
          changeModel={changeModel}
          clearConversation={clearConversation}
          refreshModels={refreshModels}
        />
      </div>
    </div>
  );
}
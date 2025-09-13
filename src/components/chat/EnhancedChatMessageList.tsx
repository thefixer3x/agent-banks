
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage as ChatMessageType } from '@/hooks/useAIChat';
import EnhancedChatMessage from './EnhancedChatMessage';
import TypingIndicator from './TypingIndicator';
import { AIModel } from '@/services/aiModels';

interface EnhancedChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  selectedModel: AIModel;
  getModelName: (modelId?: AIModel) => string;
}

const EnhancedChatMessageList: React.FC<EnhancedChatMessageListProps> = ({ 
  messages, 
  isLoading, 
  selectedModel,
  getModelName
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {messages.map((message) => (
          <EnhancedChatMessage 
            key={message.id} 
            message={message} 
            modelName={getModelName(message.modelId)}
          />
        ))}
        
        {isLoading && (
          <TypingIndicator selectedModel={selectedModel} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default EnhancedChatMessageList;

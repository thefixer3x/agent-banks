
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { AIModel } from '@/services/aiModels';
import { ChatMessage } from '@/hooks/useAIChat';

interface TypingIndicatorProps {
  selectedModel: AIModel;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ selectedModel }) => {
  const getAvatarClass = (modelId: AIModel) => {
    if (modelId === 'openai') {
      return 'bg-green-600 text-background';
    } else if (modelId === 'anthropic') {
      return 'bg-violet-600 text-background';
    } else if (modelId === 'perplexity') {
      return 'bg-blue-600 text-background';
    }
    return 'bg-secondary-foreground text-background';
  };

  return (
    <div className="flex justify-start">
      <div className="flex gap-3">
        <Avatar className={`h-8 w-8 ${getAvatarClass(selectedModel)}`}>
          <Bot className="h-4 w-4" />
        </Avatar>
        <div className="p-3 rounded-lg bg-secondary text-secondary-foreground">
          <div className="flex gap-1">
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

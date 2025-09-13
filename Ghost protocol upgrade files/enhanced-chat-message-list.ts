// src/components/chat/ChatMessageList.tsx
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, User, Bot } from 'lucide-react';
import { ChatMessage, MemoryContext } from '@/hooks/useMemoryAwareChat';
import { cn } from '@/lib/utils';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModel: string;
  getModelName: (modelId?: string) => string;
}

export function ChatMessageList({ messages, isLoading, selectedModel, getModelName }: ChatMessageListProps) {
  const [expandedMemoryContext, setExpandedMemoryContext] = useState<string | null>(null);

  const toggleMemoryContext = (messageId: string) => {
    setExpandedMemoryContext(prev => prev === messageId ? null : messageId);
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-4 space-y-2",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted',
                message.role === 'system' && 'bg-secondary text-secondary-foreground'
              )}
            >
              {/* Memory Context Indicator - Only for AI responses */}
              {message.role === 'assistant' && message.memoryContext && message.memoryContext.length > 0 && (
                <div className="mb-3 border-b border-border pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs w-full justify-between"
                    onClick={() => toggleMemoryContext(message.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400">
                        {message.memoryContext.length} memories used
                      </span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform", 
                        expandedMemoryContext === message.id && "rotate-180"
                      )} 
                    />
                  </Button>
                  
                  {/* Expanded Memory Context */}
                  {expandedMemoryContext === message.id && (
                    <div className="mt-3 space-y-2">
                      {message.memoryContext.map((memory) => (
                        <div
                          key={memory.id}
                          className="bg-background/80 border rounded-md p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{memory.title}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(memory.similarity * 100)}% match
                              </Badge>
                              {memory.topic_name && (
                                <Badge variant="secondary" className="text-xs">
                                  {memory.topic_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs line-clamp-2">
                            {memory.content}
                          </p>
                          {memory.memory_type && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {memory.memory_type}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user' 
                    ? 'bg-primary-foreground text-primary' 
                    : 'bg-primary text-primary-foreground'
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Text */}
                <div className="flex-1 min-w-0">
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>

              {/* Message Footer */}
              <div className="flex items-center justify-between text-xs opacity-70 mt-2">
                <div className="flex items-center gap-2">
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  {message.model && (
                    <Badge variant="outline" className="text-xs">
                      {getModelName(message.model)}
                    </Badge>
                  )}
                </div>
                {message.memoryContextUsed && (
                  <span className="text-purple-600 dark:text-purple-400 text-xs">
                    Memory-enhanced response
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-4 max-w-[80%] flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                <span className="text-sm text-muted-foreground ml-2">
                  {getModelName(selectedModel)} is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default ChatMessageList;
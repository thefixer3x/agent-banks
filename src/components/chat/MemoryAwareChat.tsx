import React, { useEffect, useRef, useState } from 'react';
import { Send, Brain, Sparkles, X, ChevronDown, Settings, Zap, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIModel, AIModelConfig } from '@/hooks/useMemoryAwareChat';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

// Define the props interface for the component
interface MemoryAwareChatProps {
  messages: any[];
  isLoading: boolean;
  selectedModel: AIModel;
  availableModels: AIModelConfig[];
  isLoadingModels: boolean;
  sendMessage: (content: string) => Promise<void>;
  changeModel: (modelId: AIModel) => void;
  clearConversation: () => void;
  refreshModels: () => Promise<void>;
}

export function MemoryAwareChat({
  messages,
  isLoading,
  selectedModel,
  availableModels,
  isLoadingModels,
  sendMessage,
  changeModel,
  clearConversation,
  refreshModels
}: MemoryAwareChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [showConfigAlert, setShowConfigAlert] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check if any models are available
  const hasAvailableModels = availableModels.some(model => model.isAvailable);
  const unavailableCount = availableModels.filter(model => !model.isAvailable).length;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Show config alert if no models are available
  useEffect(() => {
    if (!hasAvailableModels && availableModels.length > 0) {
      setShowConfigAlert(true);
    }
  }, [hasAvailableModels, availableModels.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && hasAvailableModels) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const toggleMemoryExpansion = (messageId: string) => {
    setExpandedMemoryId(expandedMemoryId === messageId ? null : messageId);
  };

  const handleModelChange = (value: string) => {
    const model = availableModels.find(m => m.id === value);
    if (model && model.isAvailable) {
      changeModel(value as AIModel);
    }
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="w-full h-full flex flex-col max-w-4xl mx-auto">
      {/* Configuration Alert */}
      {showConfigAlert && unavailableCount > 0 && (
        <Alert className="mb-4 border-orange-500/50 bg-orange-50/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {unavailableCount} AI model{unavailableCount > 1 ? 's require' : ' requires'} configuration. 
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline text-orange-600"
                onClick={navigateToSettings}
              >
                Review config settings
              </Button> to enable additional models.
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowConfigAlert(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Memory-Aware AI Chat</h2>
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Enhanced
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={selectedModel} 
                onValueChange={handleModelChange} 
                disabled={isLoadingModels || !hasAvailableModels}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={isLoadingModels ? "Loading..." : "Select AI Model"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {availableModels.map(model => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id} 
                      disabled={!model.isAvailable}
                      className="hover:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={model.isAvailable ? "text-foreground" : "text-muted-foreground"}>
                          {model.name}
                        </span>
                        {!model.isAvailable && (
                          <Badge variant="outline" className="text-xs ml-2 border-orange-500/50 text-orange-600">
                            Config Required
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshModels}
                disabled={isLoadingModels}
                className="h-8 w-8 p-0"
              >
                <Settings className={cn("h-4 w-4", isLoadingModels && "animate-spin")} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={navigateToSettings}
                className="h-8"
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation! Your memories will provide context automatically.</p>
                {!hasAvailableModels && (
                  <p className="text-sm mt-2 text-orange-600">
                    Please configure AI model settings to begin chatting.{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal underline"
                      onClick={navigateToSettings}
                    >
                      Open Settings
                    </Button>
                  </p>
                )}
              </div>
            )}

            {messages.map(message => (
              <div key={message.id} className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[85%] rounded-lg p-4", message.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4')}>
                  {/* Memory Context Indicator for AI responses */}
                  {message.memoryContext && message.memoryContext.length > 0 && (
                    <div className="mb-3">
                      <Collapsible open={expandedMemoryId === message.id} onOpenChange={() => toggleMemoryExpansion(message.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-background/10">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {message.memoryContext.length} memories used
                            <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", expandedMemoryId === message.id && "rotate-180")} />
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-2">
                          <div className="space-y-2">
                            {message.memoryContext.map(memory => (
                              <div key={memory.id} className="text-xs bg-background/50 rounded-md p-3 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-foreground">{memory.title}</span>
                                  <div className="flex gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(memory.similarity * 100)}%
                                    </Badge>
                                    {memory.topic_name && (
                                      <Badge variant="secondary" className="text-xs">
                                        {memory.topic_name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                                  {memory.content}
                                </p>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Type: {memory.memory_type} • Score: {memory.relevance_score}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  
                  {/* Message Footer */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                    <div className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {message.model && (
                        <Badge variant="outline" className="text-xs">
                          {message.model}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast({
                            title: "Copied",
                            description: "Message copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4 mr-4 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                    <span className="text-sm text-muted-foreground ml-2">
                      Searching memories and generating response...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <CardContent className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              placeholder={
                !hasAvailableModels 
                  ? "Configure AI models to start chatting..." 
                  : "Ask anything... Your memories will provide context automatically"
              }
              disabled={isLoading || !hasAvailableModels} 
              className="flex-1" 
            />
            <Button 
              type="submit" 
              disabled={isLoading || !inputValue.trim() || !hasAvailableModels}
            >
              <Send className="w-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

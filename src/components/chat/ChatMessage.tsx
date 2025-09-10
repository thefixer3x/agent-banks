
import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Database, Volume2, Copy, Check } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useAIChat';
import { AIModel } from '@/services/aiModels';
import { toast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  modelName: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, modelName }) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSpeak = async () => {
    if (isPlaying) {
      // Stop current speech
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "Speech Error",
        description: "Could not play audio",
        variant: "destructive",
      });
    };

    speechSynthesis.speak(utterance);
  };

  const getMessageIcon = (message: ChatMessageType) => {
    if (message.role === 'user') {
      return <User className="h-4 w-4" />;
    } else if (message.role === 'system') {
      return <Database className="h-4 w-4" />;
    } else {
      return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageClass = (message: ChatMessageType) => {
    if (message.role === 'system') {
      return 'bg-muted/50 text-muted-foreground border border-border/50';
    } else if (message.role === 'assistant') {
      return 'bg-card text-card-foreground border border-border/50';
    } else {
      return 'bg-primary text-primary-foreground border border-primary/20';
    }
  };

  const getAvatarClass = (message: ChatMessageType) => {
    if (message.role === 'system') {
      return 'bg-muted-foreground text-background';
    } else if (message.role === 'assistant') {
      // Different colors for different models
      if (message.modelId === 'openai') {
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
      } else if (message.modelId === 'anthropic') {
        return 'bg-gradient-to-br from-violet-500 to-purple-600 text-white';
      } else if (message.modelId === 'perplexity') {
        return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
      } else if (message.modelId === 'gemini') {
        return 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white';
      } else if (message.modelId === 'deepseek') {
        return 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white';
      } else if (message.modelId === 'mistral') {
        return 'bg-gradient-to-br from-red-500 to-red-600 text-white';
      }
      return 'bg-gradient-to-br from-tech-blue to-tech-purple text-white';
    } else {
      return 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground';
    }
  };

  const getModelBadgeColor = (modelId?: AIModel) => {
    switch (modelId) {
      case 'openai': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'anthropic': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300';
      case 'perplexity': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'gemini': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'deepseek': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'mistral': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div 
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div 
        className={`flex gap-3 max-w-[85%] ${
          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <Avatar className={`h-8 w-8 ${getAvatarClass(message)} shadow-sm`}>
          <AvatarFallback className={getAvatarClass(message)}>
            {getMessageIcon(message)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <div className={`p-4 rounded-xl shadow-sm ${getMessageClass(message)}`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </p>
              
              {message.role === 'assistant' && message.modelId && (
                <Badge variant="outline" className={`text-xs ${getModelBadgeColor(message.modelId)}`}>
                  {modelName}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-60 hover:opacity-100"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              {message.role === 'assistant' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100"
                  onClick={handleSpeak}
                >
                  <Volume2 className={`h-3 w-3 ${isPlaying ? 'text-primary animate-pulse' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

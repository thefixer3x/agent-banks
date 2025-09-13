
import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Copy, User, Bot, Play, Pause, Volume2, Brain } from 'lucide-react';
import { ChatMessage } from '@/hooks/useMemoryAwareChat';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TypingIndicator from './TypingIndicator';
import { AIModel } from '@/hooks/useMemoryAwareChat';

interface EnhancedMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModel: AIModel;
  getModelName: (modelId?: AIModel) => string;
  isSpeechEnabled?: boolean;
}

const EnhancedMessageList: React.FC<EnhancedMessageListProps> = ({ 
  messages, 
  isLoading, 
  selectedModel,
  getModelName,
  isSpeechEnabled = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    };
  }, [currentAudio]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const playMessage = async (message: ChatMessage) => {
    if (playingMessageId === message.id) {
      // Stop current playback
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setPlayingMessageId(null);
      }
      return;
    }

    try {
      setPlayingMessageId(message.id);
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: message.content,
          voice_id: '9BWtsMINqrJLrRacOk9x' // Aria voice
        }
      });

      if (error) throw error;

      // Stop any current audio
      if (currentAudio) {
        currentAudio.pause();
      }

      // Create and play new audio
      const audioBlob = new Blob([Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingMessageId(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingMessageId(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };

      setCurrentAudio(audio);
      await audio.play();

    } catch (error) {
      console.error('TTS Error:', error);
      setPlayingMessageId(null);
      toast({
        title: "Speech Error",
        description: "Failed to generate speech",
        variant: "destructive",
      });
    }
  };

  const formatContent = (content: string) => {
    // Split by code blocks to handle them separately
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0] && !lines[0].includes(' ') ? lines[0] : 'text';
        const code = lines[0] && !lines[0].includes(' ') ? lines.slice(1).join('\n') : lines.join('\n');
        
        return (
          <div key={index} className="my-4 bg-black/50 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                {language}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(code)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">
              {code}
            </pre>
          </div>
        );
      } else {
        // Regular text
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      }
    });
  };

  const renderMemoryContext = (memoryContext?: any[]) => {
    if (!memoryContext || memoryContext.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Memory Context Used</span>
        </div>
        <div className="space-y-2">
          {memoryContext.slice(0, 2).map((memory, index) => (
            <div key={index} className="text-xs text-blue-300">
              <span className="font-medium">{memory.title}</span>
              <span className="ml-2 text-blue-400">({Math.round(memory.similarity * 100)}% relevant)</span>
            </div>
          ))}
          {memoryContext.length > 2 && (
            <div className="text-xs text-blue-400">
              +{memoryContext.length - 2} more memories referenced
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isPlaying = playingMessageId === message.id;
          
          return (
            <Card key={message.id} className={`p-4 border ${
              isUser 
                ? 'border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-red-900/10 ml-12' 
                : 'border-orange-500/20 bg-gradient-to-br from-gray-900/80 to-orange-900/10 mr-12'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  isUser ? 'bg-orange-600' : 'bg-gray-700'
                }`}>
                  {isUser ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-orange-400" />
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {isUser ? 'You' : getModelName(message.model as AIModel) || 'AI Assistant'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.model && (
                        <Badge variant="outline" className="text-xs">
                          {message.model}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Speech button for AI messages */}
                      {!isUser && isSpeechEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playMessage(message)}
                          className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                          disabled={isLoading}
                        >
                          {isPlaying ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-gray-200 leading-relaxed">
                    {formatContent(message.content)}
                  </div>

                  {/* Memory context display */}
                  {renderMemoryContext(message.memoryContext)}
                </div>
              </div>
            </Card>
          );
        })}
        
        {isLoading && (
          <TypingIndicator selectedModel={selectedModel} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default EnhancedMessageList;

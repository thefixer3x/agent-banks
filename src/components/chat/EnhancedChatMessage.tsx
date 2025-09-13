import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, User, Bot } from 'lucide-react';
import { ChatMessage } from '@/hooks/useAIChat';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EnhancedChatMessageProps {
  message: ChatMessage;
  modelName: string;
}

const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({ message, modelName }) => {
  const { toast } = useToast();
  const isUser = message.role === 'user';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  // Clean up markdown formatting artifacts
  const cleanContent = (content: string) => {
    return content
      .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
      .replace(/```[\s\S]*?```/g, (match) => {
        // Keep code blocks but clean them
        return match.replace(/```(\w+)?/g, '```');
      })
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
      .trim();
  };

  const formatContent = (content: string) => {
    const cleaned = cleanContent(content);
    
    // Split by code blocks to handle them separately
    const parts = cleaned.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0] || 'text';
        const code = lines.slice(1).join('\n');
        
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

  return (
    <Card className={`p-4 border ${
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
                {isUser ? 'You' : modelName || 'AI Assistant'}
              </span>
              <span className="text-xs text-gray-400">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(message.content)}
              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-gray-200 leading-relaxed">
            {formatContent(message.content)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedChatMessage;

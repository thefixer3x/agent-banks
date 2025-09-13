
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Bot, Send, User, Database, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SQLQueryInput from './SQLQueryInput';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  contentType?: 'text' | 'sql' | 'code';
}

interface ChatInterfaceProps {
  isConnected: boolean;
  onSendMessage: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isConnected,
  onSendMessage 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'system', 
      content: 'Welcome to the Supabase MCP Server. I can help you interact with your Supabase project using natural language and SQL queries.', 
      timestamp: new Date(),
      contentType: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSqlInput, setShowSqlInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      contentType: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    onSendMessage(input.trim());
    setInput('');
    
    // Simulate AI response with typing indicator
    setIsTyping(true);
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've processed your request through the Supabase MCP server. Here's what I found:\n\nYour query has been executed and you can see the results in the Data Display panel above.`,
        timestamp: new Date(),
        contentType: 'text'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSqlExecute = (query: string) => {
    if (!isConnected) return;
    
    // Add SQL message
    const sqlMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
      contentType: 'sql'
    };
    
    setMessages(prev => [...prev, sqlMessage]);
    onSendMessage(query);
    setShowSqlInput(false);
    
    // Simulate AI response with typing indicator
    setIsTyping(true);
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `SQL query executed. Check the Database Queries panel for results.`,
        timestamp: new Date(),
        contentType: 'text'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const getMessageIcon = (role: string, contentType?: string) => {
    if (role === 'user') {
      if (contentType === 'sql') {
        return <Database className="h-4 w-4" />;
      } else if (contentType === 'code') {
        return <Code className="h-4 w-4" />;
      } else {
        return <User className="h-4 w-4" />;
      }
    } else {
      return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageClass = (role: string, contentType?: string) => {
    if (role === 'assistant' || role === 'system') {
      return 'bg-secondary text-secondary-foreground';
    }
    
    if (contentType === 'sql') {
      return 'bg-tech-purple/80 text-foreground';
    } else if (contentType === 'code') {
      return 'bg-tech-cyan/80 text-foreground';
    } else {
      return 'bg-tech-blue text-foreground';
    }
  };

  const formatMessage = (content: string, contentType?: string) => {
    if (contentType === 'sql' || contentType === 'code') {
      return <pre className="whitespace-pre-wrap break-words font-mono text-xs">{content}</pre>;
    }
    
    return <p className="text-sm">{content}</p>;
  };

  return (
    <Card className="border border-border bg-card flex flex-col h-[400px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className={`h-8 w-8 ${
                  message.role !== 'user' ? 'bg-tech-cyan text-background' : 
                  message.contentType === 'sql' ? 'bg-tech-purple text-background' :
                  message.contentType === 'code' ? 'bg-tech-cyan text-background' :
                  'bg-tech-blue text-background'
                }`}>
                  {getMessageIcon(message.role, message.contentType)}
                </Avatar>
                
                <div>
                  <div className={`p-3 rounded-lg ${getMessageClass(message.role, message.contentType)}`}>
                    {formatMessage(message.content, message.contentType)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-tech-cyan text-background">
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
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        {showSqlInput ? (
          <div className="space-y-2">
            <SQLQueryInput
              onExecute={handleSqlExecute}
              isLoading={isTyping}
            />
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSqlInput(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConnected ? "Ask a question or enter SQL..." : "Connect to Supabase to send messages..."}
              disabled={!isConnected}
              className="resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleSend} 
                size="icon" 
                disabled={!isConnected || !input.trim() || isTyping}
                className="bg-tech-cyan hover:bg-tech-cyan/90 text-background h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => setShowSqlInput(true)} 
                size="icon" 
                disabled={!isConnected || isTyping}
                variant="outline"
                className="h-8 w-8"
              >
                <Database className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChatInterface;

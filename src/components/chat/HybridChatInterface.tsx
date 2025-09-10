/**
 * Hybrid Chat Interface - Uses both VPS and Supabase with intelligent fallback
 */

import React from 'react';
import { useMemoryAwareChat } from '@/hooks/useMemoryAwareChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

export function HybridChatInterface() {
  const {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    selectedPersona,
    switchPersona,
    vpsConnectionStatus,
    useVPS,
    toggleVPS,
    selectedModel,
    offlineMode
  } = useMemoryAwareChat();

  const [inputMessage, setInputMessage] = React.useState('');

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getConnectionStatusBadge = () => {
    if (vpsConnectionStatus === null) {
      return <Badge variant="secondary">Testing VPS...</Badge>;
    } else if (vpsConnectionStatus && useVPS) {
      return <Badge variant="default" className="bg-green-600">🚀 VPS Connected</Badge>;
    } else if (vpsConnectionStatus && !useVPS) {
      return <Badge variant="outline">📡 Supabase Mode</Badge>;
    } else {
      return <Badge variant="destructive">❌ VPS Offline</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      {/* Status Panel */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Hybrid AI Assistant</CardTitle>
              <CardDescription>
                Intelligent fallback between VPS and Supabase services
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {getConnectionStatusBadge()}
              {offlineMode && <Badge variant="secondary">Offline Mode</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Service:</label>
              <div className="flex items-center gap-2">
                <span className={useVPS ? 'text-muted-foreground' : 'text-foreground'}>
                  Supabase
                </span>
                <Switch
                  checked={useVPS}
                  onCheckedChange={toggleVPS}
                  disabled={vpsConnectionStatus === false}
                />
                <span className={useVPS ? 'text-foreground' : 'text-muted-foreground'}>
                  VPS
                </span>
              </div>
            </div>
            
            {/* Persona Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Persona:</label>
              <Button
                variant={selectedPersona === 'banks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchPersona('banks')}
              >
                💼 Banks
              </Button>
              <Button
                variant={selectedPersona === 'bella' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchPersona('bella')}
              >
                ✨ Bella
              </Button>
            </div>
          </div>

          {/* Connection Info */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">Current Service</div>
              <div className="text-muted-foreground">
                {useVPS ? 'VPS (srv896342.hstgr.cloud)' : 'Supabase Edge Functions'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">AI Model</div>
              <div className="text-muted-foreground">{selectedModel}</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Memory System</div>
              <div className="text-muted-foreground">
                {useVPS ? 'VPS Vector Search' : 'Supabase Vector Search'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Conversation with {selectedPersona === 'banks' ? 'Banks' : 'Bella'}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearConversation}>
              Clear Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-muted/30">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-lg mb-2">
                  {selectedPersona === 'banks' ? '💼' : '✨'} Hello! I'm{' '}
                  {selectedPersona === 'banks' ? 'Banks' : 'Bella'}
                </div>
                <div>
                  {selectedPersona === 'banks'
                    ? 'Your professional AI assistant ready to help with business tasks.'
                    : 'Your creative AI assistant ready to help with fun and creative projects.'}
                </div>
                <div className="text-sm mt-2">
                  Connected via: {useVPS ? 'VPS Services' : 'Supabase'}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'system'
                        ? 'bg-muted text-muted-foreground text-center'
                        : 'bg-secondary'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && (
                      <div className="text-xs opacity-70 mt-1">
                        {selectedPersona === 'banks' ? '💼 Banks' : '✨ Bella'} via{' '}
                        {useVPS ? 'VPS' : 'Supabase'}
                        {message.memoryContextUsed ? ` • ${message.memoryContextUsed} memories used` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
                    <span>
                      {selectedPersona === 'banks' ? 'Banks' : 'Bella'} is thinking
                      {useVPS ? ' (via VPS)' : ' (via Supabase)'}...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${selectedPersona === 'banks' ? 'Banks' : 'Bella'}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !inputMessage.trim()}>
              Send
            </Button>
          </div>

          {/* Service Status */}
          <div className="text-xs text-muted-foreground mt-2 text-center">
            {useVPS && vpsConnectionStatus ? (
              <span className="text-green-600">
                ✅ Connected to VPS • Real execution capabilities available
              </span>
            ) : !useVPS ? (
              <span className="text-blue-600">
                📡 Using Supabase • Full tool orchestration available
              </span>
            ) : (
              <span className="text-amber-600">
                ⚠️ VPS offline • Automatic fallback to Supabase active
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
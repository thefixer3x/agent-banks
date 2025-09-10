
import { useState } from 'react';
import { HybridChatInterface } from '@/components/chat/HybridChatInterface';
import { ServiceActionsPanel } from '@/components/chat/ServiceActionsPanel';
import SQLQueryInterface from '@/components/SQLQueryInterface';
import { useServiceAwareChat } from '@/hooks/useServiceAwareChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState('chat');
  
  const {
    detectedCommands,
    isProcessingCommand,
    serviceActions,
    clearCommands,
    clearServiceActions,
  } = useServiceAwareChat();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto h-[calc(100vh-2rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent transition-colors"
            >
              Hybrid AI Chat (VPS + Supabase)
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent transition-colors"
            >
              Service Actions
              {(detectedCommands.length > 0 || serviceActions.length > 0) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="sql" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent transition-colors"
            >
              SQL Interface
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 mt-4">
            <HybridChatInterface />
          </TabsContent>
          
          <TabsContent value="services" className="flex-1 mt-4">
            <ServiceActionsPanel
              commands={detectedCommands}
              actions={serviceActions}
              isProcessing={isProcessingCommand}
              onClearCommands={clearCommands}
              onClearActions={clearServiceActions}
            />
          </TabsContent>

          <TabsContent value="sql" className="flex-1 mt-4">
            <SQLQueryInterface />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatPage;

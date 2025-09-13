
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Maximize2, Minimize2 } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import ModelSelector from '@/components/ModelSelector';
import ChatHeader from './ChatHeader';
import EnhancedChatMessageList from './EnhancedChatMessageList';
import EnhancedChatInput from './EnhancedChatInput';
import ChatArtifacts from './ChatArtifacts';

const EnhancedAIChatInterface: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);
  
  const {
    messages,
    isLoading,
    selectedModel,
    availableModels,
    isLoadingModels,
    sendMessage,
    changeModel,
    clearConversation,
    refreshModels
  } = useAIChat();
  
  const getModelName = (modelId?: string) => {
    if (!modelId) return '';
    const model = availableModels.find(m => m.id === modelId);
    return model ? model.name : '';
  };

  return (
    <div className="space-y-4">
      <ModelSelector 
        models={availableModels}
        selectedModel={selectedModel}
        onSelectModel={changeModel}
        isLoading={isLoadingModels}
        onRefresh={refreshModels}
      />
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid grid-cols-2 bg-gray-800/50 border border-orange-500/20">
          <TabsTrigger 
            value="chat" 
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-300"
          >
            Chat Interface
          </TabsTrigger>
          <TabsTrigger 
            value="artifacts"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300"
          >
            Artifacts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat">
          <Card className={`border border-orange-500/30 bg-gradient-to-br from-gray-900/80 to-orange-900/10 backdrop-blur-sm flex flex-col transition-all duration-300 ${
            isExpanded ? 'h-[80vh]' : 'h-[600px]'
          }`}>
            <div className="flex items-center justify-between p-3 border-b border-orange-500/20">
              <ChatHeader 
                modelName={getModelName(selectedModel)}
                selectedModel={selectedModel}
                onClearConversation={clearConversation}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
            
            <EnhancedChatMessageList 
              messages={messages}
              isLoading={isLoading}
              selectedModel={selectedModel}
              getModelName={getModelName}
            />
            
            <div className="p-4 border-t border-orange-500/20">
              <EnhancedChatInput 
                isLoading={isLoading}
                onSendMessage={sendMessage}
                placeholder={isLoading 
                  ? "Waiting for response..." 
                  : `Send a message to ${getModelName(selectedModel)}...`
                }
                isExpanded={isExpanded}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="artifacts">
          <ChatArtifacts messages={messages} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAIChatInterface;

// src/components/chat/ChatHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Brain, 
  Database, 
  Sparkles,
  Settings,
  BarChart3 
} from 'lucide-react';
import { useMemoryManagement } from '@/hooks/useMemoryManagement';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  modelName: string;
  selectedModel: string;
  onClearConversation: () => void;
  onOpenMemoryDashboard?: () => void;
  onOpenSettings?: () => void;
}

export function ChatHeader({ 
  modelName, 
  selectedModel, 
  onClearConversation,
  onOpenMemoryDashboard,
  onOpenSettings
}: ChatHeaderProps) {
  const { memories, topics } = useMemoryManagement();

  // Calculate memory stats
  const activeMemories = memories.filter(m => m.status === 'active').length;
  const conversationMemories = memories.filter(m => m.memory_type === 'conversation').length;
  const recentMemories = memories.filter(m => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(m.updated_at) > yesterday;
  }).length;

  return (
    <div className="border-b border-orange-500/20 p-4 bg-gradient-to-r from-gray-900/90 to-orange-900/20">
      <div className="flex items-center justify-between">
        {/* Left Section - Model Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-medium text-foreground">
                Memory-Aware Chat
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Model: {modelName}</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    selectedModel === 'openai' && "border-green-500 text-green-400",
                    selectedModel === 'anthropic' && "border-blue-500 text-blue-400",
                    selectedModel === 'perplexity' && "border-purple-500 text-purple-400"
                  )}
                >
                  {selectedModel}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Memory Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="w-4 h-4" />
            <span>{activeMemories} memories</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>{conversationMemories} conversations</span>
          </div>
          {recentMemories > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentMemories} new today
            </Badge>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Memory Dashboard Button */}
          {onOpenMemoryDashboard && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenMemoryDashboard}
              className="text-muted-foreground hover:text-foreground"
              title="Open Memory Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="text-muted-foreground hover:text-foreground"
              title="Chat Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {/* Clear Conversation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearConversation}
            className="text-muted-foreground hover:text-destructive"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Memory Status Indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Memory system active</span>
        </div>
        <div className="text-xs text-muted-foreground">
          • Conversations are automatically stored
        </div>
        <div className="text-xs text-muted-foreground">
          • AI has access to {topics.length} knowledge topics
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
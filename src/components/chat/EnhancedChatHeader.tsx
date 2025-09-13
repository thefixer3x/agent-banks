
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Brain, 
  Database, 
  Sparkles,
  Settings,
  BarChart3,
  Volume2,
  VolumeX,
  Mic,
  MicOff
} from 'lucide-react';
import { useMemoryManagement } from '@/hooks/useMemoryManagement';
import { cn } from '@/lib/utils';

interface EnhancedChatHeaderProps {
  modelName: string;
  selectedModel: string;
  onClearConversation: () => void;
  onOpenMemoryDashboard?: () => void;
  onOpenSettings?: () => void;
  isSpeechEnabled?: boolean;
  onToggleSpeech?: () => void;
  isListening?: boolean;
  onToggleListening?: () => void;
}

export function EnhancedChatHeader({ 
  modelName, 
  selectedModel, 
  onClearConversation,
  onOpenMemoryDashboard,
  onOpenSettings,
  isSpeechEnabled = false,
  onToggleSpeech,
  isListening = false,
  onToggleListening
}: EnhancedChatHeaderProps) {
  const { memories, topics } = useMemoryManagement();

  const activeMemories = memories.filter(m => m.status === 'active').length;
  const conversationMemories = memories.filter(m => m.memory_type === 'conversation').length;
  const recentMemories = memories.filter(m => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(m.updated_at) > yesterday;
  }).length;

  const getModelColor = (model: string) => {
    switch (model) {
      case 'openai': return 'border-green-500 text-green-400 bg-green-500/10';
      case 'anthropic': return 'border-blue-500 text-blue-400 bg-blue-500/10';
      case 'perplexity': return 'border-purple-500 text-purple-400 bg-purple-500/10';
      case 'gemini': return 'border-orange-500 text-orange-400 bg-orange-500/10';
      case 'deepseek': return 'border-red-500 text-red-400 bg-red-500/10';
      case 'mistral': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
      default: return 'border-gray-500 text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="border-b border-orange-500/20 p-4 bg-gradient-to-r from-gray-900/90 to-orange-900/20">
      <div className="flex items-center justify-between">
        {/* Left Section - Model Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                Memory-Aware Chat
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getModelColor(selectedModel))}
                >
                  {selectedModel.toUpperCase()}
                </Badge>
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Model: {modelName}</span>
                {isSpeechEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    🎤 Speech Enabled
                  </Badge>
                )}
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
          {/* Speech Controls */}
          {onToggleSpeech && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSpeech}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isSpeechEnabled && "text-orange-400"
              )}
              title="Toggle Speech Output"
            >
              {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}

          {onToggleListening && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleListening}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isListening && "text-red-400 animate-pulse"
              )}
              title="Toggle Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}

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
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Memory system active</span>
          </div>
          <span>• Conversations stored automatically</span>
          <span>• AI has access to {topics.length} knowledge topics</span>
        </div>
        
        {isSpeechEnabled && (
          <div className="flex items-center gap-2 text-xs text-orange-400">
            <Volume2 className="w-3 h-3" />
            <span>Speech synthesis active</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedChatHeader;

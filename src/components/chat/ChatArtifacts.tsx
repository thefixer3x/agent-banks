
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/hooks/useAIChat';
import { Code, FileText } from 'lucide-react';

interface ChatArtifactsProps {
  messages: ChatMessage[];
}

const ChatArtifacts: React.FC<ChatArtifactsProps> = ({ messages }) => {
  // Extract code blocks and other artifacts from messages
  const artifacts = messages
    .filter(msg => msg.role === 'assistant')
    .flatMap((msg, msgIndex) => {
      const codeBlocks = msg.content.match(/```[\s\S]*?```/g) || [];
      return codeBlocks.map((block, blockIndex) => {
        const lines = block.slice(3, -3).trim().split('\n');
        const language = lines[0] || 'text';
        const code = lines.slice(1).join('\n');
        
        return {
          id: `${msg.id}-${blockIndex}`,
          type: 'code',
          language,
          content: code,
          timestamp: msg.timestamp,
          messageId: msg.id
        };
      });
    });

  if (artifacts.length === 0) {
    return (
      <Card className="p-8 text-center border border-orange-500/30 bg-gradient-to-br from-gray-900/80 to-orange-900/10">
        <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Artifacts Yet</h3>
        <p className="text-gray-400">
          Code blocks and other artifacts from AI responses will appear here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Chat Artifacts</h3>
      {artifacts.map((artifact) => (
        <Card key={artifact.id} className="p-4 border border-orange-500/30 bg-gradient-to-br from-gray-900/80 to-orange-900/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-orange-400" />
              <Badge variant="outline" className="text-xs">
                {artifact.language}
              </Badge>
            </div>
            <span className="text-xs text-gray-400">
              {artifact.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="bg-black/50 rounded-lg p-4 border border-orange-500/20">
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">
              {artifact.content}
            </pre>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ChatArtifacts;

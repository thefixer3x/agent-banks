
import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Maximize2, Minimize2 } from 'lucide-react';
import AudioControls from './AudioControls';

interface EnhancedChatInputProps {
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  placeholder?: string;
  isExpanded?: boolean;
}

const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({ 
  isLoading, 
  onSendMessage,
  placeholder = "Send a message...",
  isExpanded = false
}) => {
  const [input, setInput] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTranscription = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const maxHeight = isInputExpanded ? '300px' : '120px';

  return (
    <div className="space-y-3">
      {/* Audio Controls */}
      <AudioControls 
        onTranscription={handleTranscription}
        isLoading={isLoading}
        className="justify-center pb-2 border-b border-orange-500/20"
      />
      
      {/* Text Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea 
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="resize-none bg-gray-800/50 border-orange-500/30 text-white placeholder-gray-400 focus:border-orange-500 pr-10"
            style={{ maxHeight }}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
            onClick={() => setIsInputExpanded(!isInputExpanded)}
          >
            {isInputExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
        
        <Button 
          onClick={handleSend} 
          size="icon" 
          disabled={isLoading || !input.trim()}
          className="bg-orange-600 hover:bg-orange-700 min-w-[44px] h-[44px] border-none"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedChatInput;

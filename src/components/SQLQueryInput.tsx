
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlayIcon, RotateCcwIcon, HelpCircleIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SQLQueryInputProps {
  onExecute: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

const EXAMPLE_QUERIES = [
  "SELECT * FROM users LIMIT 5;",
  "SELECT * FROM services WHERE status = 'active';",
  "SELECT e.name, s.name as service_name FROM endpoints e JOIN services s ON e.service_id = s.id LIMIT 10;",
  "SELECT COUNT(*) as total_logs FROM usage_logs;",
];

const SQLQueryInput: React.FC<SQLQueryInputProps> = ({ 
  onExecute, 
  isLoading = false,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  
  const handleExecute = () => {
    if (!query.trim() || isLoading) return;
    
    onExecute(query);
    
    // Add to history if not already the last item
    if (queryHistory.length === 0 || queryHistory[0] !== query) {
      setQueryHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 queries
    }
    
    setHistoryIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Execute on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
    
    // Navigate history with up/down arrows
    if (e.key === 'ArrowUp' && queryHistory.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < queryHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setQuery(queryHistory[newIndex]);
    }
    
    if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      if (historyIndex === 0) {
        setHistoryIndex(-1);
        setQuery('');
      } else {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setQuery(queryHistory[newIndex]);
      }
    }
  };
  
  const loadExampleQuery = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_QUERIES.length);
    setQuery(EXAMPLE_QUERIES[randomIndex]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium">SQL Query</div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadExampleQuery}
                className="h-7 px-2 text-xs"
              >
                <HelpCircleIcon className="h-3.5 w-3.5 mr-1" />
                Example
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Load a random example query</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <div className="relative">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter SQL query..."
          className="font-mono text-xs h-24 resize-none pr-24"
          onKeyDown={handleKeyDown}
        />
        
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setQuery('')}
            disabled={!query || isLoading}
            className="h-7 px-2 text-xs"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
          </Button>
          <Button 
            onClick={handleExecute} 
            size="sm" 
            disabled={!query.trim() || isLoading}
            className="h-7 px-3 text-xs bg-tech-blue hover:bg-tech-blue/90"
          >
            {isLoading ? (
              <span className="h-3.5 w-3.5 border-2 border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlayIcon className="h-3.5 w-3.5 mr-1" />
            )}
            Run
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl</kbd>+<kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd> to execute
      </p>
    </div>
  );
};

export default SQLQueryInput;

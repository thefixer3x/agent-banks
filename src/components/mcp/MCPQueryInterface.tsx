
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, RotateCcw, FileText, Clock } from 'lucide-react';
import { QueryResult } from '@/hooks/mcp/types';

interface MCPQueryInterfaceProps {
  onExecuteQuery: (query: string) => Promise<any>;
  queryResults: QueryResult[];
  isConnected: boolean;
}

const MCPQueryInterface: React.FC<MCPQueryInterfaceProps> = ({
  onExecuteQuery,
  queryResults,
  isConnected
}) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const sampleQueries = [
    "SELECT COUNT(*) FROM memory_entries",
    "SELECT * FROM users LIMIT 5",
    "SELECT name, description FROM memory_topics",
    "SELECT title, created_at FROM conversations ORDER BY created_at DESC LIMIT 10",
    "SELECT COUNT(*) as total_memories, memory_type FROM memory_entries GROUP BY memory_type"
  ];

  const handleExecute = async () => {
    if (!query.trim() || !isConnected || isExecuting) return;

    setIsExecuting(true);
    try {
      await onExecuteQuery(query);
      
      // Add to history if not already there
      if (!queryHistory.includes(query)) {
        setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error("Query execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const loadFromHistory = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const formatResultContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Query Input */}
      <Card className="border-orange-500/20 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SQL Query Interface
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">SQL Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="min-h-32 font-mono text-sm bg-black/50 border-gray-700"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleExecute}
              disabled={!query.trim() || !isConnected || isExecuting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isExecuting ? (
                <span className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute Query
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setQuery('')}
              disabled={!query}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <Separator />

          {/* Sample Queries */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">Sample Queries</h3>
            <div className="space-y-1">
              {sampleQueries.map((sample, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2 text-xs font-mono"
                  onClick={() => loadSampleQuery(sample)}
                >
                  {sample}
                </Button>
              ))}
            </div>
          </div>

          {/* Query History */}
          {queryHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Query History
                </h3>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {queryHistory.map((historyQuery, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-2 text-xs font-mono"
                        onClick={() => loadFromHistory(historyQuery)}
                      >
                        {historyQuery}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Query Results */}
      <Card className="border-orange-500/20 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-orange-400">Query Results</CardTitle>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-96">
            {queryResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                No query results yet. Execute a query to see results here.
              </div>
            ) : (
              <div className="space-y-4">
                {queryResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="p-4 border border-gray-700 rounded-lg bg-black/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {formatResultContent(result.content)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPQueryInterface;

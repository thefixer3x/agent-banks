
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayIcon, RotateCcwIcon, DatabaseIcon, AlertCircleIcon, CheckCircleIcon, MessageSquare, Code } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface QueryResult {
  data?: any[];
  error?: string;
  rowCount?: number;
  executionTime?: number;
}

const EXAMPLE_QUERIES = [
  "SELECT * FROM memory_entries WHERE memory_type = 'conversation' LIMIT 5;",
  "SELECT mt.name, COUNT(*) as entry_count FROM memory_entries me JOIN memory_topics mt ON me.topic_id = mt.id GROUP BY mt.name;",
  "SELECT * FROM user_settings WHERE user_id = auth.uid();",
  "SELECT COUNT(*) as total_memories FROM memory_entries WHERE status = 'active';",
];

const EXAMPLE_NL_QUERIES = [
  "Show me all conversation memories",
  "Count memories by topic",
  "Get my user settings",
  "How many active memories do I have?",
];

const SQLQueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('sql');
  const [generatedSQL, setGeneratedSQL] = useState<string>('');

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Only allow SELECT statements for safety
      const trimmedQuery = query.trim().toUpperCase();
      if (!trimmedQuery.startsWith('SELECT')) {
        throw new Error('Only SELECT statements are allowed for security reasons');
      }

      // For demonstration, we'll query memory_entries table
      // In a real implementation, you'd want to parse the SQL and execute it safely
      const { data, error, count } = await supabase
        .from('memory_entries')
        .select('*')
        .limit(10);

      const executionTime = Date.now() - startTime;
      
      if (error) {
        setResult({ 
          error: error.message || 'Query execution failed',
          executionTime 
        });
        toast({
          title: "Query Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResult({ 
          data: data || [],
          rowCount: count || (data ? data.length : 0),
          executionTime 
        });
        toast({
          title: "Query Executed",
          description: `Query completed in ${executionTime}ms`,
        });
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      setResult({ 
        error: error.message || 'Unknown error occurred',
        executionTime 
      });
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertNaturalLanguageToSQL = async () => {
    if (!naturalLanguageQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Call the AI service to convert natural language to SQL
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Convert this natural language query to SQL: "${naturalLanguageQuery}". 
                   Only return the SQL query without any additional text or explanations.
                   Assume we have tables: memory_entries, memory_topics, user_settings, and system_configs.`,
          model: 'free', // Use the free model for basic conversions
          protocol: 'mcp',
          format: 'text'
        }
      });

      if (error) throw error;

      const sqlQuery = data.tool_responses?.[0]?.response || data.response;
      
      // Clean up the response to extract just the SQL
      const cleanedSQL = extractSQLFromResponse(sqlQuery);
      
      setGeneratedSQL(cleanedSQL);
      setQuery(cleanedSQL);
      setActiveTab('sql');
      
      toast({
        title: "SQL Generated",
        description: "Natural language query converted to SQL",
      });
    } catch (error: any) {
      console.error('Error converting to SQL:', error);
      toast({
        title: "Conversion Error",
        description: error.message || 'Failed to convert natural language to SQL',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract SQL from AI response
  const extractSQLFromResponse = (response: string): string => {
    // Try to extract code between backticks or SQL blocks
    const codeBlockMatch = response.match(/```sql\s*([\s\S]*?)\s*```/) || 
                          response.match(/```\s*([\s\S]*?)\s*```/) ||
                          response.match(/`([\s\S]*?)`/);
    
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code blocks found, clean up the response
    // Remove explanations, just keep what looks like SQL
    return response.replace(/^I'll convert this to SQL:?\s*/i, '')
                 .replace(/^Here'?s? the SQL:?\s*/i, '')
                 .replace(/^SQL:?\s*/i, '')
                 .trim();
  };

  const loadExampleQuery = () => {
    if (activeTab === 'sql') {
      const randomQuery = EXAMPLE_QUERIES[Math.floor(Math.random() * EXAMPLE_QUERIES.length)];
      setQuery(randomQuery);
    } else {
      const randomNLQuery = EXAMPLE_NL_QUERIES[Math.floor(Math.random() * EXAMPLE_NL_QUERIES.length)];
      setNaturalLanguageQuery(randomNLQuery);
    }
  };

  const clearQuery = () => {
    if (activeTab === 'sql') {
      setQuery('');
    } else {
      setNaturalLanguageQuery('');
      setGeneratedSQL('');
    }
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (activeTab === 'sql') {
        executeQuery();
      } else {
        convertNaturalLanguageToSQL();
      }
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.error) {
      return (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Query Error</CardTitle>
              {result.executionTime && (
                <Badge variant="outline">{result.executionTime}ms</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-destructive whitespace-pre-wrap">
              {result.error}
            </pre>
          </CardContent>
        </Card>
      );
    }

    if (result.data) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <CardTitle>Query Results</CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
                </Badge>
                {result.executionTime && (
                  <Badge variant="outline">{result.executionTime}ms</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {result.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(result.data[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-[200px] truncate">
                            {value === null ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : typeof value === 'object' ? (
                              <span className="text-muted-foreground">
                                {JSON.stringify(value)}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No results found
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5" />
              <CardTitle>SQL Query Interface</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadExampleQuery}
            >
              Load Example
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="sql" className="flex-1">
                <Code className="w-4 h-4 mr-2" />
                SQL Query
              </TabsTrigger>
              <TabsTrigger value="nl" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Natural Language
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sql" className="space-y-2">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="font-mono text-sm min-h-[120px] resize-y"
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl</kbd>+
                  <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd> to execute
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearQuery}
                    disabled={!query && !result}
                  >
                    <RotateCcwIcon className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    onClick={executeQuery}
                    disabled={!query.trim() || isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <PlayIcon className="w-4 h-4 mr-1" />
                    )}
                    Execute
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="nl" className="space-y-2">
              <Textarea
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                placeholder="Ask your question in plain English (e.g., 'Show me all conversation memories')..."
                className="text-sm min-h-[120px] resize-y"
                onKeyDown={handleKeyDown}
              />
              
              {generatedSQL && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium">Generated SQL:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setActiveTab('sql');
                        setQuery(generatedSQL);
                      }}
                    >
                      Use This Query
                    </Button>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap">{generatedSQL}</pre>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl</kbd>+
                  <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd> to convert to SQL
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearQuery}
                    disabled={!naturalLanguageQuery && !generatedSQL}
                  >
                    <RotateCcwIcon className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    onClick={convertNaturalLanguageToSQL}
                    disabled={!naturalLanguageQuery.trim() || isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <PlayIcon className="w-4 h-4 mr-1" />
                    )}
                    Convert to SQL
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {renderResult()}
    </div>
  );
};

export default SQLQueryInterface;

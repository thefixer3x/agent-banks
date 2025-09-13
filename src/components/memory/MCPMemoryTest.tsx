
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Brain, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

const MCPMemoryTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const projectSummaries = [
    {
      title: "Ghost Protocol AI Chat System Overview",
      content: `This project is a comprehensive AI chat system called "Ghost Protocol" built with React, TypeScript, and Supabase. 

Key Features:
- Memory-aware AI chat interface with context persistence
- Multiple AI model support (OpenAI, Claude, Perplexity, Gemini, DeepSeek, Mistral)
- Supabase MCP (Model Context Protocol) server integration
- Real-time data transmission and updates
- User authentication and profile management
- API key configuration and management
- Memory management system for AI context

The system allows users to chat with AI models while maintaining conversation context through a sophisticated memory system that stores and retrieves relevant information to enhance AI responses.`,
      memory_type: "knowledge" as const,
      topic: "System Architecture"
    },
    {
      title: "Technical Stack and Implementation",
      content: `Technical Implementation Details:

Frontend:
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/UI component library
- React Query for state management
- React Router for navigation

Backend:
- Supabase for database and authentication
- Edge functions for AI model integration
- Row Level Security (RLS) for data protection
- Vector embeddings for memory search
- Real-time subscriptions for live updates

AI Integration:
- Multiple AI provider support with unified interface
- API key management through Supabase secrets
- Memory-aware context injection
- Model switching and configuration
- Token usage tracking and optimization`,
      memory_type: "knowledge" as const,
      topic: "Development Stack"
    },
    {
      title: "Database Schema and Memory System",
      content: `Database Architecture:

Core Tables:
- memory_entries: Stores AI conversation context and knowledge
- memory_topics: Categorizes memories by subject
- memory_associations: Links related memories
- conversations: Chat session management
- messages: Individual chat messages
- user_settings: API keys and user preferences
- profiles: User account information

Memory System Features:
- Vector embeddings for semantic search
- Automatic memory categorization
- Relevance scoring for context selection
- Real-time memory updates
- Cross-session memory persistence
- Memory association mapping

The memory system uses vector embeddings to find semantically similar content and inject relevant context into AI conversations, creating a persistent knowledge base that improves over time.`,
      memory_type: "project" as const,
      topic: "Database Design"
    }
  ];

  const addTestResult = (type: TestResult['type'], message: string) => {
    const result: TestResult = {
      type,
      message,
      timestamp: new Date()
    };
    setTestResults(prev => [result, ...prev]);
  };

  const testMemoryInsertion = async () => {
    setIsLoading(true);
    addTestResult('info', 'Starting MCP memory test...');

    try {
      for (const [index, summary] of projectSummaries.entries()) {
        addTestResult('info', `Inserting memory ${index + 1}: ${summary.title}`);
        
        // Generate embedding for the content
        const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
          body: { content: summary.content }
        });

        if (embeddingError) {
          addTestResult('error', `Failed to generate embedding: ${embeddingError.message}`);
          continue;
        }

        // Insert memory entry with correct field names
        const { data: memoryData, error: memoryError } = await supabase
          .from('memory_entries')
          .insert({
            title: summary.title,
            content: summary.content,
            memory_type: summary.memory_type,
            project_ref: 'ghost-protocol-dev',
            embedding: embeddingData.embedding,
            relevance_score: 1.0,
            summary: summary.content.substring(0, 200) + '...',
            tags: ['mcp-test', 'project-summary', summary.topic.toLowerCase().replace(' ', '-')]
          })
          .select()
          .single();

        if (memoryError) {
          addTestResult('error', `Failed to insert memory: ${memoryError.message}`);
        } else {
          addTestResult('success', `Successfully inserted: ${summary.title} (ID: ${memoryData.id})`);
        }

        // Small delay between insertions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addTestResult('success', 'MCP memory test completed successfully!');
      
      toast({
        title: 'Memory Test Complete',
        description: 'Project summaries have been added to the memory system',
      });

    } catch (error) {
      console.error('Memory test error:', error);
      addTestResult('error', `Test failed: ${error.message}`);
      
      toast({
        title: 'Memory Test Failed',
        description: 'Failed to complete memory insertion test',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testMemorySearch = async () => {
    setIsLoading(true);
    addTestResult('info', 'Testing memory search functionality...');

    try {
      const searchQuery = "What is the technical stack of this project?";
      
      // Generate embedding for search query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
        body: { content: searchQuery }
      });

      if (embeddingError) {
        addTestResult('error', `Failed to generate search embedding: ${embeddingError.message}`);
        return;
      }

      // Search memories
      const { data: searchResults, error: searchError } = await supabase.rpc('search_memories', {
        query_embedding: embeddingData.embedding,
        match_threshold: 0.5,
        match_count: 5,
        filter_project_ref: 'ghost-protocol-dev'
      });

      if (searchError) {
        addTestResult('error', `Memory search failed: ${searchError.message}`);
      } else {
        addTestResult('success', `Found ${searchResults.length} relevant memories for query: "${searchQuery}"`);
        
        searchResults.forEach((result, index) => {
          addTestResult('info', `  ${index + 1}. ${result.title} (similarity: ${Math.round(result.similarity * 100)}%)`);
        });
      }

      toast({
        title: 'Memory Search Complete',
        description: `Found ${searchResults?.length || 0} relevant memories`,
      });

    } catch (error) {
      console.error('Memory search error:', error);
      addTestResult('error', `Search test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          MCP Memory System Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the MCP memory functionality by inserting project summaries and searching for relevant content.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testMemoryInsertion} 
            disabled={isLoading}
            className="flex-1 min-w-[200px]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            Insert Project Summaries
          </Button>
          
          <Button 
            onClick={testMemorySearch} 
            disabled={isLoading}
            variant="outline"
            className="flex-1 min-w-[200px]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Test Memory Search
          </Button>
          
          <Button 
            onClick={clearTestResults} 
            variant="ghost"
            disabled={testResults.length === 0}
          >
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h4 className="font-medium">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-2 text-sm p-2 rounded border">
                {result.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />}
                {result.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                {result.type === 'info' && <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                
                <div className="flex-1">
                  <p className={result.type === 'error' ? 'text-red-600' : result.type === 'success' ? 'text-green-600' : 'text-blue-600'}>
                    {result.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCPMemoryTest;

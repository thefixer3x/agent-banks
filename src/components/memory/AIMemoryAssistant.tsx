
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain, Search, Sparkles, Tag, FileText, Lightbulb } from "lucide-react";
import { useAIMemoryIntegration } from "@/hooks/useAIMemoryIntegration";
import { useMemoryManagement } from "@/hooks/useMemoryManagement";
import { SearchResult } from "@/types/memory";

export function AIMemoryAssistant() {
  const {
    loading,
    semanticSearch,
    generateSummary,
    extractTags,
    findRelatedMemories,
    createMemoryWithAI
  } = useAIMemoryIntegration();
  
  const { topics } = useMemoryManagement();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [quickMemory, setQuickMemory] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [relatedMemories, setRelatedMemories] = useState<SearchResult[]>([]);

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await semanticSearch(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!quickMemory.trim()) return;
    
    try {
      const summary = await generateSummary(quickMemory);
      setGeneratedSummary(summary);
    } catch (error) {
      console.error('Summary generation failed:', error);
    }
  };

  const handleExtractTags = async () => {
    if (!quickMemory.trim()) return;
    
    try {
      const tags = await extractTags(quickMemory);
      setSuggestedTags(tags);
    } catch (error) {
      console.error('Tag extraction failed:', error);
    }
  };

  const handleQuickSave = async () => {
    if (!quickMemory.trim()) return;
    
    try {
      await createMemoryWithAI({
        title: quickMemory.slice(0, 50) + (quickMemory.length > 50 ? '...' : ''),
        content: quickMemory,
        summary: generatedSummary || undefined,
        memory_type: 'knowledge',
        tags: suggestedTags,
        project_ref: 'ai-assistant'
      });
      
      // Reset form
      setQuickMemory('');
      setGeneratedSummary('');
      setSuggestedTags([]);
    } catch (error) {
      console.error('Quick save failed:', error);
    }
  };

  const handleFindRelated = async (memoryId: string) => {
    try {
      const related = await findRelatedMemories(memoryId);
      setRelatedMemories(related);
    } catch (error) {
      console.error('Finding related memories failed:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Semantic Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AI-Powered Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search memories with natural language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
            />
            <Button 
              onClick={handleSemanticSearch}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div key={result.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{result.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(result.similarity * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.content}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => handleFindRelated(result.id)}
                    >
                      Find Related
                    </Button>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <div className="text-center text-muted-foreground py-8">
                  No results found. Try a different search query.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Memory Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Memory Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your thoughts, notes, or knowledge here..."
            value={quickMemory}
            onChange={(e) => setQuickMemory(e.target.value)}
            rows={4}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSummary}
              disabled={loading || !quickMemory.trim()}
            >
              <FileText className="h-4 w-4 mr-1" />
              {loading ? 'Generating...' : 'Generate Summary'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExtractTags}
              disabled={loading || !quickMemory.trim()}
            >
              <Tag className="h-4 w-4 mr-1" />
              Extract Tags
            </Button>
          </div>
          
          {generatedSummary && (
            <div className="p-3 bg-muted rounded-lg">
              <h5 className="font-medium text-sm mb-1">AI Summary:</h5>
              <p className="text-sm">{generatedSummary}</p>
            </div>
          )}
          
          {suggestedTags.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-2">Suggested Tags:</h5>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Button
            onClick={handleQuickSave}
            disabled={loading || !quickMemory.trim()}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save with AI Enhancement'}
          </Button>
        </CardContent>
      </Card>

      {/* Related Memories */}
      {relatedMemories.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Related Memories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedMemories.map((memory) => (
                <div key={memory.id} className="p-3 border rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">{memory.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {memory.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(memory.similarity * 100)}% similar
                    </Badge>
                    {memory.topic_name && (
                      <Badge variant="outline" className="text-xs">
                        {memory.topic_name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

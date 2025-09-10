
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MemoryEntry, SearchResult } from '@/types/memory';
import { toast } from '@/hooks/use-toast';

export function useAIMemoryIntegration() {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Generate embedding for text
  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text }
      });

      if (error) throw error;
      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  };

  // Create memory with AI enhancement
  const createMemoryWithAI = async (memory: Partial<MemoryEntry>) => {
    if (!memory.title || !memory.content) {
      throw new Error('Title and content are required');
    }

    setLoading(true);
    try {
      // Generate embedding for the content
      const embedding = await generateEmbedding(memory.content);
      const embeddingString = `[${embedding.join(',')}]`;

      // Create the memory entry with proper type safety
      const insertData = {
        title: memory.title,
        content: memory.content,
        summary: memory.summary || null,
        memory_type: memory.memory_type || 'knowledge' as const,
        topic_id: memory.topic_id || null,
        source_url: memory.source_url || null,
        source_type: memory.source_type || null,
        tags: memory.tags || [],
        project_ref: memory.project_ref || 'general',
        metadata: memory.metadata || {},
        embedding: embeddingString
      };

      const { data, error } = await supabase
        .from('memory_entries')
        .insert(insertData)
        .select(`
          *,
          topic:memory_topics(*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Memory created with AI enhancement",
      });

      return data;
    } catch (error) {
      console.error('Error creating memory with AI:', error);
      toast({
        title: "Error",
        description: "Failed to create memory with AI enhancement",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Semantic search with AI
  const semanticSearch = async (
    query: string,
    topicId?: string,
    projectRef?: string,
    limit: number = 10
  ): Promise<SearchResult[]> => {
    setLoading(true);
    try {
      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      // Call the search function
      const { data, error } = await supabase.rpc('search_memories', {
        query_embedding: embeddingString,
        match_threshold: 0.78,
        match_count: limit,
        filter_topic_id: topicId || null,
        filter_project_ref: projectRef || null
      });

      if (error) throw error;

      // Transform the data to match SearchResult interface
      const results: SearchResult[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        summary: item.summary,
        memory_type: item.memory_type,
        status: 'active' as const,
        relevance_score: item.relevance_score,
        tags: [],
        metadata: null,
        project_ref: 'general',
        last_accessed: item.created_at,
        access_count: 0,
        created_at: item.created_at,
        updated_at: item.created_at,
        user_id: '',
        similarity: item.similarity,
        topic_name: item.topic_name
      }));

      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      toast({
        title: "Error",
        description: "Failed to perform semantic search",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Find related memories
  const findRelatedMemories = async (memoryId: string): Promise<SearchResult[]> => {
    setLoading(true);
    try {
      // Get the memory content first
      const { data: memory, error: memoryError } = await supabase
        .from('memory_entries')
        .select('content, embedding')
        .eq('id', memoryId)
        .single();

      if (memoryError) throw memoryError;

      if (!memory.embedding) {
        // If no embedding exists, generate one
        const embedding = await generateEmbedding(memory.content);
        const embeddingString = `[${embedding.join(',')}]`;
        
        // Update the memory with the embedding
        await supabase
          .from('memory_entries')
          .update({ embedding: embeddingString })
          .eq('id', memoryId);

        // Use the new embedding for search
        const { data, error } = await supabase.rpc('search_memories', {
          query_embedding: embeddingString,
          match_threshold: 0.7,
          match_count: 5
        });

        if (error) throw error;

        // Transform the data to match SearchResult interface
        const results: SearchResult[] = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          summary: item.summary,
          memory_type: item.memory_type,
          status: 'active' as const,
          relevance_score: item.relevance_score,
          tags: [],
          metadata: null,
          project_ref: 'general',
          last_accessed: item.created_at,
          access_count: 0,
          created_at: item.created_at,
          updated_at: item.created_at,
          user_id: '',
          similarity: item.similarity,
          topic_name: item.topic_name
        }));

        return results.filter(r => r.id !== memoryId);
      } else {
        // Use existing embedding for search
        const { data, error } = await supabase.rpc('search_memories', {
          query_embedding: memory.embedding,
          match_threshold: 0.7,
          match_count: 5
        });

        if (error) throw error;

        // Transform the data to match SearchResult interface
        const results: SearchResult[] = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          summary: item.summary,
          memory_type: item.memory_type,
          status: 'active' as const,
          relevance_score: item.relevance_score,
          tags: [],
          metadata: null,
          project_ref: 'general',
          last_accessed: item.created_at,
          access_count: 0,
          created_at: item.created_at,
          updated_at: item.created_at,
          user_id: '',
          similarity: item.similarity,
          topic_name: item.topic_name
        }));

        return results.filter(r => r.id !== memoryId);
      }
    } catch (error) {
      console.error('Error finding related memories:', error);
      toast({
        title: "Error",
        description: "Failed to find related memories",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate summary for content
  const generateSummary = async (content: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { content }
      });

      if (error) throw error;
      return data.summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  };

  // Extract tags from content
  const extractTags = async (content: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-tags', {
        body: { content }
      });

      if (error) throw error;
      return data.tags;
    } catch (error) {
      console.error('Error extracting tags:', error);
      throw error;
    }
  };

  return {
    loading,
    searchResults,
    createMemoryWithAI,
    semanticSearch,
    findRelatedMemories,
    generateSummary,
    extractTags,
    generateEmbedding
  };
}

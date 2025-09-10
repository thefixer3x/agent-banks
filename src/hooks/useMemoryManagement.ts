
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MemoryTopic, MemoryEntry, SearchResult } from '@/types/memory';
import { toast } from '@/hooks/use-toast';

// Helper function to safely convert Json to Record<string, any>
const safeJsonToRecord = (json: any): Record<string, any> | null => {
  if (!json) return null;
  if (typeof json === 'object' && json !== null) return json as Record<string, any>;
  return null;
};

export function useMemoryManagement() {
  const [topics, setTopics] = useState<MemoryTopic[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Load topics
  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_topics')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const typedTopics: MemoryTopic[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        color: item.color || '#6366F1',
        icon: item.icon || 'brain',
        parent_topic_id: item.parent_topic_id,
        is_system: item.is_system || false,
        metadata: safeJsonToRecord(item.metadata),
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id
      }));
      
      setTopics(typedTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
      toast({
        title: "Error",
        description: "Failed to load memory topics",
        variant: "destructive",
      });
    }
  };

  // Load memories
  const loadMemories = async (topicId?: string, projectRef?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('memory_entries')
        .select(`
          *,
          topic:memory_topics(*)
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      if (projectRef && projectRef !== 'all') {
        query = query.eq('project_ref', projectRef);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedMemories: MemoryEntry[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        summary: item.summary,
        memory_type: item.memory_type as 'conversation' | 'knowledge' | 'project' | 'context' | 'reference',
        status: item.status as 'active' | 'archived' | 'draft' | 'deleted',
        relevance_score: item.relevance_score || 1.0,
        topic_id: item.topic_id,
        source_url: item.source_url,
        source_type: item.source_type,
        tags: item.tags || [],
        metadata: safeJsonToRecord(item.metadata),
        project_ref: item.project_ref || 'general',
        last_accessed: item.last_accessed,
        access_count: item.access_count || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id,
        topic: item.topic ? {
          id: item.topic.id,
          name: item.topic.name,
          description: item.topic.description,
          color: item.topic.color || '#6366F1',
          icon: item.topic.icon || 'brain',
          parent_topic_id: item.topic.parent_topic_id,
          is_system: item.topic.is_system || false,
          metadata: safeJsonToRecord(item.topic.metadata),
          created_at: item.topic.created_at,
          updated_at: item.topic.updated_at,
          user_id: item.topic.user_id
        } : undefined
      }));
      
      setMemories(typedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
      toast({
        title: "Error",
        description: "Failed to load memories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create topic
  const createTopic = async (topic: Partial<MemoryTopic>) => {
    try {
      const { data, error } = await supabase
        .from('memory_topics')
        .insert({
          name: topic.name!,
          description: topic.description,
          color: topic.color || '#6366F1',
          icon: topic.icon || 'brain',
          parent_topic_id: topic.parent_topic_id,
          metadata: topic.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      const typedTopic: MemoryTopic = {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color || '#6366F1',
        icon: data.icon || 'brain',
        parent_topic_id: data.parent_topic_id,
        is_system: data.is_system || false,
        metadata: safeJsonToRecord(data.metadata),
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };

      setTopics(prev => [...prev, typedTopic]);
      toast({
        title: "Success",
        description: "Topic created successfully",
      });

      return typedTopic;
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: "Error",
        description: "Failed to create topic",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update topic
  const updateTopic = async (id: string, updates: Partial<MemoryTopic>) => {
    try {
      const { data, error } = await supabase
        .from('memory_topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const typedTopic: MemoryTopic = {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color || '#6366F1',
        icon: data.icon || 'brain',
        parent_topic_id: data.parent_topic_id,
        is_system: data.is_system || false,
        metadata: safeJsonToRecord(data.metadata),
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };

      setTopics(prev => prev.map(topic => 
        topic.id === id ? typedTopic : topic
      ));

      toast({
        title: "Success",
        description: "Topic updated successfully",
      });

      return typedTopic;
    } catch (error) {
      console.error('Error updating topic:', error);
      toast({
        title: "Error",
        description: "Failed to update topic",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete topic
  const deleteTopic = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memory_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTopics(prev => prev.filter(topic => topic.id !== id));
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete topic",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Create memory entry
  const createMemory = async (memory: Partial<MemoryEntry>) => {
    try {
      const { data, error } = await supabase
        .from('memory_entries')
        .insert({
          title: memory.title!,
          content: memory.content!,
          summary: memory.summary,
          memory_type: memory.memory_type || 'knowledge',
          topic_id: memory.topic_id,
          source_url: memory.source_url,
          source_type: memory.source_type,
          tags: memory.tags || [],
          project_ref: memory.project_ref || 'general',
          metadata: memory.metadata || {}
        })
        .select(`
          *,
          topic:memory_topics(*)
        `)
        .single();

      if (error) throw error;

      const typedMemory: MemoryEntry = {
        id: data.id,
        title: data.title,
        content: data.content,
        summary: data.summary,
        memory_type: data.memory_type as 'conversation' | 'knowledge' | 'project' | 'context' | 'reference',
        status: data.status as 'active' | 'archived' | 'draft' | 'deleted',
        relevance_score: data.relevance_score || 1.0,
        topic_id: data.topic_id,
        source_url: data.source_url,
        source_type: data.source_type,
        tags: data.tags || [],
        metadata: safeJsonToRecord(data.metadata),
        project_ref: data.project_ref || 'general',
        last_accessed: data.last_accessed,
        access_count: data.access_count || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        topic: data.topic ? {
          id: data.topic.id,
          name: data.topic.name,
          description: data.topic.description,
          color: data.topic.color || '#6366F1',
          icon: data.topic.icon || 'brain',
          parent_topic_id: data.topic.parent_topic_id,
          is_system: data.topic.is_system || false,
          metadata: safeJsonToRecord(data.topic.metadata),
          created_at: data.topic.created_at,
          updated_at: data.topic.updated_at,
          user_id: data.topic.user_id
        } : undefined
      };

      setMemories(prev => [typedMemory, ...prev]);
      toast({
        title: "Success",
        description: "Memory created successfully",
      });

      return typedMemory;
    } catch (error) {
      console.error('Error creating memory:', error);
      toast({
        title: "Error",
        description: "Failed to create memory",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update memory entry
  const updateMemory = async (id: string, updates: Partial<MemoryEntry>) => {
    try {
      const { data, error } = await supabase
        .from('memory_entries')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          topic:memory_topics(*)
        `)
        .single();

      if (error) throw error;

      const typedMemory: MemoryEntry = {
        id: data.id,
        title: data.title,
        content: data.content,
        summary: data.summary,
        memory_type: data.memory_type as 'conversation' | 'knowledge' | 'project' | 'context' | 'reference',
        status: data.status as 'active' | 'archived' | 'draft' | 'deleted',
        relevance_score: data.relevance_score || 1.0,
        topic_id: data.topic_id,
        source_url: data.source_url,
        source_type: data.source_type,
        tags: data.tags || [],
        metadata: safeJsonToRecord(data.metadata),
        project_ref: data.project_ref || 'general',
        last_accessed: data.last_accessed,
        access_count: data.access_count || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        topic: data.topic ? {
          id: data.topic.id,
          name: data.topic.name,
          description: data.topic.description,
          color: data.topic.color || '#6366F1',
          icon: data.topic.icon || 'brain',
          parent_topic_id: data.topic.parent_topic_id,
          is_system: data.topic.is_system || false,
          metadata: safeJsonToRecord(data.topic.metadata),
          created_at: data.topic.created_at,
          updated_at: data.topic.updated_at,
          user_id: data.topic.user_id
        } : undefined
      };

      setMemories(prev => prev.map(memory => 
        memory.id === id ? typedMemory : memory
      ));

      toast({
        title: "Success",
        description: "Memory updated successfully",
      });

      return typedMemory;
    } catch (error) {
      console.error('Error updating memory:', error);
      toast({
        title: "Error",
        description: "Failed to update memory",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete memory entry
  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memory_entries')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;

      setMemories(prev => prev.filter(memory => memory.id !== id));
      toast({
        title: "Success",
        description: "Memory deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({
        title: "Error",
        description: "Failed to delete memory",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Search memories (placeholder for now - would need embedding generation)
  const searchMemories = async (query: string, topicId?: string, projectRef?: string) => {
    try {
      // For now, do a simple text search
      let searchQuery = supabase
        .from('memory_entries')
        .select(`
          *,
          topic:memory_topics(name)
        `)
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (topicId) {
        searchQuery = searchQuery.eq('topic_id', topicId);
      }

      if (projectRef && projectRef !== 'all') {
        searchQuery = searchQuery.eq('project_ref', projectRef);
      }

      const { data, error } = await searchQuery;

      if (error) throw error;

      // Add mock similarity scores for now
      const results: SearchResult[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        summary: item.summary,
        memory_type: item.memory_type as 'conversation' | 'knowledge' | 'project' | 'context' | 'reference',
        status: item.status as 'active' | 'archived' | 'draft' | 'deleted',
        relevance_score: item.relevance_score || 1.0,
        topic_id: item.topic_id,
        source_url: item.source_url,
        source_type: item.source_type,
        tags: item.tags || [],
        metadata: safeJsonToRecord(item.metadata),
        project_ref: item.project_ref || 'general',
        last_accessed: item.last_accessed,
        access_count: item.access_count || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id,
        similarity: 0.8,
        topic_name: item.topic?.name
      }));

      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Error searching memories:', error);
      toast({
        title: "Error",
        description: "Failed to search memories",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadTopics();
    loadMemories();
  }, []);

  return {
    topics,
    memories,
    searchResults,
    loading,
    loadTopics,
    loadMemories,
    createTopic,
    updateTopic,
    deleteTopic,
    createMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
  };
}

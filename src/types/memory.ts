
export interface MemoryTopic {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parent_topic_id?: string;
  is_system: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  summary?: string;
  memory_type: 'conversation' | 'knowledge' | 'project' | 'context' | 'reference';
  status: 'active' | 'archived' | 'draft' | 'deleted';
  relevance_score: number;
  topic_id?: string;
  source_url?: string;
  source_type?: string;
  tags: string[];
  metadata?: Record<string, any> | null;
  project_ref: string;
  last_accessed: string;
  access_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  topic?: MemoryTopic;
}

export interface MemoryAssociation {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  association_type: string;
  strength: number;
  created_at: string;
}

export interface SearchResult extends MemoryEntry {
  similarity: number;
  topic_name?: string;
}

-- Missing Database Functions for Memory System
-- Run this in your Supabase SQL Editor

-- 1. Enhanced search_memories function with better filtering
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_topic_id text DEFAULT NULL,
  filter_project_ref text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  memory_type text,
  relevance_score float,
  similarity float,
  topic_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.id,
    me.title,
    me.content,
    me.summary,
    me.memory_type::text,
    me.relevance_score,
    1 - (me.embedding <=> query_embedding) as similarity,
    COALESCE(mt.name, 'No Topic') as topic_name,
    me.created_at
  FROM memory_entries me
  LEFT JOIN memory_topics mt ON me.topic_id = mt.id
  WHERE 
    me.status = 'active'
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
    AND (filter_topic_id IS NULL OR me.topic_id = filter_topic_id::uuid)
    AND (filter_project_ref IS NULL OR me.project_ref = filter_project_ref)
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 2. Function to get user API keys safely
CREATE OR REPLACE FUNCTION get_user_api_keys()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT api_keys INTO result
  FROM user_settings
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- 3. Function to update user API keys
CREATE OR REPLACE FUNCTION update_user_api_keys(new_keys JSON)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_settings (user_id, api_keys)
  VALUES (auth.uid(), new_keys)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    api_keys = new_keys,
    updated_at = NOW();
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_api_keys TO authenticated;

-- 5. Ensure vector extension and indexes exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding 
  ON memory_entries USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Update memory access function
CREATE OR REPLACE FUNCTION update_memory_access(memory_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE memory_entries
  SET 
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed = NOW()
  WHERE id = memory_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_memory_access TO authenticated;
-- Enhanced Memory Search Functions for Smart Memory Server
-- This includes the CUA-compatible search_memories_enhanced function

-- 1. Enhanced search function with vector similarity
CREATE OR REPLACE FUNCTION search_memories_enhanced(
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
  created_at timestamptz,
  tags text[],
  access_count bigint
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
    COALESCE(me.relevance_score, 0.5) as relevance_score,
    1 - (me.embedding::vector <=> query_embedding) as similarity,
    COALESCE(mt.name, 'No Topic') as topic_name,
    me.created_at,
    COALESCE(me.tags, ARRAY[]::text[]) as tags,
    COALESCE(me.access_count, 0) as access_count
  FROM memory_entries me
  LEFT JOIN memory_topics mt ON me.topic_id = mt.id
  WHERE 
    me.status = 'active'
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding::vector <=> query_embedding) > match_threshold
    AND (filter_topic_id IS NULL OR me.topic_id = filter_topic_id::uuid)
    AND (filter_project_ref IS NULL OR me.project_ref = filter_project_ref)
  ORDER BY me.embedding::vector <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 2. Ensure vector extension and proper indexing
CREATE EXTENSION IF NOT EXISTS vector;

-- 3. Create optimized vector index if it doesn't exist
DROP INDEX IF EXISTS idx_memory_entries_embedding;
CREATE INDEX idx_memory_entries_embedding 
  ON memory_entries USING ivfflat (embedding::vector vector_cosine_ops)
  WITH (lists = 100);

-- 4. Create text search index for fallback
CREATE INDEX IF NOT EXISTS idx_memory_entries_content_fts
  ON memory_entries USING gin(to_tsvector('english', content));

-- 5. Create title search index
CREATE INDEX IF NOT EXISTS idx_memory_entries_title
  ON memory_entries (title);

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION search_memories_enhanced TO authenticated;
GRANT EXECUTE ON FUNCTION search_memories_enhanced TO anon;

-- 7. Update memory access tracking function
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

-- 8. Create function to safely parse embedding from text
CREATE OR REPLACE FUNCTION safe_parse_embedding(embedding_text text)
RETURNS vector(1536)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN embedding_text::vector(1536);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
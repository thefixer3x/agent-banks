-- Supabase SQL Functions for Memory Search and Management
-- Run this in your Supabase SQL Editor

-- 1. Memory Search Function with Vector Similarity
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  similarity float,
  memory_type text,
  topic_name text
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
    1 - (me.embedding <=> query_embedding) as similarity,
    me.memory_type,
    mt.name as topic_name
  FROM memory_entries me
  LEFT JOIN memory_topics mt ON me.topic_id = mt.id
  WHERE 
    me.status = 'active'
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 2. Update Memory Access Count and Last Accessed
CREATE OR REPLACE FUNCTION update_memory_access(memory_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE memory_entries
  SET 
    access_count = access_count + 1,
    last_accessed = NOW()
  WHERE id = memory_id;
END;
$$;

-- 3. Get Memory Statistics for a User
CREATE OR REPLACE FUNCTION get_memory_stats(user_id_param uuid)
RETURNS TABLE (
  total_memories bigint,
  total_topics bigint,
  most_accessed_memories jsonb,
  memory_types jsonb,
  recent_memories jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT me.id) as total_memories,
      COUNT(DISTINCT me.topic_id) as total_topics
    FROM memory_entries me
    WHERE me.user_id = user_id_param
  ),
  most_accessed AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'access_count', access_count
      ) ORDER BY access_count DESC
    ) as memories
    FROM (
      SELECT id, title, access_count
      FROM memory_entries
      WHERE user_id = user_id_param
      ORDER BY access_count DESC
      LIMIT 5
    ) t
  ),
  type_counts AS (
    SELECT jsonb_object_agg(
      memory_type,
      count
    ) as types
    FROM (
      SELECT memory_type, COUNT(*) as count
      FROM memory_entries
      WHERE user_id = user_id_param
      GROUP BY memory_type
    ) t
  ),
  recent AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as memories
    FROM (
      SELECT id, title, created_at
      FROM memory_entries
      WHERE user_id = user_id_param
      ORDER BY created_at DESC
      LIMIT 10
    ) t
  )
  SELECT 
    stats.total_memories,
    stats.total_topics,
    most_accessed.memories,
    type_counts.types,
    recent.memories
  FROM stats, most_accessed, type_counts, recent;
END;
$$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding 
  ON memory_entries USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_memory_entries_user_status 
  ON memory_entries(user_id, status);

CREATE INDEX IF NOT EXISTS idx_memory_entries_access 
  ON memory_entries(access_count DESC, last_accessed DESC);

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION update_memory_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_stats TO authenticated;
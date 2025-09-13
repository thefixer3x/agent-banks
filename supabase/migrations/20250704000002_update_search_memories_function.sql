-- Update search_memories function to include filter_project_ref parameter
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_project_ref text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  similarity float,
  memory_type text,
  topic_name text,
  relevance_score numeric,
  created_at timestamp with time zone
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
    mt.name as topic_name,
    me.relevance_score,
    me.created_at
  FROM memory_entries me
  LEFT JOIN memory_topics mt ON me.topic_id = mt.id
  WHERE 
    me.status = 'active'
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
    AND (filter_project_ref IS NULL OR me.project_ref = filter_project_ref)
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
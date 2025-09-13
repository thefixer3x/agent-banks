-- Create memories table for SD-Ghost Protocol Memory Service
-- First client: Claude's Realm IDE

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    session_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding_hash TEXT NOT NULL,
    relevance_score REAL DEFAULT 0.0,
    client_type TEXT DEFAULT 'unknown',
    client_version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_memories_session_id ON memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_content_type ON memories(content_type);
CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
CREATE INDEX IF NOT EXISTS idx_memories_client_type ON memories(client_type);
CREATE INDEX IF NOT EXISTS idx_memories_embedding_hash ON memories(embedding_hash);

-- Create full-text search index for content
CREATE INDEX IF NOT EXISTS idx_memories_content_search ON memories USING gin(to_tsvector('english', content));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_memories_updated_at 
    BEFORE UPDATE ON memories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow access to memories
-- For now, allow all operations (you may want to restrict this based on your auth setup)
CREATE POLICY "Allow memory operations" ON memories
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Create a view for memory statistics
CREATE OR REPLACE VIEW memory_stats AS
SELECT 
    session_id,
    content_type,
    client_type,
    COUNT(*) as memory_count,
    MIN(timestamp) as first_memory,
    MAX(timestamp) as last_memory,
    AVG(relevance_score) as avg_relevance
FROM memories 
GROUP BY session_id, content_type, client_type;

-- Grant permissions for the view
GRANT SELECT ON memory_stats TO anon, authenticated;

-- Create function to clean up old memories
CREATE OR REPLACE FUNCTION cleanup_old_memories(
    p_session_id TEXT DEFAULT NULL,
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    IF p_session_id IS NOT NULL THEN
        -- Clean up specific session
        DELETE FROM memories 
        WHERE session_id = p_session_id 
        AND timestamp < (NOW() - INTERVAL '1 day' * p_days_old);
    ELSE
        -- Clean up all old memories
        DELETE FROM memories 
        WHERE timestamp < (NOW() - INTERVAL '1 day' * p_days_old);
    END IF;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_memories TO anon, authenticated;

-- Create function to search memories with similarity
CREATE OR REPLACE FUNCTION search_memories(
    p_session_id TEXT,
    p_query TEXT,
    p_content_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    timestamp TIMESTAMPTZ,
    session_id TEXT,
    content_type TEXT,
    content TEXT,
    metadata JSONB,
    embedding_hash TEXT,
    relevance_score REAL,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.timestamp,
        m.session_id,
        m.content_type,
        m.content,
        m.metadata,
        m.embedding_hash,
        m.relevance_score,
        ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', p_query)) as search_rank
    FROM memories m
    WHERE m.session_id = p_session_id
    AND (p_content_type IS NULL OR m.content_type = p_content_type)
    AND (
        m.content ILIKE '%' || p_query || '%' 
        OR to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
    )
    ORDER BY search_rank DESC, m.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on search function
GRANT EXECUTE ON FUNCTION search_memories TO anon, authenticated;

-- Add some helpful comments
COMMENT ON TABLE memories IS 'Persistent memory storage for AI assistants and development tools';
COMMENT ON COLUMN memories.id IS 'Unique identifier for each memory entry';
COMMENT ON COLUMN memories.session_id IS 'Session identifier to group related memories';
COMMENT ON COLUMN memories.content_type IS 'Type of memory: conversation, code_analysis, project, insight, etc.';
COMMENT ON COLUMN memories.content IS 'The actual memory content';
COMMENT ON COLUMN memories.metadata IS 'Additional structured data about the memory';
COMMENT ON COLUMN memories.embedding_hash IS 'Hash of content for similarity matching';
COMMENT ON COLUMN memories.relevance_score IS 'Calculated relevance score for ranking';
COMMENT ON COLUMN memories.client_type IS 'Type of client that created this memory';
COMMENT ON COLUMN memories.client_version IS 'Version of the client that created this memory';
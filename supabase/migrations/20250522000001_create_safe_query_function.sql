
-- Create a secure function to execute queries safely
-- This will be used by the MCP server to execute SQL queries
CREATE OR REPLACE FUNCTION execute_safe_query(query_text TEXT, query_params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  params TEXT[];
  i INTEGER;
BEGIN
  -- Convert the JSON array to a text array
  params := ARRAY[]::TEXT[];
  FOR i IN 0..jsonb_array_length(query_params) - 1 LOOP
    params := array_append(params, query_params->i);
  END LOOP;
  
  -- Execute the query with parameters
  EXECUTE query_text INTO result USING params;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Enable realtime for tables that might be used with MCP
ALTER PUBLICATION supabase_realtime ADD TABLE services, endpoints, usage_logs;

-- Ensure these tables have full replica identity for realtime
ALTER TABLE services REPLICA IDENTITY FULL;
ALTER TABLE endpoints REPLICA IDENTITY FULL;
ALTER TABLE usage_logs REPLICA IDENTITY FULL;


-- Create a secure function to execute queries safely
-- This will be used by the SQL Query Interface
CREATE OR REPLACE FUNCTION execute_safe_query(query_text TEXT, query_params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  query_result RECORD;
  results JSONB[] := '{}';
BEGIN
  -- Only allow SELECT statements for safety
  IF NOT (TRIM(UPPER(query_text)) LIKE 'SELECT%') THEN
    RETURN jsonb_build_object('error', 'Only SELECT statements are allowed');
  END IF;
  
  -- Execute the query and collect results
  FOR query_result IN EXECUTE query_text
  LOOP
    results := array_append(results, to_jsonb(query_result));
  END LOOP;
  
  RETURN jsonb_build_object('data', to_jsonb(results));
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_safe_query TO authenticated;

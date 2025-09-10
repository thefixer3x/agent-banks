import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ClickUp API integration
async function handleClickUpTool(toolName: string, args: any) {
  const clickupToken = Deno.env.get('CLICKUP_API_TOKEN');
  if (!clickupToken) {
    throw new Error('ClickUp API token not configured');
  }

  const baseUrl = 'https://api.clickup.com/api/v2';
  
  switch (toolName) {
    case "clickup_create_task":
      const { list_id, name, description, assignees, priority, due_date } = args;
      
      const taskResponse = await fetch(`${baseUrl}/list/${list_id}/task`, {
        method: 'POST',
        headers: {
          'Authorization': clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          assignees: assignees || [],
          priority: priority || 3,
          due_date: due_date ? new Date(due_date).getTime() : undefined,
        }),
      });
      
      if (!taskResponse.ok) {
        throw new Error(`ClickUp API error: ${taskResponse.statusText}`);
      }
      
      return await taskResponse.json();

    case "clickup_get_tasks":
      const { list_id: listId, assignee } = args;
      
      let tasksUrl = `${baseUrl}/list/${listId}/task`;
      if (assignee) {
        tasksUrl += `?assignees[]=${assignee}`;
      }
      
      const tasksResponse = await fetch(tasksUrl, {
        headers: { 'Authorization': clickupToken },
      });
      
      if (!tasksResponse.ok) {
        throw new Error(`ClickUp API error: ${tasksResponse.statusText}`);
      }
      
      return await tasksResponse.json();

    case "clickup_update_task":
      const { task_id, updates } = args;
      
      const updateResponse = await fetch(`${baseUrl}/task/${task_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`ClickUp API error: ${updateResponse.statusText}`);
      }
      
      return await updateResponse.json();

    case "clickup_get_lists":
      const { space_id } = args;
      
      const listsResponse = await fetch(`${baseUrl}/space/${space_id}/list`, {
        headers: { 'Authorization': clickupToken },
      });
      
      if (!listsResponse.ok) {
        throw new Error(`ClickUp API error: ${listsResponse.statusText}`);
      }
      
      return await listsResponse.json();

    default:
      throw new Error(`Unknown ClickUp tool: ${toolName}`);
  }
}

// Telegram Bot API integration
async function handleTelegramTool(toolName: string, args: any) {
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!telegramToken) {
    throw new Error('Telegram bot token not configured');
  }

  const baseUrl = `https://api.telegram.org/bot${telegramToken}`;
  
  switch (toolName) {
    case "telegram_send_message":
      const { chat_id, text, parse_mode = 'HTML' } = args;
      
      const messageResponse = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          text,
          parse_mode,
        }),
      });
      
      if (!messageResponse.ok) {
        throw new Error(`Telegram API error: ${messageResponse.statusText}`);
      }
      
      return await messageResponse.json();

    case "telegram_get_updates":
      const { offset, limit = 100 } = args;
      
      let updatesUrl = `${baseUrl}/getUpdates?limit=${limit}`;
      if (offset) {
        updatesUrl += `&offset=${offset}`;
      }
      
      const updatesResponse = await fetch(updatesUrl);
      
      if (!updatesResponse.ok) {
        throw new Error(`Telegram API error: ${updatesResponse.statusText}`);
      }
      
      return await updatesResponse.json();

    case "telegram_send_photo":
      const { chat_id: photoChat, photo, caption } = args;
      
      const photoResponse = await fetch(`${baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: photoChat,
          photo,
          caption,
        }),
      });
      
      if (!photoResponse.ok) {
        throw new Error(`Telegram API error: ${photoResponse.statusText}`);
      }
      
      return await photoResponse.json();

    default:
      throw new Error(`Unknown Telegram tool: ${toolName}`);
  }
}

// Picaos API integration
async function handlePicaosTool(toolName: string, args: any) {
  const picaosApiKey = Deno.env.get('PICAOS_API_KEY');
  if (!picaosApiKey) {
    throw new Error('Picaos API key not configured');
  }

  const baseUrl = 'https://api.picaos.com/v1';
  
  switch (toolName) {
    case "picaos_list_tools":
      const { category, search } = args;
      
      let toolsUrl = `${baseUrl}/tools`;
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (params.toString()) toolsUrl += `?${params.toString()}`;
      
      const toolsResponse = await fetch(toolsUrl, {
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!toolsResponse.ok) {
        throw new Error(`Picaos API error: ${toolsResponse.statusText}`);
      }
      
      return await toolsResponse.json();

    case "picaos_get_tool_schema":
      const { tool_name } = args;
      
      const schemaResponse = await fetch(`${baseUrl}/tools/${tool_name}/schema`, {
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!schemaResponse.ok) {
        throw new Error(`Picaos API error: ${schemaResponse.statusText}`);
      }
      
      return await schemaResponse.json();

    case "picaos_execute_tool":
      const { tool_name: execToolName, parameters, workflow_id } = args;
      
      const execResponse = await fetch(`${baseUrl}/tools/${execToolName}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: parameters || {},
          workflow_id: workflow_id || null,
        }),
      });
      
      if (!execResponse.ok) {
        throw new Error(`Picaos API error: ${execResponse.statusText}`);
      }
      
      return await execResponse.json();

    case "picaos_search_tools":
      const { query, limit = 20 } = args;
      
      const searchResponse = await fetch(`${baseUrl}/tools/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
        }),
      });
      
      if (!searchResponse.ok) {
        throw new Error(`Picaos API error: ${searchResponse.statusText}`);
      }
      
      return await searchResponse.json();

    case "picaos_create_workflow":
      const { workflow_name, steps, description } = args;
      
      const workflowResponse = await fetch(`${baseUrl}/workflows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflow_name,
          description,
          steps,
        }),
      });
      
      if (!workflowResponse.ok) {
        throw new Error(`Picaos API error: ${workflowResponse.statusText}`);
      }
      
      return await workflowResponse.json();

    case "picaos_execute_workflow":
      const { workflow_id: execWorkflowId, input_data } = args;
      
      const workflowExecResponse = await fetch(`${baseUrl}/workflows/${execWorkflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_data: input_data || {},
        }),
      });
      
      if (!workflowExecResponse.ok) {
        throw new Error(`Picaos API error: ${workflowExecResponse.statusText}`);
      }
      
      return await workflowExecResponse.json();

    case "picaos_get_execution_status":
      const { execution_id } = args;
      
      const statusResponse = await fetch(`${baseUrl}/executions/${execution_id}/status`, {
        headers: {
          'Authorization': `Bearer ${picaosApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Picaos API error: ${statusResponse.statusText}`);
      }
      
      return await statusResponse.json();

    default:
      throw new Error(`Unknown Picaos tool: ${toolName}`);
  }
}

// Enhanced database operations
async function handleDatabaseTool(toolName: string, args: any) {
  switch (toolName) {
    case "database_search_memories":
      const { query, limit = 5, threshold = 0.7 } = args;
      
      // Generate embedding for the search query
      const embeddingResponse = await supabase.functions.invoke('generate-embedding', {
        body: { text: query }
      });
      
      if (embeddingResponse.error) {
        throw new Error(`Embedding generation failed: ${embeddingResponse.error.message}`);
      }
      
      // Search memories using the embedding
      const { data: memories, error: searchError } = await supabase.rpc('search_memories', {
        query_embedding: embeddingResponse.data.embedding,
        match_threshold: threshold,
        match_count: limit
      });
      
      if (searchError) {
        throw new Error(`Memory search failed: ${searchError.message}`);
      }
      
      return { memories, count: memories?.length || 0 };

    case "database_create_memory":
      const { title, content, memory_type = 'knowledge', project_ref = 'ai-chat' } = args;
      
      // Generate embedding for the content
      const contentEmbedding = await supabase.functions.invoke('generate-embedding', {
        body: { text: `${title}\n${content}` }
      });
      
      if (contentEmbedding.error) {
        throw new Error(`Embedding generation failed: ${contentEmbedding.error.message}`);
      }
      
      // Create the memory entry
      const { data: memory, error: createError } = await supabase
        .from('memory_entries')
        .insert({
          title,
          content,
          memory_type,
          project_ref,
          embedding: contentEmbedding.data.embedding,
          relevance_score: 1.0,
          status: 'active'
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Memory creation failed: ${createError.message}`);
      }
      
      return memory;

    case "database_update_memory":
      const { memory_id, updates } = args;
      
      const { data: updatedMemory, error: updateError } = await supabase
        .from('memory_entries')
        .update(updates)
        .eq('id', memory_id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Memory update failed: ${updateError.message}`);
      }
      
      return updatedMemory;

    case "database_get_memory_stats":
      const { data: stats, error: statsError } = await supabase
        .rpc('get_memory_stats', { user_id_param: args.user_id });
      
      if (statsError) {
        throw new Error(`Stats retrieval failed: ${statsError.message}`);
      }
      
      return stats;

    default:
      throw new Error(`Unknown database tool: ${toolName}`);
  }
}

// Main tool handler function
async function handleToolRequest(toolName: string, args: any) {
  console.log(`Handling MCP tool request: ${toolName}`);
  console.log(`With args:`, JSON.stringify(args));
  
  // ClickUp tools
  if (toolName.startsWith('clickup_')) {
    return await handleClickUpTool(toolName, args);
  }
  
  // Telegram tools
  if (toolName.startsWith('telegram_')) {
    return await handleTelegramTool(toolName, args);
  }
  
  // Picaos tools
  if (toolName.startsWith('picaos_')) {
    return await handlePicaosTool(toolName, args);
  }
  
  // Database tools
  if (toolName.startsWith('database_')) {
    return await handleDatabaseTool(toolName, args);
  }
  
  // Original tools (keeping existing functionality)
  switch (toolName) {
    case "execute_sql":
      if (!args.query) {
        throw new Error("No SQL query provided");
      }
      
      const { data, error } = await supabase.rpc('execute_safe_query', {
        query_text: args.query,
        query_params: args.params || [],
      });
      
      if (error) throw error;
      return { data, error: null };
      
    case "get_table_schema":
      const { tableName, schemaName = 'public' } = args;
      if (!tableName) {
        throw new Error("No table name provided");
      }
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', schemaName)
        .eq('table_name', tableName);
        
      if (columnsError) throw columnsError;
      
      return { schema: columns };
      
    case "list_tables":
      const { schema = 'public' } = args;
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schema)
        .eq('table_type', 'BASE TABLE');
        
      if (tablesError) throw tablesError;
      
      return { tables: tables.map(t => t.table_name) };
      
    case "get_row_count":
      // Get row count for a table
      const { table } = args;
      if (!table) {
        throw new Error("No table specified");
      }
      
      const countQuery = `SELECT COUNT(*) FROM ${table}`;
      const countResult = await executeSql(countQuery);
      
      return { count: countResult.data?.[0]?.count || 0 };
      
    case "subscribe_to_changes":
      // Return subscription info that the client can use
      const subTable = args.table;
      const subSchema = args.schema || 'public';
      const event = args.event;
      
      if (!subTable) {
        throw new Error("No table specified for subscription");
      }
      
      return { 
        subscription: {
          id: `${subSchema}-${subTable}-${event || '*'}-${Date.now()}`,
          channel: 'table-changes',
          schema: subSchema,
          table: subTable,
          event: event || '*'
        }
      };
      
    case "get_secrets":
      // Get secrets for the client (only safe ones)
      const { keys } = args;
      if (!keys || !Array.isArray(keys)) {
        throw new Error("No keys specified or invalid format");
      }
      
      return await getSecrets(keys);
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { input, tool_name, tool_args } = requestBody;
    
    console.log("Enhanced MCP Handler received request:", JSON.stringify(requestBody, null, 2));
    
    let result;
    
    if (tool_name) {
      result = await handleToolRequest(tool_name, tool_args || {});
    } else if (input) {
      result = {
        output: `Enhanced MCP Server ready. Available tool categories: ClickUp, Telegram, Picaos, Database, SQL`,
        available_tools: [
          // ClickUp tools
          "clickup_create_task",
          "clickup_get_tasks", 
          "clickup_update_task",
          "clickup_get_lists",
          // Telegram tools
          "telegram_send_message",
          "telegram_get_updates",
          "telegram_send_photo",
          // Picaos tools
          "picaos_list_tools",
          "picaos_get_tool_schema",
          "picaos_execute_tool",
          "picaos_search_tools",
          "picaos_create_workflow",
          "picaos_execute_workflow",
          "picaos_get_execution_status",
          // Database tools
          "database_search_memories",
          "database_create_memory",
          "database_update_memory",
          "database_get_memory_stats",
          // Original SQL tools
          "execute_sql",
          "get_table_schema",
          "list_tables",
          "get_row_count",
          "subscribe_to_changes",
          "get_secrets"
        ]
      };
    } else {
      throw new Error("Invalid MCP request format. Expected 'input' or 'tool_name'.");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Enhanced MCP handler error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      error_type: "tool_execution_error" 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

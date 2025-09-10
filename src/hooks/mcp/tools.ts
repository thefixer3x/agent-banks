
import { MCPToolArgs } from './types';
import { callMCPHandler, formatToolResult, formatErrorResult, showToast } from './utils';

// Call an MCP tool with arguments
export const callTool = async (
  toolName: string, 
  toolArgs: MCPToolArgs = {},
  onResult: (result: any) => void,
  updateSystemStats: () => void
) => {
  try {
    console.log(`Calling tool: ${toolName} with args:`, toolArgs);
    
    // Call the MCP Edge Function with the tool request
    const data = await callMCPHandler({
      tool_name: toolName,
      tool_args: toolArgs
    });
    
    // Add the tool result to the list
    const toolResult = formatToolResult(toolName, toolArgs, data);
    onResult(toolResult);
    
    // Update system stats
    updateSystemStats();
    
    return data;
  } catch (error) {
    console.error(`Error calling tool ${toolName}:`, error);
    
    // Add the error to the query results
    const errorResult = formatErrorResult(toolName, toolArgs, error);
    onResult(errorResult);
    
    showToast(
      "Tool Error",
      error.message || `Failed to execute tool: ${toolName}`,
      "destructive"
    );
    
    throw error;
  }
};

// Predefined tool wrappers
export const executeQuery = async (
  query: string,
  onResult: (result: any) => void,
  updateSystemStats: () => void
) => {
  return callTool("execute_sql", { query }, onResult, updateSystemStats);
};

export const getTableSchema = async (
  tableName: string,
  onResult: (result: any) => void,
  updateSystemStats: () => void,
  schemaName: string = 'public'
) => {
  return callTool("get_table_schema", { tableName, schemaName }, onResult, updateSystemStats);
};

export const listTables = async (
  onResult: (result: any) => void,
  updateSystemStats: () => void,
  schema: string = 'public'
) => {
  return callTool("list_tables", { schema }, onResult, updateSystemStats);
};

export const getRowCount = async (
  table: string,
  onResult: (result: any) => void,
  updateSystemStats: () => void
) => {
  return callTool("get_row_count", { table }, onResult, updateSystemStats);
};

export const subscribeToChanges = async (
  table: string,
  onResult: (result: any) => void,
  updateSystemStats: () => void,
  schema: string = 'public',
  event?: string
) => {
  return callTool("subscribe_to_changes", { table, schema, event }, onResult, updateSystemStats);
};

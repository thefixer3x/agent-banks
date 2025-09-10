
import { useState, useEffect } from 'react';
import { getAPIKeys } from '@/services/environment';
import { QueryResult, MCPToolArgs } from './types';
import { useServerState } from './serverState';
import { useToolSettings } from './useToolSettings';
import { 
  initializeMCP, 
  setupRealtimeSubscription, 
  formatConnectionEvent, 
  formatRealtimeUpdate,
  showToast 
} from './utils';
import { callTool, executeQuery, getTableSchema, listTables, getRowCount, subscribeToChanges } from './tools';

export function useMCPServer() {
  const { 
    state, 
    isConnecting, 
    setIsConnecting, 
    updateServerStatus, 
    updateSystemStats,
    startUptimeCounter,
    restartServer,
    cleanupUptimeCounter
  } = useServerState();
  
  const {
    settings: toolSettings,
    toggleConnection,
    toggleTool,
    resetSettings,
    isToolEnabled,
    getEnabledTools
  } = useToolSettings();
  
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState<QueryResult[]>([]);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [projectRef, setProjectRef] = useState<string>('nbmomsntbamfthxfdnme');

  // Get enabled tools based on settings
  const enabledTools = getEnabledTools(availableTools);

  // Function to add a result to the query results
  const addQueryResult = (result: QueryResult) => {
    setQueryResults(prev => [result, ...prev]);
  };

  // Function to add a realtime update
  const handleRealtimeUpdate = (payload: any) => {
    const newUpdate = formatRealtimeUpdate(payload);
    setRealtimeUpdates(prev => [newUpdate, ...prev]);
    updateSystemStats();
  };

  // Load project ref on initialization
  useEffect(() => {
    const loadProjectRef = async () => {
      try {
        const apiKeys = await getAPIKeys();
        setProjectRef(apiKeys.projectRef);
      } catch (error) {
        console.error("Error loading project reference:", error);
      }
    };
    
    loadProjectRef();
  }, []);

  // Connect to the MCP server automatically on initialization
  useEffect(() => {
    if (toolSettings.connectionEnabled) {
      connectServer();
    } else {
      updateServerStatus('offline');
    }
    
    return () => {
      cleanupUptimeCounter();
    };
  }, [toolSettings.connectionEnabled]);

  // Connect to the MCP server
  const connectServer = async () => {
    if (!toolSettings.connectionEnabled) {
      showToast(
        "Connection Disabled",
        "MCP connection is disabled in settings",
        "destructive"
      );
      return false;
    }

    setIsConnecting(true);
    updateServerStatus('connecting');
    
    try {
      // Get API keys
      const apiKeys = await getAPIKeys();
      
      // Initialize MCP with a hello request to get available tools
      const { availableTools: tools, success } = await initializeMCP();
      
      if (!success) throw new Error("Failed to initialize MCP");
      
      setAvailableTools(tools);
      
      // Add a connection event to query results
      const connectionEvent = formatConnectionEvent(apiKeys.projectRef, tools);
      setQueryResults([connectionEvent]);
      
      // Setup realtime subscription for the tables
      const channel = setupRealtimeSubscription(handleRealtimeUpdate);
      
      // Set server as online and start uptime counter
      setState({
        status: 'online',
        uptime: 0,
        memory: 30,
        cpu: 15,
      });
      
      startUptimeCounter();
      
      showToast(
        "Connected",
        "Successfully connected to Supabase MCP Server"
      );
      
      return true;
    } catch (error) {
      console.error("Error connecting to MCP server:", error);
      
      showToast(
        "Connection Failed",
        "Failed to connect to the MCP server",
        "destructive"
      );
      
      updateServerStatus('offline');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Call an MCP tool with arguments - wrapper that passes our callbacks
  const callToolWrapper = async (toolName: string, toolArgs: MCPToolArgs = {}) => {
    if (!toolSettings.connectionEnabled) {
      return Promise.reject('MCP connection is disabled');
    }
    
    if (state.status !== 'online') {
      return Promise.reject('Server offline');
    }
    
    if (!isToolEnabled(toolName)) {
      return Promise.reject(`Tool "${toolName}" is disabled`);
    }
    
    if (!availableTools.includes(toolName)) {
      return Promise.reject(`Tool "${toolName}" is not available`);
    }
    
    return callTool(toolName, toolArgs, addQueryResult, updateSystemStats);
  };

  // Execute a SQL query via the MCP server (using the execute_sql tool)
  const executeQueryWrapper = async (query: string) => {
    if (!isToolEnabled('execute_sql')) {
      return Promise.reject('SQL execution is disabled');
    }
    return executeQuery(query, addQueryResult, updateSystemStats);
  };

  // Get schema for a table
  const getTableSchemaWrapper = async (tableName: string, schemaName: string = 'public') => {
    if (!isToolEnabled('get_table_schema')) {
      return Promise.reject('Table schema tool is disabled');
    }
    return getTableSchema(tableName, addQueryResult, updateSystemStats, schemaName);
  };

  // List available tables
  const listTablesWrapper = async (schema: string = 'public') => {
    if (!isToolEnabled('list_tables')) {
      return Promise.reject('List tables tool is disabled');
    }
    return listTables(addQueryResult, updateSystemStats, schema);
  };

  // Get row count for a table
  const getRowCountWrapper = async (table: string) => {
    if (!isToolEnabled('get_row_count')) {
      return Promise.reject('Row count tool is disabled');
    }
    return getRowCount(table, addQueryResult, updateSystemStats);
  };

  // Subscribe to table changes
  const subscribeToChangesWrapper = async (table: string, schema: string = 'public', event?: string) => {
    if (!isToolEnabled('subscribe_to_changes')) {
      return Promise.reject('Subscribe to changes tool is disabled');
    }
    return subscribeToChanges(table, addQueryResult, updateSystemStats, schema, event);
  };

  // Helper function to get the current state (for use in components where state might have changed)
  const setState = (newState: typeof state) => {
    updateServerStatus(newState.status);
    if (newState.memory !== undefined) {
      state.memory = newState.memory;
    }
    if (newState.cpu !== undefined) {
      state.cpu = newState.cpu;
    }
    if (newState.uptime !== undefined) {
      state.uptime = newState.uptime;
    }
  };

  return {
    state,
    isConnecting,
    queryResults,
    realtimeUpdates,
    availableTools,
    enabledTools,
    toolSettings,
    connectServer,
    restartServer,
    executeQuery: executeQueryWrapper,
    callTool: callToolWrapper,
    getTableSchema: getTableSchemaWrapper,
    listTables: listTablesWrapper,
    getRowCount: getRowCountWrapper,
    subscribeToChanges: subscribeToChangesWrapper,
    // Tool settings management
    toggleConnection,
    toggleTool,
    resetToolSettings: resetSettings,
    isToolEnabled
  };
}

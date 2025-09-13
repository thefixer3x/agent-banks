
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

// Helper function for calling the MCP handler
export const callMCPHandler = async (body: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('mcp-handler', { body });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("MCP handler error:", error);
    throw error;
  }
};

// Initialize MCP connection and get available tools
export const initializeMCP = async () => {
  try {
    const data = await callMCPHandler({ input: "hello" });
    return {
      availableTools: data.available_tools || [],
      success: true
    };
  } catch (error) {
    console.error("Error initializing MCP:", error);
    return {
      availableTools: [],
      success: false
    };
  }
};

// Set up Supabase realtime subscription
export const setupRealtimeSubscription = (onUpdate: (payload: any) => void) => {
  const channel = supabase
    .channel('mcp-realtime-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public' },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();
  
  return channel;
};

// Format error for display in query results
export const formatErrorResult = (toolName: string, toolArgs: any, error: Error) => {
  return {
    id: Date.now().toString(),
    type: 'error',
    content: JSON.stringify({
      tool: toolName,
      args: toolArgs,
      error: error.message || "Tool execution failed",
      timestamp: new Date().toISOString()
    }, null, 2),
    timestamp: new Date().toISOString()
  };
};

// Format tool result for display in query results
export const formatToolResult = (toolName: string, toolArgs: any, data: any) => {
  return {
    id: Date.now().toString(),
    type: 'tool',
    content: JSON.stringify({
      tool: toolName,
      args: toolArgs,
      result: data,
      timestamp: new Date().toISOString()
    }, null, 2),
    timestamp: new Date().toISOString()
  };
};

// Format connection event for display in query results
export const formatConnectionEvent = (projectRef: string, availableTools: string[]) => {
  return {
    id: Date.now().toString(),
    type: 'connection',
    content: JSON.stringify({
      status: 'connected',
      project: projectRef,
      available_tools: availableTools,
      timestamp: new Date().toISOString()
    }, null, 2),
    timestamp: new Date().toISOString()
  };
};

// Format realtime update for display
export const formatRealtimeUpdate = (payload: any) => {
  return {
    id: Date.now().toString(),
    type: 'realtime',
    content: JSON.stringify(payload, null, 2),
    timestamp: new Date().toISOString()
  };
};

// Show toast notification
export const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
  toast({ title, description, variant });
};


import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MCPHeader from '@/components/MCPHeader';
import { useMCPServer } from '@/hooks/useMCPServer';
import MCPDashboard from '@/components/mcp/MCPDashboard';
import MCPQueryInterface from '@/components/mcp/MCPQueryInterface';
import MCPDataExplorer from '@/components/mcp/MCPDataExplorer';
import MCPCommandPalette from '@/components/mcp/MCPCommandPalette';
import MCPToolSettings from '@/components/mcp/MCPToolSettings';

const MCPPage = () => {
  const { 
    state: serverState, 
    queryResults, 
    realtimeUpdates, 
    availableTools,
    enabledTools,
    toolSettings,
    restartServer,
    executeQuery,
    callTool,
    getTableSchema,
    listTables,
    getRowCount,
    toggleConnection,
    toggleTool,
    resetToolSettings
  } = useMCPServer();
  
  const handleRefreshQuery = async () => {
    try {
      await listTables();
    } catch (error) {
      console.error("Error refreshing queries:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <MCPHeader connected={serverState.status === 'online'} serverStatus={serverState.status} />
      
      <div className="flex-1 container py-6">
        <div className="text-center space-y-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/sd-logo.svg" 
              alt="Ghost Protocol Avatar"
              className="h-12 w-12 rounded-full object-cover opacity-90 shadow-2xl border-2 border-orange-500/50"
            />
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Supabase MCP Interface
            </h1>
          </div>
          <p className="text-gray-300">
            Model Context Protocol integration for seamless database interaction and real-time data visualization
          </p>
        </div>

        <div className="flex gap-6">
          {/* Command Palette Sidebar */}
          <div className="w-80 flex-shrink-0">
            <MCPCommandPalette
              availableTools={enabledTools}
              onExecuteQuery={executeQuery}
              onCallTool={callTool}
              onGetSchema={getTableSchema}
              onListTables={listTables}
              onGetRowCount={getRowCount}
              isConnected={serverState.status === 'online'}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                <TabsTrigger value="dashboard" className="text-white">Dashboard</TabsTrigger>
                <TabsTrigger value="query" className="text-white">SQL Interface</TabsTrigger>
                <TabsTrigger value="explorer" className="text-white">Data Explorer</TabsTrigger>
                <TabsTrigger value="settings" className="text-white">Tool Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-6">
                <MCPDashboard
                  serverState={serverState}
                  queryResults={queryResults}
                  realtimeUpdates={realtimeUpdates}
                  onRestart={restartServer}
                  onRefreshQuery={handleRefreshQuery}
                />
              </TabsContent>

              <TabsContent value="query" className="mt-6">
                <MCPQueryInterface
                  onExecuteQuery={executeQuery}
                  queryResults={queryResults}
                  isConnected={serverState.status === 'online'}
                />
              </TabsContent>

              <TabsContent value="explorer" className="mt-6">
                <MCPDataExplorer
                  onGetSchema={getTableSchema}
                  onListTables={listTables}
                  onGetRowCount={getRowCount}
                  onExecuteQuery={executeQuery}
                  isConnected={serverState.status === 'online'}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <MCPToolSettings
                  availableTools={availableTools}
                  disabledTools={toolSettings.disabledTools}
                  connectionEnabled={toolSettings.connectionEnabled}
                  onToggleTool={toggleTool}
                  onToggleConnection={toggleConnection}
                  onResetSettings={resetToolSettings}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPPage;

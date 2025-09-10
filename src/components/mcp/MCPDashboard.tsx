
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import StatusPanel from '@/components/StatusPanel';
import DataDisplay from '@/components/DataDisplay';
import { MCPServerState, QueryResult } from '@/hooks/mcp/types';
import MCPCodeExamples from './MCPCodeExamples';

interface MCPDashboardProps {
  serverState: MCPServerState;
  queryResults: QueryResult[];
  realtimeUpdates: QueryResult[];
  onRestart: () => Promise<boolean>;
  onRefreshQuery: () => Promise<void>;
}

const MCPDashboard: React.FC<MCPDashboardProps> = ({
  serverState,
  queryResults,
  realtimeUpdates,
  onRestart,
  onRefreshQuery
}) => {
  // Format uptime for display
  const formattedUptime = () => {
    const h = Math.floor(serverState.uptime / 3600);
    const m = Math.floor((serverState.uptime % 3600) / 60);
    const s = serverState.uptime % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <StatusPanel 
            status={serverState.status}
            uptime={formattedUptime()}
            memory={serverState.memory}
            cpu={serverState.cpu}
            onRestart={onRestart}
          />
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <MCPCodeExamples />
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataDisplay 
          title="Database Queries" 
          data={queryResults}
          isLoading={serverState.status === 'connecting'}
          onRefresh={onRefreshQuery}
        />
        
        <DataDisplay 
          title="Realtime Updates" 
          data={realtimeUpdates}
          isLoading={false}
        />
      </div>
    </div>
  );
};

export default MCPDashboard;


import React from 'react';
import { Cpu, Database, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCPHeaderProps {
  connected: boolean;
  serverStatus: 'online' | 'offline' | 'connecting';
}

const MCPHeader: React.FC<MCPHeaderProps> = ({ connected, serverStatus }) => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <Cpu className="h-6 w-6 text-tech-cyan" />
        <h1 className="text-xl font-bold">
          Supabase <span className="text-tech-cyan">MCP</span> Server
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Supabase</span>
          <div 
            className={cn(
              "h-2 w-2 rounded-full", 
              connected ? "bg-tech-green animate-pulse-subtle" : "bg-destructive"
            )}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Server</span>
          <div 
            className={cn(
              "h-2 w-2 rounded-full", 
              {
                "bg-tech-green animate-pulse-subtle": serverStatus === 'online',
                "bg-yellow-500 animate-pulse-subtle": serverStatus === 'connecting',
                "bg-destructive": serverStatus === 'offline'
              }
            )}
          />
        </div>
      </div>
    </header>
  );
};

export default MCPHeader;

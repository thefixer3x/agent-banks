
export interface MCPServerState {
  status: 'online' | 'offline' | 'connecting';
  uptime: number; // in seconds
  memory: number; // percentage
  cpu: number; // percentage
}

export interface QueryResult {
  id: string;
  type: string;
  content: string;
  timestamp: string;
}

export interface MCPToolArgs {
  [key: string]: any;
}

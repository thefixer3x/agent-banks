
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StatusPanelProps {
  status: 'online' | 'offline' | 'connecting';
  uptime?: string;
  memory?: number;
  cpu?: number;
  onRestart?: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  status,
  uptime = '--:--:--',
  memory = 0,
  cpu = 0,
  onRestart
}) => {
  const statusIcon = {
    online: <CheckCircle className="h-5 w-5 text-tech-green" />,
    connecting: <RefreshCcw className="h-5 w-5 text-yellow-500 animate-spin" />,
    offline: <AlertTriangle className="h-5 w-5 text-destructive" />
  };

  const statusText = {
    online: 'MCP Server is running',
    connecting: 'Connecting to MCP Server...',
    offline: 'MCP Server is offline'
  };

  return (
    <Card className={cn(
      "border bg-card",
      status === 'online' && "border-tech-green/30",
      status === 'connecting' && "border-yellow-500/30",
      status === 'offline' && "border-destructive/30"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {statusIcon[status]}
            <span>{statusText[status]}</span>
          </CardTitle>
          {status === 'online' && (
            <div className="bg-tech-green/20 text-tech-green rounded-full px-2 py-1 text-xs font-medium">
              Active
            </div>
          )}
        </div>
        <CardDescription>
          {status === 'online' 
            ? `Uptime: ${uptime}`
            : status === 'connecting'
              ? 'Establishing connection...'
              : 'Server needs to be restarted'
          }
        </CardDescription>
      </CardHeader>
      {status === 'online' && (
        <CardContent className="pb-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Memory Usage</span>
                <span className="font-medium">{memory}%</span>
              </div>
              <Progress value={memory} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>CPU Usage</span>
                <span className="font-medium">{cpu}%</span>
              </div>
              <Progress value={cpu} className="h-1" />
            </div>
          </div>
        </CardContent>
      )}
      <CardFooter className={status === 'online' ? 'pt-2' : 'pt-0'}>
        <Button 
          onClick={onRestart}
          variant={status === 'offline' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "w-full",
            status === 'offline' && "bg-tech-purple hover:bg-tech-purple/90"
          )}
          disabled={status === 'connecting'}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          {status === 'offline' ? 'Start Server' : 'Restart Server'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StatusPanel;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { ServiceCommand } from '@/hooks/useServiceAwareChat';
import { ServiceAction } from '@/hooks/useServiceIntegration';

interface ServiceActionsPanelProps {
  commands: ServiceCommand[];
  actions: ServiceAction[];
  isProcessing: boolean;
  onClearCommands: () => void;
  onClearActions: () => void;
}

export function ServiceActionsPanel({
  commands,
  actions,
  isProcessing,
  onClearCommands,
  onClearActions
}: ServiceActionsPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'executing':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getServiceBadgeColor = (service: string) => {
    switch (service) {
      case 'clickup':
        return 'bg-purple-100 text-purple-800';
      case 'telegram':
        return 'bg-blue-100 text-blue-800';
      case 'database':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (commands.length === 0 && actions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Service Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No service actions detected. Try commands like:
            <br />
            • "Create task 'Review docs' in list ABC123"
            • "Send message 'Hello' to chat @mychat"
            • "Search memories for 'project updates'"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Service Actions
            {isProcessing && (
              <Badge variant="secondary" className="text-xs">
                Processing...
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {commands.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCommands}
                className="h-6 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-3">
            {/* Recent Commands */}
            {commands.slice(0, 5).map((command) => (
              <div
                key={command.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(command.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getServiceBadgeColor(command.service)}`}
                    >
                      {command.service}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {command.action}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-foreground mb-1">
                    {command.command}
                  </p>
                  
                  {command.status === 'failed' && command.error && (
                    <p className="text-xs text-red-600 bg-red-50 p-1 rounded">
                      {command.error}
                    </p>
                  )}
                  
                  {command.status === 'completed' && command.result && (
                    <p className="text-xs text-green-600 bg-green-50 p-1 rounded">
                      Action completed successfully
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Recent Service Actions */}
            {actions.slice(0, 3).map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {action.error ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getServiceBadgeColor(action.service)}`}
                    >
                      {action.service}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium">
                    {action.action}
                  </p>
                  
                  {action.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {action.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {(commands.length > 5 || actions.length > 3) && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Showing recent actions only
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

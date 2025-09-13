
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  MessageSquare, 
  Zap, 
  Brain,
  RotateCcw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MCPToolSettingsProps {
  availableTools: string[];
  disabledTools: string[];
  connectionEnabled: boolean;
  onToggleTool: (toolName: string, enabled: boolean) => void;
  onToggleConnection: (enabled: boolean) => void;
  onResetSettings: () => void;
}

const MCPToolSettings: React.FC<MCPToolSettingsProps> = ({
  availableTools,
  disabledTools,
  connectionEnabled,
  onToggleTool,
  onToggleConnection,
  onResetSettings
}) => {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    connectionEnabled,
    disabledTools: new Set(disabledTools)
  });

  useEffect(() => {
    setLocalSettings({
      connectionEnabled,
      disabledTools: new Set(disabledTools)
    });
  }, [connectionEnabled, disabledTools]);

  const getToolIcon = (toolName: string) => {
    if (toolName.includes('database') || toolName.includes('sql')) return Database;
    if (toolName.includes('clickup')) return CheckCircle;
    if (toolName.includes('telegram')) return MessageSquare;
    if (toolName.includes('picaos')) return Zap;
    return Brain;
  };

  const getToolCategory = (toolName: string) => {
    if (toolName.includes('database') || toolName.includes('sql')) return 'Database';
    if (toolName.includes('clickup')) return 'ClickUp';
    if (toolName.includes('telegram')) return 'Telegram';
    if (toolName.includes('picaos')) return 'Picaos';
    return 'System';
  };

  const categorizedTools = availableTools.reduce((acc, tool) => {
    const category = getToolCategory(tool);
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, string[]>);

  const handleToolToggle = (toolName: string, enabled: boolean) => {
    onToggleTool(toolName, enabled);
    
    toast({
      title: enabled ? "Tool Enabled" : "Tool Disabled",
      description: `${toolName} has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const handleConnectionToggle = (enabled: boolean) => {
    onToggleConnection(enabled);
    
    toast({
      title: enabled ? "MCP Connection Enabled" : "MCP Connection Disabled",
      description: `MCP server connection has been ${enabled ? 'enabled' : 'disabled'}`,
      variant: enabled ? "default" : "destructive"
    });
  };

  const handleResetSettings = () => {
    onResetSettings();
    
    toast({
      title: "Settings Reset",
      description: "All MCP tool settings have been reset to defaults",
    });
  };

  const enabledToolsCount = availableTools.length - disabledTools.length;

  return (
    <Card className="border-orange-500/20 bg-gray-900/80">
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          MCP Tool Settings
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant={connectionEnabled ? "default" : "destructive"} className="text-xs">
              {connectionEnabled ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {enabledToolsCount}/{availableTools.length} Tools Active
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSettings}
            className="border-gray-600 hover:border-gray-500"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Connection Toggle */}
        <div className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-orange-400" />
            <div>
              <div className="font-medium text-white">MCP Server Connection</div>
              <div className="text-xs text-gray-400">Enable/disable entire MCP integration</div>
            </div>
          </div>
          <Switch
            checked={connectionEnabled}
            onCheckedChange={handleConnectionToggle}
          />
        </div>

        <Separator />

        {/* Tool Categories */}
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {Object.entries(categorizedTools).map(([category, tools]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  {category}
                </h4>
                
                {tools.map((tool) => {
                  const Icon = getToolIcon(tool);
                  const isEnabled = !disabledTools.includes(tool);
                  
                  return (
                    <div
                      key={tool}
                      className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isEnabled ? 'text-green-400' : 'text-gray-500'}`} />
                        <div>
                          <div className={`font-medium ${isEnabled ? 'text-white' : 'text-gray-500'}`}>
                            {tool}
                          </div>
                          <div className="text-xs text-gray-400">
                            {category} integration tool
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isEnabled ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <Switch
                          checked={isEnabled && connectionEnabled}
                          disabled={!connectionEnabled}
                          onCheckedChange={(enabled) => handleToolToggle(tool, enabled)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>

        {!connectionEnabled && (
          <div className="text-center text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
            Enable MCP connection to configure individual tools
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCPToolSettings;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Table, 
  FileText, 
  Users, 
  Brain, 
  Search,
  BarChart3,
  Zap,
  Play
} from 'lucide-react';

interface MCPCommandPaletteProps {
  availableTools: string[];
  onExecuteQuery: (query: string) => Promise<any>;
  onCallTool: (toolName: string, args: any) => Promise<any>;
  onGetSchema: (tableName: string) => Promise<any>;
  onListTables: () => Promise<any>;
  onGetRowCount: (table: string) => Promise<any>;
  isConnected: boolean;
}

const MCPCommandPalette: React.FC<MCPCommandPaletteProps> = ({
  availableTools,
  onExecuteQuery,
  onCallTool,
  onGetSchema,
  onListTables,
  onGetRowCount,
  isConnected
}) => {
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCommand = async (command: () => Promise<any>, description: string) => {
    if (!isConnected) return;
    
    setIsExecuting(true);
    try {
      await command();
      console.log(`Executed: ${description}`);
    } catch (error) {
      console.error(`Error executing ${description}:`, error);
    } finally {
      setIsExecuting(false);
    }
  };

  const quickQueries = [
    {
      name: "List All Tables",
      description: "Show all database tables",
      icon: Table,
      action: () => onListTables(),
      category: "Schema"
    },
    {
      name: "Memory Entries Count",
      description: "Count all memory entries",
      icon: Brain,
      action: () => onExecuteQuery("SELECT COUNT(*) FROM memory_entries"),
      category: "Memory"
    },
    {
      name: "Active Users",
      description: "Show all registered users",
      icon: Users,
      action: () => onExecuteQuery("SELECT id, email, created_at FROM users LIMIT 10"),
      category: "Users"
    },
    {
      name: "Recent Conversations",
      description: "Show latest conversations",
      icon: FileText,
      action: () => onExecuteQuery("SELECT title, created_at FROM conversations ORDER BY created_at DESC LIMIT 5"),
      category: "Chat"
    },
    {
      name: "Memory Topics",
      description: "List all memory topics",
      icon: Search,
      action: () => onExecuteQuery("SELECT name, description, color FROM memory_topics"),
      category: "Memory"
    },
    {
      name: "Database Stats",
      description: "Get database overview",
      icon: BarChart3,
      action: () => onExecuteQuery(`
        SELECT 
          'memory_entries' as table_name, COUNT(*) as count FROM memory_entries
        UNION ALL
        SELECT 
          'users' as table_name, COUNT(*) as count FROM users
        UNION ALL
        SELECT 
          'conversations' as table_name, COUNT(*) as count FROM conversations
      `),
      category: "Analytics"
    }
  ];

  const schemaQueries = [
    {
      name: "Memory Entries Schema",
      description: "View memory_entries table structure",
      action: () => onGetSchema("memory_entries"),
      table: "memory_entries"
    },
    {
      name: "Users Schema",
      description: "View users table structure", 
      action: () => onGetSchema("users"),
      table: "users"
    },
    {
      name: "Conversations Schema",
      description: "View conversations table structure",
      action: () => onGetSchema("conversations"),
      table: "conversations"
    }
  ];

  const categories = [...new Set(quickQueries.map(q => q.category))];

  return (
    <Card className="h-fit border-orange-500/20 bg-gray-900/80">
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Command Palette
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Offline"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {availableTools.length} Tools
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="h-96">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Quick Actions</h3>
            
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs text-gray-400 uppercase tracking-wide">{category}</h4>
                {quickQueries
                  .filter(query => query.category === category)
                  .map((query, index) => {
                    const Icon = query.icon;
                    return (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-3 border border-gray-700/50 hover:border-orange-500/30"
                        onClick={() => executeCommand(query.action, query.name)}
                        disabled={!isConnected || isExecuting}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <Icon className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <div className="font-medium text-white">{query.name}</div>
                            <div className="text-xs text-gray-400">{query.description}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
              </div>
            ))}

            <Separator className="my-4" />

            {/* Schema Actions */}
            <h3 className="text-sm font-semibold text-gray-300">Schema Inspector</h3>
            <div className="space-y-2">
              {schemaQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3 border border-gray-700/50 hover:border-orange-500/30"
                  onClick={() => executeCommand(query.action, query.name)}
                  disabled={!isConnected || isExecuting}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Database className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-white">{query.name}</div>
                      <div className="text-xs text-gray-400">{query.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Tool Status */}
            <h3 className="text-sm font-semibold text-gray-300">Available Tools</h3>
            <div className="space-y-1">
              {availableTools.map((tool, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <Play className="h-3 w-3 text-green-400" />
                  <span className="text-gray-300">{tool}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MCPCommandPalette;

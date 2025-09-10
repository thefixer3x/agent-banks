
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Database, 
  Table as TableIcon, 
  Eye, 
  BarChart3, 
  RefreshCw,
  ChevronRight,
  Users,
  Brain,
  MessageSquare
} from 'lucide-react';

interface MCPDataExplorerProps {
  onGetSchema: (tableName: string) => Promise<any>;
  onListTables: () => Promise<any>;
  onGetRowCount: (table: string) => Promise<any>;
  onExecuteQuery: (query: string) => Promise<any>;
  isConnected: boolean;
}

const MCPDataExplorer: React.FC<MCPDataExplorerProps> = ({
  onGetSchema,
  onListTables,
  onGetRowCount,
  onExecuteQuery,
  isConnected
}) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [schemaData, setSchemaData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Predefined tables with icons and descriptions
  const knownTables = [
    {
      name: 'memory_entries',
      icon: Brain,
      description: 'AI memory storage and knowledge base',
      color: 'text-purple-400'
    },
    {
      name: 'users',
      icon: Users,
      description: 'User accounts and profiles',
      color: 'text-blue-400'
    },
    {
      name: 'conversations',
      icon: MessageSquare,
      description: 'Chat conversations and history',
      color: 'text-green-400'
    },
    {
      name: 'memory_topics',
      icon: Database,
      description: 'Memory categorization topics',
      color: 'text-orange-400'
    }
  ];

  const handleTableSelect = async (tableName: string) => {
    if (!isConnected) return;
    
    setSelectedTable(tableName);
    setIsLoading(true);
    
    try {
      // Get schema
      await onGetSchema(tableName);
      
      // Get sample data
      await onExecuteQuery(`SELECT * FROM ${tableName} LIMIT 10`);
      
      // Get row count
      await onGetRowCount(tableName);
    } catch (error) {
      console.error(`Error exploring table ${tableName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTableIcon = (tableName: string) => {
    const known = knownTables.find(t => t.name === tableName);
    return known ? known.icon : TableIcon;
  };

  const getTableColor = (tableName: string) => {
    const known = knownTables.find(t => t.name === tableName);
    return known ? known.color : 'text-gray-400';
  };

  const getTableDescription = (tableName: string) => {
    const known = knownTables.find(t => t.name === tableName);
    return known ? known.description : 'Database table';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Table List */}
      <Card className="border-orange-500/20 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onListTables()}
            disabled={!isConnected}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Tables
          </Button>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {knownTables.map((table) => {
                const Icon = table.icon;
                return (
                  <Button
                    key={table.name}
                    variant={selectedTable === table.name ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleTableSelect(table.name)}
                    disabled={!isConnected || isLoading}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon className={`h-5 w-5 ${table.color}`} />
                      <div className="text-left flex-1">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-xs text-gray-400">{table.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Table Schema */}
      <Card className="border-orange-500/20 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Table Schema
            {selectedTable && (
              <Badge variant="outline" className="ml-2">
                {selectedTable}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {selectedTable ? (
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">
                    Schema information for <strong>{selectedTable}</strong>
                  </div>
                  
                  {/* This would be populated from actual schema results */}
                  <div className="text-xs text-gray-400">
                    Execute "Get Schema" command to view table structure
                  </div>
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              Select a table to view its schema
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card className="border-orange-500/20 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sample Data
            {selectedTable && (
              <Badge variant="outline" className="ml-2">
                {selectedTable}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {selectedTable ? (
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">
                    Sample data from <strong>{selectedTable}</strong>
                  </div>
                  
                  {/* This would be populated from actual query results */}
                  <div className="text-xs text-gray-400">
                    Execute table selection to view sample data
                  </div>
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              Select a table to view sample data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPDataExplorer;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCcw } from 'lucide-react';

interface DataItem {
  id: string;
  type: string;
  content: string;
  timestamp: string;
}

interface DataDisplayProps {
  data: DataItem[];
  title: string;
  isLoading: boolean;
  onRefresh?: () => void;
}

const DataDisplay: React.FC<DataDisplayProps> = ({ 
  data, 
  title, 
  isLoading, 
  onRefresh 
}) => {
  return (
    <Card className="border border-border bg-card h-[400px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
          {isLoading && (
            <span className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
          )}
        </CardTitle>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 border border-border rounded-md bg-card/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-tech-purple">{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="code-block overflow-x-auto whitespace-pre-wrap break-all">
                    {item.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DataDisplay;

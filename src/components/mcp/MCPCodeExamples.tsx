
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeSample from '@/components/CodeSample';

// Sample MCP configuration code
const mcpConfigCode = `{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "<personal-access-token>"
      ]
    }
  }
}`;

// Sample SQL query code
const sqlQueryCode = `SELECT 
  users.id,
  users.email,
  profiles.full_name,
  profiles.avatar_url
FROM users
JOIN profiles ON users.id = profiles.user_id
WHERE users.status = 'active'
LIMIT 10;`;

// Sample Edge Function code
const edgeFunctionCode = `// Supabase Edge Function
export async function handler(req, res) {
  const { userId } = req.body;
  
  // Validate input
  if (!userId) {
    return res.status(400).json({
      error: 'Missing required parameter: userId'
    });
  }
  
  // Execute SQL query
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.json({ data });
}`;

const MCPCodeExamples: React.FC = () => {
  return (
    <Tabs defaultValue="code" className="w-full">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="code">MCP Configuration</TabsTrigger>
        <TabsTrigger value="sql">SQL Queries</TabsTrigger>
        <TabsTrigger value="edge">Edge Functions</TabsTrigger>
      </TabsList>
      <TabsContent value="code">
        <CodeSample 
          title="MCP Server Configuration" 
          code={mcpConfigCode} 
          language="json" 
        />
      </TabsContent>
      <TabsContent value="sql">
        <CodeSample 
          title="Example SQL Query" 
          code={sqlQueryCode} 
          language="sql" 
        />
      </TabsContent>
      <TabsContent value="edge">
        <CodeSample 
          title="Example Edge Function" 
          code={edgeFunctionCode} 
          language="javascript" 
        />
      </TabsContent>
    </Tabs>
  );
};

export default MCPCodeExamples;

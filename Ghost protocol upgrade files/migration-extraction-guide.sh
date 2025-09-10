# Migration Guide: Extract Memory System to Standalone Service
# From sd-ghost-protocol to Memory-as-a-Service

## Phase 1: Prepare the Extraction

# 1. Create new service directory structure
mkdir memory-service
cd memory-service

# Initialize the service
npm init -y
mkdir -p src/{controllers,middleware,types,utils}
mkdir -p database/{migrations,seeds}
mkdir -p tests/{unit,integration}

# 2. Install dependencies
npm install express cors helmet express-rate-limit @supabase/supabase-js ioredis jsonwebtoken axios winston joi uuid dotenv

npm install -D @types/node @types/express @types/cors @types/jsonwebtoken @types/uuid typescript ts-node-dev jest @types/jest supertest eslint

## Phase 2: Copy and Adapt Core Components

# 3. Copy memory-related files from sd-ghost-protocol
# From your existing project:
cp ../sd-ghost-protocol/src/hooks/useMemoryManagement.ts ./src/utils/memory-utils.ts
cp ../sd-ghost-protocol/src/hooks/useMemoryAwareChat.ts ./src/utils/chat-utils.ts
cp ../sd-ghost-protocol/src/hooks/useAIMemoryIntegration.ts ./src/utils/ai-integration.ts
cp ../sd-ghost-protocol/src/types/memory.ts ./src/types/memory.ts

# Copy Supabase functions
cp -r ../sd-ghost-protocol/supabase/functions/* ./database/functions/

# Copy database schema
cp ../sd-ghost-protocol/supabase/migrations/*memory* ./database/migrations/

## Phase 3: Transform Components

# 4. Create the API service structure (use the artifacts above)
# Copy the API service code from the artifacts into:
# - src/app.ts
# - src/controllers/MemoryController.ts
# - src/controllers/ToolController.ts
# - src/controllers/TenantController.ts
# - src/middleware/AuthMiddleware.ts
# - src/middleware/TenantMiddleware.ts
# - src/types/api.ts

# 5. Update database schema for multi-tenancy
cat > database/migrations/001_add_tenant_isolation.sql << 'EOF'
-- Add tenant isolation to existing memory tables

-- Add tenant_id to memory_entries
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS namespace TEXT DEFAULT 'default';

-- Add tenant_id to memory_topics
ALTER TABLE memory_topics ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  user_id UUID,
  subscription TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  limits JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenant secrets table for API keys
CREATE TABLE IF NOT EXISTS tenant_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Create tenant tool permissions
CREATE TABLE IF NOT EXISTS tenant_tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  limits JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, tool)
);

-- Create tool executions table
CREATE TABLE IF NOT EXISTS tool_executions (
  id TEXT PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL,
  tool TEXT NOT NULL,
  action TEXT NOT NULL,
  parameters JSONB,
  result JSONB,
  status TEXT DEFAULT 'pending',
  error TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Update search_memories function for tenant isolation
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_topic_id text DEFAULT NULL,
  filter_project_ref text DEFAULT NULL,
  filter_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  memory_type text,
  relevance_score float,
  similarity float,
  topic_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.id,
    me.title,
    me.content,
    me.summary,
    me.memory_type::text,
    me.relevance_score,
    1 - (me.embedding <=> query_embedding) as similarity,
    COALESCE(mt.name, 'No Topic') as topic_name,
    me.created_at
  FROM memory_entries me
  LEFT JOIN memory_topics mt ON me.topic_id = mt.id
  WHERE 
    me.status = 'active'
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
    AND (filter_topic_id IS NULL OR me.topic_id = filter_topic_id::uuid)
    AND (filter_project_ref IS NULL OR me.project_ref = filter_project_ref)
    AND (filter_tenant_id IS NULL OR me.tenant_id = filter_tenant_id)
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable RLS for tenant isolation
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Tenants can only access their own memories" ON memory_entries
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Tenants can only access their own topics" ON memory_topics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION search_memories TO service_role;
EOF

## Phase 4: Update Your Existing Project

# 6. Update sd-ghost-protocol to use the Memory Service API
cd ../sd-ghost-protocol

# Install the SDK
npm install memory-service-sdk  # Once published

# 7. Replace memory hooks with API calls
cat > src/hooks/useMemoryServiceClient.ts << 'EOF'
import { useMemoryService } from 'memory-service-sdk';

export function useMemoryServiceClient() {
  return useMemoryService({
    baseUrl: process.env.REACT_APP_MEMORY_API_URL || 'http://localhost:3001',
    apiKey: process.env.REACT_APP_MEMORY_API_KEY || 'dev_api_key'
  });
}

export function useMemoryAwareChat() {
  const { client } = useMemoryServiceClient();
  
  const sendMessage = async (content: string) => {
    // Search for relevant context
    const context = await client.searchMemories({
      query: content,
      namespace: 'chat-sessions',
      options: { limit: 5, threshold: 0.7 }
    });

    // Send to AI with context (your existing AI integration)
    const aiResponse = await sendToAI(content, context.data);

    // Store the conversation
    await client.createMemory({
      namespace: 'chat-sessions',
      context: 'conversation',
      title: `Chat: ${content.slice(0, 50)}...`,
      content: `User: ${content}\nAI: ${aiResponse}`,
      memoryType: 'conversation',
      tags: ['chat', 'auto-generated']
    });

    return aiResponse;
  };

  return { sendMessage };
}
EOF

# 8. Update AIChatInterface to use the service
# Replace the existing useMemoryAwareChat import with:
# import { useMemoryAwareChat } from '@/hooks/useMemoryServiceClient';

## Phase 5: Deploy the Memory Service

# 9. Deploy the memory service
cd ../memory-service

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secure_jwt_secret
OPENAI_API_KEY=your_openai_key
EOF

# Start with Docker
docker-compose up --build -d

# Or start locally
npm run build
npm start

## Phase 6: Create Client Tenants

# 10. Create API keys for your applications
curl -X POST http://localhost:3001/api/v1/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_token" \
  -d '{
    "name": "SD Ghost Protocol Chat",
    "subscription": "pro",
    "limits": {
      "maxMemories": 10000,
      "maxRequests": 1000,
      "maxRetentionDays": 365
    }
  }'

# This returns an API key to use in your applications

## Phase 7: Update Client Applications

# 11. Add environment variables to your client apps
echo "REACT_APP_MEMORY_API_URL=https://memory-api.yourcompany.com" >> .env
echo "REACT_APP_MEMORY_API_KEY=mas_your_generated_api_key" >> .env

# 12. Test the integration
curl -X GET http://localhost:3001/health
curl -X GET http://localhost:3001/docs

# Test memory creation
curl -X POST http://localhost:3001/api/v1/memory \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "namespace": "test",
    "context": "integration-test",
    "title": "Test Memory",
    "content": "This is a test memory to verify the service is working",
    "memoryType": "knowledge"
  }'

# Test memory search
curl -X GET "http://localhost:3001/api/v1/memory/search?query=test&namespace=test" \
  -H "X-API-Key: your_api_key"

## Phase 8: Monitor and Scale

# 13. Set up monitoring
# Add logging, metrics, and health checks
# Configure Redis clustering for scale
# Set up load balancer for multiple API instances

# 14. Enable real-time features
# Configure WebSocket or SSE for real-time updates
# Set up Redis pub/sub for multi-instance synchronization

## Phase 9: Gradual Migration

# 15. Run both systems in parallel initially
# Gradually migrate features to use the Memory Service API
# Monitor performance and reliability
# Deprecate old memory hooks once migration is complete

## Verification Commands

# Test the complete flow:
echo "Testing Memory Service Integration..."

# 1. Health check
curl -f http://localhost:3001/health || echo "❌ Service not healthy"

# 2. Create memory
MEMORY_ID=$(curl -s -X POST http://localhost:3001/api/v1/memory \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "namespace": "verification",
    "context": "test",
    "title": "Verification Memory",
    "content": "Testing the extracted memory service",
    "memoryType": "knowledge"
  }' | jq -r '.data.id')

echo "Created memory: $MEMORY_ID"

# 3. Search memories
curl -s -X GET "http://localhost:3001/api/v1/memory/search?query=verification&namespace=verification" \
  -H "X-API-Key: $API_KEY" | jq '.data | length'

# 4. Execute tool
curl -s -X POST http://localhost:3001/api/v1/tools/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "namespace": "verification",
    "context": "test",
    "tool": "database",
    "action": "search_memories",
    "parameters": {"query": "verification", "limit": 1}
  }' | jq '.data.result'

echo "✅ Memory Service extraction complete!"

## Success Criteria

# ✅ Memory Service API running on port 3001
# ✅ Health check returns 200
# ✅ Can create memories via API
# ✅ Can search memories via API
# ✅ Can execute tools via API
# ✅ Original sd-ghost-protocol app uses Memory Service API
# ✅ Real-time updates working
# ✅ Multiple client applications can connect
# ✅ Tenant isolation working properly
# ✅ Performance metrics look good
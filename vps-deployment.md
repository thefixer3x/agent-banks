# 🚀 VPS Enhanced Memory Server Deployment Guide

## 🎯 Objective
Deploy the enhanced memory server with full vector search capabilities to your Hostinger VPS.

## 🔒 SSH Access Issue
Your VPS SSH port appears to be blocked or configured differently. Here are alternative deployment methods:

## 📋 Method 1: Hostinger Control Panel (Recommended)

### Step 1: Access VPS Control Panel
1. Login to Hostinger control panel
2. Go to VPS → Manage → File Manager
3. Navigate to `/home/smartmemory/`

### Step 2: Upload Files
Upload these files to `/home/smartmemory/`:

**Required Files:**
- `enhanced-memory-server.js` (2.0.0 with all endpoints)
- `.env.production` (environment variables)
- `package.json` (dependencies)

### Step 3: Terminal Commands
In Hostinger VPS terminal:
```bash
cd /home/smartmemory

# Install new dependencies  
npm install

# Stop current basic server
pm2 stop smart-memory-server

# Start enhanced server
pm2 start enhanced-memory-server.js --name smart-memory-server

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

## 📋 Method 2: Git Pull Deployment

If git is configured on VPS:
```bash
cd /home/smartmemory
git pull origin main
npm install
pm2 restart smart-memory-server
```

## 📋 Method 3: Docker Deployment (Alternative)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "enhanced-memory-server.js"]
```

## 🧪 Testing After Deployment

Once deployed, test these endpoints:

### Health Check (Enhanced)
```bash
curl http://168.231.74.29:3000/health
```
Expected response:
```json
{
  "status": "ok",
  "server": "Enhanced Smart Memory Server", 
  "version": "2.0.0",
  "features": {
    "vector_search": true,
    "memory_creation": true,
    "embedding_generation": true
  }
}
```

### Memory Search 
```bash
curl -X POST http://168.231.74.29:3000/api/memories/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test search", "limit": 3}'
```

### Memory Creation
```bash
curl -X POST http://168.231.74.29:3000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Memory",
    "content": "This is a test memory with enhanced features",
    "memory_type": "knowledge",
    "tags": ["test", "deployment"]
  }'
```

### Enhanced Chat with Memory
```bash
curl -X POST http://168.231.74.29:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What do you know about testing?"}],
    "include_memory": true
  }'
```

## 🔧 Environment Variables Required

Ensure `.env.production` contains:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI for Vector Embeddings
OPENAI_API_KEY=your_openai_key

# Server Configuration
NODE_ENV=production
PORT=3000
```

## 🎯 Expected Enhanced Features

After successful deployment:

✅ **Vector Search**: Semantic similarity search using OpenAI embeddings
✅ **Memory Storage**: Create and store memories with embeddings
✅ **Enhanced Chat**: AI chat with memory context integration  
✅ **Text Fallback**: Falls back to text search if vector search fails
✅ **Relevance Scoring**: Advanced relevance algorithms
✅ **Error Handling**: Comprehensive error handling and logging

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check logs
pm2 logs smart-memory-server

# Check dependencies
npm install

# Check environment
cat .env.production
```

### Database Connection Issues
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
  "YOUR_SUPABASE_URL/rest/v1/memory_entries?select=id&limit=1"
```

### Port Issues
```bash
# Check if port 3000 is in use
netstat -tulpn | grep :3000

# Kill conflicting processes
pm2 delete all
pm2 start enhanced-memory-server.js --name smart-memory-server
```

## 🎉 Success Indicators

Your enhanced server is working when:
1. Health endpoint returns version "2.0.0" 
2. Memory search endpoints respond without "Cannot GET/POST" errors
3. Vector search features show as "configured: true"
4. Memory creation returns success with embedding generation

---
**Next Step**: Choose Method 1 (Control Panel) for easiest deployment!
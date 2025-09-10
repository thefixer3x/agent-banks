#!/bin/bash

# Enhanced Memory Server Deployment Script
# Deploy enhanced server to Hostinger VPS

VPS_IP="168.231.74.29"
VPS_USER="root"
VPS_PATH="/home/smartmemory"

echo "🚀 Deploying Enhanced Memory Server to VPS..."
echo "VPS: $VPS_USER@$VPS_IP:$VPS_PATH"

# Check VPS connectivity
echo "📡 Testing VPS connectivity..."
if ping -c 1 $VPS_IP > /dev/null 2>&1; then
    echo "✅ VPS is reachable"
else
    echo "❌ VPS is not reachable"
    exit 1
fi

# Try different SSH methods
echo "🔐 Attempting SSH connection..."

# Method 1: Standard SSH
if ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo "✅ SSH connection successful"
    SSH_METHOD="standard"
elif ssh -p 2222 -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo "✅ SSH connection successful on port 2222"
    SSH_METHOD="port2222"
else
    echo "❌ SSH connection failed. Manual deployment required."
    echo ""
    echo "📋 Manual Deployment Instructions:"
    echo "1. Access your Hostinger VPS control panel"
    echo "2. Upload these files to $VPS_PATH:"
    echo "   - enhanced-memory-server.js"
    echo "   - .env.production"
    echo "   - package.json"
    echo "3. Run these commands:"
    echo "   cd $VPS_PATH"
    echo "   npm install"
    echo "   pm2 stop smart-memory-server"
    echo "   pm2 start enhanced-memory-server.js --name smart-memory-server"
    echo "   pm2 save"
    exit 1
fi

# Deploy files based on successful SSH method
if [ "$SSH_METHOD" = "standard" ]; then
    SCP_CMD="scp"
    SSH_CMD="ssh"
elif [ "$SSH_METHOD" = "port2222" ]; then
    SCP_CMD="scp -P 2222"
    SSH_CMD="ssh -p 2222"
fi

echo "📤 Copying enhanced server files..."
$SCP_CMD enhanced-memory-server.js $VPS_USER@$VPS_IP:$VPS_PATH/enhanced-memory-server.js
$SCP_CMD .env.production $VPS_USER@$VPS_IP:$VPS_PATH/.env.production
$SCP_CMD package.json $VPS_USER@$VPS_IP:$VPS_PATH/package.json

echo "🔄 Updating server on VPS..."
$SSH_CMD $VPS_USER@$VPS_IP << 'EOF'
cd /home/smartmemory

# Install dependencies
npm install

# Stop current server
pm2 stop smart-memory-server 2>/dev/null || echo "No existing server to stop"

# Start enhanced server
pm2 start enhanced-memory-server.js --name smart-memory-server

# Save PM2 configuration
pm2 save

# Show status
pm2 status

echo "✅ Enhanced Memory Server deployed successfully!"
EOF

echo "🧪 Testing enhanced endpoints..."
sleep 5

# Test health endpoint
echo "Testing /health endpoint..."
curl -s http://$VPS_IP:3000/health | jq .version || echo "Health check failed"

# Test memory search endpoint
echo "Testing /api/memories/search endpoint..."
curl -s -X POST http://$VPS_IP:3000/api/memories/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test deployment", "limit": 1}' || echo "Search endpoint not ready"

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Enhanced Memory Server: http://$VPS_IP:3000"
echo "📋 Available endpoints:"
echo "   GET  http://$VPS_IP:3000/health"
echo "   POST http://$VPS_IP:3000/api/memories/search"
echo "   POST http://$VPS_IP:3000/api/memories"
echo "   POST http://$VPS_IP:3000/api/chat"
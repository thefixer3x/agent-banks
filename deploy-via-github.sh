#!/bin/bash

# GitHub-based VPS Deployment for Enhanced Memory Server
# Since SSH is blocked, use GitHub as deployment bridge

echo "🚀 Deploying Enhanced Memory Server via GitHub..."

# Ensure files are committed and pushed
echo "📤 Committing enhanced server files..."

# Add all deployment files
git add enhanced-memory-server.js .env.production package.json
git add vps-deployment.md deploy-enhanced-server.sh

# Commit changes
git commit -m "feat: Add enhanced memory server for VPS deployment

- Enhanced memory server with vector search capabilities
- Complete environment configuration
- Deployment scripts and documentation

Ready for VPS deployment via GitHub pull

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin cascadeprojects-functional-version

echo ""
echo "✅ Files pushed to GitHub!"
echo ""
echo "📋 Next Steps (Manual VPS Deployment):"
echo ""
echo "1. Access Hostinger VPS Control Panel"
echo "2. Open Terminal/SSH (web-based)"
echo "3. Run these commands:"
echo ""
echo "   # Navigate to project directory"
echo "   cd /home/smartmemory"
echo ""
echo "   # Clone/pull latest changes"
echo "   git clone https://github.com/thefixer3x/sd-ghost-protocol.git . || git pull origin main"
echo ""
echo "   # Install dependencies"
echo "   npm install"
echo ""
echo "   # Stop current server"
echo "   pm2 stop smart-memory-server"
echo ""
echo "   # Start enhanced server"
echo "   pm2 start enhanced-memory-server.js --name smart-memory-server"
echo ""
echo "   # Save PM2 configuration"
echo "   pm2 save"
echo ""
echo "   # Check status"
echo "   pm2 status"
echo ""
echo "4. Test endpoints:"
echo "   curl http://168.231.74.29:3000/health"
echo "   (Should show version 2.0.0 and enhanced features)"
echo ""
echo "🎯 Expected Result:"
echo "   Enhanced memory server with POST endpoints:"
echo "   - /api/memories/search"
echo "   - /api/memories"
echo "   - /api/chat"
echo ""
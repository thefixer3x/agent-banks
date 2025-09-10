# 🔮 SD-Ghost Protocol & Agent-Banks Complete Usage Guide

## 🌟 Overview

This guide covers the complete SD-Ghost Protocol ecosystem including Agent-Banks, Claude's Realm IDE, and the memory service infrastructure.

## 🚀 Service Architecture

### **Local Services (Development)**
```
Port 8888  - Claude's Realm IDE (Memory-Enhanced)
Port 7777  - Agent-Banks Web Interface (Banks & Bella AI)
Port 3000  - Local Memory Service (Optional)
```

### **VPS Services (Production)**
```
168.231.74.29:3000  - Enhanced Memory Server (GitHub Auto-Deploy)
168.231.74.29:5000  - Agent-Banks Production Interface
168.231.74.29:2222  - SSH Access (Alternative Port)
```

---

## 🏠 Local Development Setup

### **Prerequisites**
```bash
# Install Python dependencies
pip3 install python-dotenv aiohttp flask

# Install Node.js dependencies (if using full stack)
npm install

# Ensure Claude CLI is installed
curl -fsSL https://claude.ai/install.sh | sh
```

### **Environment Configuration**
Create `.env` file in your workspace:
```bash
# API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Server Configuration
HOST=0.0.0.0
PORT=7777  # Agent-Banks
DEBUG=true

# Features
ENABLE_VOICE=true
ENABLE_BROWSERBASE=false
ENABLE_MEETING_ASSISTANT=true
```

---

## 🚀 Starting Services Locally

### **1. Start Claude's Realm IDE (Memory-Enhanced)**
```bash
cd /path/to/sd-ghost-protocol/agent_banks_workspace
python3 simple_claude_realm.py

# Access: http://localhost:8888
# Features: Real Claude CLI integration, persistent memory, conversation storage
```

### **2. Start Agent-Banks Interface**
```bash
cd /path/to/sd-ghost-protocol/agent_banks_workspace
python3 unified_frontend.py

# Access: http://localhost:7777
# Features: Banks & Bella AI personas, multi-provider fallback, voice integration
```

### **3. Start Local Memory Service (Optional)**
```bash
cd /path/to/sd-ghost-protocol
node enhanced-memory-server.js

# Access: http://localhost:3000
# Features: Local memory storage, embedding generation, full-text search
```

---

## 🌐 VPS Production Access

### **SSH Connection**
```bash
# Primary SSH (if working)
ssh root@168.231.74.29

# Alternative SSH (Port 2222 - Recommended)
ssh -p 2222 root@168.231.74.29

# Using SSH config alias
ssh ghost-vps-2222
```

### **VPS Quick Commands**
```bash
# Check running services
ssh ghost-vps-2222 "ps aux | grep -E '(node|python)' | grep -v grep"

# Check service logs
ssh ghost-vps-2222 "tail -20 /var/log/ghost-protocol.log"
ssh ghost-vps-2222 "tail -20 /root/agent-banks/agent-banks.log"

# Restart services
ssh ghost-vps-2222 "pkill -f enhanced-memory-server.js && cd /var/www/sd-ghost-protocol && nohup node enhanced-memory-server.js > /var/log/ghost-protocol.log 2>&1 &"

ssh ghost-vps-2222 "pkill -f unified_frontend.py && cd /root/agent-banks && nohup python3 unified_frontend.py > agent-banks.log 2>&1 &"
```

---

## 📝 Web Interface Usage

### **Claude's Realm IDE (localhost:8888)**

**Features:**
- 🧠 **Memory Integration**: Persistent conversation history across sessions
- ⚡ **Real Claude CLI**: Authentic Claude responses via Claude CLI
- 🔍 **Memory Search**: Search previous conversations and insights
- 📊 **Real-time Stats**: Memory usage and connection status

**How to Use:**
1. Open http://localhost:8888
2. Check connection status (Claude CLI should show "Connected")
3. Start chatting - all conversations are automatically saved
4. Use memory search to find previous discussions
5. View memory statistics in the sidebar

### **Agent-Banks Interface (localhost:7777)**

**Features:**
- 🤖 **Dual AI Personas**: "Banks" (professional) and "Bella" (friendly)
- 🔄 **Multi-Provider Fallback**: Anthropic → OpenRouter → Perplexity → DeepSeek
- 🎤 **Voice Integration**: Speech-to-text and text-to-speech
- 🌐 **Browser Integration**: Web automation via Browserbase

**How to Use:**
1. Open http://localhost:7777
2. Choose your AI persona:
   - **Banks**: Professional, business-focused responses
   - **Bella**: Friendly, casual conversation style
3. Use side panels for:
   - API key configuration
   - Voice settings
   - Browser automation controls
4. Monitor provider status and switch if needed

---

## 🔧 Configuration & Troubleshooting

### **Common Issues & Solutions**

**SSH Connection Refused:**
```bash
# Solution: Use alternative port
ssh -p 2222 root@168.231.74.29

# Or update SSH config in ~/.ssh/config:
Host ghost-vps-2222
    HostName 168.231.74.29
    User root
    Port 2222
    IdentityFile ~/.ssh/id_rsa_vps
```

**API Key Errors:**
```bash
# Check if .env file is loaded
python3 -c "import os; print(os.getenv('ANTHROPIC_API_KEY'))"

# Verify API key format (should start with sk-ant-...)
grep ANTHROPIC_API_KEY .env
```

**Port Already In Use:**
```bash
# Find and kill process using port
lsof -i :8888
kill -9 [PID]

# Or use different port
python3 simple_claude_realm.py --port 8889
```

**Memory Service Not Responding:**
```bash
# Restart local memory service
pkill -f enhanced-memory-server.js
node enhanced-memory-server.js

# Check VPS memory service
ssh ghost-vps-2222 "curl -s http://localhost:3000/health"
```

### **Advanced Configuration**

**Custom Ports:**
```bash
# Change Claude's Realm IDE port
export CLAUDE_REALM_PORT=8889
python3 simple_claude_realm.py

# Change Agent-Banks port
export AGENT_BANKS_PORT=7778
python3 unified_frontend.py
```

**Memory Service Endpoints:**
```bash
# Health check
curl http://localhost:3000/health

# Store memory
curl -X POST http://localhost:3000/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{"content": "Test memory", "type": "note"}'

# Search memories
curl -X POST http://localhost:3000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 10}'
```

---

## 🎯 Usage Scenarios

### **1. Development Workflow**
```bash
# Morning startup routine
python3 simple_claude_realm.py &    # Start IDE
python3 unified_frontend.py &       # Start Agent-Banks
node enhanced-memory-server.js &    # Start memory service

# Open browsers
open http://localhost:8888          # Claude's Realm
open http://localhost:7777          # Agent-Banks
```

### **2. Code Review Session**
1. Start Claude's Realm IDE (port 8888)
2. Upload code files or paste code snippets
3. Ask Claude to review, analyze, or suggest improvements
4. All analysis is automatically saved to memory
5. Search previous reviews for similar patterns

### **3. AI Assistant Usage**
1. Start Agent-Banks (port 7777)
2. Choose "Banks" for professional tasks
3. Choose "Bella" for casual conversations
4. Enable voice for hands-free interaction
5. Use browser integration for web tasks

### **4. Production Deployment**
```bash
# Deploy to VPS via GitHub Actions
git add .
git commit -m "Update deployment"
git push origin main

# Or manual deployment
scp files ghost-vps-2222:/root/agent-banks/
ssh ghost-vps-2222 "cd /root/agent-banks && python3 unified_frontend.py"
```

---

## 📊 Monitoring & Maintenance

### **Service Health Checks**
```bash
# Local services
curl -s http://localhost:8888/api/test_connections
curl -s http://localhost:7777/health
curl -s http://localhost:3000/health

# VPS services
curl -s http://168.231.74.29:3000/health
curl -s http://168.231.74.29:5000/health
```

### **Log Monitoring**
```bash
# Local logs
tail -f ~/.claude_realm_memory.db.log
tail -f agent-banks.log

# VPS logs
ssh ghost-vps-2222 "tail -f /var/log/ghost-protocol.log"
ssh ghost-vps-2222 "tail -f /root/agent-banks/agent-banks.log"
```

### **Memory Database Backup**
```bash
# Local memory backup
cp ~/.claude_realm_memory.db ~/backups/memory_$(date +%Y%m%d).db

# VPS memory backup
ssh ghost-vps-2222 "cp /root/.claude_realm_memory.db /root/backups/"
```

---

## 🔑 Quick Reference Commands

### **Start All Services**
```bash
# Local development
cd agent_banks_workspace
python3 simple_claude_realm.py &     # Port 8888
python3 unified_frontend.py &        # Port 7777
cd .. && node enhanced-memory-server.js &  # Port 3000
```

### **VPS Management**
```bash
# Connect to VPS
ssh ghost-vps-2222

# Restart all services
ssh ghost-vps-2222 "pkill -f 'enhanced-memory-server.js|unified_frontend.py'; cd /var/www/sd-ghost-protocol && nohup node enhanced-memory-server.js > /var/log/ghost-protocol.log 2>&1 & cd /root/agent-banks && nohup python3 unified_frontend.py > agent-banks.log 2>&1 &"

# Check service status
ssh ghost-vps-2222 "lsof -i :3000 && lsof -i :5000"
```

### **Useful Aliases**
Add to your `~/.zshrc` or `~/.bashrc`:
```bash
alias claude-realm="cd ~/CascadeProjects/sd-ghost-protocol/agent_banks_workspace && python3 simple_claude_realm.py"
alias agent-banks="cd ~/CascadeProjects/sd-ghost-protocol/agent_banks_workspace && python3 unified_frontend.py"
alias memory-server="cd ~/CascadeProjects/sd-ghost-protocol && node enhanced-memory-server.js"
alias vps-ssh="ssh ghost-vps-2222"
alias vps-status="ssh ghost-vps-2222 'lsof -i :3000 && lsof -i :5000'"
```

---

## 🎉 Success! You're Ready

After following this guide, you should have:

✅ **Local Development Environment**: Claude's Realm IDE + Agent-Banks running locally
✅ **VPS Production Access**: SSH connection and service management
✅ **Memory Integration**: Persistent conversations and insights
✅ **Multi-AI Support**: Fallback providers and persona switching
✅ **Monitoring Tools**: Health checks and log access

**Quick Test:**
1. Open http://localhost:8888 and http://localhost:7777
2. Test chat functionality on both interfaces
3. Verify memory persistence by refreshing pages
4. Check VPS services are responding

🚀 **Happy coding with your AI-enhanced development environment!**
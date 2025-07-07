#!/bin/bash

# Alternative Agent-Banks Deployment Strategy
# Creates deployment package for manual or automated transfer

set -e

echo "🚀 Creating Agent-Banks Deployment Package..."

# Configuration
PACKAGE_NAME="agent-banks-deployment-$(date +%Y%m%d_%H%M%S)"
PACKAGE_DIR="/tmp/${PACKAGE_NAME}"
VPS_HOST="168.231.74.29"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p ${PACKAGE_DIR}

# Copy all Agent-Banks files
print_status "Copying Agent-Banks files..."
cp -r /Users/seyederick/DevOps/_project_folders/Agent_Banks/* ${PACKAGE_DIR}/ 2>/dev/null || print_warning "Original Agent-Banks not found, using workspace files"

# Copy enhanced files from workspace
print_status "Adding enhanced frontend files..."
cp enhanced_ai_provider.py ${PACKAGE_DIR}/
cp browserbase_integration.py ${PACKAGE_DIR}/
cp meeting_assistant.py ${PACKAGE_DIR}/
cp unified_frontend.py ${PACKAGE_DIR}/
cp test_agent_banks.py ${PACKAGE_DIR}/
cp hybrid_orchestrator.py ${PACKAGE_DIR}/
cp personal_ai_assistant.py ${PACKAGE_DIR}/

# Create VPS-specific configuration
print_status "Creating VPS configuration..."
cat > ${PACKAGE_DIR}/vps_config.env << 'EOF'
# VPS Environment Configuration
export FLASK_ENV=production
export FLASK_DEBUG=0
export HOST=0.0.0.0
export PORT=5000

# AI Provider Configuration (to be set with real keys)
# export ANTHROPIC_API_KEY="your-anthropic-key-here"
# export OPENROUTER_API_KEY="your-openrouter-key-here"

# Optional: Browser Automation
# export BROWSERBASE_API_KEY="your-browserbase-key-here"
# export BROWSERBASE_PROJECT_ID="your-project-id-here"

# Optional: Voice Integration
# export ELEVENLABS_API_KEY="your-elevenlabs-key-here"

# Logging
export LOG_LEVEL=INFO
export SAFETY_LEVEL=high

# Database
export DATABASE_PATH="/root/agent-banks/storage/database.db"
EOF

# Create installation script
print_status "Creating installation script..."
cat > ${PACKAGE_DIR}/install_on_vps.sh << 'EOF'
#!/bin/bash

# Agent-Banks VPS Installation Script
echo "🚀 Installing Agent-Banks on VPS..."

# Setup directories
INSTALL_DIR="/root/agent-banks"
mkdir -p ${INSTALL_DIR}
mkdir -p ${INSTALL_DIR}/logs
mkdir -p ${INSTALL_DIR}/storage
mkdir -p ${INSTALL_DIR}/config

# Copy files to installation directory
echo "📁 Setting up directory structure..."
cp -r * ${INSTALL_DIR}/

# Setup Python environment
cd ${INSTALL_DIR}
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip

# Core dependencies
pip install flask flask-socketio python-socketio eventlet
pip install asyncio aiohttp websockets fastapi uvicorn
pip install psutil requests python-dotenv pyyaml

# Optional: Voice dependencies (may fail on headless servers)
pip install pygame || echo "⚠️  pygame install failed (normal on headless servers)"
pip install pyttsx3 || echo "⚠️  pyttsx3 install failed"

# Optional: Browser automation
pip install playwright || echo "⚠️  playwright install failed"
pip install browserbase || echo "⚠️  browserbase install failed"

# Initialize database
echo "🗄️  Initializing database..."
python3 -c "
import sqlite3
import os
os.makedirs('storage', exist_ok=True)
conn = sqlite3.connect('storage/database.db')
conn.execute('''CREATE TABLE IF NOT EXISTS sessions 
                (id TEXT PRIMARY KEY, data TEXT, created_at TIMESTAMP)''')
conn.execute('''CREATE TABLE IF NOT EXISTS patterns 
                (id TEXT PRIMARY KEY, pattern TEXT, success BOOLEAN, created_at TIMESTAMP)''')
conn.commit()
conn.close()
print('✅ Database initialized')
"

# Set permissions
chmod +x *.py
chmod +x *.sh

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/agent-banks.service << 'SYSTEMD_EOF'
[Unit]
Description=Agent-Banks Unified AI Assistant
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/agent-banks
Environment=PATH=/root/agent-banks/venv/bin
EnvironmentFile=/root/agent-banks/vps_config.env
ExecStart=/root/agent-banks/venv/bin/python unified_frontend.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

# Enable and start service
systemctl daemon-reload
systemctl enable agent-banks

echo "✅ Agent-Banks installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit vps_config.env and add your API keys"
echo "2. systemctl start agent-banks"
echo "3. systemctl status agent-banks"
echo "4. Access at http://your-vps-ip:5000"
echo ""
echo "🔧 Configuration file: /root/agent-banks/vps_config.env"
echo "📊 Logs: journalctl -u agent-banks -f"
EOF

# Create startup script
print_status "Creating startup script..."
cat > ${PACKAGE_DIR}/start_agent_banks.py << 'EOF'
#!/usr/bin/env python3
"""
Agent-Banks VPS Startup Script
Handles VPS-specific initialization and startup
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/root/agent-banks/logs/startup.log')
    ]
)

logger = logging.getLogger(__name__)

async def start_agent_banks():
    """Start Agent-Banks on VPS"""
    try:
        logger.info("🚀 Starting Agent-Banks on VPS...")
        
        # Check environment
        logger.info("🔍 Checking environment...")
        
        # Check API keys
        api_keys = {
            'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY'),
            'OPENROUTER_API_KEY': os.getenv('OPENROUTER_API_KEY')
        }
        
        available_providers = [k for k, v in api_keys.items() if v]
        if not available_providers:
            logger.warning("⚠️  No AI provider API keys found!")
            logger.info("Setting demo mode...")
            os.environ['ANTHROPIC_API_KEY'] = 'demo-mode'
        
        # Import and start unified frontend
        logger.info("📚 Loading Agent-Banks modules...")
        from unified_frontend import UnifiedAgentBanks
        
        logger.info("🤖 Initializing Agent-Banks...")
        agent_banks = UnifiedAgentBanks()
        
        logger.info("🌐 Starting web interface on 0.0.0.0:5000...")
        # This would start the web server
        # For now, just keep running
        
        while True:
            await asyncio.sleep(10)
            logger.debug("Agent-Banks running...")
            
    except KeyboardInterrupt:
        logger.info("🛑 Agent-Banks shutdown requested")
    except Exception as e:
        logger.error(f"❌ Agent-Banks startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(start_agent_banks())
EOF

# Create quick test script
print_status "Creating test script..."
cat > ${PACKAGE_DIR}/test_vps_deployment.py << 'EOF'
#!/usr/bin/env python3
"""
Test VPS Deployment
Quick test to verify Agent-Banks works on VPS
"""

import asyncio
import os

async def test_deployment():
    print("🧪 Testing Agent-Banks VPS Deployment")
    print("=" * 50)
    
    try:
        # Test imports
        print("📚 Testing imports...")
        from unified_frontend import UnifiedAgentBanks
        print("✅ Core modules imported successfully")
        
        # Test initialization
        print("🤖 Testing initialization...")
        agent = UnifiedAgentBanks()
        print("✅ Agent-Banks initialized successfully")
        
        # Test command processing
        print("🎯 Testing command processing...")
        result = await agent.process_natural_command("Hello, are you working?")
        print(f"✅ Command result: {result.get('message', 'OK')}")
        
        print("\n🎉 VPS Deployment Test PASSED!")
        
    except Exception as e:
        print(f"❌ VPS Deployment Test FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_deployment())
EOF

# Make scripts executable
chmod +x ${PACKAGE_DIR}/*.sh
chmod +x ${PACKAGE_DIR}/*.py

# Create deployment archive
print_status "Creating deployment archive..."
cd /tmp
tar -czf ${PACKAGE_NAME}.tar.gz ${PACKAGE_NAME}/

# Show deployment info
echo ""
echo "🎉 Agent-Banks Deployment Package Created!"
echo "=================================================================="
echo "📦 Package: /tmp/${PACKAGE_NAME}.tar.gz"
echo "📁 Package Dir: ${PACKAGE_DIR}"
echo ""
echo "🚀 Deployment Options:"
echo ""
echo "📤 Option 1: Manual Transfer"
echo "   scp /tmp/${PACKAGE_NAME}.tar.gz root@${VPS_HOST}:~/"
echo "   ssh root@${VPS_HOST}"
echo "   tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "   cd ${PACKAGE_NAME}"
echo "   sudo bash install_on_vps.sh"
echo ""
echo "📤 Option 2: GitHub Actions (if SSH available)"
echo "   - Push deployment package to repository"
echo "   - Use GitHub Actions to deploy automatically"
echo ""
echo "📤 Option 3: VPS Web Upload"
echo "   - Upload package via VPS control panel"
echo "   - Extract and install manually"
echo ""
echo "🔧 After Installation:"
echo "   1. Edit /root/agent-banks/vps_config.env (add real API keys)"
echo "   2. systemctl start agent-banks"
echo "   3. Access: http://${VPS_HOST}:5000"
echo ""
echo "📊 Logs: journalctl -u agent-banks -f"
echo "=================================================================="

# Show package contents
print_status "Package contents:"
ls -la ${PACKAGE_DIR}/

echo ""
print_status "Deployment package ready! Choose your deployment method above."
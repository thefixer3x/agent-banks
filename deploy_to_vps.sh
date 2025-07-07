#!/bin/bash

# Agent-Banks VPS Deployment Script
# Deploys the hybrid orchestration system to VPS

set -e

echo "🚀 Starting Agent-Banks VPS Deployment..."

# Configuration
VPS_HOST="168.231.74.29"
VPS_USER="root"
DEPLOY_DIR="/root/agent-banks"
LOCAL_AGENT_BANKS="/Users/seyederick/DevOps/_project_folders/Agent_Banks"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if VPS is reachable
echo "🔍 Checking VPS connectivity..."
if ! ssh -o ConnectTimeout=10 ${VPS_USER}@${VPS_HOST} 'echo "VPS reachable"' > /dev/null 2>&1; then
    print_error "Cannot connect to VPS ${VPS_HOST}"
    exit 1
fi
print_status "VPS connection verified"

# Create deployment directory on VPS
echo "📁 Setting up VPS directories..."
ssh ${VPS_USER}@${VPS_HOST} "
    mkdir -p ${DEPLOY_DIR}
    mkdir -p ${DEPLOY_DIR}/logs
    mkdir -p ${DEPLOY_DIR}/storage
    mkdir -p ${DEPLOY_DIR}/config
"
print_status "VPS directories created"

# Copy Agent-Banks files to VPS
echo "📤 Copying Agent-Banks to VPS..."
rsync -avz --progress \
    --exclude='venv/' \
    --exclude='*.pyc' \
    --exclude='__pycache__/' \
    --exclude='.git/' \
    ${LOCAL_AGENT_BANKS}/ ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/

print_status "Agent-Banks files copied to VPS"

# Copy our enhanced files
echo "📤 Copying enhanced orchestration files..."
scp hybrid_orchestrator.py ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
scp personal_ai_assistant.py ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
scp meeting_assistant.py ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/

print_status "Enhanced files copied"

# Create VPS-specific configuration
echo "⚙️  Creating VPS configuration..."
cat > vps_config.json << EOF
{
  "deployment": {
    "environment": "production",
    "vps_host": "${VPS_HOST}",
    "orchestrator_port": 8765,
    "api_port": 5000,
    "websocket_port": 8766
  },
  "orchestration": {
    "mode": "vps_brain",
    "desktop_proxy_enabled": true,
    "pattern_storage": "${DEPLOY_DIR}/storage/patterns",
    "session_storage": "${DEPLOY_DIR}/storage/sessions"
  },
  "safety": {
    "level": "high",
    "allowed_commands": ["git", "npm", "python", "node"],
    "blocked_commands": ["rm -rf", "sudo rm", "chmod 777"]
  },
  "voice": {
    "enabled": false,
    "fallback_to_text": true,
    "tts_mode": "text_only"
  }
}
EOF

scp vps_config.json ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/config/
print_status "VPS configuration created"

# Create VPS deployment script
echo "📝 Creating VPS setup script..."
cat > setup_vps.sh << 'EOF'
#!/bin/bash

# VPS Setup Script for Agent-Banks
set -e

DEPLOY_DIR="/root/agent-banks"
cd ${DEPLOY_DIR}

echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install websockets fastapi uvicorn

# Install additional VPS-specific dependencies
pip install pygame browserbase playwright pyttsx3

echo "🗄️  Setting up database..."
python app/core/init_db.py

echo "🔧 Setting permissions..."
chmod +x scripts/*.sh
chmod +x *.py

echo "🚀 Creating systemd service..."
cat > /etc/systemd/system/agent-banks.service << 'SYSTEMD_EOF'
[Unit]
Description=Agent-Banks VPS Orchestrator
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/agent-banks
Environment=PATH=/root/agent-banks/venv/bin
ExecStart=/root/agent-banks/venv/bin/python vps_orchestrator.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

systemctl daemon-reload
systemctl enable agent-banks

echo "✅ VPS setup complete!"
EOF

scp setup_vps.sh ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
print_status "VPS setup script created"

# Create VPS Orchestrator main file
echo "🧠 Creating VPS orchestrator..."
cat > vps_orchestrator.py << 'EOF'
#!/usr/bin/env python3
"""
VPS Orchestrator - The AI brain running on VPS
Coordinates with desktop proxies for hybrid execution
"""

import asyncio
import json
import websockets
import logging
from datetime import datetime
from typing import Dict, Set
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/agent-banks/logs/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class VPSOrchestrator:
    def __init__(self):
        self.connected_desktops: Dict[str, Dict] = {}
        self.active_sessions: Dict[str, Dict] = {}
        self.pattern_storage = {}
        
        # FastAPI app for REST API
        self.app = FastAPI(title="Agent-Banks VPS Orchestrator")
        self.setup_routes()
        
        logger.info("🧠 VPS Orchestrator initialized")
    
    def setup_routes(self):
        """Setup REST API routes"""
        
        @self.app.get("/")
        async def root():
            return {
                "service": "Agent-Banks VPS Orchestrator",
                "status": "running",
                "connected_desktops": len(self.connected_desktops),
                "active_sessions": len(self.active_sessions)
            }
        
        @self.app.get("/health")
        async def health():
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "connected_desktops": list(self.connected_desktops.keys())
            }
        
        @self.app.post("/execute")
        async def execute_command(request: dict):
            """Execute command via connected desktop"""
            command = request.get("command")
            desktop_id = request.get("desktop_id")
            
            if desktop_id and desktop_id in self.connected_desktops:
                result = await self.route_to_desktop(desktop_id, command)
                return {"success": True, "result": result}
            else:
                return {"success": False, "error": "No desktop available"}
    
    async def start_websocket_server(self):
        """Start WebSocket server for desktop connections"""
        
        async def handle_desktop_connection(websocket, path):
            desktop_id = None
            try:
                logger.info(f"New desktop connection: {path}")
                
                async for message in websocket:
                    data = json.loads(message)
                    
                    if data.get("type") == "register":
                        desktop_id = data.get("desktop_id")
                        self.connected_desktops[desktop_id] = {
                            "websocket": websocket,
                            "capabilities": data.get("capabilities", []),
                            "status": "connected",
                            "last_seen": datetime.now().isoformat()
                        }
                        logger.info(f"🖥️  Desktop registered: {desktop_id}")
                        
                        # Send acknowledgment
                        await websocket.send(json.dumps({
                            "type": "registered",
                            "desktop_id": desktop_id,
                            "status": "success"
                        }))
                    
                    elif data.get("type") == "response":
                        # Handle response from desktop
                        logger.info(f"📨 Response from {desktop_id}: {data}")
                        
            except websockets.exceptions.ConnectionClosed:
                if desktop_id:
                    self.connected_desktops.pop(desktop_id, None)
                    logger.info(f"🔌 Desktop disconnected: {desktop_id}")
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
        
        logger.info("🌐 Starting WebSocket server on port 8766...")
        await websockets.serve(handle_desktop_connection, "0.0.0.0", 8766)
    
    async def route_to_desktop(self, desktop_id: str, command: str):
        """Route command to specific desktop"""
        if desktop_id not in self.connected_desktops:
            return {"error": "Desktop not connected"}
        
        desktop = self.connected_desktops[desktop_id]
        websocket = desktop["websocket"]
        
        try:
            # Send command to desktop
            await websocket.send(json.dumps({
                "type": "execute",
                "command": command,
                "timestamp": datetime.now().isoformat()
            }))
            
            return {"status": "command_sent", "desktop_id": desktop_id}
        except Exception as e:
            logger.error(f"Failed to route command: {e}")
            return {"error": str(e)}
    
    async def start_server(self):
        """Start both WebSocket and HTTP servers"""
        # Start WebSocket server for desktop connections
        websocket_task = asyncio.create_task(self.start_websocket_server())
        
        # Start FastAPI server
        config = uvicorn.Config(
            self.app,
            host="0.0.0.0",
            port=5000,
            log_level="info"
        )
        server = uvicorn.Server(config)
        
        logger.info("🚀 Starting VPS Orchestrator servers...")
        
        # Run both servers concurrently
        await asyncio.gather(
            websocket_task,
            server.serve()
        )

async def main():
    """Main entry point"""
    orchestrator = VPSOrchestrator()
    
    try:
        await orchestrator.start_server()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down VPS Orchestrator...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
EOF

scp vps_orchestrator.py ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
print_status "VPS orchestrator created"

# Execute setup on VPS
echo "⚙️  Executing VPS setup..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${DEPLOY_DIR} && chmod +x setup_vps.sh && ./setup_vps.sh"
print_status "VPS setup completed"

# Start the service
echo "🚀 Starting Agent-Banks service..."
ssh ${VPS_USER}@${VPS_HOST} "systemctl start agent-banks && systemctl status agent-banks --no-pager"
print_status "Agent-Banks service started"

# Test the deployment
echo "🧪 Testing VPS deployment..."
sleep 5

# Test health endpoint
if curl -s http://${VPS_HOST}:5000/health > /dev/null; then
    print_status "VPS REST API is responding"
else
    print_warning "VPS REST API not responding yet (may need a moment to start)"
fi

# Create desktop proxy connection script
echo "📱 Creating desktop proxy script..."
cat > connect_to_vps.py << 'EOF'
#!/usr/bin/env python3
"""
Desktop Proxy - Connects to VPS Orchestrator
Executes commands locally and reports back
"""

import asyncio
import json
import websockets
import uuid
import subprocess
from datetime import datetime

class DesktopProxy:
    def __init__(self, vps_host="168.231.74.29", vps_port=8766):
        self.vps_host = vps_host
        self.vps_port = vps_port
        self.desktop_id = str(uuid.uuid4())
        self.websocket = None
        
    async def connect_to_vps(self):
        """Connect to VPS orchestrator"""
        try:
            uri = f"ws://{self.vps_host}:{self.vps_port}"
            print(f"🔗 Connecting to VPS: {uri}")
            
            self.websocket = await websockets.connect(uri)
            
            # Register this desktop
            await self.websocket.send(json.dumps({
                "type": "register",
                "desktop_id": self.desktop_id,
                "capabilities": ["file_ops", "terminal", "browser"]
            }))
            
            print(f"🖥️  Desktop proxy connected: {self.desktop_id}")
            
            # Listen for commands
            await self.listen_for_commands()
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
    
    async def listen_for_commands(self):
        """Listen for commands from VPS"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                
                if data.get("type") == "registered":
                    print(f"✅ Registered with VPS: {data}")
                
                elif data.get("type") == "execute":
                    command = data.get("command")
                    print(f"🔧 Executing: {command}")
                    
                    result = await self.execute_command(command)
                    
                    # Send result back
                    await self.websocket.send(json.dumps({
                        "type": "response",
                        "desktop_id": self.desktop_id,
                        "command": command,
                        "result": result,
                        "timestamp": datetime.now().isoformat()
                    }))
                    
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Connection to VPS lost")
        except Exception as e:
            print(f"❌ Listen error: {e}")
    
    async def execute_command(self, command):
        """Execute command locally"""
        try:
            # Simple command execution (expand as needed)
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out"}
        except Exception as e:
            return {"success": False, "error": str(e)}

async def main():
    """Run desktop proxy"""
    proxy = DesktopProxy()
    await proxy.connect_to_vps()

if __name__ == "__main__":
    asyncio.run(main())
EOF

print_status "Desktop proxy script created"

# Display connection info
echo ""
echo "🎉 Agent-Banks VPS Deployment Complete!"
echo ""
echo "📊 Connection Details:"
echo "   VPS Host: ${VPS_HOST}"
echo "   REST API: http://${VPS_HOST}:5000"
echo "   Health Check: http://${VPS_HOST}:5000/health"
echo "   WebSocket: ws://${VPS_HOST}:8766"
echo ""
echo "🖥️  To connect desktop proxy:"
echo "   python3 connect_to_vps.py"
echo ""
echo "🧪 Test commands:"
echo "   curl http://${VPS_HOST}:5000/health"
echo "   curl http://${VPS_HOST}:5000/"
echo ""

# Clean up local temporary files
rm -f vps_config.json setup_vps.sh vps_orchestrator.py

print_status "Deployment script completed successfully!"
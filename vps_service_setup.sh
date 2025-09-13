#!/bin/bash
# VPS Service Setup Script
# Run this on the VPS to restore agent-banks service

echo "🔧 Setting up Agent-Banks service on VPS..."

# 1. Enable SSH service
echo "📡 Enabling SSH service..."
systemctl enable ssh
systemctl start ssh
systemctl status ssh --no-pager

# 2. Check current directory structure
echo "📂 Checking directory structure..."
ls -la /root/
echo "---"
ls -la /root/agent-banks/ 2>/dev/null || echo "agent-banks directory not found"

# 3. Check for Python files
echo "🐍 Checking for Python processes..."
ps aux | grep python | grep -v grep

# 4. Check if systemd service exists
echo "⚙️ Checking systemd service..."
ls -la /etc/systemd/system/agent-banks.service 2>/dev/null || echo "Service file not found"

# 5. Create systemd service file if needed
if [ ! -f /etc/systemd/system/agent-banks.service ]; then
    echo "📝 Creating systemd service file..."
    cat > /etc/systemd/system/agent-banks.service << 'EOF'
[Unit]
Description=Agent Banks Web Interface
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/agent-banks
ExecStart=/usr/bin/python3 unified_frontend.py
Restart=always
RestartSec=5
Environment=PYTHONPATH=/root/agent-banks
Environment=HOST=0.0.0.0
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF
fi

# 6. Check if Python files exist and start service
if [ -f /root/agent-banks/unified_frontend.py ]; then
    echo "✅ Found Python app, starting service..."
    systemctl daemon-reload
    systemctl enable agent-banks
    systemctl start agent-banks
    systemctl status agent-banks --no-pager
else
    echo "❌ Python app not found, starting manual search..."
    find /root -name "*.py" -type f | head -10
fi

# 7. Check network connectivity
echo "🌐 Testing network connectivity..."
curl -I http://localhost:5000/health 2>/dev/null || echo "Service not responding on port 5000"

# 8. Check firewall
echo "🔥 Checking firewall status..."
ufw status

echo "🏁 Setup complete! Check the output above for any issues."
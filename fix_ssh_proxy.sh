#!/bin/bash

echo "🔧 SSH Proxy/Network Troubleshooting"

# Test different ports
echo "Testing SSH on different ports..."
for port in 22 2222 443 80; do
    echo -n "Port $port: "
    nc -zv srv896342.hstgr.cloud $port 2>&1 | grep -q "succeeded" && echo "✅ OPEN" || echo "❌ BLOCKED"
done

# Check if we need proxy settings
echo ""
echo "🌐 Network diagnostics:"
echo "Your IP: $(curl -s ifconfig.me)"
echo "DNS lookup: $(dig +short srv896342.hstgr.cloud)"

# Create SSH config with proxy options
echo ""
echo "📝 Creating SSH config with proxy fallbacks..."

mkdir -p ~/.ssh
cat >> ~/.ssh/config << 'EOF'

# VPS Connection with Proxy Support
Host vps-direct
    HostName srv896342.hstgr.cloud
    User root
    Port 22
    
Host vps-alt-port
    HostName srv896342.hstgr.cloud
    User root
    Port 2222
    
Host vps-http-tunnel
    HostName srv896342.hstgr.cloud
    User root
    Port 443
    ProxyCommand nc -X connect -x proxy.example.com:8080 %h %p
EOF

echo "✅ SSH config updated with fallback options"
echo ""
echo "🎯 Test connections:"
echo "  ssh vps-direct"
echo "  ssh vps-alt-port" 
echo "  ssh vps-http-tunnel"
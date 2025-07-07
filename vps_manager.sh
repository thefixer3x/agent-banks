#!/bin/bash

# VPS Manager - Simple CLI for Agent-Banks VPS Management
# Usage: vps <command> [options]

set -e

# Configuration
VPS_HOST="srv896342.hstgr.cloud"
VPS_IP="168.231.74.29"
VPS_USER="root"
DEPLOYMENT_DIR="/root/agent-banks"
LOCAL_PACKAGE_DIR="/tmp/agent-banks-deployment-$(date +%Y%m%d_%H%M%S)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Icons
SUCCESS="✅"
WARNING="⚠️ "
ERROR="❌"
INFO="ℹ️ "
ROCKET="🚀"
GEAR="⚙️ "
GLOBE="🌐"
PACKAGE="📦"

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${PURPLE}🤖 VPS Agent-Banks Manager${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}${SUCCESS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_info() {
    echo -e "${CYAN}${INFO} $1${NC}"
}

show_help() {
    print_header
    echo ""
    echo -e "${CYAN}Usage: vps <command> [options]${NC}"
    echo ""
    echo -e "${YELLOW}🚀 DEPLOYMENT COMMANDS:${NC}"
    echo "  deploy        Create and deploy Agent-Banks package"
    echo "  package       Create deployment package only"
    echo "  upload        Upload package to VPS (manual)"
    echo "  install       Install Agent-Banks on VPS"
    echo ""
    echo -e "${YELLOW}🔧 MANAGEMENT COMMANDS:${NC}"
    echo "  start         Start Agent-Banks service"
    echo "  stop          Stop Agent-Banks service"
    echo "  restart       Restart Agent-Banks service"
    echo "  status        Check service status"
    echo "  logs          View service logs"
    echo ""
    echo -e "${YELLOW}⚙️  CONFIGURATION COMMANDS:${NC}"
    echo "  config        Edit configuration file"
    echo "  keys          Set API keys"
    echo "  hostname      Change VPS hostname"
    echo "  firewall      Configure firewall"
    echo ""
    echo -e "${YELLOW}📊 MONITORING COMMANDS:${NC}"
    echo "  health        Check Agent-Banks health"
    echo "  monitor       Real-time monitoring"
    echo "  backup        Backup Agent-Banks data"
    echo "  update        Update Agent-Banks"
    echo ""
    echo -e "${YELLOW}🌐 CONNECTION COMMANDS:${NC}"
    echo "  ssh           Connect via SSH"
    echo "  test          Test VPS connection"
    echo "  ping          Ping VPS"
    echo "  web           Open web interface"
    echo ""
    echo -e "${YELLOW}💡 UTILITY COMMANDS:${NC}"
    echo "  info          Show VPS information"
    echo "  clean         Clean temporary files"
    echo "  reset         Reset Agent-Banks"
    echo "  help          Show this help"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  vps deploy                    # Full deployment"
    echo "  vps package                   # Create package only"
    echo "  vps start                     # Start service"
    echo "  vps logs                      # View logs"
    echo "  vps config                    # Edit config"
    echo "  vps web                       # Open web interface"
    echo ""
    echo -e "${GREEN}${SUCCESS} Agent-Banks VPS Manager Ready!${NC}"
}

test_connection() {
    print_info "Testing VPS connection..."
    
    # Test ping
    if ping -c 2 $VPS_HOST >/dev/null 2>&1; then
        print_success "VPS is reachable via ping"
    else
        print_error "VPS ping failed"
        return 1
    fi
    
    # Test SSH
    if timeout 10 ssh -o ConnectTimeout=5 -o BatchMode=yes $VPS_USER@$VPS_HOST 'echo "SSH OK"' >/dev/null 2>&1; then
        print_success "SSH connection working"
        return 0
    else
        print_warning "SSH connection failed - will use alternative deployment"
        return 1
    fi
}

create_package() {
    print_info "Creating Agent-Banks deployment package..."
    
    # Create package directory
    mkdir -p $LOCAL_PACKAGE_DIR
    
    # Copy Agent-Banks files
    cp -r . $LOCAL_PACKAGE_DIR/ 2>/dev/null || true
    
    # Create simple installation script
    cat > $LOCAL_PACKAGE_DIR/simple_install.sh << 'EOF'
#!/bin/bash
echo "🚀 Simple Agent-Banks Installation"

# Create directory
sudo mkdir -p /root/agent-banks
cd /root/agent-banks

# Copy files
cp -r /tmp/agent-banks-deployment-*/* . 2>/dev/null || cp -r ~/*.tar.gz . && tar -xzf *.tar.gz && cp -r agent-banks-deployment-*/* .

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install flask websockets aiohttp fastapi uvicorn python-dotenv

# Set permissions
chmod +x *.py

# Create config
cat > vps_config.env << 'CONFIG_EOF'
export ANTHROPIC_API_KEY="your-key-here"
export OPENROUTER_API_KEY="your-key-here"
export FLASK_ENV=production
export HOST=0.0.0.0
export PORT=5000
CONFIG_EOF

echo "✅ Installation complete!"
echo "📝 Edit vps_config.env with your API keys"
echo "🚀 Run: source venv/bin/activate && python3 unified_frontend.py"
EOF

    chmod +x $LOCAL_PACKAGE_DIR/simple_install.sh
    
    # Create archive
    cd /tmp
    tar -czf "agent-banks-simple-$(date +%Y%m%d_%H%M%S).tar.gz" $(basename $LOCAL_PACKAGE_DIR)/
    
    print_success "Package created: /tmp/agent-banks-simple-$(date +%Y%m%d_%H%M%S).tar.gz"
    echo ""
    print_info "📋 Manual deployment steps:"
    echo "1. Download the .tar.gz file"
    echo "2. Upload to VPS via web panel"
    echo "3. SSH into VPS: ssh $VPS_USER@$VPS_HOST"
    echo "4. Extract: tar -xzf agent-banks-simple-*.tar.gz"
    echo "5. Install: cd agent-banks-deployment-* && bash simple_install.sh"
    echo "6. Configure: nano /root/agent-banks/vps_config.env"
    echo "7. Start: cd /root/agent-banks && source venv/bin/activate && python3 unified_frontend.py"
}

deploy_full() {
    print_header
    print_info "Starting full Agent-Banks deployment..."
    
    # Test connection first
    if test_connection; then
        print_info "SSH available - using direct deployment"
        deploy_via_ssh
    else
        print_warning "SSH not available - using package deployment"
        create_package
        print_info "Upload the package manually and run simple_install.sh"
    fi
}

deploy_via_ssh() {
    print_info "Deploying via SSH..."
    
    # Create and upload package
    create_package
    
    # Upload to VPS
    scp /tmp/agent-banks-simple-*.tar.gz $VPS_USER@$VPS_HOST:~/
    
    # Install on VPS
    ssh $VPS_USER@$VPS_HOST << 'EOF'
cd ~
tar -xzf agent-banks-simple-*.tar.gz
cd agent-banks-deployment-*
bash simple_install.sh
EOF
    
    print_success "Deployment complete via SSH!"
}

start_service() {
    print_info "Starting Agent-Banks service..."
    if ssh $VPS_USER@$VPS_HOST 'cd /root/agent-banks && source venv/bin/activate && nohup python3 unified_frontend.py > logs/service.log 2>&1 &'; then
        print_success "Agent-Banks service started"
        print_info "Access: http://$VPS_HOST:5000"
    else
        print_error "Failed to start service"
    fi
}

stop_service() {
    print_info "Stopping Agent-Banks service..."
    ssh $VPS_USER@$VPS_HOST 'pkill -f unified_frontend.py' && print_success "Service stopped" || print_warning "Service may not have been running"
}

show_status() {
    print_info "Checking Agent-Banks status..."
    
    echo ""
    echo -e "${YELLOW}🌐 VPS Information:${NC}"
    echo "  Hostname: $VPS_HOST"
    echo "  IP: $VPS_IP"
    echo "  Web: http://$VPS_HOST:5000"
    
    if test_connection; then
        echo ""
        echo -e "${YELLOW}📊 Service Status:${NC}"
        ssh $VPS_USER@$VPS_HOST << 'EOF'
if pgrep -f unified_frontend.py >/dev/null; then
    echo "  ✅ Agent-Banks: RUNNING"
else
    echo "  ❌ Agent-Banks: STOPPED"
fi

if [ -f /root/agent-banks/vps_config.env ]; then
    echo "  ✅ Config: EXISTS"
else
    echo "  ❌ Config: MISSING"
fi

echo "  📁 Directory: $(ls -la /root/agent-banks 2>/dev/null | wc -l || echo 0) files"
EOF
    else
        print_warning "Cannot check service status - SSH not available"
    fi
}

view_logs() {
    print_info "Viewing Agent-Banks logs..."
    ssh $VPS_USER@$VPS_HOST 'tail -f /root/agent-banks/logs/service.log 2>/dev/null || echo "No logs found"'
}

edit_config() {
    print_info "Opening configuration editor..."
    ssh $VPS_USER@$VPS_HOST 'nano /root/agent-banks/vps_config.env'
}

open_web() {
    print_info "Opening Agent-Banks web interface..."
    echo "🌐 Opening: http://$VPS_HOST:5000"
    open "http://$VPS_HOST:5000" 2>/dev/null || echo "Open this URL in your browser: http://$VPS_HOST:5000"
}

connect_ssh() {
    print_info "Connecting to VPS via SSH..."
    ssh $VPS_USER@$VPS_HOST
}

ping_vps() {
    print_info "Pinging VPS..."
    ping -c 4 $VPS_HOST
}

show_info() {
    print_header
    echo ""
    echo -e "${YELLOW}🌐 VPS Information:${NC}"
    echo "  Hostname: $VPS_HOST"
    echo "  IP Address: $VPS_IP"
    echo "  User: $VPS_USER"
    echo "  Deployment: $DEPLOYMENT_DIR"
    echo ""
    echo -e "${YELLOW}🔗 Access Points:${NC}"
    echo "  Web Interface: http://$VPS_HOST:5000"
    echo "  Health Check: http://$VPS_HOST:5000/health"
    echo "  SSH: ssh $VPS_USER@$VPS_HOST"
    echo ""
    echo -e "${YELLOW}📂 Important Paths:${NC}"
    echo "  App Directory: /root/agent-banks"
    echo "  Config File: /root/agent-banks/vps_config.env"
    echo "  Logs: /root/agent-banks/logs/"
    echo "  Database: /root/agent-banks/storage/"
}

# Main command handler
case "${1:-help}" in
    "deploy")
        deploy_full
        ;;
    "package")
        create_package
        ;;
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        stop_service
        sleep 2
        start_service
        ;;
    "status")
        show_status
        ;;
    "logs")
        view_logs
        ;;
    "config")
        edit_config
        ;;
    "test")
        test_connection
        ;;
    "ssh")
        connect_ssh
        ;;
    "web")
        open_web
        ;;
    "ping")
        ping_vps
        ;;
    "info")
        show_info
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
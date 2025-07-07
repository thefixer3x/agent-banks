#!/bin/bash

# Mount VPS as Network Drive on macOS
# Creates easy access to VPS files through Finder

echo "🔗 Setting up VPS Network Mounting..."

VPS_HOST="srv896342.hstgr.cloud"
VPS_USER="root"
MOUNT_POINT="$HOME/Desktop/VPS-AgentBanks"

# Method 1: SFTP Mount (Recommended)
setup_sftp_mount() {
    echo "📁 Setting up SFTP network mount..."
    
    # Check if macFUSE is installed
    if ! command -v sshfs &> /dev/null; then
        echo "❗ Installing macFUSE + sshfs..."
        echo "1. Download macFUSE from: https://osxfuse.github.io/"
        echo "2. Install macFUSE"
        echo "3. Install sshfs: brew install sshfs"
        echo ""
        echo "After installation, run this script again."
        return 1
    fi
    
    # Create mount point
    mkdir -p "$MOUNT_POINT"
    
    # Mount VPS as network drive
    sshfs $VPS_USER@$VPS_HOST:/root/agent-banks "$MOUNT_POINT" \
        -o allow_other,defer_permissions,volname="VPS-AgentBanks"
    
    if [ $? -eq 0 ]; then
        echo "✅ VPS mounted at: $MOUNT_POINT"
        echo "🎯 Access via Finder or: open '$MOUNT_POINT'"
    else
        echo "❌ Mount failed"
        return 1
    fi
}

# Method 2: SMB Setup (Alternative)
setup_smb_server() {
    echo "🔧 Setting up SMB server on VPS..."
    
    ssh $VPS_USER@$VPS_HOST << 'EOF'
# Install Samba
apt update && apt install -y samba

# Create SMB config
cat > /etc/samba/smb.conf << 'SMB_CONFIG'
[global]
   workgroup = WORKGROUP
   server string = Agent-Banks VPS
   security = user
   map to guest = bad user

[agent-banks]
   path = /root/agent-banks
   browseable = yes
   writable = yes
   guest ok = no
   valid users = root
SMB_CONFIG

# Set SMB password (will prompt)
smbpasswd -a root

# Start services
systemctl enable smb nmb
systemctl start smb nmb

echo "✅ SMB server configured"
echo "📍 Connect from Mac: smb://srv896342.hstgr.cloud/agent-banks"
EOF
}

# Method 3: Quick Connect Script
create_quick_connect() {
    echo "⚡ Creating quick connect aliases..."
    
    cat >> ~/.zshrc << 'EOF'

# VPS Network Access
alias vps-mount='sshfs root@srv896342.hstgr.cloud:/root/agent-banks ~/Desktop/VPS-AgentBanks -o allow_other,defer_permissions,volname="VPS-AgentBanks"'
alias vps-unmount='umount ~/Desktop/VPS-AgentBanks'
alias vps-finder='open ~/Desktop/VPS-AgentBanks'
alias vps-connect='open "smb://srv896342.hstgr.cloud/agent-banks"'
EOF
    
    echo "✅ Quick connect aliases added"
    echo ""
    echo "🎯 New commands:"
    echo "  vps-mount      # Mount VPS as network drive"
    echo "  vps-unmount    # Unmount VPS drive"
    echo "  vps-finder     # Open in Finder"
    echo "  vps-connect    # Connect via SMB"
}

# Menu
echo "Choose mounting method:"
echo "1. SFTP Mount (via sshfs) - Recommended"
echo "2. SMB Server Setup (traditional network share)"
echo "3. Quick Connect Aliases Only"
echo "4. All Methods"
echo ""
read -p "Select (1-4): " choice

case $choice in
    1)
        setup_sftp_mount
        ;;
    2)
        setup_smb_server
        ;;
    3)
        create_quick_connect
        ;;
    4)
        setup_sftp_mount
        setup_smb_server
        create_quick_connect
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 VPS Network Setup Complete!"
echo ""
echo "📍 Access Methods:"
echo "  • Finder: Go → Connect to Server → smb://srv896342.hstgr.cloud"
echo "  • Terminal: vps-mount && vps-finder"
echo "  • Direct: open ~/Desktop/VPS-AgentBanks"
echo ""
echo "💡 The VPS will appear in your Network sidebar in Finder!"
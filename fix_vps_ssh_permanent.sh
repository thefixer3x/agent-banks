#!/bin/bash
# Permanent SSH Fix for VPS
# This script will ensure SSH stays configured correctly

echo "🔧 Permanent SSH Fix for VPS..."

# 1. First, we need to add your public key to VPS via console/web interface
echo "📋 Your SSH public key (copy this to VPS):"
echo "================================"
cat ~/.ssh/id_rsa_vps.pub
echo "================================"

echo ""
echo "🌐 STEP 1: Log into VPS via Hostinger console/web interface"
echo "   Go to: https://hpanel.hostinger.com"
echo "   → Your VPS → Open Terminal (web console)"

echo ""
echo "🔑 STEP 2: Run these commands in VPS web console:"
echo "================================"
cat << 'EOF'
# Enable SSH service permanently
systemctl enable ssh
systemctl start ssh

# Create SSH directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (paste the key from above)
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDiQbLYNS6siX6/bVdE8nTk7CLCRMH1sLKexUmNGX663YWt9lGtAbHugbsUUVit6t5Nt75QvNDXDe3CJWMGxowbimJCDNuzn88fLHx1ipH82YYHWQZtZwj09gCptyX6XSam/6ma9tpr0D+1OrNGuZd5Xr7pSsYj6wJoAbPcM88xkqcCsEuXzsOdnRrx4yuF7796vus8giU9seyMt3sTpRtz9JjAJEztzYSUo0Uo+TXg6Lo+uXGYIRk8r2VqRvkGIX818susxvrDZ/pmE3pFFbIK2SQmRb/2st13yMJwRrH5Hhv5o5tfHVprHeKFdhWUOscQ3X6Vqk6YiesmvlbPMoP2IyckF+OlVlnJffW00fbEyMN+hwIbgPWfCkD1bXsSidgNR+2PqSovPiUH8kBEyNqhVU7TyVIsKCFhw6SwVGWdV8CnSFS9XbVuRmg6n7Gw7Z5IPxexy59h/bVahVmqLWaHBGi+xaCmRWFR/jCXJSFdIyoVNiOMbPwxrRrnalwvk3NZUvtobjaZftsFf+bqxH2ZxINBqTg+b3shkd3KC9YYX08MGbrYKxlZZEPDLk/AQjQtG2n7pqyHvVax0Yay/BVzK4E2u0dn/TxwoNiYJKELtgsifvVJ4HeT6yZCvkzaoGQKn6rIJGjxP9S6sKhNlgLZL+7RodI85TN5ZzZZK2kGew== sd-ghost-protocol-vps@The-Fixers-Mac.local" > ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Ensure SSH service survives reboots
systemctl enable ssh

# Create a startup script to ensure SSH always works
cat > /etc/systemd/system/ssh-ensure.service << 'SSHEOF'
[Unit]
Description=Ensure SSH is always running
After=network.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'systemctl start ssh && systemctl enable ssh'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
SSHEOF

# Enable the SSH ensure service
systemctl enable ssh-ensure
systemctl start ssh-ensure

# Check SSH status
systemctl status ssh --no-pager

# Show IP addresses
echo "VPS IP addresses:"
hostname -I
EOF
echo "================================"

echo ""
echo "🧪 STEP 3: Test SSH connection"
echo "After running the above commands in VPS console, test with:"
echo "ssh ghost-vps-ipv4"

echo ""
echo "🔄 STEP 4: If connection still fails, run this local fix:"
echo "ssh-keygen -R 168.231.74.29"
echo "ssh-keygen -R srv896342.hstgr.cloud"

echo ""
echo "📱 ALTERNATIVE: Use Hostinger mobile app"
echo "   - Download Hostinger app"
echo "   - Login to your account"
echo "   - Access VPS terminal directly from app"

echo ""
echo "🔑 SSH Troubleshooting Commands:"
echo "Local machine:"
echo "  ssh -v ghost-vps-ipv4  # Verbose connection attempt"
echo "  ssh -o PreferredAuthentications=password root@168.231.74.29  # Try password auth"
echo ""
echo "VPS console:"
echo "  systemctl status ssh"
echo "  journalctl -u ssh"
echo "  cat ~/.ssh/authorized_keys"
echo "  ufw status"
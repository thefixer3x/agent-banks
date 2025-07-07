# 🌐 Agent-Banks Web Deployment Guide

## VPS Information
- **Current Hostname**: srv896342.hstgr.cloud  
- **IP Address**: 168.231.74.29
- **Status**: SSH currently blocked, using web deployment

---

## 📤 Deployment Steps

### Step 1: Upload Deployment Package
1. **Download the package**: `/tmp/agent-banks-deployment-20250706_191559.tar.gz`
2. **Access Hostinger VPS Panel**: https://hpanel.hostinger.com
3. **Upload via File Manager** or **cPanel File Manager**
4. **Upload location**: `/root/` or `/home/` directory

### Step 2: Extract and Install
```bash
# SSH into VPS (when available) or use terminal in web panel
cd ~
tar -xzf agent-banks-deployment-20250706_191559.tar.gz
cd agent-banks-deployment-20250706_191559
sudo bash install_on_vps.sh
```

### Step 3: Configure API Keys
```bash
# Edit the configuration file
nano /root/agent-banks/vps_config.env

# Add your real API keys:
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
export OPENROUTER_API_KEY="sk-or-your-key-here"
export ELEVENLABS_API_KEY="your-elevenlabs-key"  # Optional
export BROWSERBASE_API_KEY="your-browserbase-key"  # Optional
```

### Step 4: Start the Service
```bash
# Start Agent-Banks
systemctl start agent-banks

# Enable auto-start on boot
systemctl enable agent-banks

# Check status
systemctl status agent-banks
```

### Step 5: Access Web Interface
Open in browser:
- **Current**: http://srv896342.hstgr.cloud:5000
- **Or by IP**: http://168.231.74.29:5000

---

## 🎯 Custom Hostname Setup

### Option A: Domain Pointing
1. **Buy/Use existing domain**
2. **Add A Record**: `agentbanks.yourdomain.com → 168.231.74.29`
3. **Update VPS hostname** (optional)

### Option B: Subdomain of Existing
Use your existing domains:
- `assistant.seftec.tech`
- `ai.vortexcore.app` 
- `agent.lanonasis.com`

### Option C: Hostinger DNS
```bash
# Update VPS hostname via Hostinger panel
# Or via command line when SSH works:
hostnamectl set-hostname agentbanks.yourdomain.com
```

---

## 🔧 Troubleshooting

### SSH Connection Issues
```bash
# Try different ports
ssh -p 2222 root@srv896342.hstgr.cloud
ssh -p 22222 root@srv896342.hstgr.cloud

# Check if SSH is enabled in Hostinger panel
# Enable SSH access in VPS settings
```

### Service Issues
```bash
# Check logs
journalctl -u agent-banks -f

# Restart service
systemctl restart agent-banks

# Manual start for debugging
cd /root/agent-banks
source venv/bin/activate
python3 unified_frontend.py
```

### Port Access
```bash
# Check if port 5000 is open
netstat -tlnp | grep 5000

# Open firewall if needed
ufw allow 5000
```

---

## 🌟 Post-Deployment Testing

### Test Commands
1. **Voice Commands**: "Navigate to github.com"
2. **Email Tasks**: "Draft an email about project updates"  
3. **Memory**: "Remember our conversation about development"
4. **Vendor**: "Contact vendor Susan about the order"

### Expected URLs
- **Web Interface**: http://srv896342.hstgr.cloud:5000
- **Health Check**: http://srv896342.hstgr.cloud:5000/health
- **Status**: http://srv896342.hstgr.cloud:5000/status

---

## 🚀 Next Steps After Deployment

1. **Test all features** via web interface
2. **Set up custom domain** for professional access
3. **Integrate with SD-Ghost Protocol**
4. **Connect to Onasis-CORE** for vendor management
5. **Enable MCP orchestration** for cross-platform communication

---

## 🎯 Custom Domain Examples

### Professional Branding
```
agentbanks.seftec.tech → 168.231.74.29
assistant.vortexcore.app → 168.231.74.29
ai.lanonasis.com → 168.231.74.29
```

### Neutral Connection Points
```
apiendpoint.net → 168.231.74.29
connectionpoint.io → 168.231.74.29
automationhub.tech → 168.231.74.29
```

The hostname `srv896342.hstgr.cloud` can absolutely be changed to something more professional and branded! 🎨
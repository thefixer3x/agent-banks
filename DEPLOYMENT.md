# Agent-Banks Deployment Guide

## ✅ GitHub Repository Created!

**Repository URL**: https://github.com/thefixer3x/agent-banks

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/thefixer3x/agent-banks.git
cd agent-banks

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run Agent-Banks
python banks_web_live.py
# Open: http://localhost:7777
```

### VPS Deployment
```bash
# SSH to your VPS
ssh ghost-vps-ipv4

# Clone repository
cd /root
git clone https://github.com/thefixer3x/agent-banks.git
cd agent-banks

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Add your API keys

# Run with systemd (recommended)
sudo cp agent-banks.service /etc/systemd/system/
sudo systemctl enable agent-banks
sudo systemctl start agent-banks

# Or run directly
python banks_web_live.py --host 0.0.0.0 --port 7777
```

## 🔧 Configuration

### Environment Variables
```bash
# AI Services
ANTHROPIC_API_KEY=your-key
OPENROUTER_API_KEY=your-key
ELEVENLABS_API_KEY=your-key

# The Fixer Initiative Integration
FIXER_INITIATIVE_API_KEY=your-key
FIXER_MONTHLY_BUDGET=1000.0
BILLING_ACCOUNT=agent-banks-inc

# Server
HOST=0.0.0.0
PORT=7777
```

### Systemd Service (agent-banks.service)
```ini
[Unit]
Description=Agent-Banks AI Assistant
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/agent-banks
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 /root/agent-banks/banks_web_live.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📊 Monitoring

### Check Status
```bash
# Systemd status
sudo systemctl status agent-banks

# View logs
sudo journalctl -u agent-banks -f

# Check port
netstat -tlnp | grep 7777
```

### Health Check
```bash
curl http://localhost:7777/health
```

## 🔒 Security

### Firewall Rules
```bash
# Allow port 7777
sudo ufw allow 7777/tcp

# Allow only from specific IPs (recommended)
sudo ufw allow from YOUR_IP to any port 7777
```

### HTTPS Setup (with Nginx)
```nginx
server {
    listen 443 ssl;
    server_name agent-banks.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎯 Next Steps

1. **Update API Keys**: Add your real API keys to `.env`
2. **Deploy to VPS**: Follow VPS deployment steps above
3. **Configure Domain**: Point your domain to the VPS
4. **Enable HTTPS**: Set up SSL certificate
5. **Monitor Usage**: Check The Fixer Initiative billing

## 📞 Support

- **Issues**: https://github.com/thefixer3x/agent-banks/issues
- **Documentation**: See README.md and docs/
- **Updates**: Watch the repository for updates

---

**Agent-Banks is now live on GitHub and ready for deployment!** 🚀
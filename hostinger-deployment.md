# SD-Ghost Protocol - Hostinger MCP Deployment Guide

## 🚀 Deployment Checklist

### Prerequisites
- [ ] Hostinger VPS or Cloud Hosting account
- [ ] Domain name configured
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Node.js 18+ installed on server
- [ ] PostgreSQL database (can use Supabase)
- [ ] PM2 for process management

### Step 1: Prepare Environment Variables
```bash
# On your local machine
cp .env.production.example .env.production
# Edit .env.production with your actual values
```

### Step 2: Build the Application
```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Prepare MCP server
cd mcp-server
npm install
```

### Step 3: Database Setup
```bash
# Run migrations on Supabase
npx supabase db push

# Or if using direct PostgreSQL
psql $DATABASE_URL < supabase/migrations/*.sql
```

### Step 4: Hostinger Server Setup

#### 4.1 Connect to Hostinger VPS
```bash
ssh root@your-server-ip
```

#### 4.2 Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx (for reverse proxy)
apt install -y nginx

# Install Git
apt install -y git
```

#### 4.3 Clone and Setup Project
```bash
# Create app directory
mkdir -p /var/www/sd-ghost-protocol
cd /var/www/sd-ghost-protocol

# Clone your repository
git clone https://github.com/your-repo/sd-ghost-protocol.git .

# Copy production environment
cp .env.production.example .env.production
# Edit with nano or vim
nano .env.production

# Install dependencies
npm install --production

# Build frontend
npm run build

# Setup MCP server
cd mcp-server
npm install --production
```

### Step 5: Nginx Configuration
```nginx
# /etc/nginx/sites-available/sd-ghost-protocol
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/sd-ghost-protocol/dist;
        try_files $uri $uri/ /index.html;
    }

    # API/MCP Server
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 6: PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sd-ghost-mcp',
    script: './mcp-server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/sd-ghost-error.log',
    out_file: '/var/log/pm2/sd-ghost-out.log',
    log_file: '/var/log/pm2/sd-ghost-combined.log',
    time: true
  }]
};
```

### Step 7: Start Services
```bash
# Enable and start Nginx
ln -s /etc/nginx/sites-available/sd-ghost-protocol /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Start MCP server with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 8: SSL Certificate Setup
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

### Step 9: Configure MCP for Claude
```json
// Add to Claude's MCP configuration
{
  "mcpServers": {
    "sd-ghost-protocol": {
      "command": "curl",
      "args": ["-X", "POST", "https://your-domain.com/api/chat"],
      "env": {
        "AUTHORIZATION": "Bearer your-api-key"
      }
    }
  }
}
```

### Step 10: Monitoring Setup
```bash
# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Setup basic monitoring
pm2 monit
```

## 🔒 Security Checklist

- [ ] Firewall configured (ufw)
- [ ] SSH key authentication only
- [ ] Fail2ban installed
- [ ] Regular security updates
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] API rate limiting enabled
- [ ] CORS properly configured

## 📊 Performance Optimization

### 1. Enable Compression
```nginx
# Add to nginx config
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Configure Caching
```nginx
# Static assets caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization
- Ensure proper indexes on Supabase
- Use connection pooling
- Monitor query performance

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
```bash
lsof -i :3000
kill -9 <PID>
```

2. **PM2 not starting**
```bash
pm2 logs
pm2 flush
pm2 restart all
```

3. **Nginx errors**
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

4. **Database connection issues**
- Check environment variables
- Verify Supabase URL and keys
- Check firewall rules

## 📱 Testing Deployment

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

### 2. Test MCP Tools
```bash
# Test memory search
curl -X POST https://your-domain.com/api/tools/search_memories \
  -H "Content-Type: application/json" \
  -d '{"query": "test search"}'
```

### 3. WebSocket Test
```javascript
const ws = new WebSocket('wss://your-domain.com/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
```

## 🔄 Continuous Deployment

### GitHub Actions Setup
```yaml
# .github/workflows/deploy.yml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/sd-ghost-protocol
            git pull
            npm install --production
            npm run build
            pm2 restart sd-ghost-mcp
```

## 📞 Support Resources

- Hostinger Support: https://www.hostinger.com/support
- SD-Ghost Protocol Docs: [Your documentation URL]
- MCP Documentation: https://docs.anthropic.com/claude/docs/mcp
- Supabase Docs: https://supabase.com/docs

---

## 📊 Current Deployment Status (Updated: July 23, 2025)

### Server Information
- **Server ID**: 896342
- **Hostname**: srv896342.hstgr.cloud
- **IP Address**: 168.231.74.29 (IPv4), 2a02:4780:2d:cc43::1 (IPv6)
- **Plan**: KVM 1 (1 CPU, 4GB RAM, 50GB disk)
- **OS**: Ubuntu 22.04 LTS
- **Status**: Running
- **Created**: July 5, 2025

### MCP Server Status
- **Status**: Active and fully operational
- **Port**: 8000 (proxied through Nginx)
- **Framework**: Node.js MCP server implementation
- **Process Manager**: PM2

### Nginx Configuration Status
- **Status**: Configured and synced with server
- **Ports**: 80 (HTTP, redirecting to HTTPS), 443 (HTTPS)
- **SSL**: Enabled with Let's Encrypt
- **Proxy Configuration**: Routing traffic to MCP server

### Security Configuration
- **Firewall**: "SSH Access" (ID: 99535)
- **Open Ports**:
  - SSH (22)
  - Alternative SSH (2222)
  - HTTP (80)
  - HTTPS (443)
  - MCP Server (8000-8010)
- **SSH Key**: SD-Ghost-Protocol-Laptop

### Backup Status
- Latest backup: July 19, 2025
- Previous backup: July 12, 2025

### Recent Maintenance
- Remote terminal access on July 20
- Backup created on July 19
- Recovery mode operations on July 12-13
- Firewall configuration on July 12

### Recommendations
- **Firewall Sync**: Current status shows as "not synced" - run sync operation
- **Backup Schedule**: Implement weekly automated backups
- **Monitoring**: Set up additional monitoring for MCP server performance
- **Security**: Review and potentially restrict the 8000-8010 port range to specific IPs

---

**Deployment Time Estimate**: 1-2 hours
**Monthly Cost Estimate**: $20-50 (depending on Hostinger plan)
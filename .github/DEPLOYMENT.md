# 🚀 GitHub Actions Deployment Configuration

## Required GitHub Repository Secrets

To enable automated deployments, configure these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### 🔑 Essential Secrets

| Secret Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `VPS_HOST` | VPS hostname or IP | `srv896342.hstgr.cloud` | ✅ |
| `SSH_PRIVATE_KEY` | Private SSH key for VPS access | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅ |
| `KNOWN_HOSTS` | SSH known_hosts entry for VPS | `srv896342.hstgr.cloud ssh-rsa AAAAB3...` | ✅ |
| `MEMORY_API_KEY` | Secure API key for memory service | `sk_prod_memory_2024_...` | ✅ |

### 🔧 Optional Configuration

| Secret Name | Description | Default | Required |
|-------------|-------------|---------|----------|
| `VPS_USER` | SSH username | `deploy` | ❌ |
| `VPS_IP` | VPS IP address | From VPS_HOST | ❌ |
| `DEPLOY_PATH` | Deployment directory | `/var/www/sd-ghost-protocol` | ❌ |
| `SERVICE_PORT` | Service port | `3000` | ❌ |
| `SERVICE_NAME` | Service name | `ghost-protocol` | ❌ |

## 🛡️ Security Setup Guide

### 1. Generate SSH Key Pair
```bash
# Generate new SSH key for deployment
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com" -f ~/.ssh/deploy_key

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-vps-host

# Get private key for GitHub secret
cat ~/.ssh/deploy_key
```

### 2. Get Known Hosts Entry
```bash
# Generate known_hosts entry
ssh-keyscan -H your-vps-host >> ~/.ssh/known_hosts

# Copy the entry for GitHub secret
grep your-vps-host ~/.ssh/known_hosts
```

### 3. Create Non-Root User (Recommended)
```bash
# On your VPS, create deployment user
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
```

### 4. Generate Secure API Key
```bash
# Generate cryptographically secure API key
openssl rand -hex 32 | sed 's/^/sk_prod_memory_2024_/'
```

## 🔧 Environment Configuration

### Production Environment Setup
1. Navigate to **Settings → Environments**
2. Create environment: `production`
3. Add protection rules:
   - ✅ Required reviewers (recommended)
   - ✅ Wait timer: 5 minutes
   - ✅ Restrict to main branch

### Staging Environment Setup (Optional)
1. Create environment: `staging`
2. Configure separate VPS or subdomain
3. Use same secrets with different values

## 🚀 Deployment Workflows

### 1. Main Deployment (`deploy.yml`)
- **Trigger**: Push to main/develop, manual dispatch
- **Purpose**: Full production deployment to connection point
- **Features**: Enhanced memory server, API gateway options
- **Environment**: Production with protection

### 2. VPS Deployment (`deploy-vps.yml`)
- **Trigger**: Push to main/develop, manual dispatch  
- **Purpose**: Standard VPS deployment
- **Features**: Memory server, health checks
- **Environment**: Configurable (production/staging)

### 3. Agent Banks Deployment (`deploy-to-vps.yml`)
- **Trigger**: Push to main (agent_banks_workspace changes), manual
- **Purpose**: Deploy Agent-Banks workspace
- **Features**: Multi-method deployment, artifact upload
- **Environment**: Production

## 🔍 Health Checks

All workflows include comprehensive health checks:
- ✅ SSH connectivity verification
- ✅ Service startup confirmation
- ✅ API endpoint validation
- ✅ Memory system verification

## 🚨 Security Features

### Implemented Security
- ✅ SSH StrictHostKeyChecking enabled
- ✅ Non-root user deployment
- ✅ Encrypted secrets management
- ✅ Connection timeouts
- ✅ Environment protection rules
- ✅ Concurrency control

### Security Best Practices
- 🔐 Never commit secrets to repository
- 🔐 Use environment-specific API keys
- 🔐 Regular key rotation (monthly)
- 🔐 Monitor deployment logs
- 🔐 Enable 2FA on GitHub

## 🐛 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```bash
# Check VPS accessibility
ssh -o ConnectTimeout=10 deploy@your-vps-host

# Verify known_hosts entry
ssh-keyscan your-vps-host
```

#### 2. Permission Denied
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/deploy_key
chmod 700 ~/.ssh/

# Verify user exists on VPS
id deploy
```

#### 3. Service Not Starting
```bash
# Check logs on VPS
tail -f /var/log/ghost-protocol.log
journalctl -u ghost-protocol -f
```

#### 4. Health Check Failed
```bash
# Test endpoints manually
curl http://localhost:3000/health
curl http://localhost:3000/api/memories
```

### Debug Mode
Enable debug logging by adding to workflow:
```yaml
env:
  DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## 📞 Support

For deployment issues:
1. Check workflow logs in GitHub Actions
2. Verify all required secrets are configured
3. Test SSH connection manually
4. Review VPS logs for service errors

## 🔄 Updates

When updating workflows:
1. Test in staging environment first
2. Review security implications
3. Update this documentation
4. Monitor first production deployment

---

**⚠️ Security Notice**: Never share SSH private keys or API keys. Rotate secrets regularly and monitor for unauthorized access.
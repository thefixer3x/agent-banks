# 🔧 Hostinger VPS SSH Setup Guide

## 🎯 Issue Identified
SSH access is **disabled by default** on Hostinger and requires manual activation.

## 📋 Step-by-Step Fix

### Step 1: Enable SSH Access in hPanel
1. **Login** to Hostinger hPanel
2. **Navigate** to your VPS management
3. **Find "Remote Access"** or **"SSH Access"** section
4. **Enable SSH access** (toggle/checkbox)
5. **Copy the SSH command** provided by Hostinger

### Step 2: Get Correct Connection Details
Hostinger will provide something like:
```bash
ssh root@[YOUR_VPS_IP]:[CUSTOM_PORT]
# Example: ssh root@168.231.74.29:65002
```

### Step 3: Update Our SSH Config
Once you get the correct port from hPanel, update SSH config:

```bash
# Update ~/.ssh/config with correct port
Host ghost-vps
    HostName 168.231.74.29
    User root
    Port [PORT_FROM_HPANEL]  # This will be provided by Hostinger
    IdentityFile ~/.ssh/id_rsa_vps
    IdentitiesOnly yes
```

### Step 4: Initial Connection (Password)
First connection might require password instead of SSH key:
```bash
ssh root@168.231.74.29 -p [PORT_FROM_HPANEL]
# Enter FTP password when prompted
```

### Step 5: Add SSH Key to VPS
Once connected with password:
```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh

# Add your public key to authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDiQbLYNS6siX6/bVdE8nTk7CLCRMH1sLKexUmNGX663YWt9lGtAbHugbsUUVit6t5Nt75QvNDXDe3CJWMGxowbimJCDNuzn88fLHx1ipH82YYHWQZtZwj09gCptyX6XSam/6ma9tpr0D+1OrNGuZd5Xr7pSsYj6wJoAbPcM88xkqcCsEuXzsOdnRrx4yuF7796vus8giU9seyMt3sTpRtz9JjAJEztzYSUo0Uo+TXg6Lo+uXGYIRk8r2VqRvkGIX818susxvrDZ/pmE3pFFbIK2SQmRb/2st13yMJwRrH5Hhv5o5tfHVprHeKFdhWUOscQ3X6Vqk6YiesmvlbPMoP2IyckF+OlVlnJffW00fbEyMN+hwIbgPWfCkD1bXsSidgNR+2PqSovPiUH8kBEyNqhVU7TyVIsKCFhw6SwVGWdV8CnSFS9XbVuRmg6n7Gw7Z5IPxexy59h/bVahVmqLWaHBGi+xaCmRWFR/jCXJSFdIyoVNiOMbPwxrRrnalwvk3NZUvtobjaZftsFf+bqxH2ZxINBqTg+b3shkd3KC9YYX08MGbrYKxlZZEPDLk/AQjQtG2n7pqyHvVax0Yay/BVzK4E2u0dn/TxwoNiYJKELtgsifvVJ4HeT6yZCvkzaoGQKn6rIJGjxP9S6sKhNlgLZL+7RodI85TN5ZzZZK2kGew== sd-ghost-protocol-vps@The-Fixers-Mac.local" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## 🎯 What You Need to Do RIGHT NOW:

### 1. Access hPanel
- Login to Hostinger
- Go to VPS management  
- Look for "Remote Access" or "SSH" section

### 2. Enable SSH Access
- Toggle SSH access ON
- Copy the exact SSH command they provide

### 3. Share the SSH Command
The command will look like:
```bash
ssh root@168.231.74.29:[SOME_PORT]
```

## 🚨 Common Hostinger SSH Ports:
- **65002** (very common)
- **2222** 
- **22222**
- Custom ports in 60000+ range

## ✅ Once You Get the Port:
I'll update our SSH config and we can deploy the enhanced server immediately!

---
**Next Step**: Check hPanel for SSH access settings and get the correct port! 🔧
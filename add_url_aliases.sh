#!/bin/bash

# Add URL and convenience aliases to shell

echo "🔗 Adding VPS URL aliases..."

# Add to .zshrc
cat >> ~/.zshrc << 'EOF'

# VPS URL Aliases - Quick Access
alias agent-web='open http://srv896342.hstgr.cloud:5000'
alias agent-health='curl -s http://srv896342.hstgr.cloud:5000/health'
alias agent-status='vps status'
alias agent-logs='vps logs'
alias agent-deploy='vps deploy'

# Short aliases
alias vpsweb='vps web'
alias vpsup='vps start'
alias vpsdown='vps stop'
alias vpsstatus='vps status'

# Quick deploy alias
alias deployagent='vps package && echo "📦 Package ready for upload!"'
EOF

echo "✅ URL aliases added to ~/.zshrc"
echo ""
echo "🎯 New aliases available after 'source ~/.zshrc':"
echo "  agent-web      # Open web interface"
echo "  agent-status   # Quick status"
echo "  agent-logs     # View logs"
echo "  agent-deploy   # Full deployment"
echo "  vpsweb         # Short web access"
echo "  deployagent    # Quick package creation"
#!/bin/bash

# Install VPS CLI with Tab Completions
# Creates the same experience as your CUA system

echo "🚀 Installing VPS CLI for Agent-Banks..."

# Make VPS script executable
chmod +x vps

# Install to /usr/local/bin for global access
if sudo cp vps /usr/local/bin/vps; then
    echo "✅ VPS CLI installed to /usr/local/bin/vps"
else
    echo "⚠️  Installing to ~/.local/bin instead..."
    mkdir -p ~/.local/bin
    cp vps ~/.local/bin/vps
    echo "✅ VPS CLI installed to ~/.local/bin/vps"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
        echo "📝 Added ~/.local/bin to PATH in ~/.zshrc"
    fi
fi

# Install tab completions
echo "📝 Installing tab completions..."

# For zsh (primary)
if [ -d ~/.oh-my-zsh/completions ]; then
    cp vps_completions.sh ~/.oh-my-zsh/completions/_vps
    echo "✅ Installed zsh completions (oh-my-zsh)"
elif [ -d ~/.zsh/completions ]; then
    cp vps_completions.sh ~/.zsh/completions/_vps
    echo "✅ Installed zsh completions"
else
    mkdir -p ~/.zsh/completions
    cp vps_completions.sh ~/.zsh/completions/_vps
    echo "✅ Created and installed zsh completions"
fi

# Add to shell profile
if ! grep -q "vps_completions.sh" ~/.zshrc 2>/dev/null; then
    echo "" >> ~/.zshrc
    echo "# VPS CLI Tab Completions" >> ~/.zshrc
    echo "source ~/.zsh/completions/_vps 2>/dev/null || source $(pwd)/vps_completions.sh" >> ~/.zshrc
    echo "📝 Added completions to ~/.zshrc"
fi

# Create alias for easy access (like CUA)
if ! grep -q "alias vps=" ~/.zshrc 2>/dev/null; then
    echo "" >> ~/.zshrc
    echo "# VPS CLI Alias" >> ~/.zshrc
    echo "alias vps-help='vps help'" >> ~/.zshrc
    echo "alias vps-status='vps status'" >> ~/.zshrc
    echo "alias vps-deploy='vps deploy'" >> ~/.zshrc
    echo "📝 Added VPS aliases to ~/.zshrc"
fi

echo ""
echo "🎉 VPS CLI Installation Complete!"
echo ""
echo "📋 Usage:"
echo "  vps help          # Show all commands"
echo "  vps deploy        # Deploy Agent-Banks"
echo "  vps status        # Check status"
echo "  vps start         # Start service"
echo "  vps web           # Open web interface"
echo ""
echo "🔄 Restart your terminal or run: source ~/.zshrc"
echo "💡 Try typing 'vps ' and press TAB for auto-completion!"
echo ""
echo "🌐 VPS Information:"
echo "  Hostname: srv896342.hstgr.cloud"
echo "  IP: 168.231.74.29"
echo "  Web: http://srv896342.hstgr.cloud:5000"
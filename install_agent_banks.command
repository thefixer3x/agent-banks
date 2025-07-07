#!/bin/bash

# Agent-Banks Desktop Installer
# Double-click this file to install

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🤖 Agent-Banks Desktop Installer                ║"
echo "║                Your Personal AI Assistant                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Check Python
echo "🔍 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Found $PYTHON_VERSION"
else
    echo "❌ Python 3 not found. Please install Python first."
    echo "Visit: https://www.python.org/downloads/"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip3 install --user rumps flask aiohttp python-dotenv requests anthropic openai

# Run setup
echo ""
echo "🛠️  Setting up desktop app..."
bash setup_desktop_app.sh

# Create desktop shortcut
echo ""
echo "🖥️  Creating desktop shortcut..."
ln -sf /Applications/Agent-Banks.app ~/Desktop/Agent-Banks

echo ""
echo "✨ Installation Complete!"
echo ""
echo "🚀 To start Agent-Banks:"
echo "   • Double-click Agent-Banks on your Desktop"
echo "   • Or open /Applications/Agent-Banks.app"
echo ""
echo "💡 Features:"
echo "   • 💼 Banks Mode - Professional AI assistant"
echo "   • ✨ Bella Mode - Friendly AI assistant"
echo "   • 📅 Calendar integration"
echo "   • 📝 Reminders integration"
echo "   • 👥 Contacts management"
echo "   • 🎙️  Voice commands (when enabled)"
echo ""
echo "Press any key to close..."
read -n 1
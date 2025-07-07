#!/bin/bash

# Setup Agent-Banks Desktop App with macOS permissions

echo "🚀 Setting up Agent-Banks Desktop App..."

# Create app structure
APP_NAME="Agent-Banks"
APP_DIR="/Applications/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

# Create directories
mkdir -p "${MACOS_DIR}"
mkdir -p "${RESOURCES_DIR}"

# Create Info.plist with permissions
cat > "${CONTENTS_DIR}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>agent-banks</string>
    <key>CFBundleIdentifier</key>
    <string>com.cascadeprojects.agent-banks</string>
    <key>CFBundleName</key>
    <string>Agent-Banks</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>LSUIElement</key>
    <true/>
    
    <!-- Permissions for system integration -->
    <key>NSAppleEventsUsageDescription</key>
    <string>Agent-Banks needs to send Apple events to integrate with your task management apps.</string>
    
    <key>NSCalendarsUsageDescription</key>
    <string>Agent-Banks can help manage your calendar events and tasks.</string>
    
    <key>NSRemindersUsageDescription</key>
    <string>Agent-Banks can create and manage reminders for you.</string>
    
    <key>NSContactsUsageDescription</key>
    <string>Agent-Banks can help manage vendor and contact information.</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>Agent-Banks uses your microphone for voice commands when enabled.</string>
    
    <key>NSSpeechRecognitionUsageDescription</key>
    <string>Agent-Banks uses speech recognition for voice interactions.</string>
    
    <!-- Allow network connections -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    
    <!-- Background modes -->
    <key>LSBackgroundOnly</key>
    <false/>
    
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# Create launcher script
cat > "${MACOS_DIR}/agent-banks" << 'EOF'
#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="$DIR/../Resources"

# Set up Python environment
export PYTHONPATH="${RESOURCES_DIR}:${PYTHONPATH}"

# Ensure we have the right Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Check for dependencies
check_dependencies() {
    $PYTHON_CMD -c "import rumps" 2>/dev/null
    if [ $? -ne 0 ]; then
        # Install in user space
        $PYTHON_CMD -m pip install --user rumps flask aiohttp python-dotenv
    fi
}

# Launch the app
cd "${RESOURCES_DIR}"
check_dependencies
exec $PYTHON_CMD agent_banks_desktop.py "$@"
EOF

# Make launcher executable
chmod +x "${MACOS_DIR}/agent-banks"

# Copy Python files to Resources
cp agent_banks_desktop.py "${RESOURCES_DIR}/"
cp enhanced_ai_provider.py "${RESOURCES_DIR}/"
cp web_frontend.py "${RESOURCES_DIR}/"
cp claude_ide_bridge.py "${RESOURCES_DIR}/"

# Create icon (placeholder - you can add a real icon later)
echo "💼" > "${RESOURCES_DIR}/icon.txt"

# Create LaunchAgent for auto-start (optional)
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
LAUNCH_AGENT_PLIST="$LAUNCH_AGENT_DIR/com.cascadeprojects.agent-banks.plist"

mkdir -p "$LAUNCH_AGENT_DIR"

cat > "$LAUNCH_AGENT_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cascadeprojects.agent-banks</string>
    <key>ProgramArguments</key>
    <array>
        <string>${APP_DIR}/Contents/MacOS/agent-banks</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF

echo "✅ Agent-Banks Desktop App installed!"
echo ""
echo "📱 App Location: ${APP_DIR}"
echo ""
echo "🚀 To start Agent-Banks:"
echo "   1. Open Applications folder"
echo "   2. Double-click Agent-Banks"
echo "   3. Look for 💼 or ✨ in your menu bar"
echo ""
echo "⚙️  First launch will request permissions for:"
echo "   • Calendar access (for task management)"
echo "   • Reminders access (for todos)"
echo "   • Contacts access (for vendor management)"
echo "   • Microphone access (for voice commands)"
echo ""
echo "💡 Tip: Add to Login Items for auto-start"
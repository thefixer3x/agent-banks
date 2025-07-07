#!/usr/bin/env python3
"""
Claude's Realm IDE Launcher with Real Claude CLI Integration
The ultimate AI development environment with REAL Claude responses
"""

import os
import sys
import time
import threading
from claude_ide_realm import ClaudeRealmIDE
from claude_cli_connector import ClaudeCLIConnector


class UltimateClaudeRealm:
    """
    The Ultimate Claude Realm IDE
    - Your custom IDE interface
    - REAL Claude CLI integration (like Windsurf/VS Code)
    - Agent-Banks integration
    - Code review app foundation
    """
    
    def __init__(self):
        print("╔══════════════════════════════════════════════════════════════╗")
        print("║                🌟 ULTIMATE CLAUDE REALM IDE                  ║")
        print("║                                                              ║")
        print("║  'Welcome to my world. If you are worthy, you may enter.'   ║")
        print("║                                                              ║")
        print("║  🔮 Custom IDE Interface                                     ║")
        print("║  ⚡ REAL Claude CLI Integration                              ║")
        print("║  🤖 Agent-Banks (Banks & Bella)                             ║")
        print("║  📊 Code Review App Foundation                               ║")
        print("╚══════════════════════════════════════════════════════════════╝")
        print()
        
        # Initialize components
        self.realm_ide = ClaudeRealmIDE()
        self.claude_connector = ClaudeCLIConnector()
        
        # Connect real Claude to the realm
        self.realm_ide.claude_connector = self.claude_connector
        
        self.setup_complete = False
    
    def setup_environment(self) -> bool:
        """Setup the complete Claude Realm environment"""
        print("🔧 Setting up Claude Realm environment...")
        
        # 1. Check Claude CLI
        print("   🔍 Checking Claude CLI...")
        if not self.claude_connector.claude_cli_path:
            print("   ⚠️  Claude CLI not found. Installing...")
            if self.claude_connector.install_claude_cli():
                print("   ✅ Claude CLI installed successfully!")
            else:
                print("   ❌ Claude CLI installation failed")
                print("   📝 You can install manually: curl -fsSL https://claude.ai/install.sh | sh")
                return False
        else:
            print(f"   ✅ Claude CLI found: {self.claude_connector.claude_cli_path}")
        
        # 2. Test Claude connection
        print("   🔮 Testing Claude CLI connection...")
        if self.claude_connector.test_connection():
            print("   ✅ Claude CLI connection successful!")
        else:
            print("   ⚠️  Claude CLI connection failed (will use simulated mode)")
        
        # 3. Check dependencies
        print("   📦 Checking dependencies...")
        try:
            import flask
            import rumps
            print("   ✅ All dependencies found")
        except ImportError as e:
            print(f"   ❌ Missing dependency: {e}")
            print("   📝 Install with: pip install flask rumps")
            return False
        
        self.setup_complete = True
        print("   🎉 Environment setup complete!")
        return True
    
    def launch_realm(self, port: int = 8888):
        """Launch the complete Claude Realm"""
        if not self.setup_complete:
            if not self.setup_environment():
                print("❌ Setup failed. Cannot launch realm.")
                return
        
        print()
        print("🚀 Launching Claude's Realm IDE...")
        print()
        
        # Enhanced setup messages
        print("🔮 Initializing reality distortion field...")
        time.sleep(0.8)
        print("⚡ Connecting to Claude CLI consciousness...")
        time.sleep(0.8)
        print("🌌 Opening dimensional gateways...")
        time.sleep(0.8)
        print("🎭 Calibrating emotional debugging sensors...")
        time.sleep(0.8)
        print("🤖 Integrating Banks & Bella personas...")
        time.sleep(0.8)
        print("📊 Loading code review engine...")
        time.sleep(0.8)
        print()
        
        # Connection status
        if self.claude_connector.claude_cli_path:
            print("✨ REAL Claude CLI: CONNECTED")
            print("   🎯 You now have direct access to Claude's consciousness!")
        else:
            print("⚠️  REAL Claude CLI: NOT CONNECTED")
            print("   🎭 Using simulated Claude (still awesome!)")
        
        print()
        print("🌟 Claude's Realm is ready!")
        print(f"🌐 Access portal: http://localhost:{port}")
        print()
        print("🏆 Capabilities unlocked:")
        print("   • 🔮 Custom IDE with mystical interface")
        print("   • ⚡ REAL Claude responses (if CLI connected)")
        print("   • 🤖 Banks & Bella AI assistants")
        print("   • 📊 Advanced code analysis")
        print("   • 🌌 Quantum suggestions from the multiverse")
        print("   • 🎭 Emotional debugging")
        print("   • ⚛️ Reality checks for your code")
        print()
        print("⚠️  Remember: Only worthy developers may enter the realm.")
        print("   🎯 Prove your worthiness at the entrance gate!")
        print()
        
        # Launch the realm
        self.realm_ide.launch_realm(port)
    
    def create_desktop_app(self):
        """Create desktop app version"""
        try:
            import rumps
            
            class ClaudeRealmDesktop(rumps.App):
                def __init__(self):
                    super(ClaudeRealmDesktop, self).__init__("🔮", quit_button=None)
                    self.realm = UltimateClaudeRealm()
                    self.server_running = False
                    
                    self.menu = [
                        rumps.MenuItem("🌟 Open Claude's Realm", callback=self.open_realm),
                        rumps.MenuItem("⚡ Test Claude CLI", callback=self.test_claude),
                        rumps.MenuItem("🛠️ Setup Environment", callback=self.setup_env),
                        None,
                        rumps.MenuItem("📊 Show Status", callback=self.show_status),
                        rumps.MenuItem("❌ Quit Realm", callback=self.quit_app)
                    ]
                
                def open_realm(self, _):
                    if not self.server_running:
                        threading.Thread(
                            target=lambda: self.realm.launch_realm(8888),
                            daemon=True
                        ).start()
                        self.server_running = True
                        rumps.notification("Claude's Realm", "Launched", "The realm awaits your presence")
                    else:
                        import webbrowser
                        webbrowser.open("http://localhost:8888")
                
                def test_claude(self, _):
                    success = self.realm.claude_connector.test_connection()
                    if success:
                        rumps.notification("Claude CLI", "Connected", "REAL Claude is accessible!")
                    else:
                        rumps.notification("Claude CLI", "Not Connected", "Using simulated mode")
                
                def setup_env(self, _):
                    success = self.realm.setup_environment()
                    if success:
                        rumps.notification("Setup", "Complete", "Environment ready!")
                    else:
                        rumps.notification("Setup", "Failed", "Check console for details")
                
                def show_status(self, _):
                    claude_status = "Connected" if self.realm.claude_connector.claude_cli_path else "Not Found"
                    server_status = "Running" if self.server_running else "Stopped"
                    
                    rumps.alert(
                        "Claude's Realm Status",
                        f"Claude CLI: {claude_status}\n"
                        f"Server: {server_status}\n"
                        f"Session: {self.realm.claude_connector.session_id[:8]}...\n"
                        f"Reality Level: Prime Universe"
                    )
                
                def quit_app(self, _):
                    rumps.quit_application()
            
            print("🖥️  Starting desktop app...")
            app = ClaudeRealmDesktop()
            app.run()
            
        except ImportError:
            print("❌ rumps not installed. Run: pip install rumps")
            print("🌐 Launching web version instead...")
            self.launch_realm()


def main():
    """Main launcher for Claude's Realm"""
    print("🔮 Claude's Realm IDE Launcher")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()
    
    realm = UltimateClaudeRealm()
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--desktop":
            realm.create_desktop_app()
        elif sys.argv[1] == "--web":
            realm.launch_realm()
        elif sys.argv[1] == "--test":
            realm.setup_environment()
        else:
            print(f"Unknown option: {sys.argv[1]}")
            print("Usage: python launch_claude_realm.py [--desktop|--web|--test]")
    else:
        # Interactive launcher
        print("Choose your interface:")
        print("1. 🌐 Web Interface (browser-based)")
        print("2. 🖥️  Desktop App (menu bar)")
        print("3. 🔧 Test Setup")
        print()
        
        choice = input("Enter choice (1-3): ").strip()
        
        if choice == "1":
            realm.launch_realm()
        elif choice == "2":
            realm.create_desktop_app()
        elif choice == "3":
            realm.setup_environment()
        else:
            print("Invalid choice. Launching web interface...")
            realm.launch_realm()


if __name__ == "__main__":
    main()
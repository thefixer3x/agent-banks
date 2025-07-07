#!/usr/bin/env python3
"""
Claude JARVIS Installer - Built on Code Review App Foundation
Self-improving AI development assistant that reviews its own code
"""

import os
import sys
import json
import subprocess
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional

# Import our existing foundation
from claude_ide_bridge import ClaudeIDEHelper, send_to_agent_banks
from agent_banks_desktop import AgentBanksApp
from enhanced_ai_provider import MultiAIProvider


class ClaudeJARVISInstaller:
    """
    JARVIS = Just A Really Very Intelligent System
    Built on your code review app foundation
    """
    
    def __init__(self):
        self.version = "1.0.0"
        self.install_path = "/Applications/Claude-JARVIS.app"
        self.workspace_path = os.path.expanduser("~/Claude-JARVIS-Workspace")
        self.config_path = os.path.expanduser("~/.claude_jarvis_config.json")
        
        # Core components from your code review app
        self.ai_provider = None
        self.code_reviewer = None
        self.ide_bridge = None
        
        # Installation steps
        self.installation_steps = [
            {"name": "Environment Check", "function": self.check_environment},
            {"name": "Install Dependencies", "function": self.install_dependencies},
            {"name": "Setup AI Providers", "function": self.setup_ai_providers},
            {"name": "Install Code Review Engine", "function": self.install_code_review_engine},
            {"name": "Setup IDE Integration", "function": self.setup_ide_integration},
            {"name": "Install Desktop App", "function": self.install_desktop_app},
            {"name": "Configure Permissions", "function": self.configure_permissions},
            {"name": "Setup Auto-Improvement", "function": self.setup_auto_improvement},
            {"name": "Verify Installation", "function": self.verify_installation}
        ]
    
    def install(self, progress_callback=None) -> bool:
        """Run the full JARVIS installation"""
        print("╔══════════════════════════════════════════════════════════════╗")
        print("║            🤖 Claude JARVIS Installer v1.0.0                 ║")
        print("║          Just A Really Very Intelligent System               ║")
        print("║         Built on Code Review App Foundation                  ║")
        print("╚══════════════════════════════════════════════════════════════╝")
        print()
        
        total_steps = len(self.installation_steps)
        
        for i, step in enumerate(self.installation_steps, 1):
            print(f"[{i}/{total_steps}] {step['name']}...")
            
            if progress_callback:
                progress_callback(i, total_steps, step['name'])
            
            try:
                success = step['function']()
                if not success:
                    print(f"❌ Failed: {step['name']}")
                    return False
                print(f"✅ Completed: {step['name']}")
            except Exception as e:
                print(f"❌ Error in {step['name']}: {str(e)}")
                return False
        
        print("\n🎉 Claude JARVIS Installation Complete!")
        self.show_post_install_info()
        return True
    
    def check_environment(self) -> bool:
        """Check if environment is ready for JARVIS"""
        # Check Python version
        if sys.version_info < (3, 8):
            print("Python 3.8+ required")
            return False
        
        # Check if we're on macOS
        if os.uname().sysname != "Darwin":
            print("Claude JARVIS requires macOS")
            return False
        
        # Check existing Agent-Banks installation
        if os.path.exists("/Applications/Agent-Banks.app"):
            print("🔍 Found existing Agent-Banks installation - will integrate")
        
        # Create workspace
        os.makedirs(self.workspace_path, exist_ok=True)
        
        return True
    
    def install_dependencies(self) -> bool:
        """Install required packages"""
        packages = [
            "rumps",           # Menu bar app
            "flask",           # Web interface
            "aiohttp",         # Async HTTP
            "python-dotenv",   # Environment variables
            "requests",        # HTTP requests
            "anthropic",       # Claude API
            "openai",          # OpenAI API
        ]
        
        for package in packages:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", "--user", package], 
                             check=True, capture_output=True)
            except subprocess.CalledProcessError:
                print(f"Failed to install {package}")
                return False
        
        return True
    
    def setup_ai_providers(self) -> bool:
        """Setup AI provider configuration"""
        self.ai_provider = MultiAIProvider()
        
        # Create initial config
        config = {
            "ai_providers": {
                "anthropic": {"enabled": True, "key": ""},
                "openrouter": {"enabled": True, "key": ""},
                "perplexity": {"enabled": False, "key": ""},
                "deepseek": {"enabled": False, "key": ""}
            },
            "jarvis_settings": {
                "auto_review": True,
                "self_improvement": True,
                "learning_mode": True,
                "voice_enabled": False
            }
        }
        
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        return True
    
    def install_code_review_engine(self) -> bool:
        """Install enhanced code review engine based on your app"""
        # Copy code review components
        review_engine_code = '''
class JARVISCodeReviewer:
    """Enhanced code reviewer with self-improvement"""
    
    def __init__(self, ai_provider):
        self.ai_provider = ai_provider
        self.review_history = []
        
    def review_code(self, code: str, language: str = "python") -> Dict:
        """Review code with multiple AI perspectives"""
        
        # Banks review (technical)
        banks_prompt = f"""
        As Banks, review this {language} code for:
        - Best practices and patterns
        - Performance optimizations
        - Security considerations
        - Architecture improvements
        
        Code:
        ```{language}
        {code}
        ```
        """
        
        # Bella review (UX/readability)
        bella_prompt = f"""
        As Bella, review this {language} code for:
        - Readability and clarity
        - Documentation needs
        - User experience impact
        - Maintainability
        
        Code:
        ```{language}
        {code}
        ```
        """
        
        banks_review = self.ai_provider.process_message(banks_prompt)
        bella_review = self.ai_provider.process_message(bella_prompt)
        
        review = {
            "timestamp": datetime.now().isoformat(),
            "code": code,
            "language": language,
            "banks_review": banks_review,
            "bella_review": bella_review,
            "suggestions": self.extract_suggestions(banks_review, bella_review)
        }
        
        self.review_history.append(review)
        return review
    
    def extract_suggestions(self, banks_review: str, bella_review: str) -> List[str]:
        """Extract actionable suggestions from reviews"""
        # This would use NLP to extract specific suggestions
        # For now, return a placeholder
        return ["Improve error handling", "Add documentation", "Optimize performance"]
    
    def self_improve(self):
        """Analyze review history to improve future reviews"""
        if len(self.review_history) < 5:
            return
            
        # Analyze patterns in reviews
        improvement_prompt = f"""
        Analyze these code review patterns and suggest improvements to the review process:
        
        Recent Reviews: {json.dumps(self.review_history[-5:], indent=2)}
        
        How can I provide better code reviews?
        """
        
        improvement = self.ai_provider.process_message(improvement_prompt)
        print(f"🧠 JARVIS Self-Improvement: {improvement}")
'''
        
        # Write code reviewer to workspace
        with open(f"{self.workspace_path}/jarvis_code_reviewer.py", 'w') as f:
            f.write(review_engine_code)
        
        return True
    
    def setup_ide_integration(self) -> bool:
        """Setup IDE integration using existing bridge"""
        # Use your existing claude_ide_bridge.py as foundation
        ide_integration_code = '''
# Claude JARVIS IDE Integration
# Built on claude_ide_bridge.py foundation

from claude_ide_bridge import ClaudeIDEHelper

class JARVISIDEIntegration(ClaudeIDEHelper):
    """Enhanced IDE integration with self-improvement"""
    
    def __init__(self):
        super().__init__()
        self.jarvis_url = "http://localhost:9999"  # JARVIS specific port
        
    def jarvis_code_review(self, code: str, language: str = "python") -> dict:
        """JARVIS-enhanced code review"""
        import requests
        
        response = requests.post(f"{self.jarvis_url}/jarvis/review", json={
            "code": code,
            "language": language,
            "enhanced": True,
            "self_improve": True
        })
        
        return response.json() if response.status_code == 200 else {}
    
    def jarvis_suggest_improvement(self, code: str, context: str = "") -> str:
        """Get JARVIS suggestions for code improvement"""
        import requests
        
        response = requests.post(f"{self.jarvis_url}/jarvis/improve", json={
            "code": code,
            "context": context
        })
        
        return response.json().get("suggestion", "") if response.status_code == 200 else ""
'''
        
        with open(f"{self.workspace_path}/jarvis_ide_integration.py", 'w') as f:
            f.write(ide_integration_code)
        
        return True
    
    def install_desktop_app(self) -> bool:
        """Create JARVIS desktop app based on Agent-Banks"""
        # Create JARVIS.app bundle
        app_bundle = f"{self.install_path}"
        contents_dir = f"{app_bundle}/Contents"
        macos_dir = f"{contents_dir}/MacOS"
        resources_dir = f"{contents_dir}/Resources"
        
        os.makedirs(macos_dir, exist_ok=True)
        os.makedirs(resources_dir, exist_ok=True)
        
        # Info.plist for JARVIS
        info_plist = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>claude-jarvis</string>
    <key>CFBundleIdentifier</key>
    <string>com.cascadeprojects.claude-jarvis</string>
    <key>CFBundleName</key>
    <string>Claude JARVIS</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSAppleEventsUsageDescription</key>
    <string>JARVIS needs to integrate with your development tools.</string>
</dict>
</plist>'''
        
        with open(f"{contents_dir}/Info.plist", 'w') as f:
            f.write(info_plist)
        
        # Launcher script
        launcher = f'''#!/bin/bash
cd "{resources_dir}"
python3 claude_jarvis_desktop.py
'''
        
        with open(f"{macos_dir}/claude-jarvis", 'w') as f:
            f.write(launcher)
        
        os.chmod(f"{macos_dir}/claude-jarvis", 0o755)
        
        return True
    
    def configure_permissions(self) -> bool:
        """Setup macOS permissions for JARVIS"""
        # This would request permissions for:
        # - Accessibility (for IDE integration)
        # - Automation (for code review)
        # - Files (for project access)
        print("🔐 JARVIS will request permissions on first launch")
        return True
    
    def setup_auto_improvement(self) -> bool:
        """Setup JARVIS self-improvement system"""
        improvement_code = '''
class JARVISSelfImprovement:
    """JARVIS learns from its interactions to improve"""
    
    def __init__(self):
        self.learning_data = []
        
    def learn_from_interaction(self, interaction_data):
        """Learn from user interactions"""
        self.learning_data.append(interaction_data)
        
        # Analyze patterns every 10 interactions
        if len(self.learning_data) % 10 == 0:
            self.analyze_and_improve()
    
    def analyze_and_improve(self):
        """Analyze usage patterns and improve"""
        # This is where JARVIS gets smarter
        print("🧠 JARVIS is learning and improving...")
'''
        
        with open(f"{self.workspace_path}/jarvis_self_improvement.py", 'w') as f:
            f.write(improvement_code)
        
        return True
    
    def verify_installation(self) -> bool:
        """Verify JARVIS installation"""
        required_files = [
            f"{self.workspace_path}/jarvis_code_reviewer.py",
            f"{self.workspace_path}/jarvis_ide_integration.py",
            f"{self.workspace_path}/jarvis_self_improvement.py",
            self.config_path
        ]
        
        for file_path in required_files:
            if not os.path.exists(file_path):
                print(f"Missing: {file_path}")
                return False
        
        return True
    
    def show_post_install_info(self):
        """Show post-installation information"""
        print("\n╔══════════════════════════════════════════════════════════════╗")
        print("║                🎉 JARVIS Installation Complete!              ║")
        print("╚══════════════════════════════════════════════════════════════╝")
        print()
        print("🚀 Claude JARVIS Features:")
        print("   • 🔍 Advanced code review with Banks & Bella")
        print("   • 🧠 Self-improving AI that learns from reviews")
        print("   • 💻 Deep IDE integration")
        print("   • 📊 Code quality analytics")
        print("   • 🤖 Menu bar access (🔮 icon)")
        print()
        print("📁 JARVIS Workspace:", self.workspace_path)
        print("⚙️  Configuration:", self.config_path)
        print("🖥️  Desktop App:", self.install_path)
        print()
        print("🎯 Next Steps:")
        print("   1. Launch Claude JARVIS from Applications")
        print("   2. Configure your AI API keys")
        print("   3. Connect to your IDE")
        print("   4. Start coding with AI superpowers!")


def main():
    """Main installer function"""
    installer = ClaudeJARVISInstaller()
    
    print("Welcome to Claude JARVIS Installer!")
    print("Built on your code review app foundation")
    print()
    
    confirm = input("Install Claude JARVIS? (y/N): ").lower().strip()
    if confirm != 'y':
        print("Installation cancelled.")
        return
    
    success = installer.install()
    
    if success:
        print("\n🎉 Installation successful!")
        print("Your code review app has evolved into Claude JARVIS!")
    else:
        print("\n❌ Installation failed. Check the logs above.")


if __name__ == "__main__":
    main()
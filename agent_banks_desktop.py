#!/usr/bin/env python3
"""
Agent-Banks Desktop App
A menu bar application with toggle and settings
"""

import sys
import os
import threading
import webbrowser
from datetime import datetime

# Desktop app framework
try:
    import rumps
except ImportError:
    print("Installing rumps for menu bar app...")
    os.system("pip install rumps")
    import rumps

# For the web server
from flask import Flask, render_template_string, request, jsonify
from enhanced_ai_provider import MultiAIProvider
import json


class AgentBanksApp(rumps.App):
    """Agent-Banks Desktop Application with Menu Bar Control"""
    
    def __init__(self):
        super(AgentBanksApp, self).__init__("🤖", quit_button=None)
        
        # App state
        self.server_thread = None
        self.is_running = False
        self.flask_app = None
        self.port = 7777
        
        # Load saved settings
        self.settings = self.load_settings()
        
        # Create menu items
        self.menu = [
            rumps.MenuItem("💼 Banks Mode", callback=self.toggle_banks_mode),
            rumps.MenuItem("✨ Bella Mode", callback=self.toggle_bella_mode),
            None,  # Separator
            rumps.MenuItem("🟢 Start Agent-Banks", callback=self.toggle_server),
            rumps.MenuItem("🌐 Open Interface", callback=self.open_interface),
            None,  # Separator
            rumps.MenuItem("⚙️ Settings", callback=self.open_settings),
            rumps.MenuItem("📊 Status", callback=self.show_status),
            None,  # Separator
            rumps.MenuItem("❌ Quit", callback=self.quit_app)
        ]
        
        # Set initial mode
        self.current_mode = self.settings.get("default_persona", "banks")
        self.update_mode_display()
        
    def load_settings(self):
        """Load settings from file"""
        settings_file = os.path.expanduser("~/.agent_banks_settings.json")
        default_settings = {
            "default_persona": "banks",
            "auto_start": False,
            "port": 7777,
            "api_providers": {
                "anthropic": {"enabled": True, "key": ""},
                "openrouter": {"enabled": True, "key": ""},
                "perplexity": {"enabled": False, "key": ""},
                "deepseek": {"enabled": False, "key": ""}
            },
            "features": {
                "voice": False,
                "browserbase": False,
                "memory": True
            }
        }
        
        try:
            with open(settings_file, 'r') as f:
                saved_settings = json.load(f)
                default_settings.update(saved_settings)
        except:
            pass
            
        return default_settings
    
    def save_settings(self):
        """Save settings to file"""
        settings_file = os.path.expanduser("~/.agent_banks_settings.json")
        with open(settings_file, 'w') as f:
            json.dump(self.settings, f, indent=2)
    
    def toggle_banks_mode(self, _):
        """Switch to Banks mode"""
        self.current_mode = "banks"
        self.update_mode_display()
        rumps.notification("Agent-Banks", "Mode Changed", "Switched to Banks (Professional)")
    
    def toggle_bella_mode(self, _):
        """Switch to Bella mode"""
        self.current_mode = "bella"
        self.update_mode_display()
        rumps.notification("Agent-Banks", "Mode Changed", "Switched to Bella (Friendly)")
    
    def update_mode_display(self):
        """Update menu bar icon based on mode"""
        if self.current_mode == "banks":
            self.icon = "💼"
            self.menu["💼 Banks Mode"].state = True
            self.menu["✨ Bella Mode"].state = False
        else:
            self.icon = "✨"
            self.menu["💼 Banks Mode"].state = False
            self.menu["✨ Bella Mode"].state = True
    
    @rumps.clicked("🟢 Start Agent-Banks", "🔴 Stop Agent-Banks")
    def toggle_server(self, sender):
        """Toggle the Agent-Banks server"""
        if not self.is_running:
            self.start_server()
            sender.title = "🔴 Stop Agent-Banks"
            self.icon = "🟢"
            rumps.notification("Agent-Banks", "Started", f"Running on port {self.port}")
        else:
            self.stop_server()
            sender.title = "🟢 Start Agent-Banks"
            self.update_mode_display()
            rumps.notification("Agent-Banks", "Stopped", "Server shut down")
    
    def start_server(self):
        """Start the Flask server in a separate thread"""
        self.is_running = True
        
        # Create Flask app with Agent-Banks
        self.flask_app = create_flask_app(self.settings, self.current_mode)
        
        # Run in thread
        self.server_thread = threading.Thread(
            target=lambda: self.flask_app.run(
                host='0.0.0.0', 
                port=self.port, 
                debug=False,
                use_reloader=False
            )
        )
        self.server_thread.daemon = True
        self.server_thread.start()
    
    def stop_server(self):
        """Stop the Flask server"""
        self.is_running = False
        # In production, you'd properly shutdown Flask
        # For now, the daemon thread will end with the app
    
    def open_interface(self, _):
        """Open Agent-Banks in browser"""
        if self.is_running:
            webbrowser.open(f"http://localhost:{self.port}")
        else:
            rumps.alert("Agent-Banks is not running", "Start Agent-Banks first")
    
    def open_settings(self, _):
        """Open settings window"""
        # Create settings window
        window = rumps.Window(
            title="Agent-Banks Settings",
            message="Configure your AI assistants",
            default_text=json.dumps(self.settings, indent=2),
            ok="Save",
            cancel="Cancel",
            dimensions=(600, 400)
        )
        
        response = window.run()
        if response.clicked:
            try:
                self.settings = json.loads(response.text)
                self.save_settings()
                rumps.notification("Agent-Banks", "Settings", "Settings saved successfully")
            except:
                rumps.alert("Invalid JSON", "Please check your settings format")
    
    def show_status(self, _):
        """Show current status"""
        status_text = f"""
Agent-Banks Status:
━━━━━━━━━━━━━━━━━
Server: {'🟢 Running' if self.is_running else '🔴 Stopped'}
Port: {self.port}
Mode: {self.current_mode.title()}
━━━━━━━━━━━━━━━━━
API Providers:
{self._get_providers_status()}
━━━━━━━━━━━━━━━━━
Features:
Voice: {'✅' if self.settings['features']['voice'] else '❌'}
Browser: {'✅' if self.settings['features']['browserbase'] else '❌'}
Memory: {'✅' if self.settings['features']['memory'] else '✅'}
        """
        rumps.alert("Agent-Banks Status", status_text)
    
    def _get_providers_status(self):
        """Get formatted provider status"""
        status = []
        for provider, config in self.settings['api_providers'].items():
            emoji = '✅' if config['enabled'] and config['key'] else '❌'
            status.append(f"{emoji} {provider.title()}")
        return '\n'.join(status)
    
    def quit_app(self, _):
        """Quit the application"""
        if self.is_running:
            response = rumps.alert(
                "Agent-Banks is running",
                "Stop the server and quit?",
                ok="Quit",
                cancel="Cancel"
            )
            if response == 1:  # OK clicked
                self.stop_server()
                rumps.quit_application()
        else:
            rumps.quit_application()


def create_flask_app(settings, default_mode):
    """Create Flask app with current settings"""
    app = Flask(__name__)
    
    # Set environment variables from settings
    for provider, config in settings['api_providers'].items():
        if config['enabled'] and config['key']:
            os.environ[f"{provider.upper()}_API_KEY"] = config['key']
    
    # Initialize AI provider
    from enhanced_ai_provider import MultiAIProvider
    ai_provider = MultiAIProvider()
    ai_provider.current_persona = default_mode
    
    # Enhanced HTML template with desktop styling
    DESKTOP_TEMPLATE = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agent-Banks Desktop</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                min-height: 100vh;
                color: #333;
            }
            
            .desktop-header {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            
            .mode-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                color: white;
                font-size: 18px;
            }
            
            .mode-toggle {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .mode-toggle:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .container {
                max-width: 1000px;
                margin: 20px auto;
                padding: 20px;
            }
            
            .chat-container {
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                height: 600px;
                display: flex;
                flex-direction: column;
            }
            
            .quick-actions {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .quick-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .quick-btn:hover {
                background: #5a6fd8;
            }
        </style>
    </head>
    <body>
        <div class="desktop-header">
            <div class="mode-indicator">
                <span id="modeEmoji">💼</span>
                <span id="modeName">Banks Mode</span>
            </div>
            <div>
                <button class="mode-toggle" onclick="toggleMode()">Switch Mode</button>
            </div>
        </div>
        
        <div class="container">
            <div class="chat-container">
                <div class="quick-actions">
                    <button class="quick-btn" onclick="quickAction('help')">
                        🚀 Quick Start
                    </button>
                    <button class="quick-btn" onclick="quickAction('tasks')">
                        📋 My Tasks
                    </button>
                    <button class="quick-btn" onclick="quickAction('code')">
                        💻 Code Help
                    </button>
                    <button class="quick-btn" onclick="quickAction('idea')">
                        💡 Brainstorm
                    </button>
                </div>
                
                <div class="chat-messages" id="chatMessages" style="flex: 1; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                    <div class="message ai-message">
                        <strong>🤖 Agent-Banks Desktop</strong><br>
                        Your AI assistants are ready! Click a quick action or type below.
                    </div>
                </div>
                
                <div class="input-area" style="display: flex; gap: 10px;">
                    <input type="text" id="messageInput" placeholder="Ask Banks or Bella anything..." 
                           style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; font-size: 16px;"
                           onkeypress="handleKeyPress(event)">
                    <button onclick="sendMessage()" style="padding: 12px 25px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer;">Send</button>
                </div>
            </div>
        </div>
        
        <script>
            let currentMode = '{{ mode }}';
            
            function toggleMode() {
                currentMode = currentMode === 'banks' ? 'bella' : 'banks';
                updateModeDisplay();
                
                // Notify backend
                fetch('/set_mode', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({mode: currentMode})
                });
            }
            
            function updateModeDisplay() {
                const emoji = document.getElementById('modeEmoji');
                const name = document.getElementById('modeName');
                
                if (currentMode === 'banks') {
                    emoji.textContent = '💼';
                    name.textContent = 'Banks Mode';
                } else {
                    emoji.textContent = '✨';
                    name.textContent = 'Bella Mode';
                }
            }
            
            function quickAction(action) {
                let message = '';
                switch(action) {
                    case 'help':
                        message = 'Show me what you can do';
                        break;
                    case 'tasks':
                        message = 'Help me organize my tasks for today';
                        break;
                    case 'code':
                        message = 'I need help with coding';
                        break;
                    case 'idea':
                        message = 'Let\'s brainstorm some ideas';
                        break;
                }
                document.getElementById('messageInput').value = message;
                sendMessage();
            }
            
            function handleKeyPress(event) {
                if (event.key === 'Enter') sendMessage();
            }
            
            function sendMessage() {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                if (!message) return;
                
                // Add user message
                addMessage(message, 'user');
                input.value = '';
                
                // Send to AI
                fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message})
                })
                .then(response => response.json())
                .then(data => {
                    addMessage(data.response, 'ai');
                });
            }
            
            function addMessage(text, sender) {
                const container = document.getElementById('chatMessages');
                const messageDiv = document.createElement('div');
                messageDiv.style.marginBottom = '15px';
                
                if (sender === 'ai') {
                    const emoji = currentMode === 'banks' ? '💼' : '✨';
                    messageDiv.innerHTML = `<strong>${emoji} ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}:</strong> ${text}`;
                } else {
                    messageDiv.innerHTML = `<strong>👤 You:</strong> ${text}`;
                }
                
                container.appendChild(messageDiv);
                container.scrollTop = container.scrollHeight;
            }
        </script>
    </body>
    </html>
    """
    
    @app.route('/')
    def index():
        return render_template_string(DESKTOP_TEMPLATE, mode=ai_provider.current_persona)
    
    @app.route('/chat', methods=['POST'])
    def chat():
        data = request.get_json()
        message = data.get('message', '')
        response = ai_provider.process_message(message)
        return jsonify({"response": response})
    
    @app.route('/set_mode', methods=['POST'])
    def set_mode():
        data = request.get_json()
        mode = data.get('mode', 'banks')
        ai_provider.switch_persona(mode)
        return jsonify({"status": "ok", "mode": mode})
    
    return app


if __name__ == "__main__":
    # Check if running as main desktop app
    if len(sys.argv) > 1 and sys.argv[1] == "--server-only":
        # Just run the server without menu bar
        app = create_flask_app(AgentBanksApp().load_settings(), "banks")
        app.run(host='0.0.0.0', port=7777, debug=True)
    else:
        # Run as menu bar app
        print("🚀 Starting Agent-Banks Desktop App...")
        print("Look for the icon in your menu bar!")
        AgentBanksApp().run()
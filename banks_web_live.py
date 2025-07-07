#!/usr/bin/env python3
"""
Banks Web Live Interface - Simple Integration
Real execution capabilities through web interface without complex dependencies
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime
from flask import Flask, render_template_string, request, jsonify
from flask_socketio import SocketIO, emit

# Import Banks real execution capabilities directly
from computer_control_integration import operate_computer_system

app = Flask(__name__)
app.config['SECRET_KEY'] = 'banks-live-execution'
socketio = SocketIO(app, cors_allowed_origins="*")

# Default user for execution
BANKS_USER = {
    "username": "seyederick",
    "permissions": ["execute", "admin"]
}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>🚀 Banks - Live Execution Interface</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white; min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        
        .execution-panel {
            background: rgba(255,255,255,0.1);
            border-radius: 15px; padding: 30px;
            backdrop-filter: blur(10px);
            margin-bottom: 30px;
        }
        
        .quick-actions {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px; margin-bottom: 30px;
        }
        
        .action-btn {
            background: linear-gradient(45deg, #ff6b6b, #ff8e53);
            border: none; color: white; padding: 15px 20px;
            border-radius: 10px; cursor: pointer;
            font-size: 1em; font-weight: 600;
            transition: transform 0.2s;
        }
        .action-btn:hover { transform: translateY(-2px); }
        
        .chat-container {
            background: rgba(255,255,255,0.1);
            border-radius: 15px; padding: 20px;
            backdrop-filter: blur(10px);
            min-height: 400px; display: flex; flex-direction: column;
        }
        
        .messages { flex: 1; overflow-y: auto; margin-bottom: 20px; max-height: 300px; }
        .message { 
            margin-bottom: 15px; padding: 10px 15px;
            border-radius: 10px; animation: fadeIn 0.3s;
        }
        .user-message { background: rgba(74, 144, 226, 0.3); margin-left: 50px; }
        .banks-message { background: rgba(46, 204, 113, 0.3); margin-right: 50px; }
        .system-message { background: rgba(241, 196, 15, 0.3); text-align: center; }
        .execution-message { background: rgba(155, 89, 182, 0.3); margin-right: 50px; }
        
        .input-section {
            display: flex; gap: 10px; align-items: center;
        }
        .input-section input {
            flex: 1; padding: 15px; border: none;
            border-radius: 10px; font-size: 1em;
            background: rgba(255,255,255,0.2);
            color: white;
        }
        .input-section input::placeholder { color: rgba(255,255,255,0.7); }
        .send-btn {
            background: linear-gradient(45deg, #4facfe, #00f2fe);
            border: none; color: white; padding: 15px 25px;
            border-radius: 10px; cursor: pointer;
            font-weight: 600;
        }
        
        .status-bar {
            position: fixed; bottom: 20px; right: 20px;
            background: rgba(0,0,0,0.8); color: white;
            padding: 10px 20px; border-radius: 25px;
            font-size: 0.9em;
        }
        
        .success { color: #2ecc71; }
        .error { color: #e74c3c; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Banks - Live Execution Interface</h1>
            <p>Your AI assistant with REAL computer control capabilities</p>
        </div>
        
        <div class="execution-panel">
            <h3>⚡ Quick Actions - Click to Execute REAL Commands</h3>
            <div class="quick-actions">
                <button class="action-btn" onclick="executeAction('app:calculator')">📱 Open Calculator</button>
                <button class="action-btn" onclick="executeAction('app:finder')">📁 Open Finder</button>
                <button class="action-btn" onclick="executeAction('app:terminal')">💻 Open Terminal</button>
                <button class="action-btn" onclick="executeAction('browse:https://github.com')">🌐 Open GitHub</button>
                <button class="action-btn" onclick="executeAction('system:memory_usage')">📊 Check Memory</button>
                <button class="action-btn" onclick="executeAction('system:disk_usage')">💾 Check Disk</button>
                <button class="action-btn" onclick="createDemoProject()">🎯 Create Demo Project</button>
                <button class="action-btn" onclick="executeAction('app:Visual Studio Code')">🔧 Open VS Code</button>
            </div>
        </div>
        
        <div class="chat-container">
            <div class="messages" id="messages">
                <div class="system-message">
                    🤖 Banks is ready for REAL execution! Click the buttons above to see me actually control your desktop.
                </div>
            </div>
            
            <div class="input-section">
                <input type="text" id="messageInput" placeholder="Tell Banks what to do... (e.g., 'open calculator', 'create a file', 'browse to google')" onkeypress="if(event.key==='Enter') processMessage()">
                <button class="send-btn" onclick="processMessage()">Execute</button>
            </div>
        </div>
    </div>
    
    <div class="status-bar" id="statusBar">
        🟢 Banks Ready - Real Execution Mode
    </div>

    <script>
        const socket = io();
        
        socket.on('execution_result', function(data) {
            const success = data.success;
            const className = success ? 'success' : 'error';
            const icon = success ? '✅' : '❌';
            
            addMessage(`<span class="${className}"><strong>${icon} Banks:</strong> ${data.message}</span>`);
            updateStatus(success ? '✅ Execution Complete' : '❌ Execution Failed');
        });
        
        function addMessage(html) {
            const messages = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message execution-message';
            messageDiv.innerHTML = html;
            
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function updateStatus(status) {
            document.getElementById('statusBar').textContent = status;
            setTimeout(() => {
                document.getElementById('statusBar').textContent = '🟢 Banks Ready - Real Execution Mode';
            }, 3000);
        }
        
        function executeAction(command) {
            addMessage(`<strong>🔄 Executing:</strong> ${command}`);
            updateStatus('⚡ Executing...');
            socket.emit('execute_command', {command: command});
        }
        
        function processMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage(`<strong>💬 You said:</strong> ${message}`);
            input.value = '';
            updateStatus('🧠 Processing...');
            
            socket.emit('process_message', {message: message});
        }
        
        function createDemoProject() {
            addMessage('<strong>🎯 Starting:</strong> Multi-step demo project creation');
            updateStatus('🎯 Creating Demo Project...');
            socket.emit('demo_workflow', {});
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@socketio.on('execute_command')
def handle_execute_command(data):
    command = data.get('command', '')
    
    try:
        print(f"🔧 Executing: {command}")
        result = operate_computer_system(command, BANKS_USER)
        
        success = result.get('success', False)
        message = result.get('message', result.get('error', 'Unknown result'))
        
        emit('execution_result', {
            'success': success,
            'message': f"Command '{command}' → {message}",
            'command': command
        })
        
        print(f"✅ Result: {success} - {message}")
        
    except Exception as e:
        error_msg = f"Error executing '{command}': {str(e)}"
        print(f"❌ {error_msg}")
        emit('execution_result', {
            'success': False,
            'message': error_msg,
            'command': command
        })

@socketio.on('process_message')
def handle_process_message(data):
    message = data.get('message', '')
    
    try:
        # Parse natural language into commands
        command = parse_natural_language_to_command(message)
        
        if command:
            print(f"🧠 Parsed '{message}' → '{command}'")
            result = operate_computer_system(command, BANKS_USER)
            
            success = result.get('success', False)
            response = result.get('message', result.get('error', 'No response'))
            
            emit('execution_result', {
                'success': success,
                'message': f"I understood '{message}' and executed: {response}",
                'command': command
            })
        else:
            emit('execution_result', {
                'success': False,
                'message': f"I couldn't parse '{message}' into a command. Try 'open calculator' or 'browse github'",
                'command': None
            })
            
    except Exception as e:
        emit('execution_result', {
            'success': False,
            'message': f"Error processing '{message}': {str(e)}"
        })

@socketio.on('demo_workflow')
def handle_demo_workflow(data):
    """Execute multi-step demo workflow"""
    
    steps = [
        ("Creating project folder", create_demo_folder),
        ("Opening VS Code", lambda: operate_computer_system("app:Visual Studio Code", BANKS_USER)),
        ("Creating README file", create_demo_readme),
        ("Opening project folder", show_demo_folder)
    ]
    
    for step_name, step_function in steps:
        try:
            emit('execution_result', {
                'success': True,
                'message': f"🔄 {step_name}...",
                'command': step_name
            })
            
            socketio.sleep(1)  # Small delay for dramatic effect
            
            result = step_function()
            success = result.get('success', False)
            message = result.get('message', result.get('error', 'Unknown result'))
            
            emit('execution_result', {
                'success': success,
                'message': f"✅ {step_name}: {message}" if success else f"❌ {step_name}: {message}",
                'command': step_name
            })
            
        except Exception as e:
            emit('execution_result', {
                'success': False,
                'message': f"❌ {step_name}: Error - {str(e)}"
            })
    
    emit('execution_result', {
        'success': True,
        'message': "🎯 Demo workflow complete! Check your Desktop for 'BanksWebDemo' folder.",
        'command': 'workflow_complete'
    })

def parse_natural_language_to_command(message):
    """Parse natural language into executable commands"""
    message_lower = message.lower()
    
    # Application commands
    if any(word in message_lower for word in ['calculator', 'calc']):
        return 'app:calculator'
    elif any(word in message_lower for word in ['finder', 'files']):
        return 'app:finder'
    elif any(word in message_lower for word in ['terminal', 'command line']):
        return 'app:terminal'
    elif any(word in message_lower for word in ['vscode', 'vs code', 'visual studio']):
        return 'app:Visual Studio Code'
    elif any(word in message_lower for word in ['chrome', 'browser']):
        return 'app:Google Chrome'
    
    # Web browsing
    elif any(word in message_lower for word in ['github', 'git']):
        return 'browse:https://github.com'
    elif any(word in message_lower for word in ['google', 'search']):
        return 'browse:https://google.com'
    
    # System commands
    elif any(word in message_lower for word in ['memory', 'ram']):
        return 'system:memory_usage'
    elif any(word in message_lower for word in ['disk', 'storage', 'space']):
        return 'system:disk_usage'
    elif any(word in message_lower for word in ['system', 'info']):
        return 'system:system_info'
    
    return None

def create_demo_folder():
    """Create demo project folder"""
    try:
        project_folder = Path.home() / "Desktop" / "BanksWebDemo"
        project_folder.mkdir(exist_ok=True)
        return {"success": True, "message": f"Created {project_folder}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def create_demo_readme():
    """Create demo README file"""
    try:
        project_folder = Path.home() / "Desktop" / "BanksWebDemo"
        readme_file = project_folder / "README.md"
        
        content = f"""# Banks Web Demo Project
Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} via Banks Web Interface

## 🚀 This was created by Banks AI through the web!

Banks just demonstrated REAL execution capabilities:
- ✅ Created this project folder
- ✅ Opened VS Code
- ✅ Created this README file
- ✅ All through the web interface!

This is NOT simulation - this is REAL computer control! 🎯
"""
        
        with open(readme_file, "w") as f:
            f.write(content)
        
        return {"success": True, "message": "Created README.md with project details"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def show_demo_folder():
    """Show demo folder in Finder"""
    try:
        project_folder = Path.home() / "Desktop" / "BanksWebDemo"
        command = f"file:show|{project_folder}"
        return operate_computer_system(command, BANKS_USER)
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == '__main__':
    print("🚀 BANKS WEB LIVE INTERFACE")
    print("=" * 40)
    print("🌐 Starting web interface with REAL execution...")
    print("🔗 Open: http://localhost:7777")
    print("⚡ Banks can now execute REAL commands via web!")
    print("🎯 Click buttons to see ACTUAL desktop control!")
    print()
    
    socketio.run(app, host='0.0.0.0', port=7777, debug=False, allow_unsafe_werkzeug=True)
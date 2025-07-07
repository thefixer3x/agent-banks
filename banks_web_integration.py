#!/usr/bin/env python3
"""
Banks Web Integration - Connect Real Execution to Web Interface
Integrates the Banks live demo capabilities with the web frontend
"""

import sys
import os
import asyncio
import json
from pathlib import Path
from flask import Flask, render_template_string, request, jsonify
from flask_socketio import SocketIO, emit

# Add Banks evolution core to path
sys.path.insert(0, str(Path.home() / "BanksEvolution" / "agent_banks_core"))

# Import Banks real execution capabilities
from computer_control_integration import operate_computer_system
from unified_execution_orchestrator import UnifiedExecutionOrchestrator

app = Flask(__name__)
app.config['SECRET_KEY'] = 'banks-web-execution'
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Banks orchestrator
try:
    banks_orchestrator = UnifiedExecutionOrchestrator()
    print("✅ Banks execution orchestrator loaded")
except Exception as e:
    print(f"⚠️ Banks orchestrator error: {e}")
    banks_orchestrator = None

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
        
        .messages { flex: 1; overflow-y: auto; margin-bottom: 20px; }
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
            <h3>⚡ Quick Actions</h3>
            <div class="quick-actions">
                <button class="action-btn" onclick="executeQuickAction('app:calculator')">📱 Open Calculator</button>
                <button class="action-btn" onclick="executeQuickAction('app:finder')">📁 Open Finder</button>
                <button class="action-btn" onclick="executeQuickAction('app:terminal')">💻 Open Terminal</button>
                <button class="action-btn" onclick="executeQuickAction('browse:https://github.com')">🌐 Open GitHub</button>
                <button class="action-btn" onclick="executeQuickAction('system:memory_usage')">📊 Check Memory</button>
                <button class="action-btn" onclick="executeQuickAction('system:disk_usage')">💾 Check Disk</button>
                <button class="action-btn" onclick="createDemoProject()">🎯 Create Demo Project</button>
                <button class="action-btn" onclick="executeQuickAction('app:Visual Studio Code')">🔧 Open VS Code</button>
            </div>
        </div>
        
        <div class="chat-container">
            <div class="messages" id="messages">
                <div class="system-message">
                    🤖 Banks is ready for real execution! Try the quick actions above or type commands below.
                </div>
            </div>
            
            <div class="input-section">
                <input type="text" id="messageInput" placeholder="Tell Banks what to do... (e.g., 'open calculator', 'create a file', 'browse to google')" onkeypress="if(event.key==='Enter') sendMessage()">
                <button class="send-btn" onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>
    
    <div class="status-bar" id="statusBar">
        🟢 Banks Ready - Real Execution Mode
    </div>

    <script>
        const socket = io();
        
        socket.on('execution_result', function(data) {
            addMessage('execution', data.message, data.success);
            updateStatus(data.success ? '✅ Execution Complete' : '❌ Execution Failed');
        });
        
        socket.on('banks_response', function(data) {
            addMessage('banks', data.message);
            updateStatus('💭 Banks Response');
        });
        
        function addMessage(type, message, success = true) {
            const messages = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            
            if (type === 'user') {
                messageDiv.className = 'message user-message';
                messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
            } else if (type === 'banks') {
                messageDiv.className = 'message banks-message';
                messageDiv.innerHTML = `<strong>🤖 Banks:</strong> ${message}`;
            } else if (type === 'execution') {
                messageDiv.className = 'message execution-message';
                const icon = success ? '✅' : '❌';
                messageDiv.innerHTML = `<strong>${icon} Execution:</strong> ${message}`;
            } else {
                messageDiv.className = 'message system-message';
                messageDiv.innerHTML = message;
            }
            
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function updateStatus(status) {
            document.getElementById('statusBar').textContent = status;
            setTimeout(() => {
                document.getElementById('statusBar').textContent = '🟢 Banks Ready - Real Execution Mode';
            }, 3000);
        }
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            input.value = '';
            updateStatus('🔄 Processing...');
            
            socket.emit('user_message', {message: message});
        }
        
        function executeQuickAction(command) {
            addMessage('user', `Quick Action: ${command}`);
            updateStatus('⚡ Executing Quick Action...');
            socket.emit('quick_action', {command: command});
        }
        
        function createDemoProject() {
            addMessage('user', 'Create Demo Project (Multi-step workflow)');
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

@socketio.on('quick_action')
def handle_quick_action(data):
    command = data.get('command', '')
    
    try:
        # Execute real command
        result = operate_computer_system(command, BANKS_USER)
        
        success = result.get('success', False)
        message = result.get('message', result.get('error', 'Unknown result'))
        
        emit('execution_result', {
            'success': success,
            'message': f"Command '{command}': {message}",
            'command': command,
            'result': result
        })
        
    except Exception as e:
        emit('execution_result', {
            'success': False,
            'message': f"Error executing '{command}': {str(e)}",
            'command': command
        })

@socketio.on('user_message')
def handle_user_message(data):
    message = data.get('message', '')
    
    try:
        # Parse natural language into commands
        command = parse_natural_language_to_command(message)
        
        if command:
            # Execute the parsed command
            result = operate_computer_system(command, BANKS_USER)
            
            success = result.get('success', False)
            response = result.get('message', result.get('error', 'No response'))
            
            emit('execution_result', {
                'success': success,
                'message': f"Executed: {response}",
                'command': command,
                'result': result
            })
            
            # Send Banks response
            if success:
                banks_response = f"✅ Done! I successfully {get_action_description(command)}."
            else:
                banks_response = f"❌ Sorry, I couldn't {get_action_description(command)}. {response}"
            
            emit('banks_response', {'message': banks_response})
        else:
            # Fallback to AI response
            emit('banks_response', {
                'message': f"I understand you want: '{message}'. Let me try to help with that!"
            })
            
    except Exception as e:
        emit('execution_result', {
            'success': False,
            'message': f"Error processing message: {str(e)}"
        })

@socketio.on('demo_workflow')
def handle_demo_workflow(data):
    """Execute the multi-step demo workflow"""
    
    workflow_steps = [
        ("Create project folder", "create_demo_folder"),
        ("Open VS Code", "app:Visual Studio Code"),
        ("Create README file", "create_readme"),
        ("Show project folder", "show_demo_folder")
    ]
    
    try:
        for step_name, command in workflow_steps:
            emit('execution_result', {
                'success': True,
                'message': f"🔄 Step: {step_name}...",
                'command': command
            })
            
            # Execute step
            if command == "create_demo_folder":
                result = create_demo_project_folder()
            elif command == "create_readme":
                result = create_demo_readme()
            elif command == "show_demo_folder":
                result = show_demo_folder()
            else:
                result = operate_computer_system(command, BANKS_USER)
            
            success = result.get('success', False)
            message = result.get('message', result.get('error', 'Unknown result'))
            
            emit('execution_result', {
                'success': success,
                'message': f"✅ {step_name}: {message}" if success else f"❌ {step_name}: {message}",
                'command': command
            })
            
            # Small delay between steps
            socketio.sleep(1)
        
        # Final success message
        emit('banks_response', {
            'message': "🎯 Demo project workflow complete! Check your Desktop for the 'BanksWebDemo' folder."
        })
        
    except Exception as e:
        emit('execution_result', {
            'success': False,
            'message': f"Workflow error: {str(e)}"
        })

def parse_natural_language_to_command(message):
    """Parse natural language into executable commands"""
    message_lower = message.lower()
    
    # Application commands
    if 'open calculator' in message_lower or 'calculator' in message_lower:
        return 'app:calculator'
    elif 'open finder' in message_lower or 'finder' in message_lower:
        return 'app:finder'
    elif 'open terminal' in message_lower or 'terminal' in message_lower:
        return 'app:terminal'
    elif 'open vs code' in message_lower or 'vscode' in message_lower or 'visual studio' in message_lower:
        return 'app:Visual Studio Code'
    elif 'open chrome' in message_lower or 'chrome' in message_lower:
        return 'app:Google Chrome'
    
    # Web browsing
    elif 'browse' in message_lower or 'open website' in message_lower:
        if 'github' in message_lower:
            return 'browse:https://github.com'
        elif 'google' in message_lower:
            return 'browse:https://google.com'
    
    # System commands
    elif 'memory' in message_lower or 'ram' in message_lower:
        return 'system:memory_usage'
    elif 'disk' in message_lower or 'storage' in message_lower:
        return 'system:disk_usage'
    elif 'system info' in message_lower:
        return 'system:system_info'
    
    return None

def get_action_description(command):
    """Get friendly description of action"""
    if command.startswith('app:'):
        app = command.replace('app:', '')
        return f"opened {app}"
    elif command.startswith('browse:'):
        url = command.replace('browse:', '')
        return f"opened {url}"
    elif command.startswith('system:'):
        cmd = command.replace('system:', '')
        return f"checked {cmd.replace('_', ' ')}"
    else:
        return f"executed {command}"

def create_demo_project_folder():
    """Create demo project folder"""
    try:
        from pathlib import Path
        project_folder = Path.home() / "Desktop" / "BanksWebDemo"
        project_folder.mkdir(exist_ok=True)
        return {"success": True, "message": f"Created project folder: {project_folder}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def create_demo_readme():
    """Create demo README file"""
    try:
        from pathlib import Path
        from datetime import datetime
        
        project_folder = Path.home() / "Desktop" / "BanksWebDemo"
        readme_file = project_folder / "README.md"
        
        content = f"""# Banks Web Demo Project
Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 🚀 Created by Banks AI via Web Interface!

This project was created by Banks AI assistant through the web interface, demonstrating:

### Real Capabilities:
- ✅ Multi-step workflow execution
- ✅ Real file and folder creation
- ✅ Application control
- ✅ Web interface integration
- ✅ Live execution feedback

### What This Proves:
Banks is not just a chatbot - it's a real AI assistant that can:
- Control your desktop applications
- Create and manage files and folders
- Execute complex multi-step workflows
- Provide real-time feedback through the web interface

### Tomorrow's Enterprise Vision:
- Automated business processes
- Team workflow coordination
- Custom enterprise integrations
- Strategic analysis and reporting

🎯 Banks: Your AI productivity partner with REAL execution power!
"""
        
        with open(readme_file, "w") as f:
            f.write(content)
        
        return {"success": True, "message": f"Created README.md with project details"}
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
    print("🚀 BANKS WEB INTEGRATION")
    print("=" * 40)
    print("🌐 Starting web interface with REAL execution...")
    print("🔗 http://localhost:7777")
    print("⚡ Banks can now execute real commands via web interface!")
    print()
    
    socketio.run(app, host='0.0.0.0', port=7777, debug=True)
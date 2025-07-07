#!/usr/bin/env python3
"""
Agent-Banks Web Frontend
Flask-based web interface for Agent-Banks
"""

from flask import Flask, render_template_string, request, jsonify, send_from_directory
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import AI provider
try:
    from enhanced_ai_provider import MultiAIProvider
except ImportError:
    print("❌ Enhanced AI provider not found")
    exit(1)

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'agent-banks-secret-key')

# Initialize AI provider
ai_provider = MultiAIProvider()

# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 Agent-Banks - Personal AI Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .status-panel {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .status-item {
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
        }
        
        .status-item h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .status-available { border-left-color: #28a745; }
        .status-unavailable { border-left-color: #dc3545; }
        
        .chat-container {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            height: 500px;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            background: #f8f9fa;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 10px;
            max-width: 80%;
        }
        
        .user-message {
            background: #667eea;
            color: white;
            margin-left: auto;
        }
        
        .ai-message {
            background: white;
            border: 1px solid #e9ecef;
        }
        
        .input-area {
            display: flex;
            gap: 10px;
        }
        
        .input-area input {
            flex: 1;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 25px;
            font-size: 16px;
            outline: none;
        }
        
        .input-area input:focus {
            border-color: #667eea;
        }
        
        .send-btn {
            padding: 12px 25px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
        }
        
        .send-btn:hover {
            background: #5a6fd8;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .feature-card {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .loading {
            display: none;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Agent-Banks</h1>
            <p>Your Personal AI Assistant</p>
        </div>
        
        <div class="status-panel">
            <h2>System Status</h2>
            <div class="status-grid" id="statusGrid">
                <!-- Status items will be loaded here -->
            </div>
        </div>
        
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages">
                <div class="message ai-message">
                    <strong>🤖 Banks:</strong> Banks here. Ready to handle your business needs efficiently.
                    <br><br>
                    I can help you with:
                    <ul>
                        <li>🌐 Web automation and browsing</li>
                        <li>📧 Email drafting and communication</li>
                        <li>💼 Vendor management and orders</li>
                        <li>📝 Meeting notes and action items</li>
                        <li>🧠 Memory retrieval and conversation</li>
                    </ul>
                    <br>
                    <strong>🎭 Persona Commands:</strong>
                    <ul>
                        <li>Say "banks" or "agent banks" for professional assistance</li>
                        <li>Say "bella" or "hey bella" for friendly conversation</li>
                    </ul>
                </div>
            </div>
            
            <div class="input-area">
                <input type="text" id="messageInput" placeholder="Type your message here..." onkeypress="handleKeyPress(event)">
                <button class="send-btn" onclick="sendMessage()">Send</button>
            </div>
            <div class="loading" id="loading">🤖 Agent-Banks is thinking...</div>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <h3>🧠 AI Powered</h3>
                <p>Anthropic Claude + OpenRouter fallback</p>
            </div>
            <div class="feature-card">
                <h3>🌐 Web Automation</h3>
                <p>Browserbase + Playwright integration</p>
            </div>
            <div class="feature-card">
                <h3>🎙️ Voice Ready</h3>
                <p>ElevenLabs + OpenAI TTS/STT</p>
            </div>
            <div class="feature-card">
                <h3>💼 Business Ready</h3>
                <p>Vendor management & MCP integration</p>
            </div>
        </div>
    </div>

    <script>
        // Load system status
        fetch('/status')
            .then(response => response.json())
            .then(data => {
                const statusGrid = document.getElementById('statusGrid');
                statusGrid.innerHTML = '';
                
                Object.entries(data).forEach(([category, info]) => {
                    const statusClass = info.available ? 'status-available' : 'status-unavailable';
                    const statusIcon = info.available ? '✅' : '❌';
                    
                    statusGrid.innerHTML += `
                        <div class="status-item ${statusClass}">
                            <h3>${statusIcon} ${category}</h3>
                            <p>${info.details}</p>
                        </div>
                    `;
                });
            });
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage(message, 'user');
            input.value = '';
            
            // Show loading
            document.getElementById('loading').style.display = 'block';
            
            // Send to AI
            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('loading').style.display = 'none';
                addMessage(data.response, 'ai');
            })
            .catch(error => {
                document.getElementById('loading').style.display = 'none';
                addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            });
        }
        
        function addMessage(text, sender) {
            const messagesContainer = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            if (sender === 'ai') {
                // Get current persona from status
                fetch('/status')
                    .then(response => response.json())
                    .then(data => {
                        const currentPersona = data["Current Persona"]?.details?.includes("Banks") ? "Banks" : "Bella";
                        const emoji = currentPersona === "Banks" ? "💼" : "✨";
                        messageDiv.innerHTML = `<strong>${emoji} ${currentPersona}:</strong> ${text}`;
                    })
                    .catch(() => {
                        messageDiv.innerHTML = `<strong>🤖 AI:</strong> ${text}`;
                    });
            } else {
                messageDiv.innerHTML = `<strong>👤 You:</strong> ${text}`;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/status')
def status():
    """Get system status for display"""
    persona_info = ai_provider.get_current_persona_info()
    
    status_info = {
        "Current Persona": {
            "available": True,
            "details": f"Active: {persona_info['name']} - {persona_info['personality'][:50]}..."
        },
        "AI Provider": {
            "available": ai_provider.current_provider is not None,
            "details": f"Primary: {ai_provider.current_provider.value if ai_provider.current_provider else 'None'}"
        },
        "Browser Automation": {
            "available": False,  # Will be updated when browserbase is available
            "details": "Playwright fallback ready"
        },
        "Voice System": {
            "available": False,  # Will be updated when voice is available
            "details": "Voice integration pending"
        },
        "Memory System": {
            "available": True,
            "details": "Local conversation memory active"
        }
    }
    return jsonify(status_info)

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Process with AI provider
        response = ai_provider.process_message(user_message)
        
        return jsonify({"response": response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Agent-Banks Web Interface...")
    print(f"🌐 Access at: http://localhost:5000")
    print("🎯 Features: AI Chat, Status Monitoring, Web UI")
    
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'false').lower() == 'true'
    )
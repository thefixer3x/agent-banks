#!/usr/bin/env python3
"""
Simple Claude's Realm IDE with Memory Integration
Web-only version without tkinter dependencies
"""

import os
import sys
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from flask import Flask, render_template_string, request, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import our enhanced modules
from claude_mcp_connector import ClaudeMCPConnector, EnhancedClaudeRealmMCP
from enhanced_memory_client import SDGhostMemoryClient

class SimpleClaudeRealm:
    """Simple Claude's Realm IDE with real Claude CLI and memory"""
    
    def __init__(self):
        print("🔮 Agent-Banks IDE - Memory Enhanced")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
        # Initialize components
        self.claude_connector = ClaudeMCPConnector()
        self.memory_client = SDGhostMemoryClient()
        self.app = Flask(__name__)
        
        # Setup routes
        self.setup_routes()
        
    def setup_routes(self):
        """Setup web interface routes"""
        
        @self.app.route('/')
        def index():
            return render_template_string(CLAUDE_REALM_HTML)
        
        @self.app.route('/api/memory_chat', methods=['POST'])
        def memory_enhanced_chat():
            """Chat with Claude enhanced by memory via MCP"""
            data = request.get_json()
            message = data.get('message', '')
            context = data.get('context', {})
            
            if not message:
                return jsonify({"error": "No message provided"})
            
            try:
                # Enhanced chat with memory via MCP
                response = asyncio.run(
                    self.claude_connector.chat_with_claude_mcp(message, context)
                )
                
                return jsonify({
                    "response": response,
                    "source": "claude_mcp_with_memory",
                    "session_id": self.claude_connector.session_id,
                    "timestamp": time.time(),
                    "memory_enabled": True,
                    "connection_type": "MCP"
                })
                
            except Exception as e:
                return jsonify({"error": f"Chat error: {str(e)}"})
        
        @self.app.route('/api/memory_stats', methods=['GET'])
        def memory_stats():
            """Get memory statistics"""
            try:
                stats = asyncio.run(self.memory_client.get_memory_stats())
                return jsonify(stats)
            except Exception as e:
                return jsonify({"error": f"Stats error: {str(e)}"})
        
        @self.app.route('/api/test_connections', methods=['GET'])
        def test_connections():
            """Test all connections"""
            claude_connected = self.claude_connector.is_connected()
            memory_connected = asyncio.run(self.memory_client.check_sd_ghost_connection())
            
            # Test local storage
            local_storage_ok = True
            try:
                import sqlite3
                conn = sqlite3.connect(self.memory_client.local_db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM memories")
                local_count = cursor.fetchone()[0]
                conn.close()
            except Exception as e:
                local_storage_ok = False
                local_count = 0
            
            return jsonify({
                "claude_mcp": {
                    "connected": claude_connected,
                    "connection_type": "MCP (Model Context Protocol)",
                    "model": self.claude_connector.config["model"],
                    "api_key_available": bool(self.claude_connector.api_key)
                },
                "memory_service": {
                    "connected": memory_connected,
                    "local_backup": local_storage_ok,
                    "local_memories": local_count
                },
                "session_id": self.claude_connector.session_id
            })
    
    def run(self, host='0.0.0.0', port=8888, debug=True):
        """Run the Claude Realm IDE"""
        print(f"\n🌟 Agent-Banks IDE is ready!")
        print(f"🌐 Access portal: http://localhost:{port}")
        print(f"🧠 Memory integration: Enabled")
        print(f"⚡ Claude MCP: {'Connected' if self.claude_connector.is_connected() else 'Disconnected'}")
        print("\n✨ Features:")
        print("   • Real Claude MCP integration with persistent memory")
        print("   • SD-Ghost Protocol memory service (first client)")
        print("   • Local SQLite backup for offline functionality")
        print("   • Conversation, code analysis, and insight storage")
        print("   • Model Context Protocol integration pattern")
        print()
        
        self.app.run(host=host, port=port, debug=debug)

# HTML Template for Claude's Realm IDE
CLAUDE_REALM_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude's Realm IDE - Memory Enhanced</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: #e4e4e7;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .status-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .status-card h3 {
            color: #60a5fa;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .chat-container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            height: 600px;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .message {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 10px;
            max-width: 80%;
        }
        
        .message.user {
            background: linear-gradient(45deg, #3b82f6, #1d4ed8);
            margin-left: auto;
            text-align: right;
        }
        
        .message.claude {
            background: linear-gradient(45deg, #7c3aed, #5b21b6);
            margin-right: auto;
        }
        
        .message .meta {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        
        .chat-input {
            display: flex;
            gap: 10px;
        }
        
        .chat-input input {
            flex: 1;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.1);
            color: #e4e4e7;
            font-size: 1rem;
        }
        
        .chat-input input::placeholder {
            color: rgba(228, 228, 231, 0.5);
        }
        
        .chat-input button {
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(45deg, #3b82f6, #1d4ed8);
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .chat-input button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
        }
        
        .chat-input button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-connected {
            background-color: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }
        
        .status-disconnected {
            background-color: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }
        
        .memory-stats {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 10px;
            margin-top: 10px;
        }
        
        .loading {
            display: inline-block;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .feature-badge {
            display: inline-block;
            background: rgba(96, 165, 250, 0.2);
            color: #60a5fa;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            margin: 2px;
            border: 1px solid rgba(96, 165, 250, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔮 Agent-Banks IDE</h1>
            <p>Memory-Enhanced AI Development Environment</p>
            <div style="margin-top: 15px;">
                <span class="feature-badge">🧠 SD-Ghost Protocol Memory</span>
                <span class="feature-badge">⚡ Banks MCP Connection</span>
                <span class="feature-badge">💾 Local Backup</span>
                <span class="feature-badge">🔄 Model Context Protocol</span>
            </div>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h3>🤖 Banks MCP Status</h3>
                <div id="claude-status">
                    <span class="loading">Checking MCP connection...</span>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🧠 Memory Service</h3>
                <div id="memory-status">
                    <span class="loading">Checking memory...</span>
                </div>
            </div>
            
            <div class="status-card">
                <h3>📊 Memory Statistics</h3>
                <div id="memory-stats">
                    <span class="loading">Loading stats...</span>
                </div>
            </div>
        </div>
        
        <div class="chat-container">
            <h3 style="color: #60a5fa; margin-bottom: 15px;">💬 Chat with Banks (Memory Enhanced)</h3>
            <div class="chat-messages" id="chat-messages">
                <div class="message claude">
                    <div class="meta">Banks • Memory System Online</div>
                    <div>Welcome to Agent-Banks IDE! I'm Banks, your professional AI assistant connected with persistent memory via SD-Ghost Protocol. I can remember our conversations, code analyses, and insights across sessions. How can I help you today?</div>
                </div>
            </div>
            <div class="chat-input">
                <input type="text" id="message-input" placeholder="Ask Banks anything... (memory-enhanced)" onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()" id="send-btn">Send</button>
            </div>
        </div>
    </div>

    <script>
        let isLoading = false;

        // Load initial status
        window.onload = function() {
            checkConnections();
            loadMemoryStats();
        };

        async function checkConnections() {
            try {
                const response = await fetch('/api/test_connections');
                const data = await response.json();
                
                // Claude MCP Status
                const claudeStatus = document.getElementById('claude-status');
                if (data.claude_mcp.connected) {
                    claudeStatus.innerHTML = `
                        <span class="status-indicator status-connected"></span>
                        MCP Connected: ${data.claude_mcp.model}
                        <div style="margin-top: 5px; font-size: 0.9rem; opacity: 0.8;">
                            Real Claude via ${data.claude_mcp.connection_type}
                        </div>
                    `;
                } else {
                    claudeStatus.innerHTML = `
                        <span class="status-indicator status-disconnected"></span>
                        MCP Not Connected
                        <div style="margin-top: 5px; font-size: 0.9rem; opacity: 0.8;">
                            Check API key configuration
                        </div>
                    `;
                }
                
                // Memory Status
                const memoryStatus = document.getElementById('memory-status');
                if (data.memory_service.connected) {
                    memoryStatus.innerHTML = `
                        <span class="status-indicator status-connected"></span>
                        SD-Ghost Protocol Connected
                        <div style="margin-top: 5px; font-size: 0.9rem; opacity: 0.8;">
                            Persistent memory active
                        </div>
                    `;
                } else {
                    memoryStatus.innerHTML = `
                        <span class="status-indicator status-disconnected"></span>
                        Using Local Storage
                        <div style="margin-top: 5px; font-size: 0.9rem; opacity: 0.8;">
                            SQLite backup active
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error('Connection check failed:', error);
            }
        }

        async function loadMemoryStats() {
            try {
                const response = await fetch('/api/memory_stats');
                const data = await response.json();
                
                const statsDiv = document.getElementById('memory-stats');
                statsDiv.innerHTML = `
                    <div class="memory-stats">
                        Session: ${data.session_id.substring(0, 8)}...<br>
                        Local Memories: ${data.local_memories.total}<br>
                        Types: ${Object.keys(data.local_memories.by_type).join(', ')}<br>
                        SD-Ghost: ${data.sd_ghost_connected ? 'Connected' : 'Offline'}
                    </div>
                `;
                
            } catch (error) {
                console.error('Stats loading failed:', error);
                document.getElementById('memory-stats').innerHTML = 'Stats unavailable';
            }
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter' && !isLoading) {
                sendMessage();
            }
        }

        async function sendMessage() {
            if (isLoading) return;
            
            const input = document.getElementById('message-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            isLoading = true;
            const sendBtn = document.getElementById('send-btn');
            sendBtn.disabled = true;
            sendBtn.textContent = 'Thinking...';
            
            // Add user message to chat
            addMessage('user', message);
            input.value = '';
            
            try {
                const response = await fetch('/api/memory_chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        context: {
                            workspace: 'claude_realm_ide',
                            timestamp: Date.now()
                        }
                    }),
                });
                
                const data = await response.json();
                
                if (data.error) {
                    addMessage('claude', `Error: ${data.error}`, 'Error');
                } else {
                    addMessage('claude', data.response, data.source);
                    // Refresh memory stats after conversation
                    loadMemoryStats();
                }
                
            } catch (error) {
                addMessage('claude', `Connection error: ${error.message}`, 'Error');
            } finally {
                isLoading = false;
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
            }
        }

        function addMessage(sender, content, source = '') {
            const messagesDiv = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            
            const timestamp = new Date().toLocaleTimeString();
            const meta = source ? `${sender} • ${source} • ${timestamp}` : `${sender} • ${timestamp}`;
            
            messageDiv.innerHTML = `
                <div class="meta">${meta}</div>
                <div>${content}</div>
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Refresh connections periodically
        setInterval(checkConnections, 30000);
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    realm = SimpleClaudeRealm()
    realm.run(port=8888)
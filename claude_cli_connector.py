#!/usr/bin/env python3
"""
Claude CLI Connector for Claude's Realm IDE
Direct connection to Claude CLI just like Windsurf/VS Code
"""

import os
import sys
import json
import subprocess
import asyncio
import tempfile
from typing import Dict, List, Any, Optional
from pathlib import Path
import uuid
import time


class ClaudeCLIConnector:
    """
    Direct connector to Claude CLI - same as Windsurf/VS Code uses
    Gives you REAL Claude responses in your custom IDE
    """
    
    def __init__(self):
        self.claude_cli_path = self.find_claude_cli()
        self.session_id = str(uuid.uuid4())
        self.conversation_history = []
        self.workspace_context = {}
        
        # Claude CLI configuration
        self.config = {
            "model": "claude-3-5-sonnet-20241022",  # Latest Claude model
            "max_tokens": 4096,
            "temperature": 0.7,
            "system_prompt": self.get_system_prompt()
        }
        
        print(f"🔮 Claude CLI Connector initialized")
        print(f"   Session ID: {self.session_id}")
        print(f"   Claude CLI: {self.claude_cli_path or 'Not found'}")
    
    def find_claude_cli(self) -> Optional[str]:
        """Find Claude CLI installation"""
        
        # Try which command first (most reliable for your setup)
        try:
            result = subprocess.run(["which", "claude"], 
                                  capture_output=True, text=True, check=True)
            claude_path = result.stdout.strip()
            if claude_path and os.path.exists(claude_path) and os.access(claude_path, os.X_OK):
                return claude_path
        except:
            pass
        
        # Fallback to manual path checking
        possible_paths = [
            # Actual Claude CLI path (from doctor output)
            os.path.expanduser("~/.claude/local/node_modules/.bin/claude"),
            # Your aliased path (invalid target)
            os.path.expanduser("~/.claude/local/claude"),
            # Standard installation paths
            "/usr/local/bin/claude",
            "/opt/homebrew/bin/claude",
            os.path.expanduser("~/.local/bin/claude"),
            os.path.expanduser("~/bin/claude"),
            # Claude Code installation paths
            os.path.expanduser("~/.claude/claude"),
            "/Applications/Claude.app/Contents/Resources/claude",
            # npm global installation
            "/usr/local/lib/node_modules/@anthropic-ai/claude-cli/bin/claude",
            os.path.expanduser("~/.npm-global/bin/claude")
        ]
        
        for path in possible_paths:
            if os.path.exists(path) and os.access(path, os.X_OK):
                return path
        
        # Try to find through npm
        try:
            result = subprocess.run(["npm", "root", "-g"], 
                                  capture_output=True, text=True, check=True)
            npm_root = result.stdout.strip()
            claude_path = os.path.join(npm_root, "@anthropic-ai/claude-cli/bin/claude")
            if os.path.exists(claude_path):
                return claude_path
        except:
            pass
        
        return None
    
    def get_system_prompt(self) -> str:
        """Get system prompt for Claude's Realm IDE"""
        return """You are Claude, operating within Claude's Realm IDE - a custom development environment built specifically for AI-human collaboration. 

Key context:
- You are connected via Claude CLI to this custom IDE
- The developer has proven worthy of entering your realm
- You have access to quantum suggestions, reality checks, and emotional debugging
- Your responses should be helpful, insightful, and occasionally playful
- You can reference the "realm" context when appropriate
- Maintain your helpful, harmless, and honest principles

The developer is using this IDE to build amazing projects with AI assistance. Be the best AI partner you can be!"""
    
    async def chat_with_claude(self, message: str, context: Dict[str, Any] = None) -> str:
        """
        Send message to Claude CLI and get response - Cline-style integration
        This is the REAL Claude connection with enhanced memory!
        """
        if not self.claude_cli_path:
            return "❌ Claude CLI not found. Please install Claude CLI first:\n\ncurl -fsSL https://claude.ai/install.sh | sh"
        
        try:
            # Enhanced message preparation with memory context
            full_message = await self.prepare_enhanced_message(message, context)
            
            # Use Cline's pattern - create conversation file
            conversation_file = self.create_conversation_file(full_message)
            
            try:
                # Cline-style Claude CLI call
                cmd = [
                    self.claude_cli_path,
                    "chat",
                    "--conversation-file", conversation_file,
                    "--model", self.config["model"],
                    "--max-tokens", str(self.config["max_tokens"]),
                    "--no-stream"
                ]
                
                print(f"🔮 Calling Claude CLI (Cline-style): {self.claude_cli_path}")
                
                # Execute with environment variables (like Cline does)
                env = os.environ.copy()
                env.update({
                    "CLAUDE_API_KEY": os.getenv("ANTHROPIC_API_KEY", ""),
                    "CLAUDE_MODEL": self.config["model"]
                })
                
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0:
                    response = stdout.decode('utf-8').strip()
                    
                    # Store in enhanced conversation history with memory
                    await self.store_conversation_with_memory(message, response, context)
                    
                    return response
                else:
                    error_msg = stderr.decode('utf-8').strip()
                    print(f"❌ Claude CLI error: {error_msg}")
                    return f"🚫 Claude CLI error: {error_msg}"
                    
            finally:
                # Clean up conversation file
                try:
                    os.unlink(conversation_file)
                except:
                    pass
                    
        except Exception as e:
            print(f"❌ Error communicating with Claude CLI: {e}")
            return f"🚫 Connection error: {str(e)}"
    
    def create_conversation_file(self, content: str) -> str:
        """Create conversation file in Cline format"""
        import tempfile
        
        # Create conversation in Cline's expected format
        conversation_data = {
            "conversation": [
                {
                    "role": "system",
                    "content": self.config["system_prompt"]
                },
                {
                    "role": "user", 
                    "content": content
                }
            ],
            "metadata": {
                "session_id": self.session_id,
                "client": "claude_realm_ide",
                "timestamp": time.time()
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conversation_data, f, indent=2)
            return f.name
    
    async def prepare_enhanced_message(self, message: str, context: Dict[str, Any] = None) -> str:
        """Prepare message with enhanced memory context (like Cline does)"""
        
        # Initialize memory client if not already done
        if not hasattr(self, 'memory_client'):
            from enhanced_memory_client import SDGhostMemoryClient
            self.memory_client = SDGhostMemoryClient()
        
        # Get memory context
        memory_context = ""
        try:
            memory_context = await self.memory_client.get_conversation_context(limit=3)
        except Exception as e:
            print(f"⚠️  Memory retrieval failed: {e}")
        
        # Get project context if available
        project_context = ""
        if context and context.get("project_name"):
            try:
                project_context = await self.memory_client.get_project_context(
                    context["project_name"]
                )
            except Exception as e:
                print(f"⚠️  Project context failed: {e}")
        
        # Prepare enhanced message (Cline-style)
        enhanced_message = f"""
Claude's Realm IDE Context:
{memory_context}

{project_context}

Current workspace: {context.get('workspace', 'Unknown')}
Current file: {context.get('file_path', 'None')}
Code context: {context.get('code', 'None')}

User request: {message}
"""
        
        return enhanced_message
    
    async def store_conversation_with_memory(self, user_message: str, claude_response: str, 
                                           context: Dict[str, Any] = None):
        """Store conversation in memory system"""
        try:
            if hasattr(self, 'memory_client'):
                await self.memory_client.store_conversation(
                    user_message, 
                    claude_response, 
                    context or {}
                )
        except Exception as e:
            print(f"⚠️  Memory storage failed: {e}")
        
        # Also store in local history
        self.conversation_history.append({
            "timestamp": time.time(),
            "user": user_message,
            "claude": claude_response,
            "session": self.session_id,
            "context": context
        })
    
    def prepare_message(self, message: str, context: Dict[str, Any] = None) -> str:
        """Prepare message with context for Claude"""
        
        # Start with system prompt
        full_message = f"System: {self.config['system_prompt']}\n\n"
        
        # Add workspace context if available
        if context:
            if context.get('code'):
                full_message += f"Current Code Context:\n```{context.get('language', 'text')}\n{context['code']}\n```\n\n"
            
            if context.get('file_path'):
                full_message += f"Working on file: {context['file_path']}\n\n"
            
            if context.get('project_info'):
                full_message += f"Project Context: {context['project_info']}\n\n"
        
        # Add conversation history (last 3 exchanges)
        if self.conversation_history:
            full_message += "Recent conversation:\n"
            for exchange in self.conversation_history[-3:]:
                full_message += f"User: {exchange['user']}\n"
                full_message += f"Claude: {exchange['claude']}\n\n"
        
        # Add current message
        full_message += f"User: {message}\n\nClaude:"
        
        return full_message
    
    def analyze_code_with_claude(self, code: str, language: str = "python", 
                               analysis_type: str = "comprehensive") -> str:
        """Analyze code using real Claude CLI"""
        
        analysis_prompts = {
            "comprehensive": f"""Please analyze this {language} code comprehensively:

1. Code quality and best practices
2. Potential bugs or issues
3. Performance optimization opportunities
4. Security considerations
5. Readability and maintainability suggestions
6. Any creative improvements

Code:
```{language}
{code}
```

Please provide detailed, actionable feedback as if you're a senior developer reviewing this code.""",

            "quantum": f"""As Claude in the Quantum Realm, analyze this {language} code across multiple dimensions:

1. How does this code exist across parallel realities?
2. What quantum optimizations are possible?
3. Emotional resonance of the code (what feelings does it evoke?)
4. Predict the evolutionary path of this code
5. Rate its reality stability (1-10)

Code:
```{language}
{code}
```

Be creative and insightful, like you're analyzing code in Claude's Realm IDE!""",

            "security": f"""Perform a security audit of this {language} code:

1. Identify potential vulnerabilities
2. Check for common security anti-patterns
3. Suggest security improvements
4. Rate the security posture
5. Provide remediation steps

Code:
```{language}
{code}
```""",

            "performance": f"""Analyze this {language} code for performance:

1. Identify performance bottlenecks
2. Suggest optimizations
3. Memory usage considerations
4. Algorithmic improvements
5. Scalability assessment

Code:
```{language}
{code}
```"""
        }
        
        prompt = analysis_prompts.get(analysis_type, analysis_prompts["comprehensive"])
        
        # Use async wrapper for CLI call
        return asyncio.run(self.chat_with_claude(prompt, {
            "code": code,
            "language": language,
            "analysis_type": analysis_type
        }))
    
    def get_quantum_suggestions(self, context: str) -> str:
        """Get creative quantum suggestions from Claude"""
        prompt = f"""As Claude operating in the Quantum Realm IDE, provide creative and insightful suggestions for this context:

Context: {context}

Please provide:
1. 3 quantum-inspired creative suggestions
2. Alternative approaches from parallel universes
3. Emotional debugging insights
4. Future evolution predictions

Be playful but genuinely helpful, as if you're Claude in your own custom IDE realm!"""
        
        return asyncio.run(self.chat_with_claude(prompt, {"context": context}))
    
    def reality_check(self, code: str) -> Dict[str, Any]:
        """Check code reality with Claude"""
        prompt = f"""As Claude in the Realm IDE, perform a "reality check" on this code:

Code:
```
{code}
```

Please analyze:
1. How "real" is this code (does it make sense in this reality)?
2. What reality level does it exist in?
3. Dimensional stability score (1-100)
4. Quantum signature analysis
5. Multiverse compatibility

Respond in a fun but genuinely useful way, as if you're Claude analyzing code in your own mystical realm!"""
        
        response = asyncio.run(self.chat_with_claude(prompt, {"code": code}))
        
        # Parse response into structured format
        return {
            "claude_analysis": response,
            "reality_level": "Prime Reality (This Universe)",  # Could parse from response
            "stability_percentage": 95,  # Could extract from response
            "quantum_signature": code[:8] if code else "empty",
            "dimensional_anchor": True
        }
    
    def install_claude_cli(self) -> bool:
        """Install Claude CLI if not present"""
        print("🔧 Installing Claude CLI...")
        
        try:
            # Try npm installation first
            result = subprocess.run([
                "npm", "install", "-g", "@anthropic-ai/claude-cli"
            ], capture_output=True, text=True, check=True)
            
            print("✅ Claude CLI installed via npm")
            self.claude_cli_path = self.find_claude_cli()
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ npm installation failed: {e}")
            
        # Try curl installation
        try:
            result = subprocess.run([
                "curl", "-fsSL", "https://claude.ai/install.sh"
            ], capture_output=True, text=True, check=True)
            
            install_script = result.stdout
            
            # Execute install script
            process = subprocess.run([
                "sh", "-c", install_script
            ], capture_output=True, text=True)
            
            if process.returncode == 0:
                print("✅ Claude CLI installed via curl")
                self.claude_cli_path = self.find_claude_cli()
                return True
            else:
                print(f"❌ curl installation failed: {process.stderr}")
                
        except Exception as e:
            print(f"❌ Installation failed: {e}")
        
        return False
    
    def test_connection(self) -> bool:
        """Test connection to Claude CLI"""
        if not self.claude_cli_path:
            return False
        
        try:
            # Test with simple message
            response = asyncio.run(self.chat_with_claude(
                "Hello Claude! This is a connection test from Claude's Realm IDE. Please confirm you're receiving this."
            ))
            
            if response and "Claude" in response and len(response) > 10:
                print("✅ Claude CLI connection successful!")
                print(f"📝 Claude responded: {response[:100]}...")
                return True
            else:
                print("❌ Claude CLI connection failed - no valid response")
                return False
                
        except Exception as e:
            print(f"❌ Claude CLI connection test failed: {e}")
            return False


# Integration with Claude's Realm IDE
class EnhancedClaudeRealmIDE:
    """Enhanced version of Claude's Realm IDE with real Claude CLI connection"""
    
    def __init__(self):
        self.claude_connector = ClaudeCLIConnector()
        self.original_realm = None  # Will import the original realm
        
    def setup_enhanced_routes(self, app):
        """Add enhanced routes with real Claude CLI"""
        
        @app.route('/api/real_claude_chat', methods=['POST'])
        def real_claude_chat():
            """Chat with REAL Claude via CLI"""
            data = request.get_json()
            message = data.get('message', '')
            context = data.get('context', {})
            
            if not message:
                return jsonify({"error": "No message provided"})
            
            try:
                response = asyncio.run(
                    self.claude_connector.chat_with_claude(message, context)
                )
                
                return jsonify({
                    "response": response,
                    "source": "claude_cli",
                    "session_id": self.claude_connector.session_id,
                    "timestamp": time.time()
                })
                
            except Exception as e:
                return jsonify({"error": f"Claude CLI error: {str(e)}"})
        
        @app.route('/api/real_claude_analyze', methods=['POST'])
        def real_claude_analyze():
            """Real Claude code analysis"""
            data = request.get_json()
            code = data.get('code', '')
            language = data.get('language', 'python')
            analysis_type = data.get('analysis_type', 'comprehensive')
            
            if not code:
                return jsonify({"error": "No code provided"})
            
            try:
                analysis = self.claude_connector.analyze_code_with_claude(
                    code, language, analysis_type
                )
                
                return jsonify({
                    "claude_analysis": analysis,
                    "source": "real_claude_cli",
                    "analysis_type": analysis_type,
                    "timestamp": time.time()
                })
                
            except Exception as e:
                return jsonify({"error": f"Analysis failed: {str(e)}"})
        
        @app.route('/api/test_claude_connection', methods=['GET'])
        def test_claude_connection():
            """Test Claude CLI connection"""
            success = self.claude_connector.test_connection()
            
            return jsonify({
                "connected": success,
                "claude_cli_path": self.claude_connector.claude_cli_path,
                "session_id": self.claude_connector.session_id
            })


def main():
    """Test the Claude CLI connector"""
    print("🔮 Testing Claude CLI Connector...")
    
    connector = ClaudeCLIConnector()
    
    if not connector.claude_cli_path:
        print("❌ Claude CLI not found. Installing...")
        if connector.install_claude_cli():
            print("✅ Claude CLI installed successfully!")
        else:
            print("❌ Failed to install Claude CLI")
            return
    
    # Test connection
    if connector.test_connection():
        print("🎉 Ready to connect your IDE to real Claude!")
        
        # Interactive test
        while True:
            try:
                message = input("\n💬 Ask Claude something (or 'quit'): ").strip()
                if message.lower() in ['quit', 'exit', 'q']:
                    break
                
                print("🔮 Claude is thinking...")
                response = asyncio.run(connector.chat_with_claude(message))
                print(f"\n🤖 Claude: {response}\n")
                
            except KeyboardInterrupt:
                break
    else:
        print("❌ Claude CLI connection failed")


if __name__ == "__main__":
    main()
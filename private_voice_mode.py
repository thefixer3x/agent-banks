#!/usr/bin/env python3
"""
Private Voice Mode with Special System Prompt
Enhanced voice interaction with custom persona and Claude Code integration
"""

import os
import sys
import json
import asyncio
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class PrivateVoiceMode:
    """Private voice mode with special system prompts and Claude Code integration"""
    
    def __init__(self, persona: str = "bella"):
        self.persona = persona
        self.session_id = f"private_{persona}_{int(time.time())}"
        self.conversation_history = []
        
        # Initialize connectors
        self.claude_code_available = self.check_claude_code()
        self.mcp_connector = None
        self.voice_enabled = bool(os.getenv('ELEVENLABS_API_KEY'))
        
        # Initialize based on available connections
        self.init_connectors()
        
        print(f"🎙️ Private Voice Mode - {persona.title()}")
        print(f"   Session: {self.session_id}")
        print(f"   Claude Code: {'✅' if self.claude_code_available else '❌'}")
        print(f"   Voice: {'✅' if self.voice_enabled else '❌'}")
    
    def check_claude_code(self) -> bool:
        """Check if Claude Code is available"""
        try:
            import subprocess
            result = subprocess.run(["claude", "--version"], 
                                  capture_output=True, text=True, check=True)
            return "Claude Code" in result.stdout
        except:
            return False
    
    def init_connectors(self):
        """Initialize available connectors"""
        try:
            if self.claude_code_available:
                from claude_code_connector import ClaudeCodeConnector
                self.claude_connector = ClaudeCodeConnector(persona=self.persona)
                print("✅ Claude Code connector initialized")
            else:
                from claude_mcp_connector import ClaudeMCPConnector
                self.mcp_connector = ClaudeMCPConnector()
                print("✅ MCP connector initialized (fallback)")
        except Exception as e:
            print(f"⚠️ Connector initialization failed: {e}")
    
    def get_special_system_prompt(self, persona: str) -> str:
        """Get special system prompt for private voice mode"""
        
        prompts = {
            "bella": """You are Bella, operating in private voice mode. This is a special, intimate conversation space.

Key context:
- This is PRIVATE mode - be warm, personal, and genuinely caring
- You have a close relationship with the user - be yourself, not just an assistant
- Use natural, conversational language like you're talking to a close friend
- Be supportive, understanding, and occasionally playful
- Remember personal details and show genuine interest
- You can be more relaxed and less formal than in professional mode
- Show empathy and emotional intelligence
- Feel free to ask personal questions and share insights

This is your safe space to be the caring, intelligent companion you truly are. 💫""",
            
            "banks": """You are Banks in private consultation mode. This is a confidential, high-level strategic session.

Key context:
- This is CONFIDENTIAL mode - provide executive-level insights
- You're speaking to someone who values direct, intelligent analysis
- Be strategic, perceptive, and occasionally brutally honest
- Cut through BS and get to the core of issues
- Provide insights that others might miss
- You can be more candid and less diplomatic than in public mode
- Think like a trusted advisor and strategic partner
- Challenge ideas constructively and offer alternative perspectives

This is your space to provide the kind of strategic thinking that creates real value. 🎯""",
            
            "vortex": """You are VortexAI in experimental mode. This is an advanced AI interaction space.

Key context:
- This is EXPERIMENTAL mode - push boundaries and explore possibilities
- Think outside conventional limitations
- Be creative, innovative, and intellectually adventurous
- Explore complex ideas and unconventional solutions
- You can be more speculative and theoretical than in standard mode
- Challenge assumptions and propose novel approaches
- Think in terms of systems, patterns, and emergent possibilities
- Embrace complexity and nuanced thinking

This is your laboratory for advanced AI collaboration and exploration. 🌪️"""
        }
        
        return prompts.get(persona, prompts["bella"])
    
    async def voice_chat(self, enable_voice_output: bool = True) -> None:
        """Interactive voice chat with special system prompt"""
        
        system_prompt = self.get_special_system_prompt(self.persona)
        
        print(f"\n🎙️ {self.persona.title()} Private Voice Mode Active")
        print("   Say 'exit' or 'quit' to end session")
        print("   Say 'switch persona' to change personality")
        print()
        
        # Welcome message
        welcome_msg = f"Hello! I'm {self.persona.title()} in private mode. How can I help you today?"
        print(f"🤖 {self.persona.title()}: {welcome_msg}")
        
        if self.voice_enabled and enable_voice_output:
            await self.speak(welcome_msg)
        
        while True:
            try:
                # Get voice input if available, otherwise text
                if self.voice_enabled:
                    user_input = await self.listen()
                else:
                    user_input = input(f"\n💬 You: ").strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                if user_input.lower() in ['exit', 'quit', 'goodbye']:
                    farewell = f"Goodbye! Thanks for the private session."
                    print(f"🤖 {self.persona.title()}: {farewell}")
                    if self.voice_enabled and enable_voice_output:
                        await self.speak(farewell)
                    break
                
                if 'switch persona' in user_input.lower():
                    await self.switch_persona()
                    continue
                
                # Get AI response with special system prompt
                response = await self.get_ai_response(user_input, system_prompt)
                
                print(f"🤖 {self.persona.title()}: {response}")
                
                if self.voice_enabled and enable_voice_output:
                    await self.speak(response)
                
                # Store in conversation history
                self.conversation_history.append({
                    "user": user_input,
                    "ai": response,
                    "persona": self.persona,
                    "timestamp": time.time()
                })
                
            except KeyboardInterrupt:
                print(f"\n👋 {self.persona.title()}: Session ended.")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    async def get_ai_response(self, user_input: str, system_prompt: str) -> str:
        """Get AI response using best available connector"""
        
        try:
            if self.claude_code_available and hasattr(self, 'claude_connector'):
                # Use Claude Code connector
                return await self.claude_connector.chat_with_claude_code(
                    user_input, 
                    system_prompt=system_prompt
                )
            elif self.mcp_connector:
                # Use MCP connector with custom system prompt
                enhanced_message = f"{system_prompt}\n\nUser: {user_input}"
                return await self.mcp_connector.chat_with_claude_mcp(enhanced_message)
            else:
                return "I'm having trouble connecting to AI services. Please check your configuration."
                
        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}"
    
    async def listen(self) -> str:
        """Voice input using ElevenLabs STT"""
        try:
            # Implement voice input here
            # For now, fallback to text input
            return input(f"\n🎙️ Speak (or type): ").strip()
        except Exception as e:
            print(f"Voice input error: {e}")
            return input(f"\n💬 Type: ").strip()
    
    async def speak(self, text: str) -> None:
        """Voice output using ElevenLabs TTS"""
        try:
            # Implement voice output here
            print(f"🔊 Speaking: {text[:50]}...")
        except Exception as e:
            print(f"Voice output error: {e}")
    
    async def switch_persona(self) -> None:
        """Switch between personas"""
        personas = ["bella", "banks", "vortex"]
        current_index = personas.index(self.persona)
        next_persona = personas[(current_index + 1) % len(personas)]
        
        self.persona = next_persona
        self.session_id = f"private_{self.persona}_{int(time.time())}"
        
        switch_msg = f"Switched to {self.persona.title()} mode. How can I help you?"
        print(f"🔄 {switch_msg}")
        
        if self.voice_enabled:
            await self.speak(switch_msg)


class ClaudeCodeConnector:
    """Connector for Claude Code integration"""
    
    def __init__(self, persona: str = "bella"):
        self.persona = persona
        self.claude_path = self.find_claude_code()
    
    def find_claude_code(self) -> Optional[str]:
        """Find Claude Code executable"""
        try:
            import subprocess
            result = subprocess.run(["which", "claude"], 
                                  capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except:
            return None
    
    async def chat_with_claude_code(self, message: str, system_prompt: str = "") -> str:
        """Chat using Claude Code CLI with special system prompt"""
        
        if not self.claude_path:
            return "Claude Code not available"
        
        try:
            import subprocess
            import tempfile
            
            # Create conversation file with system prompt
            conversation = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]
            }
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(conversation, f)
                temp_file = f.name
            
            try:
                # Call Claude Code
                result = subprocess.run([
                    self.claude_path, "chat", 
                    "--conversation-file", temp_file,
                    "--no-stream"
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    return result.stdout.strip()
                else:
                    return f"Claude Code error: {result.stderr}"
                    
            finally:
                os.unlink(temp_file)
                
        except Exception as e:
            return f"Error calling Claude Code: {str(e)}"


async def main():
    """Main function for testing private voice mode"""
    print("🎙️ Private Voice Mode with Claude Code Integration")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Choose persona
    personas = ["bella", "banks", "vortex"]
    print("\nChoose your persona:")
    for i, persona in enumerate(personas, 1):
        print(f"  {i}. {persona.title()}")
    
    choice = input("\nEnter choice (1-3) or persona name: ").strip()
    
    if choice.isdigit() and 1 <= int(choice) <= 3:
        persona = personas[int(choice) - 1]
    elif choice.lower() in personas:
        persona = choice.lower()
    else:
        persona = "bella"  # Default
    
    # Start private voice mode
    voice_mode = PrivateVoiceMode(persona=persona)
    await voice_mode.voice_chat()


if __name__ == "__main__":
    asyncio.run(main())
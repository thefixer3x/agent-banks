#!/usr/bin/env python3
"""
Claude CLI Integration for Agent-Banks
Allows Claude in IDEs to communicate with Agent-Banks interface
"""

import asyncio
import json
import os
import sys
import aiohttp
from typing import Dict, Any, Optional
import logging
from datetime import datetime


class ClaudeAgentBanksConnector:
    """Connect Claude CLI to Agent-Banks for collaborative development"""
    
    def __init__(self, agent_banks_url: str = "http://localhost:7777"):
        self.base_url = agent_banks_url
        self.session = None
        self.logger = logging.getLogger(__name__)
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def chat_with_banks(self, message: str, persona: str = "banks") -> str:
        """Send message to Agent-Banks and get response"""
        try:
            # Add persona hint to message if switching
            if persona.lower() == "bella":
                message = f"Hey Bella, {message}"
            elif "banks" not in message.lower():
                message = f"Banks, {message}"
                
            async with self.session.post(
                f"{self.base_url}/chat",
                json={"message": message},
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("response", "No response received")
                else:
                    return f"Error: {response.status}"
                    
        except Exception as e:
            return f"Connection error: {str(e)}"
    
    async def get_status(self) -> Dict[str, Any]:
        """Get Agent-Banks system status"""
        try:
            async with self.session.get(f"{self.base_url}/status") as response:
                if response.status == 200:
                    return await response.json()
                return {"error": f"Status check failed: {response.status}"}
        except Exception as e:
            return {"error": f"Connection error: {str(e)}"}
    
    async def collaborative_session(self):
        """Start a collaborative development session"""
        print("🤝 Claude-to-Agent-Banks Collaborative Session")
        print("=" * 50)
        
        # Check status
        status = await self.get_status()
        print(f"📊 Agent-Banks Status: {json.dumps(status, indent=2)}")
        print("=" * 50)
        
        # Example collaborative tasks
        tasks = [
            {
                "description": "Review current Agent-Banks features",
                "message": "Banks, list your current capabilities and any limitations you've noticed.",
                "persona": "banks"
            },
            {
                "description": "Brainstorm improvements",
                "message": "What features would make you more useful for software development?",
                "persona": "banks"
            },
            {
                "description": "Get Bella's perspective",
                "message": "What would make the user experience more friendly and intuitive?",
                "persona": "bella"
            }
        ]
        
        for task in tasks:
            print(f"\n🎯 Task: {task['description']}")
            print(f"💬 Asking: {task['message']}")
            
            response = await self.chat_with_banks(task['message'], task['persona'])
            print(f"🤖 Response: {response}")
            print("-" * 50)
            
            # Log for analysis
            self._log_interaction(task, response)
    
    def _log_interaction(self, task: Dict, response: str):
        """Log interactions for later analysis"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "task": task,
            "response": response
        }
        
        log_file = "claude_agent_banks_interactions.jsonl"
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")


class ClaudeCLIProvider:
    """Provider that allows Agent-Banks to use Claude CLI"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    async def send_to_claude_cli(self, prompt: str) -> str:
        """Send prompt to Claude CLI and get response"""
        # This would integrate with the actual Claude CLI
        # For now, returns a placeholder
        return f"Claude CLI would respond to: {prompt}"


# CLI Interface
async def main():
    """Main CLI interface for Claude-Agent-Banks integration"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        async with ClaudeAgentBanksConnector() as connector:
            if command == "chat":
                # Direct chat mode
                message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Hello Banks!"
                response = await connector.chat_with_banks(message)
                print(response)
                
            elif command == "status":
                # Check status
                status = await connector.get_status()
                print(json.dumps(status, indent=2))
                
            elif command == "collab":
                # Collaborative session
                await connector.collaborative_session()
                
            else:
                print(f"Unknown command: {command}")
                print("Usage: python claude_cli_integration.py [chat|status|collab] [message]")
    else:
        # Interactive mode
        print("🤖 Claude-to-Agent-Banks Interactive Mode")
        print("Commands: 'banks: <message>', 'bella: <message>', 'status', 'quit'")
        
        async with ClaudeAgentBanksConnector() as connector:
            while True:
                try:
                    user_input = input("\n> ").strip()
                    
                    if user_input.lower() == "quit":
                        break
                    elif user_input.lower() == "status":
                        status = await connector.get_status()
                        print(json.dumps(status, indent=2))
                    elif user_input.startswith("bella:"):
                        message = user_input[6:].strip()
                        response = await connector.chat_with_banks(message, "bella")
                        print(f"✨ Bella: {response}")
                    else:
                        # Default to Banks
                        if user_input.startswith("banks:"):
                            message = user_input[6:].strip()
                        else:
                            message = user_input
                        response = await connector.chat_with_banks(message, "banks")
                        print(f"💼 Banks: {response}")
                        
                except KeyboardInterrupt:
                    print("\n\nGoodbye!")
                    break
                except Exception as e:
                    print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
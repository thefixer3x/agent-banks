#!/usr/bin/env python3
"""
Claude MCP Provider - Use Claude through IDE integration
Connects to Claude the same way VS Code/Windsurf does
"""

import asyncio
import json
import os
import subprocess
from typing import Dict, List, Optional, Any
import logging
import aiohttp
from dataclasses import dataclass


@dataclass
class ClaudeMCPConfig:
    """Configuration for Claude MCP connection"""
    name: str = "Claude MCP"
    model: str = "claude-3-opus-20240229"
    max_tokens: int = 4096
    available: bool = True


class ClaudeMCPProvider:
    """Connect to Claude through MCP protocol like IDEs do"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = ClaudeMCPConfig()
        
        # Try to find MCP server from IDE
        self.mcp_port = self._find_mcp_port()
        self.mcp_url = f"http://localhost:{self.mcp_port}/v1/messages" if self.mcp_port else None
        
    def _find_mcp_port(self) -> Optional[int]:
        """Find MCP server port from running IDE processes"""
        try:
            # Look for Claude/Windsurf MCP servers
            result = subprocess.run(
                ["lsof", "-i", "-P", "-n", "|", "grep", "LISTEN", "|", "grep", "-E", "(claude|windsurf|cursor)"],
                shell=True,
                capture_output=True,
                text=True
            )
            
            # Parse for MCP ports (usually 3000-9999 range)
            for line in result.stdout.split('\n'):
                if 'LISTEN' in line and 'localhost' in line:
                    parts = line.split()
                    for part in parts:
                        if 'localhost:' in part:
                            port = int(part.split(':')[1])
                            if 3000 <= port <= 9999:
                                self.logger.info(f"Found potential MCP port: {port}")
                                return port
                                
        except Exception as e:
            self.logger.error(f"Error finding MCP port: {e}")
            
        return None
    
    async def chat_completion(self, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Send chat request through MCP protocol"""
        if not self.mcp_url:
            raise Exception("No MCP server found. Make sure VS Code/Windsurf is running with Claude.")
            
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Agent-Banks/1.0",
            "X-Client-Name": "agent-banks"
        }
        
        payload = {
            "model": self.config.model,
            "messages": messages,
            "max_tokens": self.config.max_tokens,
            "temperature": kwargs.get("temperature", 0.7),
            "stream": False
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.mcp_url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "provider": "claude-mcp",
                            "model": self.config.model,
                            "choices": [{
                                "message": {
                                    "role": "assistant",
                                    "content": result.get("content", [{"text": "Response received"}])[0].get("text", "")
                                }
                            }]
                        }
                    else:
                        raise Exception(f"MCP request failed: {response.status}")
                        
        except Exception as e:
            self.logger.error(f"MCP connection error: {e}")
            raise


class LocalClaudeProvider:
    """Alternative: Use Claude through local command-line interface"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.claude_cli_path = self._find_claude_cli()
        
    def _find_claude_cli(self) -> Optional[str]:
        """Find Claude CLI installation"""
        possible_paths = [
            "/usr/local/bin/claude",
            "/opt/homebrew/bin/claude",
            os.path.expanduser("~/.local/bin/claude"),
            os.path.expanduser("~/bin/claude")
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
                
        # Try which command
        try:
            result = subprocess.run(["which", "claude"], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass
            
        return None
    
    async def chat_completion(self, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Send chat through Claude CLI"""
        if not self.claude_cli_path:
            raise Exception("Claude CLI not found. Install with: npm install -g @anthropic/claude-cli")
            
        # Format messages for CLI
        prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
        
        try:
            # Run Claude CLI
            result = await asyncio.create_subprocess_exec(
                self.claude_cli_path,
                "chat",
                "--message", prompt,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                response_text = stdout.decode().strip()
                return {
                    "provider": "claude-cli",
                    "model": "claude-local",
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": response_text
                        }
                    }]
                }
            else:
                raise Exception(f"Claude CLI error: {stderr.decode()}")
                
        except Exception as e:
            self.logger.error(f"Claude CLI error: {e}")
            raise


# Integration function for Agent-Banks
def get_claude_local_provider():
    """Get the best available local Claude provider"""
    # Try MCP first (IDE integration)
    mcp_provider = ClaudeMCPProvider()
    if mcp_provider.mcp_url:
        return mcp_provider
        
    # Fall back to CLI
    cli_provider = LocalClaudeProvider()
    if cli_provider.claude_cli_path:
        return cli_provider
        
    return None
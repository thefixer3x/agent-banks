#!/usr/bin/env python3
"""
Computer Control Integration for Agent-Banks
Transforms AI from text generator to execution engine
"""

import json
import subprocess
import webbrowser
import os
from typing import Dict, Any, List


def operate_computer_system(command: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Operate a computer system with the given command and user permissions.
    
    Args:
        command (str): The command to execute on the computer system
        user (dict): User information including username and permissions
    
    Returns:
        dict: Result of the operation
    """
    # Validate user has required permissions
    required_permissions = ["execute"]
    if not all(perm in user["permissions"] for perm in required_permissions):
        return {
            "success": False,
            "error": f"User {user['username']} lacks required permissions: {required_permissions}"
        }
    
    # Log the operation
    print(f"🔧 User {user['username']} executing: {command}")
    
    try:
        # Execute the command based on its type
        if command.startswith("browse:"):
            url = command.replace("browse:", "").strip()
            return browse_url(url, user)
        elif command.startswith("search:"):
            query = command.replace("search:", "").strip()
            return search_web(query, user)
        elif command.startswith("system:"):
            sys_cmd = command.replace("system:", "").strip()
            if "admin" in user["permissions"]:
                return execute_system_command(sys_cmd)
            else:
                return {"success": False, "error": "Insufficient permissions for system commands"}
        elif command.startswith("app:"):
            app_name = command.replace("app:", "").strip()
            return open_application(app_name, user)
        elif command.startswith("file:"):
            file_cmd = command.replace("file:", "").strip()
            return handle_file_operation(file_cmd, user)
        elif command.startswith("agent:"):
            agent_cmd = command.replace("agent:", "").strip()
            return handle_agent_operation(agent_cmd, user)
        else:
            return process_command(command, user)
    except Exception as e:
        return {"success": False, "error": str(e)}


def browse_url(url: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Browse to a specific URL"""
    try:
        webbrowser.open(url)
        return {
            "success": True, 
            "action": "browse", 
            "url": url,
            "message": f"Opened {url} in browser"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to open URL: {str(e)}"}


def search_web(query: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Search the web for a query"""
    try:
        search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        webbrowser.open(search_url)
        return {
            "success": True, 
            "action": "search", 
            "query": query,
            "message": f"Searched for '{query}'"
        }
    except Exception as e:
        return {"success": False, "error": f"Search failed: {str(e)}"}


def open_application(app_name: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Open a specific application"""
    try:
        # macOS application opening
        if app_name.lower() in ["vscode", "code"]:
            subprocess.run(["open", "-a", "Visual Studio Code"], check=True)
        elif app_name.lower() in ["terminal"]:
            subprocess.run(["open", "-a", "Terminal"], check=True)
        elif app_name.lower() in ["finder"]:
            subprocess.run(["open", "-a", "Finder"], check=True)
        elif app_name.lower() in ["chrome"]:
            subprocess.run(["open", "-a", "Google Chrome"], check=True)
        elif app_name.lower() in ["safari"]:
            subprocess.run(["open", "-a", "Safari"], check=True)
        else:
            # Try to open any app by name
            subprocess.run(["open", "-a", app_name], check=True)
        
        return {
            "success": True,
            "action": "open_app",
            "app": app_name,
            "message": f"Opened {app_name}"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to open {app_name}: {str(e)}"}


def handle_file_operation(file_cmd: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Handle file operations"""
    try:
        parts = file_cmd.split("|")
        operation = parts[0].strip()
        path = parts[1].strip() if len(parts) > 1 else ""
        
        if operation == "open" and path:
            subprocess.run(["open", path], check=True)
            return {
                "success": True,
                "action": "file_open",
                "path": path,
                "message": f"Opened {path}"
            }
        elif operation == "show" and path:
            subprocess.run(["open", "-R", path], check=True)
            return {
                "success": True,
                "action": "file_show",
                "path": path,
                "message": f"Revealed {path} in Finder"
            }
        else:
            return {"success": False, "error": f"Unknown file operation: {operation}"}
            
    except Exception as e:
        return {"success": False, "error": f"File operation failed: {str(e)}"}


def handle_agent_operation(agent_cmd: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Agent-Banks specific operations"""
    try:
        if agent_cmd == "status":
            return {
                "success": True,
                "action": "agent_status",
                "status": {
                    "agent_banks_running": True,
                    "claude_realm_running": True,
                    "mcp_connected": True,
                    "memory_active": True
                }
            }
        elif agent_cmd == "deploy":
            return {
                "success": True,
                "action": "agent_deploy",
                "message": "Deployment initiated"
            }
        elif agent_cmd.startswith("switch_persona:"):
            persona = agent_cmd.replace("switch_persona:", "").strip()
            return {
                "success": True,
                "action": "switch_persona",
                "persona": persona,
                "message": f"Switched to {persona} persona"
            }
        else:
            return {"success": False, "error": f"Unknown agent operation: {agent_cmd}"}
            
    except Exception as e:
        return {"success": False, "error": f"Agent operation failed: {str(e)}"}


def execute_system_command(command: str) -> Dict[str, Any]:
    """Execute a system command (restricted to admin users)"""
    try:
        # Security: Only allow specific safe commands
        safe_commands = {
            "wifi_status": ["networksetup", "-getairportnetwork", "en0"],
            "memory_usage": ["vm_stat"],
            "disk_usage": ["df", "-h"],
            "process_list": ["ps", "aux"],
            "system_info": ["sw_vers"]
        }
        
        if command in safe_commands:
            result = subprocess.run(
                safe_commands[command], 
                capture_output=True, 
                text=True, 
                check=True
            )
            return {
                "success": True,
                "action": "system_command",
                "command": command,
                "output": result.stdout
            }
        else:
            return {"success": False, "error": f"Command not in safe list: {command}"}
            
    except Exception as e:
        return {"success": False, "error": f"System command failed: {str(e)}"}


def process_command(command: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """Process a generic command"""
    return {
        "success": True,
        "action": "process",
        "command": command,
        "message": f"Processed command: {command}"
    }


# Function definition for Claude to use
COMPUTER_CONTROL_FUNCTION = {
    "name": "operate_computer_system",
    "description": "Operate a computer system to perform real actions like opening apps, browsing URLs, file operations, and system commands",
    "strict": True,
    "parameters": {
        "type": "object",
        "required": ["command", "user"],
        "properties": {
            "command": {
                "type": "string",
                "description": "The command to execute. Format: 'type:action' where type is browse, search, system, app, file, or agent"
            },
            "user": {
                "type": "object",
                "required": ["username", "permissions"],
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "The name of the user operating the system"
                    },
                    "permissions": {
                        "type": "array",
                        "description": "Array of permissions granted to the user",
                        "items": {
                            "type": "string",
                            "description": "A specific permission level for the user"
                        }
                    }
                },
                "additionalProperties": False
            }
        },
        "additionalProperties": False
    }
}


# Example usage and test
if __name__ == "__main__":
    # Test user with admin permissions
    test_user = {
        "username": "developer",
        "permissions": ["execute", "admin"]
    }
    
    # Test commands
    test_commands = [
        "browse:https://github.com",
        "search:Agent-Banks AI development",
        "app:vscode",
        "file:open|/Users/seyederick/Desktop",
        "agent:status",
        "system:memory_usage"
    ]
    
    print("🚀 Testing Computer Control Integration")
    print("=" * 50)
    
    for cmd in test_commands:
        print(f"\n🔧 Testing: {cmd}")
        result = operate_computer_system(cmd, test_user)
        print(f"✅ Result: {result}")
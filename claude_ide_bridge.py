#!/usr/bin/env python3
"""
Claude IDE Bridge - Direct integration for your development workflow
Allows Claude in IDE to communicate with Agent-Banks for real-time development
"""

import asyncio
import json
import aiohttp
from flask import Flask, request, jsonify
from datetime import datetime


# Bridge server that Claude in IDE can call
bridge_app = Flask(__name__)

AGENT_BANKS_URL = "http://localhost:7777"


@bridge_app.route('/claude/think', methods=['POST'])
def claude_think():
    """
    Endpoint for Claude to send development thoughts to Agent-Banks
    Used when you're coding and want Banks/Bella to help ideate
    """
    data = request.get_json()
    
    thought = data.get('thought', '')
    context = data.get('context', '')  # Current code context
    task = data.get('task', '')  # What you're trying to build
    
    # Format message for Agent-Banks
    message = f"""
    Development Context: {context}
    Current Task: {task}
    Claude's Thought: {thought}
    
    What's your perspective on this? Any suggestions or improvements?
    """
    
    # Send to Agent-Banks asynchronously
    response = asyncio.run(send_to_agent_banks(message))
    
    return jsonify({
        "banks_response": response,
        "timestamp": datetime.now().isoformat()
    })


@bridge_app.route('/claude/code_review', methods=['POST'])
def claude_code_review():
    """
    Send code to Agent-Banks for review from different personas
    """
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    # Ask Banks for technical review
    banks_message = f"Banks, please review this {language} code for best practices and potential issues:\n```{language}\n{code}\n```"
    
    # Ask Bella for UX/readability perspective  
    bella_message = f"Bella, how could we make this {language} code more readable and user-friendly:\n```{language}\n{code}\n```"
    
    banks_response = asyncio.run(send_to_agent_banks(banks_message, "banks"))
    bella_response = asyncio.run(send_to_agent_banks(bella_message, "bella"))
    
    return jsonify({
        "banks_review": banks_response,
        "bella_review": bella_response,
        "timestamp": datetime.now().isoformat()
    })


@bridge_app.route('/claude/brainstorm', methods=['POST'])
def claude_brainstorm():
    """
    Collaborative brainstorming endpoint
    """
    data = request.get_json()
    idea = data.get('idea', '')
    
    # Create a brainstorming session
    prompts = [
        {
            "persona": "banks",
            "message": f"Banks, from a technical architecture perspective, how would you implement: {idea}"
        },
        {
            "persona": "bella", 
            "message": f"Bella, what would make this idea more user-friendly and engaging: {idea}"
        }
    ]
    
    responses = {}
    for prompt in prompts:
        response = asyncio.run(send_to_agent_banks(prompt["message"], prompt["persona"]))
        responses[prompt["persona"]] = response
    
    return jsonify({
        "brainstorm_results": responses,
        "original_idea": idea,
        "timestamp": datetime.now().isoformat()
    })


async def send_to_agent_banks(message: str, persona: str = "banks") -> str:
    """Send message to Agent-Banks and get response"""
    try:
        # Add persona trigger
        if persona == "bella" and "bella" not in message.lower():
            message = f"Hey Bella, {message}"
            
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{AGENT_BANKS_URL}/chat",
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


# Quick CLI for testing
def test_bridge():
    """Test the bridge with a simple example"""
    import requests
    
    # Test thought sharing
    response = requests.post('http://localhost:8888/claude/think', json={
        "thought": "We should add a memory system to Agent-Banks to remember conversations",
        "context": "Working on enhanced_ai_provider.py",
        "task": "Implementing conversation persistence"
    })
    
    print("Bridge Test Results:")
    print(json.dumps(response.json(), indent=2))


# Add this to your IDE workflow
class ClaudeIDEHelper:
    """
    Helper class to integrate into your IDE workflow
    Add this to your IDE's startup script or extension
    """
    
    def __init__(self):
        self.bridge_url = "http://localhost:8888"
        
    def think_with_banks(self, thought: str, context: str = "", task: str = "") -> str:
        """Share a development thought with Agent-Banks"""
        import requests
        
        response = requests.post(f"{self.bridge_url}/claude/think", json={
            "thought": thought,
            "context": context,
            "task": task
        })
        
        if response.status_code == 200:
            return response.json().get("banks_response", "")
        return "Bridge connection failed"
    
    def review_code(self, code: str, language: str = "python") -> dict:
        """Get code review from both Banks and Bella"""
        import requests
        
        response = requests.post(f"{self.bridge_url}/claude/code_review", json={
            "code": code,
            "language": language
        })
        
        if response.status_code == 200:
            return response.json()
        return {"error": "Bridge connection failed"}


if __name__ == "__main__":
    print("🌉 Starting Claude-Agent-Banks Bridge on port 8888...")
    print("This allows Claude in your IDE to collaborate with Agent-Banks")
    print("\nEndpoints:")
    print("  POST /claude/think - Share development thoughts")
    print("  POST /claude/code_review - Get code reviews")  
    print("  POST /claude/brainstorm - Collaborative brainstorming")
    
    bridge_app.run(host="0.0.0.0", port=8888, debug=True)
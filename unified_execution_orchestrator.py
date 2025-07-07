#!/usr/bin/env python3
"""
Unified Execution Orchestrator for Agent-Banks
Integrates CUA execution engine with Banks/Bella personas for REAL computer control

Subscription Tiers:
- Minor Actions: Basic automation (clicks, typing, simple apps)
- Regular Plan: Advanced workflows (file management, research, scheduling)  
- Exclusive Actions: Complex multi-app orchestration
- Big Boss Assistant: Full enterprise-level AI delegation
"""

import os
import json
import asyncio
import aiohttp
import subprocess
import webbrowser
import platform
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
from enum import Enum

# Import our existing components
from computer_control_integration import operate_computer_system, COMPUTER_CONTROL_FUNCTION
from claude_mcp_connector import ClaudeMCPConnector
from enhanced_memory_client import SDGhostMemoryClient
from limitless_ai_prompts import combine_prompts


class SubscriptionTier(Enum):
    MINOR_ACTIONS = "minor_actions"
    REGULAR_PLAN = "regular_plan" 
    EXCLUSIVE_ACTIONS = "exclusive_actions"
    BIG_BOSS_ASSISTANT = "big_boss_assistant"


@dataclass
class ActionComplexity:
    tier: SubscriptionTier
    cost_credits: int
    description: str
    examples: List[str]


class SubscriptionManager:
    """Manages subscription tiers and action permissions"""
    
    def __init__(self):
        self.tiers = {
            SubscriptionTier.MINOR_ACTIONS: ActionComplexity(
                tier=SubscriptionTier.MINOR_ACTIONS,
                cost_credits=1,
                description="Basic automation and simple tasks",
                examples=[
                    "Click buttons and links",
                    "Type text in forms", 
                    "Take screenshots",
                    "Open single applications",
                    "Simple web browsing"
                ]
            ),
            SubscriptionTier.REGULAR_PLAN: ActionComplexity(
                tier=SubscriptionTier.REGULAR_PLAN,
                cost_credits=5,
                description="Advanced workflows and multi-step tasks",
                examples=[
                    "File management operations",
                    "Research and data collection",
                    "Email management",
                    "Calendar scheduling",
                    "Document creation/editing"
                ]
            ),
            SubscriptionTier.EXCLUSIVE_ACTIONS: ActionComplexity(
                tier=SubscriptionTier.EXCLUSIVE_ACTIONS,
                cost_credits=15,
                description="Complex multi-app orchestration",
                examples=[
                    "Cross-platform data syncing",
                    "Automated reporting workflows",
                    "Complex project management",
                    "Multi-app integrations",
                    "Advanced automation sequences"
                ]
            ),
            SubscriptionTier.BIG_BOSS_ASSISTANT: ActionComplexity(
                tier=SubscriptionTier.BIG_BOSS_ASSISTANT,
                cost_credits=50,
                description="Full enterprise-level AI delegation",
                examples=[
                    "Complete project delegation",
                    "Team coordination",
                    "Strategic analysis and execution",
                    "Complex business workflows",
                    "AI-driven decision making"
                ]
            )
        }
        
        # User subscription info (would come from database)
        self.user_subscription = SubscriptionTier.REGULAR_PLAN  # Default for testing
        self.user_credits = 1000  # Monthly credits
    
    def can_execute_action(self, action_type: str, complexity: SubscriptionTier) -> bool:
        """Check if user can execute action based on subscription"""
        user_tier_value = list(self.tiers.keys()).index(self.user_subscription)
        required_tier_value = list(self.tiers.keys()).index(complexity)
        
        # User must have equal or higher tier
        can_execute = user_tier_value >= required_tier_value
        
        # Check credits
        required_credits = self.tiers[complexity].cost_credits
        has_credits = self.user_credits >= required_credits
        
        return can_execute and has_credits
    
    def deduct_credits(self, complexity: SubscriptionTier):
        """Deduct credits for action execution"""
        cost = self.tiers[complexity].cost_credits
        self.user_credits = max(0, self.user_credits - cost)
        return self.user_credits


class ActionClassifier:
    """Classifies actions by complexity tier"""
    
    @staticmethod
    def classify_action(action_type: str, parameters: Dict[str, Any]) -> SubscriptionTier:
        """Determine subscription tier required for action"""
        
        # Minor Actions (Tier 1)
        minor_actions = [
            "screenshot", "click", "type", "key_press", "scroll",
            "move_mouse", "open_application"
        ]
        
        # Regular Plan (Tier 2) 
        regular_actions = [
            "file_operation", "email_management", "calendar_event",
            "document_edit", "web_research", "data_extraction"
        ]
        
        # Exclusive Actions (Tier 3)
        exclusive_actions = [
            "multi_app_workflow", "data_sync", "automated_reporting",
            "complex_integration", "batch_processing"
        ]
        
        # Big Boss Assistant (Tier 4)
        big_boss_actions = [
            "project_delegation", "team_coordination", "strategic_analysis",
            "ai_decision_making", "enterprise_workflow"
        ]
        
        if action_type in minor_actions:
            return SubscriptionTier.MINOR_ACTIONS
        elif action_type in regular_actions:
            return SubscriptionTier.REGULAR_PLAN
        elif action_type in exclusive_actions:
            return SubscriptionTier.EXCLUSIVE_ACTIONS
        else:
            return SubscriptionTier.BIG_BOSS_ASSISTANT


class PersonaExecutor:
    """Persona-specific execution with subscription awareness"""
    
    def __init__(self, persona: str, subscription_manager: SubscriptionManager):
        self.persona = persona
        self.subscription_manager = subscription_manager
        self.cua_server_url = "http://localhost:5002"  # CUA execution server
        
    async def execute_with_personality(self, action_type: str, parameters: Dict[str, Any], 
                                     user: Dict[str, Any]) -> Dict[str, Any]:
        """Execute action with persona-specific approach"""
        
        # Classify action complexity
        complexity = ActionClassifier.classify_action(action_type, parameters)
        
        # Check subscription permissions
        if not self.subscription_manager.can_execute_action(action_type, complexity):
            return {
                "success": False,
                "error": f"Action requires {complexity.value} subscription tier",
                "upgrade_message": f"Upgrade to access: {self.subscription_manager.tiers[complexity].description}",
                "current_tier": self.subscription_manager.user_subscription.value
            }
        
        # Execute action based on persona
        if self.persona == "banks":
            return await self._banks_execution(action_type, parameters, user, complexity)
        elif self.persona == "bella":
            return await self._bella_execution(action_type, parameters, user, complexity)
        else:
            return await self._standard_execution(action_type, parameters, user, complexity)
    
    async def _banks_execution(self, action_type: str, parameters: Dict[str, Any], 
                              user: Dict[str, Any], complexity: SubscriptionTier) -> Dict[str, Any]:
        """Banks persona - Professional, efficient execution"""
        
        print(f"💼 Banks executing {action_type} (Tier: {complexity.value})")
        
        # Banks adds business context and efficiency optimizations
        enhanced_params = parameters.copy()
        enhanced_params["persona_context"] = "professional_efficiency"
        enhanced_params["execution_style"] = "direct_business_focused"
        
        # Execute via CUA server or local control
        result = await self._execute_action(action_type, enhanced_params, user)
        
        # Banks provides strategic feedback
        if result.get("success"):
            result["banks_insight"] = self._get_banks_insight(action_type, result)
            self.subscription_manager.deduct_credits(complexity)
        
        return result
    
    async def _bella_execution(self, action_type: str, parameters: Dict[str, Any], 
                              user: Dict[str, Any], complexity: SubscriptionTier) -> Dict[str, Any]:
        """Bella persona - Creative, user-friendly execution"""
        
        print(f"✨ Bella executing {action_type} (Tier: {complexity.value})")
        
        # Bella adds creative enhancements and user experience focus
        enhanced_params = parameters.copy()
        enhanced_params["persona_context"] = "creative_friendly"
        enhanced_params["execution_style"] = "smooth_delightful"
        
        # Execute with extra care for user experience
        result = await self._execute_action(action_type, enhanced_params, user)
        
        # Bella provides encouraging feedback
        if result.get("success"):
            result["bella_encouragement"] = self._get_bella_encouragement(action_type, result)
            self.subscription_manager.deduct_credits(complexity)
        
        return result
    
    async def _standard_execution(self, action_type: str, parameters: Dict[str, Any], 
                                 user: Dict[str, Any], complexity: SubscriptionTier) -> Dict[str, Any]:
        """Standard execution without persona enhancement"""
        result = await self._execute_action(action_type, parameters, user)
        if result.get("success"):
            self.subscription_manager.deduct_credits(complexity)
        return result
    
    async def _execute_action(self, action_type: str, parameters: Dict[str, Any], 
                             user: Dict[str, Any]) -> Dict[str, Any]:
        """Execute action via appropriate method"""
        
        try:
            # Try CUA execution server first
            result = await self._execute_via_cua_server(action_type, parameters)
            if result.get("success"):
                return result
        except Exception as e:
            print(f"CUA server unavailable: {e}")
        
        # Fallback to local computer control integration
        try:
            command = self._build_command(action_type, parameters)
            return operate_computer_system(command, user)
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _execute_via_cua_server(self, action_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute action via CUA execution server"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.cua_server_url}/execute",
                json={"command": action_type, "params": parameters},
                timeout=30
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    return {"success": False, "error": f"CUA server error: {error_text}"}
    
    def _build_command(self, action_type: str, parameters: Dict[str, Any]) -> str:
        """Build command string for computer control integration"""
        if action_type == "open_application":
            return f"app:{parameters.get('app_name', '')}"
        elif action_type == "browse_url":
            return f"browse:{parameters.get('url', '')}"
        elif action_type == "file_operation":
            op = parameters.get('operation', 'open')
            path = parameters.get('path', '')
            return f"file:{op}|{path}"
        elif action_type == "system_info":
            return f"system:{parameters.get('info_type', 'memory_usage')}"
        else:
            return action_type
    
    def _get_banks_insight(self, action_type: str, result: Dict[str, Any]) -> str:
        """Banks provides business-focused insights"""
        insights = {
            "open_application": "Productivity app launched. Consider keyboard shortcuts for faster access.",
            "file_operation": "File operation completed. Recommend organizing files for better workflow efficiency.",
            "browse_url": "Navigation successful. Consider bookmarking frequently accessed resources.",
            "default": "Task completed efficiently. Analyzing for workflow optimization opportunities."
        }
        return insights.get(action_type, insights["default"])
    
    def _get_bella_encouragement(self, action_type: str, result: Dict[str, Any]) -> str:
        """Bella provides encouraging, friendly feedback"""
        encouragements = {
            "open_application": "Great! Your app is ready to go. You're making excellent progress! ✨",
            "file_operation": "Perfect! Your files are organized beautifully. You're doing amazing! 🌟",
            "browse_url": "Wonderful! I've taken you exactly where you wanted to go. Keep exploring! 🚀",
            "default": "Fantastic work! You're becoming so efficient with these tasks. I'm proud of you! 💫"
        }
        return encouragements.get(action_type, encouragements["default"])


class UnifiedExecutionOrchestrator:
    """Main orchestrator that brings everything together"""
    
    def __init__(self):
        self.subscription_manager = SubscriptionManager()
        self.claude_connector = ClaudeMCPConnector()
        self.memory_client = SDGhostMemoryClient()
        
        # Initialize persona executors
        self.executors = {
            "banks": PersonaExecutor("banks", self.subscription_manager),
            "bella": PersonaExecutor("bella", self.subscription_manager)
        }
        
        # User context
        self.current_user = {
            "username": "developer",
            "permissions": ["execute", "admin"],
            "subscription": self.subscription_manager.user_subscription.value
        }
    
    async def process_user_request(self, message: str, persona: str = "banks") -> Dict[str, Any]:
        """Process user request with full AI intelligence + real execution"""
        
        print(f"🎯 Processing request with {persona.title()}")
        print(f"   Subscription: {self.subscription_manager.user_subscription.value}")
        print(f"   Credits: {self.subscription_manager.user_credits}")
        
        try:
            # Get AI understanding with limitless prompts
            context = {
                "persona": persona,
                "subscription_tier": self.subscription_manager.user_subscription.value,
                "available_credits": self.subscription_manager.user_credits,
                "user": self.current_user
            }
            
            # Use Claude to understand intent and plan execution
            ai_response = await self.claude_connector.chat_with_claude_mcp(message, context)
            
            # Extract executable actions from AI response
            actions = self._extract_actions_from_ai_response(ai_response)
            
            if not actions:
                # AI provided guidance without executable actions
                return {
                    "type": "guidance",
                    "ai_response": ai_response,
                    "persona": persona
                }
            
            # Execute actions with persona-specific approach
            results = []
            executor = self.executors.get(persona, self.executors["banks"])
            
            for action in actions:
                action_type = action.get("action_type", "")
                parameters = action.get("parameters", {})
                
                result = await executor.execute_with_personality(
                    action_type, parameters, self.current_user
                )
                
                results.append({
                    "action": action,
                    "result": result,
                    "persona": persona
                })
                
                # Store execution in memory
                await self._store_execution_memory(action, result, persona, message)
            
            return {
                "type": "execution",
                "ai_response": ai_response,
                "executions": results,
                "persona": persona,
                "remaining_credits": self.subscription_manager.user_credits
            }
            
        except Exception as e:
            return {
                "type": "error",
                "error": str(e),
                "persona": persona
            }
    
    def _extract_actions_from_ai_response(self, ai_response: str) -> List[Dict[str, Any]]:
        """Extract executable actions from AI response"""
        actions = []
        
        # Look for action patterns in AI response
        action_patterns = [
            (r"operate_computer_system\([\"']([^\"']+)[\"'], .*?\)", "extracted_command"),
            (r"open[\s]+([a-zA-Z\s]+)", "open_application"),
            (r"browse to ([^\s]+)", "browse_url"),
            (r"navigate to ([^\s]+)", "browse_url"),
            (r"click(?:\s+on)?\s+([^\s]+)", "click"),
            (r"type [\"']([^\"']+)[\"']", "type"),
            (r"screenshot", "screenshot")
        ]
        
        import re
        for pattern, action_type in action_patterns:
            matches = re.finditer(pattern, ai_response, re.IGNORECASE)
            for match in matches:
                if action_type == "extracted_command":
                    actions.append({
                        "action_type": "computer_command",
                        "parameters": {"command": match.group(1)}
                    })
                elif action_type == "open_application":
                    actions.append({
                        "action_type": "open_application", 
                        "parameters": {"app_name": match.group(1).strip()}
                    })
                elif action_type in ["browse_url", "navigate_url"]:
                    url = match.group(1)
                    if not url.startswith("http"):
                        url = "https://" + url
                    actions.append({
                        "action_type": "browse_url",
                        "parameters": {"url": url}
                    })
                elif action_type == "click":
                    actions.append({
                        "action_type": "click",
                        "parameters": {"element": match.group(1)}
                    })
                elif action_type == "type":
                    actions.append({
                        "action_type": "type",
                        "parameters": {"text": match.group(1)}
                    })
                elif action_type == "screenshot":
                    actions.append({
                        "action_type": "screenshot",
                        "parameters": {}
                    })
        
        return actions
    
    async def _store_execution_memory(self, action: Dict[str, Any], result: Dict[str, Any], 
                                    persona: str, original_request: str):
        """Store execution in memory system"""
        try:
            memory_text = f"Executed {action['action_type']} with {persona} persona"
            if result.get("success"):
                memory_text += f" - Success: {result.get('message', 'Completed')}"
            else:
                memory_text += f" - Failed: {result.get('error', 'Unknown error')}"
            
            await self.memory_client.store_conversation(
                original_request,
                memory_text,
                {
                    "action": action,
                    "result": result,
                    "persona": persona,
                    "execution_timestamp": datetime.now().isoformat()
                }
            )
        except Exception as e:
            print(f"Memory storage failed: {e}")
    
    def get_subscription_status(self) -> Dict[str, Any]:
        """Get current subscription status and available actions"""
        return {
            "current_tier": self.subscription_manager.user_subscription.value,
            "credits_remaining": self.subscription_manager.user_credits,
            "tier_capabilities": {
                tier.value: {
                    "description": complexity.description,
                    "cost_per_action": complexity.cost_credits,
                    "examples": complexity.examples
                }
                for tier, complexity in self.subscription_manager.tiers.items()
            }
        }


# FastAPI integration for web interface
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Agent-Banks Unified Execution API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# Global orchestrator
orchestrator = UnifiedExecutionOrchestrator()


@app.post("/execute")
async def execute_request(request: Dict[str, Any]):
    """Execute user request with AI + real computer control"""
    message = request.get("message", "")
    persona = request.get("persona", "banks")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message required")
    
    result = await orchestrator.process_user_request(message, persona)
    return result


@app.get("/subscription")
async def get_subscription():
    """Get subscription status and capabilities"""
    return orchestrator.get_subscription_status()


@app.post("/persona/switch")
async def switch_persona(request: Dict[str, Any]):
    """Switch active persona"""
    persona = request.get("persona", "banks")
    return {"switched_to": persona, "available": ["banks", "bella"]}


@app.get("/health")
async def health():
    """Health check for unified orchestrator"""
    return {
        "status": "operational",
        "cua_server": "http://localhost:5002",
        "claude_mcp": orchestrator.claude_connector.is_connected(),
        "memory_client": "active",
        "subscription_manager": "active",
        "personas": list(orchestrator.executors.keys())
    }


async def main():
    """Test the unified orchestrator"""
    print("🚀 AGENT-BANKS UNIFIED EXECUTION ORCHESTRATOR")
    print("=" * 60)
    print("💰 Subscription Model:")
    print("   • Minor Actions: Basic automation (1 credit)")
    print("   • Regular Plan: Advanced workflows (5 credits)")
    print("   • Exclusive Actions: Complex orchestration (15 credits)")
    print("   • Big Boss Assistant: Full AI delegation (50 credits)")
    print()
    
    orchestrator = UnifiedExecutionOrchestrator()
    
    # Show subscription status
    status = orchestrator.get_subscription_status()
    print(f"🎯 Current Tier: {status['current_tier']}")
    print(f"💳 Credits: {status['credits_remaining']}")
    print()
    
    # Interactive testing
    while True:
        try:
            persona = input("👤 Choose persona (banks/bella) [banks]: ").strip() or "banks"
            message = input(f"💬 Tell {persona.title()} what to do: ").strip()
            
            if message.lower() in ['quit', 'exit']:
                break
            
            print(f"\n🔄 {persona.title()} is processing your request...")
            result = await orchestrator.process_user_request(message, persona)
            
            print(f"\n✅ Result Type: {result['type']}")
            if result['type'] == 'execution':
                print(f"🤖 AI Understanding: {result['ai_response']}")
                print(f"⚡ Executions: {len(result['executions'])}")
                for i, execution in enumerate(result['executions'], 1):
                    action = execution['action']
                    exec_result = execution['result']
                    success = "✅" if exec_result.get('success') else "❌"
                    print(f"   {i}. {success} {action['action_type']}: {exec_result.get('message', exec_result.get('error', ''))}")
                print(f"💳 Credits Remaining: {result['remaining_credits']}")
            else:
                print(f"💭 AI Response: {result.get('ai_response', 'No response')}")
            
            print()
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
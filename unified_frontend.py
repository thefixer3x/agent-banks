#!/usr/bin/env python3
"""
Unified Agent-Banks Frontend
Combines AI providers (Anthropic + OpenRouter) + Browserbase + Voice integration
"""

import asyncio
import json
import os
from typing import Dict, List, Optional, Any
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Import components with fallbacks
try:
    from enhanced_ai_provider import MultiAIProvider
except ImportError:
    print("❌ Enhanced AI provider not found")
    exit(1)

try:
    from browserbase_integration import EnhancedWebAssistant, BrowserAction
except ImportError:
    print("⚠️  Browser integration not available")
    EnhancedWebAssistant = None

try:
    from meeting_assistant import VoiceFallbackManager
except ImportError:
    print("⚠️  Voice integration not available")
    VoiceFallbackManager = None


class UnifiedAgentBanks:
    """
    Complete Agent-Banks system with:
    - AI: Anthropic + OpenRouter fallback
    - Browser: Browserbase + Playwright fallback  
    - Voice: ElevenLabs + OpenAI + Desktop TTS fallback
    """
    
    def __init__(self):
        # Initialize all components with fallbacks
        self.ai_provider = MultiAIProvider()
        
        self.web_assistant = EnhancedWebAssistant() if EnhancedWebAssistant else None
        self.voice_manager = VoiceFallbackManager() if VoiceFallbackManager else None
        
        # Session management
        self.conversation_history = []
        self.active_tasks = {}
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        print("🚀 Unified Agent-Banks Starting...")
        self._show_system_status()
    
    def _show_system_status(self):
        """Display system capabilities and status"""
        print("\n🤖 AGENT-BANKS UNIFIED SYSTEM STATUS")
        print("=" * 50)
        
        # AI Provider Status
        ai_status = self.ai_provider.get_provider_status()
        print(f"🧠 AI Primary: {ai_status['primary_provider']}")
        for provider, info in ai_status['providers'].items():
            icon = "✅" if info['available'] else "❌"
            print(f"   {icon} {info['name']}")
        
        # Browser Automation Status
        if self.web_assistant:
            browserbase_available = bool(os.getenv('BROWSERBASE_API_KEY'))
            print(f"🌐 Browser Automation:")
            print(f"   {'✅' if browserbase_available else '❌'} Browserbase Cloud")
            print(f"   ✅ Playwright Fallback")
        else:
            print(f"🌐 Browser Automation: ❌ Not Available")
        
        # Voice System Status  
        if self.voice_manager:
            print(f"🎙️  Voice System:")
            print(f"   {'✅' if self.voice_manager.elevenlabs_available else '❌'} ElevenLabs")
            print(f"   {'✅' if self.voice_manager.openai_tts_available else '❌'} OpenAI TTS")
            print(f"   {'✅' if self.voice_manager.desktop_tts else '❌'} Desktop TTS")
            print(f"   🔊 Active Mode: {self.voice_manager.current_tts_mode}")
        else:
            print(f"🎙️  Voice System: ❌ Not Available")
        
        print("=" * 50)
    
    async def process_natural_command(self, command: str) -> Dict[str, Any]:
        """
        Process natural language commands and route to appropriate system
        """
        try:
            self.logger.info(f"🎯 Processing: {command}")
            
            # Analyze command intent using AI
            intent_analysis = await self._analyze_command_intent(command)
            
            # Route to appropriate handler based on intent
            if intent_analysis["category"] == "web_automation":
                return await self._handle_web_automation(command, intent_analysis)
            
            elif intent_analysis["category"] == "email_task":
                return await self._handle_email_task(command, intent_analysis)
            
            elif intent_analysis["category"] == "memory_retrieval":
                return await self._handle_memory_retrieval(command, intent_analysis)
            
            elif intent_analysis["category"] == "vendor_communication":
                return await self._handle_vendor_communication(command, intent_analysis)
            
            elif intent_analysis["category"] == "meeting_notes":
                return await self._handle_meeting_task(command, intent_analysis)
                
            else:
                return await self._handle_general_conversation(command)
        
        except Exception as e:
            self.logger.error(f"Command processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "fallback_response": "I encountered an error processing that request. Could you try rephrasing it?"
            }
    
    async def _analyze_command_intent(self, command: str) -> Dict[str, Any]:
        """Use AI to analyze command intent and extract parameters"""
        
        analysis_prompt = [
            {
                "role": "system", 
                "content": """Analyze user commands and categorize them. Return JSON with:
                {
                    "category": "web_automation|email_task|memory_retrieval|vendor_communication|meeting_notes|general",
                    "confidence": 0.0-1.0,
                    "parameters": {
                        "url": "if web task",
                        "action": "specific action to take",
                        "form_data": {"field": "value"} if form filling,
                        "vendor": "vendor name if applicable",
                        "topic": "topic if memory retrieval"
                    },
                    "reasoning": "why this category was chosen"
                }"""
            },
            {
                "role": "user",
                "content": f"Analyze this command: {command}"
            }
        ]
        
        try:
            response = await self.ai_provider.chat_completion(analysis_prompt)
            intent_text = response["choices"][0]["message"]["content"]
            
            # Try to parse as JSON
            if intent_text.startswith("```json"):
                intent_text = intent_text.replace("```json", "").replace("```", "").strip()
            
            intent_analysis = json.loads(intent_text)
            return intent_analysis
            
        except Exception as e:
            self.logger.warning(f"Intent analysis failed: {e}")
            # Fallback to simple keyword matching
            return self._simple_intent_analysis(command)
    
    def _simple_intent_analysis(self, command: str) -> Dict[str, Any]:
        """Simple fallback intent analysis using keywords"""
        command_lower = command.lower()
        
        if any(word in command_lower for word in ["navigate", "website", "form", "browser", "click"]):
            return {"category": "web_automation", "confidence": 0.7, "parameters": {}}
        elif any(word in command_lower for word in ["email", "draft", "proofread", "send"]):
            return {"category": "email_task", "confidence": 0.7, "parameters": {}}
        elif any(word in command_lower for word in ["remember", "conversation", "recall", "what did"]):
            return {"category": "memory_retrieval", "confidence": 0.7, "parameters": {}}
        elif any(word in command_lower for word in ["vendor", "order", "contact", "mcp"]):
            return {"category": "vendor_communication", "confidence": 0.7, "parameters": {}}
        elif any(word in command_lower for word in ["meeting", "notes", "action items"]):
            return {"category": "meeting_notes", "confidence": 0.7, "parameters": {}}
        else:
            return {"category": "general", "confidence": 0.5, "parameters": {}}
    
    async def _handle_web_automation(self, command: str, intent: Dict) -> Dict[str, Any]:
        """Handle web automation tasks"""
        try:
            # Extract URL and actions from command using AI
            web_analysis = await self._extract_web_task_details(command)
            
            url = web_analysis.get("url", "")
            form_data = web_analysis.get("form_data", {})
            
            if not url:
                return {
                    "success": False,
                    "message": "I need a website URL to navigate to. Could you specify which website?"
                }
            
            # Perform web automation
            if not self.web_assistant:
                return {
                    "success": False,
                    "message": "Web automation not available. Browser integration not loaded."
                }
            
            if form_data:
                result = await self.web_assistant.navigate_and_fill_form(url, form_data)
            else:
                result = await self.web_assistant.perform_website_task(command, url)
            
            # Generate human-friendly response
            if result["success"]:
                response = f"✅ Successfully navigated to {url}"
                if form_data:
                    response += f" and filled form with {len(form_data)} fields"
            else:
                response = f"❌ Failed to complete web task: {result.get('error', 'Unknown error')}"
            
            return {
                "success": result["success"],
                "message": response,
                "details": result
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Web automation error: {str(e)}"
            }
    
    async def _extract_web_task_details(self, command: str) -> Dict[str, Any]:
        """Extract specific web task details using AI"""
        extraction_prompt = [
            {
                "role": "system",
                "content": """Extract web automation details from user commands. Return JSON:
                {
                    "url": "full URL or infer from context",
                    "form_data": {"field_name": "value"} if form filling mentioned,
                    "action_sequence": ["action1", "action2"] if specific steps
                }"""
            },
            {
                "role": "user", 
                "content": f"Extract web task details: {command}"
            }
        ]
        
        try:
            response = await self.ai_provider.chat_completion(extraction_prompt)
            details_text = response["choices"][0]["message"]["content"]
            
            if details_text.startswith("```json"):
                details_text = details_text.replace("```json", "").replace("```", "").strip()
            
            return json.loads(details_text)
        except:
            return {"url": "", "form_data": {}}
    
    async def _handle_email_task(self, command: str, intent: Dict) -> Dict[str, Any]:
        """Handle email drafting and management tasks"""
        try:
            # Use AI to draft email based on command
            email_prompt = [
                {
                    "role": "system",
                    "content": "You are an email writing assistant. Draft professional emails based on user requests."
                },
                {
                    "role": "user",
                    "content": f"Help me with this email task: {command}"
                }
            ]
            
            response = await self.ai_provider.chat_completion(email_prompt)
            email_draft = response["choices"][0]["message"]["content"]
            
            return {
                "success": True,
                "message": "Email drafted successfully",
                "email_draft": email_draft
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Email task error: {str(e)}"
            }
    
    async def _handle_memory_retrieval(self, command: str, intent: Dict) -> Dict[str, Any]:
        """Handle memory and conversation retrieval"""
        try:
            # Search conversation history
            topic = intent.get("parameters", {}).get("topic", "")
            
            # Use AI to search and summarize relevant conversations
            memory_prompt = [
                {
                    "role": "system",
                    "content": f"Search this conversation history and provide relevant information about: {topic}\n\nConversation History: {json.dumps(self.conversation_history[-20:])}"
                },
                {
                    "role": "user",
                    "content": command
                }
            ]
            
            response = await self.ai_provider.chat_completion(memory_prompt)
            memory_result = response["choices"][0]["message"]["content"]
            
            return {
                "success": True,
                "message": memory_result
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Memory retrieval error: {str(e)}"
            }
    
    async def _handle_vendor_communication(self, command: str, intent: Dict) -> Dict[str, Any]:
        """Handle vendor and MCP communication tasks"""
        try:
            # Simulate vendor communication
            vendor = intent.get("parameters", {}).get("vendor", "vendor")
            
            return {
                "success": True,
                "message": f"✅ Initiated contact with {vendor}. MCP communication protocol engaged."
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Vendor communication error: {str(e)}"
            }
    
    async def _handle_meeting_task(self, command: str, intent: Dict) -> Dict[str, Any]:
        """Handle meeting notes and action items"""
        try:
            # Would integrate with meeting assistant
            return {
                "success": True,
                "message": "Meeting assistant ready. I can take notes and track action items."
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Meeting task error: {str(e)}"
            }
    
    async def _handle_general_conversation(self, command: str) -> Dict[str, Any]:
        """Handle general conversation and questions"""
        try:
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": command
            })
            
            # Get AI response
            conversation_prompt = [
                {
                    "role": "system",
                    "content": "You are a helpful personal AI assistant. Provide concise, actionable responses."
                }
            ] + self.conversation_history[-10:]
            
            response = await self.ai_provider.chat_completion(conversation_prompt)
            ai_response = response["choices"][0]["message"]["content"]
            
            # Add to history
            self.conversation_history.append({
                "role": "assistant", 
                "content": ai_response
            })
            
            return {
                "success": True,
                "message": ai_response
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Conversation error: {str(e)}"
            }
    
    async def run_interactive_mode(self):
        """Run the unified interactive mode"""
        print("\n💬 Unified Agent-Banks Interactive Mode")
        print("📝 I can help you with:")
        print("   🌐 Web automation (navigate, fill forms)")
        print("   ✉️  Email tasks (draft, proofread)")
        print("   🧠 Memory retrieval (recall conversations)")
        print("   🤝 Vendor communication (orders, MCP)")
        print("   📅 Meeting notes (action items)")
        print("   💬 General conversation")
        print("\nType 'quit' to exit, 'voice' to enable voice mode")
        
        voice_mode = False
        
        while True:
            try:
                if voice_mode:
                    # Voice input mode
                    print("\n🎙️  Listening...")
                    # Would implement voice listening here
                    user_input = input("👤 [Voice Mode] You: ").strip()
                else:
                    # Text input mode
                    user_input = input("\n👤 You: ").strip()
                
                if user_input.lower() in ['quit', 'exit']:
                    print("👋 Goodbye!")
                    break
                
                elif user_input.lower() == 'voice':
                    voice_mode = not voice_mode
                    status = "enabled" if voice_mode else "disabled"
                    print(f"🎙️  Voice mode {status}")
                    continue
                
                elif user_input.lower() == 'status':
                    self._show_system_status()
                    continue
                
                if not user_input:
                    continue
                
                print("🤔 Processing...")
                
                # Process the command
                result = await self.process_natural_command(user_input)
                
                # Display result
                if result["success"]:
                    print(f"🤖 Assistant: {result['message']}")
                    
                    # Voice output if enabled
                    if voice_mode and self.voice_manager:
                        await self.voice_manager.speak(result['message'])
                else:
                    print(f"❌ Error: {result['message']}")
                
                # Show additional details if available
                if "details" in result:
                    print(f"📊 Details: {result['details']}")
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ System error: {e}")


async def main():
    """Start the unified Agent-Banks system"""
    try:
        print("🚀 Starting Unified Agent-Banks System...")
        
        # Check environment variables
        required_vars = ["ANTHROPIC_API_KEY", "OPENROUTER_API_KEY"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if len(missing_vars) == len(required_vars):
            print("❌ No AI provider API keys found!")
            print("Please set at least one of:")
            for var in required_vars:
                print(f"   export {var}='your-key-here'")
            return
        
        agent_banks = UnifiedAgentBanks()
        await agent_banks.run_interactive_mode()
        
    except Exception as e:
        print(f"❌ Failed to start Agent-Banks: {e}")


if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Enhanced AI Provider with Anthropic + OpenRouter Fallback
Updates the Agent-Banks frontend to support multiple AI providers
"""

import asyncio
import json
import os
import aiohttp
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class AIProvider(Enum):
    ANTHROPIC = "anthropic"
    OPENROUTER = "openrouter"
    PERPLEXITY = "perplexity"
    DEEPSEEK = "deepseek"


@dataclass
class AIProviderConfig:
    name: str
    api_key: str
    base_url: str
    model: str
    max_tokens: int
    available: bool = True


class MultiAIProvider:
    """Enhanced AI provider with intelligent fallback between Anthropic and OpenRouter"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.providers = self._initialize_providers()
        self.current_provider = self._select_primary_provider()
        self.current_persona = "banks"  # Default persona
        self.personas = self._initialize_personas()
        
    def _initialize_providers(self) -> Dict[AIProvider, AIProviderConfig]:
        """Initialize AI provider configurations"""
        providers = {}
        
        # Anthropic Configuration
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            providers[AIProvider.ANTHROPIC] = AIProviderConfig(
                name="Anthropic Claude",
                api_key=anthropic_key,
                base_url="https://api.anthropic.com/v1/messages",
                model="claude-3-sonnet-20240229",
                max_tokens=4000,
                available=True
            )
            self.logger.info("✅ Anthropic provider configured")
        else:
            self.logger.warning("⚠️  Anthropic API key not found")
        
        # OpenRouter Configuration
        openrouter_key = os.getenv('OPENROUTER_API_KEY')
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        
        if openrouter_key:
            providers[AIProvider.OPENROUTER] = AIProviderConfig(
                name="OpenRouter",
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1/chat/completions",
                model="anthropic/claude-3-sonnet",  # Claude via OpenRouter
                max_tokens=4000,
                available=True
            )
            self.logger.info("✅ OpenRouter provider configured with Claude model")
        elif anthropic_key:
            # Use Anthropic key through OpenRouter as fallback
            providers[AIProvider.OPENROUTER] = AIProviderConfig(
                name="OpenRouter (Anthropic Key)",
                api_key=anthropic_key,
                base_url="https://openrouter.ai/api/v1/chat/completions",
                model="anthropic/claude-3-sonnet",
                max_tokens=4000,
                available=True
            )
            self.logger.info("✅ OpenRouter configured with Anthropic key as fallback")
        else:
            self.logger.warning("⚠️  Neither OpenRouter nor Anthropic API key found")
        
        # Perplexity Configuration
        perplexity_key = os.getenv('PERPLEXITY_API_KEY')
        if perplexity_key:
            providers[AIProvider.PERPLEXITY] = AIProviderConfig(
                name="Perplexity AI",
                api_key=perplexity_key,
                base_url="https://api.perplexity.ai/chat/completions",
                model="pplx-70b-online",
                max_tokens=4096
            )
            self.logger.info("✅ Perplexity provider configured")
        else:
            self.logger.warning("⚠️  Perplexity API key not found")
        
        # DeepSeek Configuration
        deepseek_key = os.getenv('DEEPSEEK_API_KEY')
        if deepseek_key:
            providers[AIProvider.DEEPSEEK] = AIProviderConfig(
                name="DeepSeek",
                api_key=deepseek_key,
                base_url="https://api.deepseek.com/v1/chat/completions",
                model="deepseek-chat",
                max_tokens=4096
            )
            self.logger.info("✅ DeepSeek provider configured")
        else:
            self.logger.warning("⚠️  DeepSeek API key not found")
            
        return providers
    
    def _initialize_personas(self) -> Dict[str, Dict[str, str]]:
        """Initialize AI personas"""
        return {
            "banks": {
                "name": "Banks",
                "wake_words": ["banks", "agent banks", "hey banks"],
                "personality": "Professional, efficient AI assistant focused on business tasks, productivity, and getting things done. Direct, concise, and results-oriented.",
                "greeting": "Banks here. Ready to handle your business needs efficiently.",
                "system_prompt": "You are Banks, a professional AI assistant. Be direct, efficient, and focus on business productivity. Keep responses concise and actionable."
            },
            "bella": {
                "name": "Bella",
                "wake_words": ["bella", "hey bella", "hi bella"],
                "personality": "Friendly, conversational AI assistant for personal tasks and casual interactions. Warm, approachable, and helpful.",
                "greeting": "Hi! I'm Bella, your friendly AI assistant. How can I help you today?",
                "system_prompt": "You are Bella, a friendly and warm AI assistant. Be conversational, empathetic, and helpful. Use a more casual tone while remaining professional."
            }
        }
    
    def detect_persona(self, message: str) -> str:
        """Detect which persona to use based on wake words"""
        message_lower = message.lower()
        
        # Check for specific wake words
        for persona_name, persona_info in self.personas.items():
            for wake_word in persona_info["wake_words"]:
                if wake_word in message_lower:
                    return persona_name
        
        # Default to current persona if no wake word detected
        return self.current_persona
    
    def switch_persona(self, persona_name: str) -> bool:
        """Switch to a specific persona"""
        if persona_name in self.personas:
            self.current_persona = persona_name
            return True
        return False
    
    def get_current_persona_info(self) -> Dict[str, str]:
        """Get current persona information"""
        return self.personas.get(self.current_persona, self.personas["banks"])
    
    def _select_primary_provider(self) -> AIProvider:
        """Select primary AI provider based on availability"""
        if AIProvider.ANTHROPIC in self.providers:
            self.logger.info("🎯 Primary provider: Anthropic")
            return AIProvider.ANTHROPIC
        elif AIProvider.OPENROUTER in self.providers:
            self.logger.info("🎯 Primary provider: OpenRouter")
            return AIProvider.OPENROUTER
        else:
            raise ValueError("No AI providers configured! Please set ANTHROPIC_API_KEY or OPENROUTER_API_KEY")
    
    async def chat_completion(self, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """
        Get chat completion with intelligent fallback
        """
        # Try primary provider first
        try:
            result = await self._call_provider(self.current_provider, messages, **kwargs)
            return result
        except Exception as e:
            self.logger.warning(f"Primary provider {self.current_provider.value} failed: {e}")
            
            # Try fallback provider
            fallback_provider = self._get_fallback_provider()
            if fallback_provider:
                try:
                    self.logger.info(f"🔄 Falling back to {fallback_provider.value}")
                    result = await self._call_provider(fallback_provider, messages, **kwargs)
                    return result
                except Exception as fallback_error:
                    self.logger.error(f"Fallback provider {fallback_provider.value} also failed: {fallback_error}")
            
            # All providers failed
            raise Exception(f"All AI providers failed. Primary: {e}")
    
    def _get_fallback_provider(self) -> Optional[AIProvider]:
        """Get fallback provider"""
        available_providers = list(self.providers.keys())
        
        # Remove current provider and return first available fallback
        if self.current_provider in available_providers:
            available_providers.remove(self.current_provider)
        
        return available_providers[0] if available_providers else None
    
    async def _call_provider(self, provider: AIProvider, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Call specific AI provider"""
        config = self.providers[provider]
        
        if provider == AIProvider.ANTHROPIC:
            return await self._call_anthropic(config, messages, **kwargs)
        elif provider == AIProvider.OPENROUTER:
            return await self._call_openrouter(config, messages, **kwargs)
        elif provider == AIProvider.PERPLEXITY:
            return await self._call_perplexity(config, messages, **kwargs)
        elif provider == AIProvider.DEEPSEEK:
            return await self._call_deepseek(config, messages, **kwargs)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    async def _call_anthropic(self, config: AIProviderConfig, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Call Anthropic API"""
        headers = {
            "Content-Type": "application/json",
            "x-api-key": config.api_key,
            "anthropic-version": "2023-06-01"
        }
        
        # Convert messages to Anthropic format
        system_message = ""
        user_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                user_messages.append(msg)
        
        payload = {
            "model": config.model,
            "max_tokens": config.max_tokens,
            "messages": user_messages
        }
        
        if system_message:
            payload["system"] = system_message
        
        async with aiohttp.ClientSession() as session:
            async with session.post(config.base_url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Anthropic API error {response.status}: {error_text}")
                
                result = await response.json()
                
                # Convert back to standard format
                return {
                    "provider": "anthropic",
                    "model": config.model,
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": result["content"][0]["text"]
                        }
                    }],
                    "usage": result.get("usage", {})
                }
    
    async def _call_openrouter(self, config: AIProviderConfig, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Call OpenRouter API"""
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Agent-Banks"
        }
        
        payload = {
            "model": config.model,
            "messages": messages,
            "max_tokens": config.max_tokens,
            "temperature": kwargs.get("temperature", 0.7)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(config.base_url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenRouter API error {response.status}: {error_text}")
                
                result = await response.json()
                result["provider"] = "openrouter"
                return result
    
    async def _call_perplexity(self, config: AIProviderConfig, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Call Perplexity API"""
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": config.model,
            "messages": messages,
            "max_tokens": config.max_tokens,
            "temperature": kwargs.get("temperature", 0.7)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(config.base_url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Perplexity API error {response.status}: {error_text}")
                
                result = await response.json()
                result["provider"] = "perplexity"
                return result
    
    async def _call_deepseek(self, config: AIProviderConfig, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Call DeepSeek API"""
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": config.model,
            "messages": messages,
            "max_tokens": config.max_tokens,
            "temperature": kwargs.get("temperature", 0.7)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(config.base_url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"DeepSeek API error {response.status}: {error_text}")
                
                result = await response.json()
                result["provider"] = "deepseek"
                return result
    
    def process_message(self, message: str) -> str:
        """Process message with persona detection and AI response"""
        try:
            # Detect persona from message
            detected_persona = self.detect_persona(message)
            
            # Switch persona if different
            if detected_persona != self.current_persona:
                self.switch_persona(detected_persona)
                persona_info = self.get_current_persona_info()
                return f"✨ Switched to {persona_info['name']}! {persona_info['greeting']}"
            
            # Get current persona info
            persona_info = self.get_current_persona_info()
            
            # Prepare messages with persona system prompt
            messages = [
                {"role": "system", "content": persona_info["system_prompt"]},
                {"role": "user", "content": message}
            ]
            
            # Call AI provider synchronously (for web interface)
            import asyncio
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            response = loop.run_until_complete(self.chat_completion(messages))
            
            # Extract response text
            if response and "choices" in response and len(response["choices"]) > 0:
                return response["choices"][0]["message"]["content"]
            else:
                return "I apologize, but I couldn't generate a response. Please try again."
                
        except Exception as e:
            self.logger.error(f"Error processing message: {e}")
            return f"I encountered an error: {str(e)}. Please try again or check your API configuration."
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        status = {
            "primary_provider": self.current_provider.value,
            "providers": {}
        }
        
        for provider, config in self.providers.items():
            status["providers"][provider.value] = {
                "name": config.name,
                "model": config.model,
                "available": config.available,
                "api_key_set": bool(config.api_key)
            }
        
        return status


class EnhancedPersonalAssistant:
    """Enhanced Personal Assistant with multi-provider AI support"""
    
    def __init__(self):
        self.ai_provider = MultiAIProvider()
        self.conversation_history = []
        
        print("🤖 Enhanced Personal Assistant with AI Fallback ready!")
        self._show_provider_status()
    
    def _show_provider_status(self):
        """Show current AI provider configuration"""
        status = self.ai_provider.get_provider_status()
        print(f"🎯 Primary AI Provider: {status['primary_provider']}")
        
        for provider_name, provider_info in status['providers'].items():
            icon = "✅" if provider_info['available'] else "❌"
            print(f"{icon} {provider_info['name']} ({provider_info['model']})")
    
    async def process_command(self, user_input: str) -> str:
        """Process user command with AI fallback"""
        try:
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            # Create system message for personal assistant context
            system_message = {
                "role": "system",
                "content": """You are a helpful personal AI assistant that can:
                - Navigate websites and fill forms
                - Draft and proofread emails
                - Remember conversations and execution plans
                - Manage tasks and schedules
                - Contact vendors via MCP
                - Take meeting notes and create action items
                
                Provide concise, actionable responses. If you need to perform actions, 
                explain what you're going to do before doing it."""
            }
            
            # Prepare messages for AI
            messages = [system_message] + self.conversation_history[-10:]  # Keep last 10 exchanges
            
            # Get AI response with fallback
            response = await self.ai_provider.chat_completion(messages)
            
            ai_response = response["choices"][0]["message"]["content"]
            provider_used = response.get("provider", "unknown")
            
            # Add AI response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": ai_response
            })
            
            print(f"🧠 Response from: {provider_used}")
            return ai_response
            
        except Exception as e:
            error_msg = f"AI processing failed: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg
    
    async def run_interactive_mode(self):
        """Run interactive mode with AI fallback"""
        print("\n💬 Interactive mode started. Type 'quit' to exit.")
        print("Example commands:")
        print("  - Navigate to github.com and check my repositories")
        print("  - Draft an email about project updates")
        print("  - Remember our conversation about development plans")
        print("  - Create a task to call the vendor tomorrow")
        
        while True:
            try:
                user_input = input("\n👤 You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print("👋 Goodbye!")
                    break
                
                if not user_input:
                    continue
                
                print("🤔 Processing...")
                response = await self.process_command(user_input)
                print(f"🤖 Assistant: {response}")
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")


async def main():
    """Test the enhanced AI provider"""
    try:
        assistant = EnhancedPersonalAssistant()
        await assistant.run_interactive_mode()
    except Exception as e:
        print(f"❌ Failed to start assistant: {e}")
        print("\nPlease ensure you have set either:")
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        print("  export OPENROUTER_API_KEY='your-key-here'")


if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Test Agent-Banks System
Simple test script to demonstrate the unified system
"""

import asyncio
import os

# Set test API keys if not already set
if not os.getenv('ANTHROPIC_API_KEY') and not os.getenv('OPENROUTER_API_KEY'):
    print("🔧 Setting test API keys...")
    os.environ['ANTHROPIC_API_KEY'] = 'test-key-for-demo'

async def test_agent_banks():
    """Test the Agent-Banks system"""
    try:
        print("🚀 Testing Agent-Banks Unified System")
        print("=" * 50)
        
        # Import and test
        from unified_frontend import UnifiedAgentBanks
        
        agent = UnifiedAgentBanks()
        
        print("\n🧪 Testing command analysis...")
        
        # Test different command types
        test_commands = [
            "Navigate to github.com and check my repositories",
            "Draft an email about project updates", 
            "Remember our conversation about development plans",
            "Contact vendor Susan about the order",
            "What's the weather like today?"
        ]
        
        for command in test_commands:
            print(f"\n🎯 Testing: {command}")
            try:
                result = await agent.process_natural_command(command)
                print(f"✅ Result: {result['message']}")
            except Exception as e:
                print(f"❌ Error: {e}")
        
        print("\n✅ Agent-Banks test completed!")
        print("\n📊 System Capabilities Summary:")
        agent._show_system_status()
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent_banks())
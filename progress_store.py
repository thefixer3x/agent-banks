#!/usr/bin/env python3
"""
Progress Store - Migration Helper
Stores progress reports in both old CLI and new MCP memory systems
Pending migration to full MCP approach
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional


class ProgressStore:
    """Store progress in both old and new memory systems during migration"""
    
    def __init__(self):
        self.old_connector = None  # Will be CLI connector
        self.new_connector = None  # Will be MCP connector
        self.memory_client = None
        self.session_id = None
        
        # Initialize connectors
        self._init_connectors()
    
    def _init_connectors(self):
        """Initialize both old CLI and new MCP connectors"""
        try:
            # New MCP connector (preferred)
            from claude_mcp_connector import ClaudeMCPConnector
            self.new_connector = ClaudeMCPConnector()
            self.session_id = self.new_connector.session_id
            print("✅ New MCP connector initialized")
        except Exception as e:
            print(f"⚠️ MCP connector failed: {e}")
        
        try:
            # Old CLI connector (fallback)
            from claude_cli_connector import ClaudeCLIConnector
            self.old_connector = ClaudeCLIConnector()
            if not self.session_id:
                self.session_id = self.old_connector.session_id
            print("✅ Old CLI connector initialized")
        except Exception as e:
            print(f"⚠️ CLI connector failed: {e}")
        
        try:
            # Memory client
            from enhanced_memory_client import SDGhostMemoryClient
            self.memory_client = SDGhostMemoryClient()
            print("✅ Memory client initialized")
        except Exception as e:
            print(f"⚠️ Memory client failed: {e}")
    
    async def store_progress_report(self, title: str, description: str, 
                                  status: str = "completed", 
                                  metadata: Dict[str, Any] = None) -> Dict[str, str]:
        """Store progress report in both old and new systems"""
        
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "report_type": "progress",
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "migration_phase": "dual_storage"
        })
        
        # Create progress report content
        progress_content = f"""Progress Report: {title}

Status: {status.upper()}
Description: {description}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Details:
{json.dumps(metadata, indent=2)}"""
        
        results = {}
        
        # Store in new MCP system (preferred)
        if self.new_connector and self.new_connector.is_connected():
            try:
                response = await self.new_connector.chat_with_claude_mcp(
                    f"Please acknowledge this progress report and store it in memory:\n\n{progress_content}",
                    metadata
                )
                results["mcp_storage"] = "✅ Stored in MCP system"
                print(f"✅ Progress stored in MCP: {title}")
            except Exception as e:
                results["mcp_storage"] = f"❌ MCP storage failed: {e}"
                print(f"❌ MCP storage failed: {e}")
        else:
            results["mcp_storage"] = "❌ MCP not available"
        
        # Store in old CLI system (fallback)
        if self.old_connector and hasattr(self.old_connector, 'claude_cli_path'):
            try:
                response = await self.old_connector.chat_with_claude(
                    f"Please acknowledge this progress report:\n\n{progress_content}",
                    metadata
                )
                results["cli_storage"] = "✅ Stored in CLI system"
                print(f"✅ Progress stored in CLI: {title}")
            except Exception as e:
                results["cli_storage"] = f"❌ CLI storage failed: {e}"
                print(f"❌ CLI storage failed: {e}")
        else:
            results["cli_storage"] = "❌ CLI not available"
        
        # Store in memory system (universal backup)
        if self.memory_client:
            try:
                memory_id = await self.memory_client.store_memory(
                    progress_content, 
                    "progress_report", 
                    metadata
                )
                results["memory_storage"] = f"✅ Stored in memory: {memory_id[:8]}..."
                print(f"✅ Progress stored in memory: {title}")
            except Exception as e:
                results["memory_storage"] = f"❌ Memory storage failed: {e}"
                print(f"❌ Memory storage failed: {e}")
        else:
            results["memory_storage"] = "❌ Memory client not available"
        
        return results
    
    async def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status"""
        return {
            "migration_phase": "dual_storage",
            "preferred_system": "MCP",
            "fallback_system": "CLI",
            "backup_system": "Memory",
            "connectors": {
                "mcp_available": bool(self.new_connector and self.new_connector.is_connected()),
                "cli_available": bool(self.old_connector and hasattr(self.old_connector, 'claude_cli_path')),
                "memory_available": bool(self.memory_client)
            },
            "session_id": self.session_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def create_migration_report(self) -> str:
        """Create a comprehensive migration report"""
        status = await self.get_migration_status()
        
        report = f"""🔄 Migration Status Report

Phase: {status['migration_phase'].upper()}
Preferred System: {status['preferred_system']} (Model Context Protocol)
Session ID: {status['session_id']}

System Availability:
• MCP Connector: {'✅ Available' if status['connectors']['mcp_available'] else '❌ Unavailable'}
• CLI Connector: {'✅ Available' if status['connectors']['cli_available'] else '❌ Unavailable'}  
• Memory Client: {'✅ Available' if status['connectors']['memory_available'] else '❌ Unavailable'}

Migration Strategy:
1. Store all progress in MCP system (preferred)
2. Fallback to CLI system if MCP unavailable
3. Always backup to memory system
4. Gradual transition to full MCP approach

Timestamp: {status['timestamp']}
"""
        
        # Store this migration report itself
        await self.store_progress_report(
            "Migration Status Report",
            "Current state of CLI→MCP migration",
            "active",
            {"report_type": "migration_status"}
        )
        
        return report


# Convenience functions for easy use
async def store_progress(title: str, description: str, status: str = "completed", 
                        metadata: Dict[str, Any] = None) -> Dict[str, str]:
    """Quick function to store progress in both systems"""
    store = ProgressStore()
    return await store.store_progress_report(title, description, status, metadata)


async def migration_status() -> str:
    """Quick function to get migration status"""
    store = ProgressStore()
    return await store.create_migration_report()


async def main():
    """Test the progress store"""
    print("🔄 Testing Progress Store (Dual System)...")
    
    store = ProgressStore()
    
    # Test migration status
    print("\n📊 Getting migration status...")
    status_report = await store.create_migration_report()
    print(status_report)
    
    # Test progress storage
    print("\n📝 Testing progress storage...")
    results = await store.store_progress_report(
        "MCP Integration Complete",
        "Successfully implemented Model Context Protocol connector as preferred method over CLI path detection",
        "completed",
        {
            "features": ["MCP connection", "Memory integration", "Dual storage"],
            "improvements": "More reliable than CLI path detection"
        }
    )
    
    print("\n✅ Storage Results:")
    for system, result in results.items():
        print(f"   {system}: {result}")


if __name__ == "__main__":
    asyncio.run(main())
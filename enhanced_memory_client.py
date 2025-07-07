#!/usr/bin/env python3
"""
Enhanced Memory Client for Claude's Realm IDE
First client to connect to SD-Ghost Protocol memory service
Based on Cline's Claude CLI integration pattern
"""

import os
import sys
import json
import asyncio
import aiohttp
import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import uuid


@dataclass
class MemoryEntry:
    """Memory entry structure compatible with SD-Ghost Protocol"""
    id: str
    timestamp: datetime
    session_id: str
    content_type: str  # "conversation", "code_analysis", "project", "insight"
    content: str
    metadata: Dict[str, Any]
    embedding_hash: str
    relevance_score: float = 0.0
    
    def to_dict(self):
        """Convert to dict for JSON serialization"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MemoryEntry':
        """Create from dict"""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)


class SDGhostMemoryClient:
    """
    First client to connect to SD-Ghost Protocol memory service
    Provides persistent memory for Claude's Realm IDE
    """
    
    def __init__(self, sd_ghost_url: str = "http://localhost:3000"):
        self.sd_ghost_url = sd_ghost_url
        self.session_id = str(uuid.uuid4())
        self.local_db_path = os.path.expanduser("~/.claude_realm_memory.db")
        
        # Memory configuration
        self.config = {
            "memory_retention_days": 30,
            "max_memories_per_session": 1000,
            "embedding_model": "claude-text-embeddings",
            "similarity_threshold": 0.7,
            "auto_cleanup": True
        }
        
        # Initialize local database as backup
        self.init_local_db()
        
        print(f"🧠 Memory Client initialized")
        print(f"   Session: {self.session_id}")
        print(f"   SD-Ghost: {self.sd_ghost_url}")
        print(f"   Local DB: {self.local_db_path}")
    
    def init_local_db(self):
        """Initialize local SQLite database as backup"""
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                session_id TEXT,
                content_type TEXT,
                content TEXT,
                metadata TEXT,
                embedding_hash TEXT,
                relevance_score REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_session_id ON memories(session_id);
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_content_type ON memories(content_type);
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp);
        ''')
        
        conn.commit()
        conn.close()
    
    async def check_sd_ghost_connection(self) -> bool:
        """Check if SD-Ghost Protocol memory service is available"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(f"{self.sd_ghost_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ SD-Ghost Protocol connected: {data.get('status', 'unknown')}")
                        return True
                    else:
                        print(f"⚠️  SD-Ghost Protocol health check failed: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ SD-Ghost Protocol connection failed: {e}")
            return False
    
    async def store_memory(self, content: str, content_type: str, 
                          metadata: Dict[str, Any] = None) -> str:
        """Store memory in SD-Ghost Protocol and local backup"""
        
        if metadata is None:
            metadata = {}
        
        # Create memory entry
        memory_id = str(uuid.uuid4())
        embedding_hash = hashlib.md5(content.encode()).hexdigest()
        
        memory = MemoryEntry(
            id=memory_id,
            timestamp=datetime.now(),
            session_id=self.session_id,
            content_type=content_type,
            content=content,
            metadata=metadata,
            embedding_hash=embedding_hash
        )
        
        # Try to store in SD-Ghost Protocol first
        try:
            await self._store_in_sd_ghost(memory)
            print(f"✅ Memory stored in SD-Ghost Protocol: {memory_id[:8]}...")
        except Exception as e:
            print(f"⚠️  SD-Ghost storage failed, using local: {e}")
        
        # Always store locally as backup
        self._store_locally(memory)
        
        return memory_id
    
    async def _store_in_sd_ghost(self, memory: MemoryEntry):
        """Store memory in SD-Ghost Protocol memory service"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "memory": memory.to_dict(),
                "client_type": "claude_realm_ide",
                "version": "1.0.0"
            }
            
            async with session.post(
                f"{self.sd_ghost_url}/api/memory/store",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"SD-Ghost storage failed: {response.status} - {error_text}")
                
                result = await response.json()
                return result.get("memory_id")
    
    def _store_locally(self, memory: MemoryEntry):
        """Store memory in local SQLite database"""
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO memories 
            (id, timestamp, session_id, content_type, content, metadata, embedding_hash, relevance_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            memory.id,
            memory.timestamp.isoformat(),
            memory.session_id,
            memory.content_type,
            memory.content,
            json.dumps(memory.metadata),
            memory.embedding_hash,
            memory.relevance_score
        ))
        
        conn.commit()
        conn.close()
    
    async def retrieve_memories(self, query: str, content_type: str = None, 
                              limit: int = 10) -> List[MemoryEntry]:
        """Retrieve relevant memories from SD-Ghost Protocol or local storage"""
        
        # Try SD-Ghost Protocol first
        try:
            memories = await self._retrieve_from_sd_ghost(query, content_type, limit)
            if memories:
                return memories
        except Exception as e:
            print(f"⚠️  SD-Ghost retrieval failed, using local: {e}")
        
        # Fall back to local storage
        return self._retrieve_locally(query, content_type, limit)
    
    async def _retrieve_from_sd_ghost(self, query: str, content_type: str = None, 
                                    limit: int = 10) -> List[MemoryEntry]:
        """Retrieve memories from SD-Ghost Protocol"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "query": query,
                "content_type": content_type,
                "limit": limit,
                "session_id": self.session_id,
                "similarity_threshold": self.config["similarity_threshold"]
            }
            
            async with session.post(
                f"{self.sd_ghost_url}/api/memory/retrieve",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"SD-Ghost retrieval failed: {response.status} - {error_text}")
                
                result = await response.json()
                memories = []
                
                for memory_data in result.get("memories", []):
                    memories.append(MemoryEntry.from_dict(memory_data))
                
                return memories
    
    def _retrieve_locally(self, query: str, content_type: str = None, 
                         limit: int = 10) -> List[MemoryEntry]:
        """Retrieve memories from local SQLite database"""
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        
        # Simple text search (could be enhanced with FTS)
        if content_type:
            cursor.execute('''
                SELECT * FROM memories 
                WHERE content LIKE ? AND content_type = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (f"%{query}%", content_type, limit))
        else:
            cursor.execute('''
                SELECT * FROM memories 
                WHERE content LIKE ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (f"%{query}%", limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        memories = []
        for row in rows:
            memory = MemoryEntry(
                id=row[0],
                timestamp=datetime.fromisoformat(row[1]),
                session_id=row[2],
                content_type=row[3],
                content=row[4],
                metadata=json.loads(row[5]),
                embedding_hash=row[6],
                relevance_score=row[7]
            )
            memories.append(memory)
        
        return memories
    
    async def get_conversation_context(self, limit: int = 5) -> str:
        """Get recent conversation context for Claude"""
        memories = await self.retrieve_memories(
            query="conversation", 
            content_type="conversation", 
            limit=limit
        )
        
        context = "Recent conversation history:\n"
        for memory in reversed(memories):  # Chronological order
            context += f"[{memory.timestamp.strftime('%H:%M')}] {memory.content}\n"
        
        return context
    
    async def store_code_analysis(self, code: str, analysis: str, 
                                language: str, metadata: Dict[str, Any] = None) -> str:
        """Store code analysis in memory"""
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "language": language,
            "code_hash": hashlib.md5(code.encode()).hexdigest(),
            "analysis_type": "claude_analysis"
        })
        
        content = f"Code Analysis:\nLanguage: {language}\nCode:\n{code}\n\nAnalysis:\n{analysis}"
        
        return await self.store_memory(content, "code_analysis", metadata)
    
    async def store_conversation(self, user_message: str, claude_response: str, 
                               metadata: Dict[str, Any] = None) -> str:
        """Store conversation exchange"""
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "exchange_type": "user_claude",
            "user_message_length": len(user_message),
            "claude_response_length": len(claude_response)
        })
        
        content = f"User: {user_message}\n\nClaude: {claude_response}"
        
        return await self.store_memory(content, "conversation", metadata)
    
    async def get_project_context(self, project_name: str) -> str:
        """Get project-specific context"""
        memories = await self.retrieve_memories(
            query=project_name,
            content_type="project",
            limit=20
        )
        
        if not memories:
            return f"No previous context found for project: {project_name}"
        
        context = f"Project context for {project_name}:\n\n"
        for memory in memories:
            context += f"• {memory.content[:200]}...\n"
        
        return context
    
    async def store_insight(self, insight: str, category: str = "general", 
                          metadata: Dict[str, Any] = None) -> str:
        """Store insights and learnings"""
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "insight_category": category,
            "importance": "high"  # Could be determined dynamically
        })
        
        return await self.store_memory(insight, "insight", metadata)
    
    async def cleanup_old_memories(self):
        """Clean up old memories based on retention policy"""
        cutoff_date = datetime.now() - timedelta(days=self.config["memory_retention_days"])
        
        # Clean local database
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM memories 
            WHERE timestamp < ?
        ''', (cutoff_date.isoformat(),))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        print(f"🧹 Cleaned up {deleted_count} old memories")
        
        # Also request cleanup from SD-Ghost Protocol
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "cutoff_date": cutoff_date.isoformat(),
                    "session_id": self.session_id
                }
                
                async with session.post(
                    f"{self.sd_ghost_url}/api/memory/cleanup",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"🧹 SD-Ghost cleanup: {result.get('deleted_count', 0)} memories")
        except Exception as e:
            print(f"⚠️  SD-Ghost cleanup failed: {e}")
    
    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        # Local stats
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM memories')
        total_local = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT content_type, COUNT(*) 
            FROM memories 
            GROUP BY content_type
        ''')
        local_by_type = dict(cursor.fetchall())
        
        conn.close()
        
        stats = {
            "local_memories": {
                "total": total_local,
                "by_type": local_by_type
            },
            "session_id": self.session_id,
            "sd_ghost_connected": await self.check_sd_ghost_connection()
        }
        
        # Try to get SD-Ghost stats
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.sd_ghost_url}/api/memory/stats?session_id={self.session_id}"
                ) as response:
                    if response.status == 200:
                        sd_ghost_stats = await response.json()
                        stats["sd_ghost_memories"] = sd_ghost_stats
        except Exception as e:
            stats["sd_ghost_error"] = str(e)
        
        return stats


class ClaudeMemoryEnhancer:
    """
    Enhances Claude CLI with persistent memory
    Based on Cline's integration pattern
    """
    
    def __init__(self, claude_cli_path: str, memory_client: SDGhostMemoryClient):
        self.claude_cli_path = claude_cli_path
        self.memory_client = memory_client
        
    async def enhanced_chat(self, message: str, context: Dict[str, Any] = None) -> str:
        """Chat with Claude enhanced by memory context"""
        
        # Get relevant memory context
        memory_context = await self.memory_client.get_conversation_context(limit=5)
        
        # Get project context if available
        project_context = ""
        if context and context.get("project_name"):
            project_context = await self.memory_client.get_project_context(
                context["project_name"]
            )
        
        # Prepare enhanced message with memory
        enhanced_message = f"""
{memory_context}

{project_context}

Current request: {message}
"""
        
        # Call Claude CLI (implementation similar to your claude_cli_connector.py)
        # This would use the same pattern as Cline
        response = await self._call_claude_cli(enhanced_message)
        
        # Store the conversation
        await self.memory_client.store_conversation(message, response, context)
        
        return response
    
    async def _call_claude_cli(self, message: str) -> str:
        """Call Claude CLI with enhanced context"""
        # Implementation similar to your claude_cli_connector.py
        # Following Cline's pattern for Claude CLI integration
        
        import tempfile
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(message)
            temp_file = f.name
        
        try:
            cmd = [
                self.claude_cli_path,
                "chat",
                "--file", temp_file,
                "--model", "claude-3-5-sonnet-20241022",
                "--no-stream"
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return stdout.decode('utf-8').strip()
            else:
                return f"Error: {stderr.decode('utf-8').strip()}"
                
        finally:
            try:
                os.unlink(temp_file)
            except:
                pass


async def main():
    """Test the enhanced memory client"""
    print("🧠 Testing SD-Ghost Protocol Memory Client...")
    
    # Initialize memory client
    memory_client = SDGhostMemoryClient()
    
    # Check SD-Ghost connection
    connected = await memory_client.check_sd_ghost_connection()
    if connected:
        print("✅ Connected to SD-Ghost Protocol memory service!")
    else:
        print("⚠️  SD-Ghost Protocol not available, using local storage only")
    
    # Test storing memories
    print("\n📝 Testing memory storage...")
    
    # Store a conversation
    conv_id = await memory_client.store_conversation(
        "Hello Claude, how are you today?",
        "Hello! I'm doing well, thank you for asking. How can I help you today?",
        {"context": "greeting"}
    )
    print(f"✅ Stored conversation: {conv_id[:8]}...")
    
    # Store code analysis
    code_id = await memory_client.store_code_analysis(
        "def hello():\n    return 'world'",
        "This is a simple function that returns a string. It follows Python naming conventions.",
        "python",
        {"file": "example.py"}
    )
    print(f"✅ Stored code analysis: {code_id[:8]}...")
    
    # Store insight
    insight_id = await memory_client.store_insight(
        "Users prefer simple, elegant code over complex solutions",
        "design_principle"
    )
    print(f"✅ Stored insight: {insight_id[:8]}...")
    
    # Test retrieval
    print("\n🔍 Testing memory retrieval...")
    
    memories = await memory_client.retrieve_memories("hello", limit=5)
    print(f"✅ Retrieved {len(memories)} memories for 'hello'")
    
    for memory in memories:
        print(f"   • {memory.content_type}: {memory.content[:50]}...")
    
    # Get stats
    print("\n📊 Memory statistics:")
    stats = await memory_client.get_memory_stats()
    print(json.dumps(stats, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
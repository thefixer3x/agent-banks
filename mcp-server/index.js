#!/usr/bin/env node

/**
 * SD-Ghost Protocol MCP Server
 * Memory-aware AI assistant with persistent conversation context
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.production') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize Express app
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: process.env.MCP_SERVER_NAME,
    version: process.env.MCP_SERVER_VERSION,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// MCP Tool Handlers
const toolHandlers = {
  search_memories: async (params) => {
    try {
      // Generate embedding for the query
      const { data: embeddingData } = await supabase.functions.invoke('generate-embedding', {
        body: { text: params.query }
      });

      if (!embeddingData?.embedding) {
        throw new Error('Failed to generate embedding');
      }

      // Search memories using vector similarity
      const { data: memories, error } = await supabase.rpc('search_memories', {
        query_embedding: embeddingData.embedding,
        match_threshold: params.threshold || 0.7,
        match_count: params.limit || 5,
        filter_project_ref: 'mcp-server'
      });

      if (error) throw error;

      return {
        success: true,
        memories: memories || [],
        count: memories?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  create_memory: async (params) => {
    try {
      const { data, error } = await supabase
        .from('memory_entries')
        .insert({
          title: params.title,
          content: params.content,
          tags: params.tags || [],
          memory_type: params.memory_type || 'knowledge',
          status: 'active',
          project_ref: 'mcp-server',
          metadata: {
            source: 'mcp-server',
            created_via: 'tool_call'
          }
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        memory: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  get_conversation_context: async (params) => {
    try {
      const query = supabase
        .from('chat_sessions')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (params.session_id) {
        query.eq('id', params.session_id);
      }

      const { data, error } = await query.limit(1).single();

      if (error) throw error;

      const messages = data?.messages || [];
      const limitedMessages = params.limit 
        ? messages.slice(-params.limit)
        : messages;

      return {
        success: true,
        session_id: data?.id,
        messages: limitedMessages,
        message_count: limitedMessages.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  analyze_conversation: async (params) => {
    try {
      // Get current conversation context
      const contextResult = await toolHandlers.get_conversation_context({});
      
      if (!contextResult.success) {
        throw new Error('Failed to get conversation context');
      }

      let analysis = {
        focus_area: params.focus_area,
        message_count: contextResult.message_count,
        insights: [],
        patterns: []
      };

      // Analyze based on focus area
      const messages = contextResult.messages || [];
      
      if (params.focus_area === 'topics') {
        // Extract main topics discussed
        const topics = new Set();
        messages.forEach(msg => {
          if (msg.role === 'user') {
            // Simple topic extraction (can be enhanced)
            const words = msg.content.toLowerCase().split(/\s+/);
            words.forEach(word => {
              if (word.length > 5) topics.add(word);
            });
          }
        });
        analysis.insights.push(`Main topics: ${Array.from(topics).slice(0, 10).join(', ')}`);
      }

      // Include related memories if requested
      if (params.include_memories && messages.length > 0) {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
          const memoryResult = await toolHandlers.search_memories({
            query: lastUserMessage.content,
            limit: 3
          });
          
          if (memoryResult.success && memoryResult.memories.length > 0) {
            analysis.related_memories = memoryResult.memories;
          }
        }
      }

      return {
        success: true,
        analysis
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, tools, session_id } = req.body;

    // Call the Supabase AI chat function
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages,
        model: 'openai', // Default model
        enableToolOrchestration: true,
        conversationId: session_id
      }
    });

    if (error) throw error;

    res.json({
      success: true,
      response: data.response,
      tool_calls: data.tool_calls_executed || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tool execution endpoint
app.post('/api/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const params = req.body;

    if (!toolHandlers[toolName]) {
      return res.status(404).json({
        success: false,
        error: `Tool ${toolName} not found`
      });
    }

    const result = await toolHandlers[toolName](params);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket connection for real-time features
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe' && data.channel) {
        // Subscribe to Supabase real-time channel
        const channel = supabase
          .channel(data.channel)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: data.table || 'memory_entries' 
          }, (payload) => {
            ws.send(JSON.stringify({
              type: 'update',
              channel: data.channel,
              payload
            }));
          })
          .subscribe();

        ws.on('close', () => {
          channel.unsubscribe();
        });
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SD-Ghost Protocol MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
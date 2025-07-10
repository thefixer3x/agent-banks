#!/usr/bin/env node

/**
 * Enhanced Smart Memory Server - Based on CUA Memory Architecture
 * Implements vector search, embedding generation, and advanced memory features
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

// Logging utility
const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Generate embedding using OpenAI (like CUA implementation)
async function generateEmbedding(text) {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        log('error', 'Failed to generate embedding', { error: error.message, text: text.substring(0, 100) });
        throw error;
    }
}

// Enhanced memory search with vector similarity (CUA pattern)
async function searchMemoriesVector(query, options = {}) {
    const {
        limit = 5,
        threshold = 0.7,
        projectRef = 'smart-memory-server',
        includeMetadata = true
    } = options;

    try {
        // Generate embedding for the query
        log('info', 'Generating embedding for search query', { query: query.substring(0, 100) });
        const queryEmbedding = await generateEmbedding(query);
        
        // Call the enhanced search function (based on CUA implementation)
        const { data: memories, error } = await supabase.rpc('search_memories_enhanced', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit,
            filter_project_ref: projectRef
        });

        if (error) {
            // Fallback to basic search if vector search fails
            log('warn', 'Vector search failed, falling back to text search', { error: error.message });
            return await searchMemoriesText(query, { limit });
        }

        // Enhance results with metadata if requested
        const enhancedMemories = includeMetadata ? 
            memories.map(memory => ({
                ...memory,
                similarity_percentage: Math.round(memory.similarity * 100),
                relevance_category: memory.similarity > 0.9 ? 'high' : 
                                   memory.similarity > 0.7 ? 'medium' : 'low',
                search_metadata: {
                    query_length: query.length,
                    embedding_model: 'text-embedding-ada-002',
                    search_threshold: threshold
                }
            })) : memories;

        log('info', 'Vector search completed', { 
            resultsCount: enhancedMemories.length, 
            avgSimilarity: memories.length > 0 ? (memories.reduce((sum, m) => sum + m.similarity, 0) / memories.length).toFixed(3) : 0
        });

        return {
            success: true,
            memories: enhancedMemories,
            count: enhancedMemories.length,
            search_type: 'vector',
            query_analysis: {
                length: query.length,
                has_keywords: query.split(' ').length > 1,
                estimated_intent: query.length > 50 ? 'detailed_query' : 'keyword_search'
            }
        };
    } catch (error) {
        log('error', 'Vector search error', { error: error.message });
        throw error;
    }
}

// Fallback text search (current implementation enhanced)
async function searchMemoriesText(query, options = {}) {
    const { limit = 5 } = options;
    
    try {
        log('info', 'Performing text search', { query: query.substring(0, 100) });
        
        // Try multiple search strategies (CUA pattern)
        const searchStrategies = [
            // Exact phrase search
            supabase
                .from('memory_entries')
                .select('id, title, content, summary, memory_type, created_at, relevance_score')
                .ilike('content', `%${query}%`)
                .limit(limit),
            
            // Title search (higher priority)
            supabase
                .from('memory_entries')
                .select('id, title, content, summary, memory_type, created_at, relevance_score')
                .ilike('title', `%${query}%`)
                .limit(limit),
            
            // Full text search if available
            supabase
                .from('memory_entries')
                .select('id, title, content, summary, memory_type, created_at, relevance_score')
                .textSearch('content', query, {
                    type: 'websearch',
                    config: 'english'
                })
                .limit(limit)
        ];

        // Execute all strategies and combine results
        const results = await Promise.allSettled(searchStrategies);
        const allMemories = [];
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.data) {
                result.value.data.forEach(memory => {
                    if (!allMemories.find(m => m.id === memory.id)) {
                        allMemories.push({
                            ...memory,
                            similarity: index === 1 ? 0.8 : 0.6, // Higher score for title matches
                            search_strategy: ['content', 'title', 'fulltext'][index]
                        });
                    }
                });
            }
        });

        // Sort by similarity and limit results
        const sortedMemories = allMemories
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        log('info', 'Text search completed', { resultsCount: sortedMemories.length });

        return {
            success: true,
            memories: sortedMemories,
            count: sortedMemories.length,
            search_type: 'text',
            strategies_used: results.map((r, i) => ({ 
                strategy: ['content', 'title', 'fulltext'][i], 
                success: r.status === 'fulfilled',
                count: r.status === 'fulfilled' ? (r.value.data?.length || 0) : 0
            }))
        };
    } catch (error) {
        log('error', 'Text search error', { error: error.message });
        throw error;
    }
}

// Create memory entry (CUA pattern)
async function createMemory(memoryData) {
    try {
        const {
            title,
            content,
            summary = '',
            memory_type = 'reference',
            tags = [],
            source_url = null,
            project_ref = 'smart-memory-server'
        } = memoryData;

        // Generate embedding for content
        const embedding = await generateEmbedding(content);
        
        // Calculate relevance score based on content quality
        const relevance_score = calculateRelevanceScore(content, title);

        const { data, error } = await supabase
            .from('memory_entries')
            .insert({
                title,
                content,
                summary,
                memory_type,
                tags,
                source_url,
                project_ref,
                embedding: JSON.stringify(embedding),
                relevance_score,
                status: 'active',
                access_count: 0,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        log('info', 'Memory created successfully', { id: data.id, title: title.substring(0, 50) });
        return { success: true, memory: data };
    } catch (error) {
        log('error', 'Failed to create memory', { error: error.message });
        throw error;
    }
}

// Calculate relevance score (CUA algorithm)
function calculateRelevanceScore(content, title) {
    let score = 0.5; // Base score
    
    // Content length factor
    if (content.length > 1000) score += 0.2;
    else if (content.length > 500) score += 0.1;
    
    // Title quality factor
    if (title && title.length > 10) score += 0.1;
    
    // Content quality indicators
    if (content.includes('?')) score += 0.05; // Questions are valuable
    if (content.split('.').length > 3) score += 0.1; // Well-structured content
    if (content.match(/\b(how|what|why|when|where)\b/gi)) score += 0.05; // Knowledge indicators
    
    return Math.min(score, 1.0); // Cap at 1.0
}

// Enhanced health check
app.get('/health', (req, res) => {
    const health = {
        status: 'ok',
        server: 'Enhanced Smart Memory Server',
        version: '2.0.0',
        uptime: process.uptime(),
        supabase: supabaseUrl ? 'configured' : 'missing',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
        features: {
            vector_search: !!process.env.OPENAI_API_KEY,
            text_search: true,
            memory_creation: true,
            embedding_generation: !!process.env.OPENAI_API_KEY
        },
        timestamp: new Date().toISOString()
    };
    
    res.json(health);
});

// Enhanced memory search endpoint
app.post('/api/memories/search', async (req, res) => {
    try {
        const { 
            query, 
            limit = 5, 
            threshold = 0.7, 
            search_type = 'auto',
            project_ref = 'smart-memory-server',
            include_metadata = true
        } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Query parameter is required',
                message: 'Please provide a search query'
            });
        }

        log('info', 'Memory search request received', { 
            query: query.substring(0, 100), 
            limit, 
            threshold, 
            search_type 
        });

        let result;

        // Determine search strategy
        if (search_type === 'vector' || (search_type === 'auto' && process.env.OPENAI_API_KEY)) {
            try {
                result = await searchMemoriesVector(query, { 
                    limit, 
                    threshold, 
                    projectRef: project_ref,
                    includeMetadata: include_metadata 
                });
            } catch (error) {
                log('warn', 'Vector search failed, falling back to text search', { error: error.message });
                result = await searchMemoriesText(query, { limit });
            }
        } else {
            result = await searchMemoriesText(query, { limit });
        }

        res.json(result);
    } catch (error) {
        log('error', 'Memory search failed', { error: error.message });
        res.status(500).json({ 
            success: false,
            error: error.message,
            message: 'Memory search failed'
        });
    }
});

// Create memory endpoint
app.post('/api/memories', async (req, res) => {
    try {
        const result = await createMemory(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Enhanced chat endpoint with memory integration
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, include_memory = true, memory_threshold = 0.7 } = req.body;
        
        let memoryContext = [];
        
        // Search for relevant memories if enabled
        if (include_memory && messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                try {
                    const memoryResult = await searchMemoriesVector(lastMessage.content, {
                        limit: 3,
                        threshold: memory_threshold
                    });
                    memoryContext = memoryResult.memories || [];
                } catch (error) {
                    log('warn', 'Memory search for chat failed', { error: error.message });
                }
            }
        }
        
        res.json({ 
            response: 'Enhanced Smart Memory Server with CUA-based memory search!',
            receivedMessages: messages?.length || 0,
            memoryContext: memoryContext.map(m => ({
                title: m.title,
                summary: m.summary || m.content.substring(0, 100),
                similarity: m.similarity,
                relevance: m.relevance_category
            })),
            features: {
                vector_search: !!process.env.OPENAI_API_KEY,
                memory_integration: include_memory,
                conversation_context: true
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const { data: stats } = await supabase
            .from('memory_entries')
            .select('memory_type, status')
            .eq('project_ref', 'smart-memory-server');

        const analytics = {
            total_memories: stats?.length || 0,
            by_type: stats?.reduce((acc, m) => {
                acc[m.memory_type] = (acc[m.memory_type] || 0) + 1;
                return acc;
            }, {}) || {},
            by_status: stats?.reduce((acc, m) => {
                acc[m.status] = (acc[m.status] || 0) + 1;
                return acc;
            }, {}) || {},
            server_uptime: process.uptime(),
            version: '2.0.0'
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    log('info', `Enhanced Smart Memory Server running on port ${PORT}`, {
        features: {
            vector_search: !!process.env.OPENAI_API_KEY,
            supabase: !!supabaseUrl,
            service_key: !!supabaseServiceKey
        }
    });
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Memory search: http://localhost:${PORT}/api/memories/search`);
    console.log(`Chat with memory: http://localhost:${PORT}/api/chat`);
});
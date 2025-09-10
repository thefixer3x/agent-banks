/**
 * Simple utility to store memories in the SD-Ghost Protocol system
 * This provides a convenient way to programmatically store memories
 */

import { supabase } from '@/integrations/supabase/client';

export interface StoreMemoryOptions {
  title: string;
  content: string;
  summary?: string;
  memory_type?: 'conversation' | 'knowledge' | 'project' | 'context' | 'reference';
  tags?: string[];
  project_ref?: string;
  topic_id?: string;
  source_url?: string;
  source_type?: string;
  metadata?: Record<string, any>;
}

/**
 * Store a memory in the SD-Ghost Protocol memory system
 * 
 * @param options - Memory storage options
 * @returns Promise<{ success: boolean; memory?: any; error?: string }>
 * 
 * @example
 * ```typescript
 * import { store_memory } from '@/utils/store-memory';
 * 
 * const result = await store_memory({
 *   title: "Meeting Notes - Q1 Planning",
 *   content: "Discussed roadmap for Q1 2025...",
 *   summary: "Q1 planning meeting with key decisions",
 *   memory_type: "knowledge",
 *   tags: ["meeting", "planning", "q1-2025"],
 *   project_ref: "company-planning"
 * });
 * ```
 */
export async function store_memory(options: StoreMemoryOptions) {
  try {
    // Validate required fields
    if (!options.title || !options.content) {
      return {
        success: false,
        error: "Title and content are required fields"
      };
    }

    // Generate embedding if OpenAI API key is available
    let embedding = null;
    try {
      const { data: embeddingResponse } = await supabase.functions.invoke('generate-embedding', {
        body: { text: options.content }
      });
      
      if (embeddingResponse?.embedding) {
        embedding = JSON.stringify(embeddingResponse.embedding);
      }
    } catch (embError) {
      console.warn('Could not generate embedding:', embError);
      // Continue without embedding - text search will still work
    }

    // Store the memory
    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        title: options.title,
        content: options.content,
        summary: options.summary || options.content.substring(0, 200) + '...',
        memory_type: options.memory_type || 'knowledge',
        status: 'active',
        relevance_score: 1.0,
        topic_id: options.topic_id || null,
        source_url: options.source_url || null,
        source_type: options.source_type || 'manual',
        tags: options.tags || [],
        project_ref: options.project_ref || 'general',
        metadata: options.metadata || {},
        embedding: embedding,
        access_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store memory:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Memory stored successfully:', data.id);
    
    return {
      success: true,
      memory: data
    };

  } catch (error: any) {
    console.error('❌ Error storing memory:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Store multiple memories in batch
 * 
 * @param memories - Array of memory options
 * @returns Promise<{ success: boolean; stored: number; errors: any[] }>
 */
export async function store_memories_batch(memories: StoreMemoryOptions[]) {
  const results = {
    success: true,
    stored: 0,
    errors: [] as any[]
  };

  for (const memory of memories) {
    const result = await store_memory(memory);
    if (result.success) {
      results.stored++;
    } else {
      results.success = false;
      results.errors.push({
        memory: memory.title,
        error: result.error
      });
    }
  }

  console.log(`✅ Stored ${results.stored}/${memories.length} memories`);
  if (results.errors.length > 0) {
    console.warn('⚠️ Errors:', results.errors);
  }

  return results;
}

/**
 * Quick function to store a conversation memory
 * 
 * @param userMessage - User's message
 * @param aiResponse - AI's response
 * @param metadata - Additional metadata
 */
export async function store_conversation_memory(
  userMessage: string, 
  aiResponse: string,
  metadata?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  
  return store_memory({
    title: `Conversation - ${new Date().toLocaleString()}`,
    content: `User: ${userMessage}\n\nAI: ${aiResponse}`,
    summary: userMessage.substring(0, 100),
    memory_type: 'conversation',
    tags: ['chat', 'conversation'],
    metadata: {
      ...metadata,
      user_message: userMessage,
      ai_response: aiResponse,
      timestamp
    }
  });
}

// Export as default for convenience
export default store_memory;
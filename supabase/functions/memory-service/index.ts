import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MemoryEntry {
  id: string
  timestamp: string
  session_id: string
  content_type: string
  content: string
  metadata: any
  embedding_hash: string
  relevance_score?: number
}

interface MemoryRequest {
  memory: MemoryEntry
  client_type: string
  version: string
}

interface MemoryRetrievalRequest {
  query: string
  content_type?: string
  limit: number
  session_id: string
  similarity_threshold: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname

    // Health check endpoint
    if (path === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          service: 'sd-ghost-protocol-memory',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Store memory endpoint
    if (path === '/api/memory/store' && req.method === 'POST') {
      const { memory, client_type, version }: MemoryRequest = await req.json()

      console.log(`📝 Storing memory from ${client_type} v${version}`)

      // Store in memories table
      const { data, error } = await supabaseClient
        .from('memories')
        .insert([
          {
            id: memory.id,
            timestamp: memory.timestamp,
            session_id: memory.session_id,
            content_type: memory.content_type,
            content: memory.content,
            metadata: memory.metadata,
            embedding_hash: memory.embedding_hash,
            relevance_score: memory.relevance_score || 0.0,
            client_type: client_type,
            client_version: version
          }
        ])
        .select()

      if (error) {
        console.error('❌ Memory storage error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      console.log(`✅ Memory stored: ${memory.id}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          memory_id: memory.id,
          stored_at: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Retrieve memories endpoint
    if (path === '/api/memory/retrieve' && req.method === 'POST') {
      const { query, content_type, limit, session_id, similarity_threshold }: MemoryRetrievalRequest = await req.json()

      console.log(`🔍 Retrieving memories for query: "${query}"`)

      // Build query
      let supabaseQuery = supabaseClient
        .from('memories')
        .select('*')
        .ilike('content', `%${query}%`)
        .eq('session_id', session_id)
        .order('timestamp', { ascending: false })
        .limit(limit)

      // Add content type filter if specified
      if (content_type) {
        supabaseQuery = supabaseQuery.eq('content_type', content_type)
      }

      const { data: memories, error } = await supabaseQuery

      if (error) {
        console.error('❌ Memory retrieval error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      console.log(`✅ Retrieved ${memories?.length || 0} memories`)

      // Transform to expected format
      const formattedMemories = memories?.map(memory => ({
        id: memory.id,
        timestamp: memory.timestamp,
        session_id: memory.session_id,
        content_type: memory.content_type,
        content: memory.content,
        metadata: memory.metadata,
        embedding_hash: memory.embedding_hash,
        relevance_score: memory.relevance_score
      })) || []

      return new Response(
        JSON.stringify({ 
          memories: formattedMemories,
          total_count: formattedMemories.length,
          query: query
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Memory statistics endpoint
    if (path === '/api/memory/stats' && req.method === 'GET') {
      const session_id = url.searchParams.get('session_id')

      if (!session_id) {
        return new Response(
          JSON.stringify({ error: 'session_id parameter required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Get total count
      const { count: totalCount, error: countError } = await supabaseClient
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session_id)

      if (countError) {
        console.error('❌ Stats count error:', countError)
        return new Response(
          JSON.stringify({ error: countError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      // Get breakdown by content type
      const { data: typeBreakdown, error: typeError } = await supabaseClient
        .from('memories')
        .select('content_type')
        .eq('session_id', session_id)

      if (typeError) {
        console.error('❌ Stats type error:', typeError)
        return new Response(
          JSON.stringify({ error: typeError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      // Calculate type breakdown
      const byType: Record<string, number> = {}
      typeBreakdown?.forEach(row => {
        byType[row.content_type] = (byType[row.content_type] || 0) + 1
      })

      return new Response(
        JSON.stringify({
          total: totalCount || 0,
          by_type: byType,
          session_id: session_id,
          last_updated: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Memory cleanup endpoint
    if (path === '/api/memory/cleanup' && req.method === 'POST') {
      const { cutoff_date, session_id } = await req.json()

      console.log(`🧹 Cleaning up memories older than ${cutoff_date}`)

      const { data, error } = await supabaseClient
        .from('memories')
        .delete()
        .eq('session_id', session_id)
        .lt('timestamp', cutoff_date)

      if (error) {
        console.error('❌ Memory cleanup error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      console.log(`✅ Cleanup completed`)

      return new Response(
        JSON.stringify({ 
          success: true,
          deleted_count: data?.length || 0,
          cutoff_date: cutoff_date
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Default 404 response
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    )

  } catch (error) {
    console.error('❌ Memory service error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
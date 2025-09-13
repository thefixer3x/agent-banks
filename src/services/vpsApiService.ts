/**
 * VPS API Service - Connects React frontend to VPS backend services
 * Replaces Supabase Edge Functions with direct VPS calls
 */

const VPS_BASE_URL = 'http://srv896342.hstgr.cloud';
const VPS_CHAT_PORT = 5000;
const VPS_MEMORY_PORT = 3000;

export interface VPSChatRequest {
  message: string;
  persona?: string;
  conversation_history?: Array<{
    role: string;
    content: string;
    model?: string;
    memoryContext?: any[];
  }>;
}

export interface VPSChatResponse {
  response: string;
  persona?: string;
  execution?: any;
  memory_context_used?: number;
  tool_calls_executed?: any[];
}

export interface VPSMemoryRequest {
  text: string;
  metadata?: Record<string, any>;
  memory_type?: string;
  topic_name?: string;
}

export interface VPSMemorySearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  memory_type?: string;
}

class VPSApiService {
  private chatBaseUrl = `${VPS_BASE_URL}:${VPS_CHAT_PORT}`;
  private memoryBaseUrl = `${VPS_BASE_URL}:${VPS_MEMORY_PORT}`;

  /**
   * Send chat message to VPS AI service
   */
  async sendChatMessage(request: VPSChatRequest): Promise<VPSChatResponse> {
    try {
      const response = await fetch(`${this.chatBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          persona: request.persona || 'banks',
          conversation_history: request.conversation_history || []
        })
      });

      if (!response.ok) {
        throw new Error(`VPS Chat API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        response: data.response,
        persona: data.persona,
        execution: data.execution,
        memory_context_used: data.memory_context_used,
        tool_calls_executed: data.tool_calls_executed
      };
    } catch (error) {
      console.error('VPS Chat API error:', error);
      throw new Error(`Failed to send message to VPS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search memories in VPS memory system
   */
  async searchMemories(request: VPSMemorySearchRequest) {
    try {
      const response = await fetch(`${this.memoryBaseUrl}/api/memories/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          limit: request.limit || 5,
          threshold: request.threshold || 0.7,
          ...(request.memory_type && { memory_type: request.memory_type })
        })
      });

      if (!response.ok) {
        throw new Error(`VPS Memory API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('VPS Memory search error:', error);
      throw new Error(`Failed to search memories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store memory in VPS memory system
   */
  async storeMemory(request: VPSMemoryRequest) {
    try {
      const response = await fetch(`${this.memoryBaseUrl}/api/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          metadata: request.metadata || {},
          memory_type: request.memory_type || 'conversation',
          topic_name: request.topic_name
        })
      });

      if (!response.ok) {
        throw new Error(`VPS Memory API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('VPS Memory store error:', error);
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get VPS system status
   */
  async getStatus() {
    try {
      const [chatStatus, memoryStatus] = await Promise.all([
        fetch(`${this.chatBaseUrl}/status`).then(r => r.json()).catch(() => ({ available: false })),
        fetch(`${this.memoryBaseUrl}/health`).then(r => r.json()).catch(() => ({ status: 'error' }))
      ]);

      return {
        chat_service: {
          available: !!chatStatus.AI_Provider?.available,
          details: `Memory: ${chatStatus.Memory_System?.available ? 'Active' : 'Inactive'}, AI: ${chatStatus.AI_Provider?.details || 'Unknown'}`
        },
        memory_service: {
          available: memoryStatus.status === 'ok',
          details: `Features: ${Object.keys(memoryStatus.features || {}).filter(k => memoryStatus.features[k]).join(', ')}`
        },
        personas: {
          available: !!chatStatus.Current_Persona?.available,
          details: chatStatus.Current_Persona?.details || 'Banks persona active'
        }
      };
    } catch (error) {
      console.error('VPS Status check error:', error);
      return {
        chat_service: { available: false, details: 'Connection failed' },
        memory_service: { available: false, details: 'Connection failed' },
        personas: { available: false, details: 'Connection failed' }
      };
    }
  }

  /**
   * Test VPS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.chatBaseUrl}/status`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('VPS connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const vpsApiService = new VPSApiService();
export default vpsApiService;
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key: string
          last_used: string | null
          name: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          last_used?: string | null
          name: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          last_used?: string | null
          name?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string
          id: string
          similarity: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding: string
          id?: string
          similarity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string
          id?: string
          similarity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      endpoints: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          method: string
          name: string
          path: string
          request_schema: Json | null
          response_schema: Json | null
          service_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          method: string
          name: string
          path: string
          request_schema?: Json | null
          response_schema?: Json | null
          service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          method?: string
          name?: string
          path?: string
          request_schema?: Json | null
          response_schema?: Json | null
          service_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      memory_associations: {
        Row: {
          association_type: string | null
          created_at: string | null
          id: string
          source_memory_id: string | null
          strength: number | null
          target_memory_id: string | null
        }
        Insert: {
          association_type?: string | null
          created_at?: string | null
          id?: string
          source_memory_id?: string | null
          strength?: number | null
          target_memory_id?: string | null
        }
        Update: {
          association_type?: string | null
          created_at?: string | null
          id?: string
          source_memory_id?: string | null
          strength?: number | null
          target_memory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_associations_source_memory_id_fkey"
            columns: ["source_memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_associations_target_memory_id_fkey"
            columns: ["target_memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_entries: {
        Row: {
          access_count: number | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          last_accessed: string | null
          memory_type: Database["public"]["Enums"]["memory_type"] | null
          metadata: Json | null
          project_ref: string | null
          relevance_score: number | null
          source_type: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["memory_status"] | null
          summary: string | null
          tags: string[] | null
          title: string
          topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_accessed?: string | null
          memory_type?: Database["public"]["Enums"]["memory_type"] | null
          metadata?: Json | null
          project_ref?: string | null
          relevance_score?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["memory_status"] | null
          summary?: string | null
          tags?: string[] | null
          title: string
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_accessed?: string | null
          memory_type?: Database["public"]["Enums"]["memory_type"] | null
          metadata?: Json | null
          project_ref?: string | null
          relevance_score?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["memory_status"] | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_entries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "memory_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_topics: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          metadata: Json | null
          name: string
          parent_topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          parent_topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          parent_topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "memory_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          feedback: string | null
          id: string
          model: string
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          model: string
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          model?: string
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          invite_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          base_url: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          id: string
          is_public: boolean | null
          name: string
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          base_url?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          api_key_id: string | null
          endpoint: string
          id: string
          method: string
          response_time: number
          status_code: number
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          endpoint: string
          id?: string
          method: string
          response_time: number
          status_code: number
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          endpoint?: string
          id?: string
          method?: string
          response_time?: number
          status_code?: number
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          api_keys: Json | null
          created_at: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_keys?: Json | null
          created_at?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_keys?: Json | null
          created_at?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          subscription_status: string | null
          subscription_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          subscription_status?: string | null
          subscription_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_status?: string | null
          subscription_tier?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_user_api_keys: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_approved: {
        Args: { user_id?: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      search_memories: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          filter_topic_id?: string
          filter_project_ref?: string
        }
        Returns: {
          id: string
          title: string
          content: string
          summary: string
          memory_type: Database["public"]["Enums"]["memory_type"]
          relevance_score: number
          similarity: number
          topic_name: string
          created_at: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_memory_access: {
        Args: { memory_id: string }
        Returns: undefined
      }
      update_user_api_keys: {
        Args: { new_keys: Json }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      memory_status: "active" | "archived" | "draft" | "deleted"
      memory_type:
        | "conversation"
        | "knowledge"
        | "project"
        | "context"
        | "reference"
      user_role: "admin" | "user"
      user_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      memory_status: ["active", "archived", "draft", "deleted"],
      memory_type: [
        "conversation",
        "knowledge",
        "project",
        "context",
        "reference",
      ],
      user_role: ["admin", "user"],
      user_status: ["pending", "approved", "rejected"],
    },
  },
} as const

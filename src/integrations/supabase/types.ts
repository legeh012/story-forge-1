export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          activity_id: string | null
          completed_at: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string | null
          test_name: string
          user_id: string
          variant_a: Json
          variant_a_performance: Json | null
          variant_b: Json
          variant_b_performance: Json | null
          winner: string | null
        }
        Insert: {
          activity_id?: string | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          test_name: string
          user_id: string
          variant_a: Json
          variant_a_performance?: Json | null
          variant_b: Json
          variant_b_performance?: Json | null
          winner?: string | null
        }
        Update: {
          activity_id?: string | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          test_name?: string
          user_id?: string
          variant_a?: Json
          variant_a_performance?: Json | null
          variant_b?: Json
          variant_b_performance?: Json | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          activity_id: string | null
          affiliate_url: string
          clicks: number | null
          commission_rate: number | null
          conversions: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          product_name: string
          revenue: number | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          affiliate_url: string
          clicks?: number | null
          commission_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          product_name: string
          revenue?: number | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          affiliate_url?: string
          clicks?: number | null
          commission_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          product_name?: string
          revenue?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_activities: {
        Row: {
          bot_id: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          results: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["bot_status"] | null
          user_id: string
        }
        Insert: {
          bot_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["bot_status"] | null
          user_id: string
        }
        Update: {
          bot_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["bot_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_activities_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "viral_bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_execution_stats: {
        Row: {
          bot_type: Database["public"]["Enums"]["bot_type"]
          episode_id: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          quality_score: number | null
        }
        Insert: {
          bot_type: Database["public"]["Enums"]["bot_type"]
          episode_id?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          quality_score?: number | null
        }
        Update: {
          bot_type?: Database["public"]["Enums"]["bot_type"]
          episode_id?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_execution_stats_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          template_data: Json
          template_type: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          template_data: Json
          template_type: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          template_data?: Json
          template_type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          age: number | null
          background: string | null
          created_at: string | null
          goals: string | null
          id: string
          metadata: Json | null
          name: string
          personality: string | null
          project_id: string
          relationships: Json | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          background?: string | null
          created_at?: string | null
          goals?: string | null
          id?: string
          metadata?: Json | null
          name: string
          personality?: string | null
          project_id: string
          relationships?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          background?: string | null
          created_at?: string | null
          goals?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          personality?: string | null
          project_id?: string
          relationships?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_remixes: {
        Row: {
          activity_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          remix_type: string
          remixed_content: string | null
          source_content: string | null
          user_id: string
          viral_score: number | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          remix_type: string
          remixed_content?: string | null
          source_content?: string | null
          user_id: string
          viral_score?: number | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          remix_type?: string
          remixed_content?: string | null
          source_content?: string | null
          user_id?: string
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_remixes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_injections: {
        Row: {
          activity_id: string | null
          created_at: string | null
          cultural_relevance_score: number | null
          id: string
          injected_content: string | null
          injection_type: string
          metadata: Json | null
          original_content: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          cultural_relevance_score?: number | null
          id?: string
          injected_content?: string | null
          injection_type: string
          metadata?: Json | null
          original_content?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          cultural_relevance_score?: number | null
          id?: string
          injected_content?: string | null
          injection_type?: string
          metadata?: Json | null
          original_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_injections_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_actions: {
        Row: {
          action_type: string
          activity_id: string | null
          created_at: string | null
          executed_at: string | null
          id: string
          platform: string
          result: Json | null
          target_url: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          activity_id?: string | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          platform: string
          result?: Json | null
          target_url?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          activity_id?: string | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          platform?: string
          result?: Json | null
          target_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_actions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          content: string | null
          created_at: string | null
          episode_number: number
          id: string
          project_id: string
          realism_settings: Json | null
          rendering_style: string | null
          script: string | null
          season: number | null
          status: string | null
          storyboard: Json | null
          synopsis: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_render_completed_at: string | null
          video_render_error: string | null
          video_render_started_at: string | null
          video_status: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          episode_number: number
          id?: string
          project_id: string
          realism_settings?: Json | null
          rendering_style?: string | null
          script?: string | null
          season?: number | null
          status?: string | null
          storyboard?: Json | null
          synopsis?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_render_completed_at?: string | null
          video_render_error?: string | null
          video_render_started_at?: string | null
          video_status?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          episode_number?: number
          id?: string
          project_id?: string
          realism_settings?: Json | null
          rendering_style?: string | null
          script?: string | null
          season?: number | null
          status?: string | null
          storyboard?: Json | null
          synopsis?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_render_completed_at?: string | null
          video_render_error?: string | null
          video_render_started_at?: string | null
          video_status?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          recovery_action: string | null
          recovery_status: string | null
          resolved_at: string | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          recovery_action?: string | null
          recovery_status?: string | null
          resolved_at?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          recovery_action?: string | null
          recovery_status?: string | null
          resolved_at?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      generated_scripts: {
        Row: {
          activity_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          script_content: string
          script_type: string
          used: boolean | null
          user_id: string
          viral_score: number | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          script_content: string
          script_type: string
          used?: boolean | null
          user_id: string
          viral_score?: number | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          script_content?: string
          script_type?: string
          used?: boolean | null
          user_id?: string
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_scripts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_thumbnails: {
        Row: {
          activity_id: string | null
          concept: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          predicted_ctr: number | null
          thumbnail_url: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          concept?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          predicted_ctr?: number | null
          thumbnail_url: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          concept?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          predicted_ctr?: number | null
          thumbnail_url?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_thumbnails_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_attachments: {
        Row: {
          created_at: string
          description: string | null
          episode_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          episode_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          episode_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_attachments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hook_optimizations: {
        Row: {
          activity_id: string | null
          created_at: string | null
          id: string
          optimized_description: string | null
          optimized_title: string | null
          original_description: string | null
          original_title: string | null
          predicted_ctr: number | null
          thumbnail_suggestions: Json | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          optimized_description?: string | null
          optimized_title?: string | null
          original_description?: string | null
          original_title?: string | null
          predicted_ctr?: number | null
          thumbnail_suggestions?: Json | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          optimized_description?: string | null
          optimized_title?: string | null
          original_description?: string | null
          original_title?: string | null
          predicted_ctr?: number | null
          thumbnail_suggestions?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hook_optimizations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_captures: {
        Row: {
          activity_id: string | null
          captured_at: string | null
          id: string
          lead_email: string | null
          lead_name: string | null
          metadata: Json | null
          source_content: string | null
          source_platform: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          captured_at?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          metadata?: Json | null
          source_content?: string | null
          source_platform?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          captured_at?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          metadata?: Json | null
          source_content?: string | null
          source_platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_captures_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          asset_type: string
          asset_url: string
          created_at: string | null
          episode_id: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          asset_url: string
          created_at?: string | null
          episode_id?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          asset_url?: string
          created_at?: string | null
          episode_id?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          activity_id: string | null
          content_id: string | null
          conversions: number | null
          ctr: number | null
          engagement_rate: number | null
          id: string
          metadata: Json | null
          platform: string
          recorded_at: string | null
          retention_rate: number | null
          revenue: number | null
          user_id: string
          views: number | null
          watch_time: number | null
        }
        Insert: {
          activity_id?: string | null
          content_id?: string | null
          conversions?: number | null
          ctr?: number | null
          engagement_rate?: number | null
          id?: string
          metadata?: Json | null
          platform: string
          recorded_at?: string | null
          retention_rate?: number | null
          revenue?: number | null
          user_id: string
          views?: number | null
          watch_time?: number | null
        }
        Update: {
          activity_id?: string | null
          content_id?: string | null
          conversions?: number | null
          ctr?: number | null
          engagement_rate?: number | null
          id?: string
          metadata?: Json | null
          platform?: string
          recorded_at?: string | null
          retention_rate?: number | null
          revenue?: number | null
          user_id?: string
          views?: number | null
          watch_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          default_rendering_style: string | null
          description: string | null
          genre: string | null
          id: string
          mood: string | null
          status: string | null
          theme: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_rendering_style?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          mood?: string | null
          status?: string | null
          theme?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_rendering_style?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          mood?: string | null
          status?: string | null
          theme?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          activity_id: string | null
          content: string
          created_at: string | null
          id: string
          media_urls: string[] | null
          metadata: Json | null
          platform: string
          post_url: string | null
          posted_at: string | null
          scheduled_time: string
          status: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platform: string
          post_url?: string | null
          posted_at?: string | null
          scheduled_time: string
          status?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platform?: string
          post_url?: string | null
          posted_at?: string | null
          scheduled_time?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          id: string
          last_check: string | null
          metadata: Json | null
          service_name: string
          status: string
        }
        Insert: {
          id?: string
          last_check?: string | null
          metadata?: Json | null
          service_name: string
          status?: string
        }
        Update: {
          id?: string
          last_check?: string | null
          metadata?: Json | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      trend_detections: {
        Row: {
          activity_id: string | null
          content: string
          detected_at: string | null
          engagement_score: number | null
          hashtags: string[] | null
          id: string
          metadata: Json | null
          platform: string
          trend_type: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          content: string
          detected_at?: string | null
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          metadata?: Json | null
          platform: string
          trend_type: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          content?: string
          detected_at?: string | null
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          metadata?: Json | null
          platform?: string
          trend_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_detections_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "bot_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viral_bots: {
        Row: {
          bot_type: Database["public"]["Enums"]["bot_type"]
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bot_type: Database["public"]["Enums"]["bot_type"]
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bot_type?: Database["public"]["Enums"]["bot_type"]
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "creator" | "viewer"
      bot_status: "idle" | "running" | "completed" | "failed"
      bot_type:
        | "trend_detection"
        | "live_view_booster"
        | "cross_platform_poster"
        | "lead_capture"
        | "remix"
        | "roi_analyzer"
        | "voiceover"
        | "multi_channel_uploader"
        | "thumbnail_designer"
        | "llm_reflection"
        | "video_assembly"
        | "bot_orchestrator"
        | "persona_bot"
        | "script_generator"
        | "cultural_injection"
        | "affiliate_bot"
        | "hook_optimization"
        | "engagement_amplifier"
        | "digital_product"
        | "performance_tracker"
        | "feedback_loop"
        | "sales_funnel"
        | "ab_testing"
        | "expert_director"
        | "production_team"
        | "scene_orchestration"
        | "ai_engineer"
        | "ultra_video"
        | "infrastructure_monitor"
        | "gpu_scaler"
        | "module_deployer"
        | "runtime_validator"
        | "app_logic_manager"
        | "auth_flow_handler"
        | "database_sync"
        | "api_orchestrator"
        | "dashboard_manager"
        | "confessional_editor"
        | "cast_branding"
        | "ai_model_connector"
        | "payment_gateway"
        | "cultural_library"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "creator", "viewer"],
      bot_status: ["idle", "running", "completed", "failed"],
      bot_type: [
        "trend_detection",
        "live_view_booster",
        "cross_platform_poster",
        "lead_capture",
        "remix",
        "roi_analyzer",
        "voiceover",
        "multi_channel_uploader",
        "thumbnail_designer",
        "llm_reflection",
        "video_assembly",
        "bot_orchestrator",
        "persona_bot",
        "script_generator",
        "cultural_injection",
        "affiliate_bot",
        "hook_optimization",
        "engagement_amplifier",
        "digital_product",
        "performance_tracker",
        "feedback_loop",
        "sales_funnel",
        "ab_testing",
        "expert_director",
        "production_team",
        "scene_orchestration",
        "ai_engineer",
        "ultra_video",
        "infrastructure_monitor",
        "gpu_scaler",
        "module_deployer",
        "runtime_validator",
        "app_logic_manager",
        "auth_flow_handler",
        "database_sync",
        "api_orchestrator",
        "dashboard_manager",
        "confessional_editor",
        "cast_branding",
        "ai_model_connector",
        "payment_gateway",
        "cultural_library",
      ],
    },
  },
} as const

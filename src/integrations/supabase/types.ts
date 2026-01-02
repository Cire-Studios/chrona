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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      entry_images: {
        Row: {
          caption: string | null
          created_at: string
          entry_id: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          entry_id: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_images_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_signals: {
        Row: {
          context: string | null
          created_at: string
          entry_id: string
          id: string
          reflection_id: string
          signal_flag: Database["public"]["Enums"]["signal_flag"]
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          entry_id: string
          id?: string
          reflection_id: string
          signal_flag: Database["public"]["Enums"]["signal_flag"]
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          reflection_id?: string
          signal_flag?: Database["public"]["Enums"]["signal_flag"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_signals_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_signals_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "weekly_reflections"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          accomplishments: string | null
          challenges: string | null
          created_at: string
          decisions: string | null
          entry_date: string
          id: string
          learnings: string | null
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accomplishments?: string | null
          challenges?: string | null
          created_at?: string
          decisions?: string | null
          entry_date?: string
          id?: string
          learnings?: string | null
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accomplishments?: string | null
          challenges?: string | null
          created_at?: string
          decisions?: string | null
          entry_date?: string
          id?: string
          learnings?: string | null
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          daily_reminder_enabled: boolean
          daily_reminder_time: string
          email_notifications_enabled: boolean
          id: string
          quarterly_reminder_day: number
          quarterly_reminder_enabled: boolean
          quarterly_reminder_time: string
          timezone: string
          updated_at: string
          user_id: string
          weekly_reminder_day: number
          weekly_reminder_enabled: boolean
          weekly_reminder_time: string
        }
        Insert: {
          created_at?: string
          daily_reminder_enabled?: boolean
          daily_reminder_time?: string
          email_notifications_enabled?: boolean
          id?: string
          quarterly_reminder_day?: number
          quarterly_reminder_enabled?: boolean
          quarterly_reminder_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
          weekly_reminder_day?: number
          weekly_reminder_enabled?: boolean
          weekly_reminder_time?: string
        }
        Update: {
          created_at?: string
          daily_reminder_enabled?: boolean
          daily_reminder_time?: string
          email_notifications_enabled?: boolean
          id?: string
          quarterly_reminder_day?: number
          quarterly_reminder_enabled?: boolean
          quarterly_reminder_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_reminder_day?: number
          weekly_reminder_enabled?: boolean
          weekly_reminder_time?: string
        }
        Relationships: []
      }
      pattern_evidence: {
        Row: {
          created_at: string
          id: string
          pattern_id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pattern_id: string
          signal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pattern_id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_evidence_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "quarterly_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_evidence_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "entry_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proof_links: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          link_type: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          link_type: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          link_type?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_links_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_patterns: {
        Row: {
          category: Database["public"]["Enums"]["pattern_category"]
          created_at: string
          description: string
          id: string
          is_confirmed: boolean
          record_id: string
          signal_count: number
          title: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["pattern_category"]
          created_at?: string
          description: string
          id?: string
          is_confirmed?: boolean
          record_id: string
          signal_count?: number
          title: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["pattern_category"]
          created_at?: string
          description?: string
          id?: string
          is_confirmed?: boolean
          record_id?: string
          signal_count?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_patterns_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "quarterly_records"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_records: {
        Row: {
          created_at: string
          finalized_at: string | null
          id: string
          quarter_end_date: string
          quarter_start_date: string
          role_id: string
          status: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          quarter_end_date: string
          quarter_start_date: string
          role_id: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          quarter_end_date?: string
          quarter_start_date?: string
          role_id?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          color: string | null
          company: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sent_reminders: {
        Row: {
          id: string
          reminder_date: string
          reminder_type: string
          role_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reminder_date: string
          reminder_type: string
          role_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reminder_date?: string
          reminder_type?: string
          role_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reflections: {
        Row: {
          created_at: string
          id: string
          role_id: string
          summary: string | null
          updated_at: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          summary?: string | null
          updated_at?: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pattern_category:
        | "growth"
        | "scope_change"
        | "sustained_impact"
        | "skill_development"
        | "leadership"
        | "collaboration"
      signal_flag: "delivery" | "ownership" | "influence" | "learning"
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
      pattern_category: [
        "growth",
        "scope_change",
        "sustained_impact",
        "skill_development",
        "leadership",
        "collaboration",
      ],
      signal_flag: ["delivery", "ownership", "influence", "learning"],
    },
  },
} as const

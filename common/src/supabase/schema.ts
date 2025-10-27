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
    PostgrestVersion: '13.0.4'
  }
  public: {
    Tables: {
      bookmarked_searches: {
        Row: {
          created_time: string
          creator_id: string
          id: number
          last_notified_at: string | null
          location: Json | null
          search_filters: Json | null
          search_name: string | null
        }
        Insert: {
          created_time?: string
          creator_id: string
          id?: never
          last_notified_at?: string | null
          location?: Json | null
          search_filters?: Json | null
          search_name?: string | null
        }
        Update: {
          created_time?: string
          creator_id?: string
          id?: never
          last_notified_at?: string | null
          location?: Json | null
          search_filters?: Json | null
          search_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bookmarked_searches_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      compatibility_answers: {
        Row: {
          created_time: string
          creator_id: string
          explanation: string | null
          id: number
          importance: number
          multiple_choice: number
          pref_choices: number[]
          question_id: number
        }
        Insert: {
          created_time?: string
          creator_id: string
          explanation?: string | null
          id?: number
          importance: number
          multiple_choice: number
          pref_choices: number[]
          question_id: number
        }
        Update: {
          created_time?: string
          creator_id?: string
          explanation?: string | null
          id?: number
          importance?: number
          multiple_choice?: number
          pref_choices?: number[]
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'compatibility_answers_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      compatibility_answers_free: {
        Row: {
          created_time: string
          creator_id: string
          free_response: string | null
          id: number
          integer: number | null
          multiple_choice: number | null
          question_id: number
        }
        Insert: {
          created_time?: string
          creator_id: string
          free_response?: string | null
          id?: number
          integer?: number | null
          multiple_choice?: number | null
          question_id: number
        }
        Update: {
          created_time?: string
          creator_id?: string
          free_response?: string | null
          id?: number
          integer?: number | null
          multiple_choice?: number | null
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'compatibility_answers_free_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      compatibility_prompts: {
        Row: {
          answer_type: string
          created_time: string
          creator_id: string | null
          id: number
          importance_score: number
          multiple_choice_options: Json | null
          question: string
        }
        Insert: {
          answer_type?: string
          created_time?: string
          creator_id?: string | null
          id?: number
          importance_score?: number
          multiple_choice_options?: Json | null
          question: string
        }
        Update: {
          answer_type?: string
          created_time?: string
          creator_id?: string | null
          id?: number
          importance_score?: number
          multiple_choice_options?: Json | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: 'compatibility_prompts_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      contact: {
        Row: {
          content: Json | null
          created_time: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          content?: Json | null
          created_time?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: Json | null
          created_time?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contact_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      private_user_message_channel_members: {
        Row: {
          channel_id: number
          created_time: string
          id: number
          notify_after_time: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          channel_id: number
          created_time?: string
          id?: never
          notify_after_time?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          channel_id?: number
          created_time?: string
          id?: never
          notify_after_time?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'channel_id_fkey'
            columns: ['channel_id']
            isOneToOne: false
            referencedRelation: 'private_user_message_channels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'private_user_message_channel_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      private_user_message_channels: {
        Row: {
          created_time: string
          id: number
          last_updated_time: string
          title: string | null
        }
        Insert: {
          created_time?: string
          id?: number
          last_updated_time?: string
          title?: string | null
        }
        Update: {
          created_time?: string
          id?: number
          last_updated_time?: string
          title?: string | null
        }
        Relationships: []
      }
      private_user_messages: {
        Row: {
          channel_id: number
          ciphertext: string | null
          content: Json | null
          created_time: string
          id: number
          iv: string | null
          tag: string | null
          user_id: string | null
          visibility: string
        }
        Insert: {
          channel_id: number
          ciphertext?: string | null
          content?: Json | null
          created_time?: string
          id?: never
          iv?: string | null
          tag?: string | null
          user_id?: string | null
          visibility?: string
        }
        Update: {
          channel_id?: number
          ciphertext?: string | null
          content?: Json | null
          created_time?: string
          id?: never
          iv?: string | null
          tag?: string | null
          user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: 'private_user_messages_channel_id_fkey'
            columns: ['channel_id']
            isOneToOne: false
            referencedRelation: 'private_user_message_channels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'private_user_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      private_user_seen_message_channels: {
        Row: {
          channel_id: number
          created_time: string
          id: number
          user_id: string
        }
        Insert: {
          channel_id: number
          created_time?: string
          id?: never
          user_id: string
        }
        Update: {
          channel_id?: number
          created_time?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'channel_id_fkey'
            columns: ['channel_id']
            isOneToOne: false
            referencedRelation: 'private_user_message_channels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'private_user_seen_message_channels_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      private_users: {
        Row: {
          data: Json
          id: string
        }
        Insert: {
          data: Json
          id: string
        }
        Update: {
          data?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'private_users_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profile_comments: {
        Row: {
          content: Json
          created_time: string
          hidden: boolean
          id: number
          on_user_id: string
          reply_to_comment_id: number | null
          user_avatar_url: string
          user_id: string
          user_name: string
          user_username: string
        }
        Insert: {
          content: Json
          created_time?: string
          hidden?: boolean
          id?: number
          on_user_id: string
          reply_to_comment_id?: number | null
          user_avatar_url: string
          user_id: string
          user_name: string
          user_username: string
        }
        Update: {
          content?: Json
          created_time?: string
          hidden?: boolean
          id?: number
          on_user_id?: string
          reply_to_comment_id?: number | null
          user_avatar_url?: string
          user_id?: string
          user_name?: string
          user_username?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_comments_on_user_id_fkey'
            columns: ['on_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profile_likes: {
        Row: {
          created_time: string
          creator_id: string
          like_id: string
          target_id: string
        }
        Insert: {
          created_time?: string
          creator_id: string
          like_id?: string
          target_id: string
        }
        Update: {
          created_time?: string
          creator_id?: string
          like_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_likes_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profile_ships: {
        Row: {
          created_time: string
          creator_id: string
          ship_id: string
          target1_id: string
          target2_id: string
        }
        Insert: {
          created_time?: string
          creator_id: string
          ship_id?: string
          target1_id: string
          target2_id: string
        }
        Update: {
          created_time?: string
          creator_id?: string
          ship_id?: string
          target1_id?: string
          target2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_ships_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profile_stars: {
        Row: {
          created_time: string
          creator_id: string
          star_id: string
          target_id: string
        }
        Insert: {
          created_time?: string
          creator_id: string
          star_id?: string
          target_id: string
        }
        Update: {
          created_time?: string
          creator_id?: string
          star_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_stars_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_stars_target_id_fkey'
            columns: ['target_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          bio: Json | null
          bio_length: number | null
          bio_text: string | null
          bio_tsv: unknown
          born_in_location: string | null
          city: string | null
          city_latitude: number | null
          city_longitude: number | null
          comments_enabled: boolean
          company: string | null
          country: string | null
          created_time: string
          diet: string[] | null
          disabled: boolean
          drinks_per_month: number | null
          education_level: string | null
          ethnicity: string[] | null
          gender: string | null
          geodb_city_id: string | null
          has_kids: number | null
          height_in_inches: number | null
          id: number
          is_smoker: boolean | null
          last_modification_time: string
          looking_for_matches: boolean
          messaging_status: string
          occupation: string | null
          occupation_title: string | null
          photo_urls: string[] | null
          pinned_url: string | null
          political_beliefs: string[] | null
          political_details: string | null
          pref_age_max: number | null
          pref_age_min: number | null
          pref_gender: string[] | null
          pref_relation_styles: string[] | null
          pref_romantic_styles: string[] | null
          referred_by_username: string | null
          region_code: string | null
          religion: string[] | null
          religious_belief_strength: number | null
          religious_beliefs: string | null
          twitter: string | null
          university: string | null
          user_id: string
          visibility: Database['public']['Enums']['lover_visibility']
          wants_kids_strength: number | null
          website: string | null
        }
        Insert: {
          age?: number | null
          bio?: Json | null
          bio_length?: number | null
          bio_text?: string | null
          bio_tsv?: unknown
          born_in_location?: string | null
          city?: string | null
          city_latitude?: number | null
          city_longitude?: number | null
          comments_enabled?: boolean
          company?: string | null
          country?: string | null
          created_time?: string
          diet?: string[] | null
          disabled?: boolean
          drinks_per_month?: number | null
          education_level?: string | null
          ethnicity?: string[] | null
          gender?: string | null
          geodb_city_id?: string | null
          has_kids?: number | null
          height_in_inches?: number | null
          id?: number
          is_smoker?: boolean | null
          last_modification_time?: string
          looking_for_matches?: boolean
          messaging_status?: string
          occupation?: string | null
          occupation_title?: string | null
          photo_urls?: string[] | null
          pinned_url?: string | null
          political_beliefs?: string[] | null
          political_details?: string | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_gender?: string[] | null
          pref_relation_styles?: string[] | null
          pref_romantic_styles?: string[] | null
          referred_by_username?: string | null
          region_code?: string | null
          religion?: string[] | null
          religious_belief_strength?: number | null
          religious_beliefs?: string | null
          twitter?: string | null
          university?: string | null
          user_id: string
          visibility?: Database['public']['Enums']['lover_visibility']
          wants_kids_strength?: number | null
          website?: string | null
        }
        Update: {
          age?: number | null
          bio?: Json | null
          bio_length?: number | null
          bio_text?: string | null
          bio_tsv?: unknown
          born_in_location?: string | null
          city?: string | null
          city_latitude?: number | null
          city_longitude?: number | null
          comments_enabled?: boolean
          company?: string | null
          country?: string | null
          created_time?: string
          diet?: string[] | null
          disabled?: boolean
          drinks_per_month?: number | null
          education_level?: string | null
          ethnicity?: string[] | null
          gender?: string | null
          geodb_city_id?: string | null
          has_kids?: number | null
          height_in_inches?: number | null
          id?: number
          is_smoker?: boolean | null
          last_modification_time?: string
          looking_for_matches?: boolean
          messaging_status?: string
          occupation?: string | null
          occupation_title?: string | null
          photo_urls?: string[] | null
          pinned_url?: string | null
          political_beliefs?: string[] | null
          political_details?: string | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_gender?: string[] | null
          pref_relation_styles?: string[] | null
          pref_romantic_styles?: string[] | null
          referred_by_username?: string | null
          region_code?: string | null
          religion?: string[] | null
          religious_belief_strength?: number | null
          religious_beliefs?: string | null
          twitter?: string | null
          university?: string | null
          user_id?: string
          visibility?: Database['public']['Enums']['lover_visibility']
          wants_kids_strength?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: number
          keys: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: number
          keys: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: number
          keys?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      reports: {
        Row: {
          content_id: string
          content_owner_id: string
          content_type: string
          created_time: string | null
          description: string | null
          id: string
          parent_id: string | null
          parent_type: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_owner_id: string
          content_type: string
          created_time?: string | null
          description?: string | null
          id?: string
          parent_id?: string | null
          parent_type?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_owner_id?: string
          content_type?: string
          created_time?: string | null
          description?: string | null
          id?: string
          parent_id?: string | null
          parent_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reports_content_owner_id_fkey'
            columns: ['content_owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_activity: {
        Row: {
          last_online_time: string
          user_id: string
        }
        Insert: {
          last_online_time: string
          user_id: string
        }
        Update: {
          last_online_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_activity_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_events: {
        Row: {
          ad_id: string | null
          comment_id: string | null
          contract_id: string | null
          data: Json
          id: number
          name: string
          ts: string
          user_id: string | null
        }
        Insert: {
          ad_id?: string | null
          comment_id?: string | null
          contract_id?: string | null
          data: Json
          id?: never
          name: string
          ts?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string | null
          comment_id?: string | null
          contract_id?: string | null
          data?: Json
          id?: never
          name?: string
          ts?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          data: Json
          notification_id: string
          user_id: string
        }
        Insert: {
          data: Json
          notification_id: string
          user_id: string
        }
        Update: {
          data?: Json
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_waitlist: {
        Row: {
          created_time: string
          email: string
          id: number
        }
        Insert: {
          created_time?: string
          email: string
          id?: number
        }
        Update: {
          created_time?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_time: string
          data: Json
          id: string
          name: string
          name_username_vector: unknown
          username: string
        }
        Insert: {
          created_time?: string
          data: Json
          id?: string
          name: string
          name_username_vector?: unknown
          username: string
        }
        Update: {
          created_time?: string
          data?: Json
          id?: string
          name?: string
          name_username_vector?: unknown
          username?: string
        }
        Relationships: []
      }
      vote_results: {
        Row: {
          choice: number
          created_time: string
          id: number
          priority: number
          user_id: string
          vote_id: number
        }
        Insert: {
          choice: number
          created_time?: string
          id?: never
          priority: number
          user_id: string
          vote_id: number
        }
        Update: {
          choice?: number
          created_time?: string
          id?: never
          priority?: number
          user_id?: string
          vote_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'vote_results_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vote_results_vote_id_fkey'
            columns: ['vote_id']
            isOneToOne: false
            referencedRelation: 'votes'
            referencedColumns: ['id']
          },
        ]
      }
      votes: {
        Row: {
          created_time: string
          creator_id: string
          description: Json | null
          id: number
          is_anonymous: boolean | null
          status: string | null
          title: string
        }
        Insert: {
          created_time?: string
          creator_id: string
          description?: Json | null
          id?: never
          is_anonymous?: boolean | null
          status?: string | null
          title: string
        }
        Update: {
          created_time?: string
          creator_id?: string
          description?: Json | null
          id?: never
          is_anonymous?: boolean | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'votes_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_earth_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      can_access_private_messages: {
        Args: { channel_id: number; user_id: string }
        Returns: boolean
      }
      firebase_uid: { Args: never; Returns: string }
      get_average_rating: { Args: { user_id: string }; Returns: number }
      get_compatibility_questions_with_answer_count: {
        Args: never
        Returns: Record<string, unknown>[]
      }
      get_love_question_answers_and_lovers: {
        Args: { p_question_id: number }
        Returns: Record<string, unknown>[]
      }
      get_love_question_answers_and_profiles: {
        Args: { p_question_id: number }
        Returns: Record<string, unknown>[]
      }
      get_votes_with_results: {
        Args: { order_by?: string }
        Returns: {
          created_time: string
          creator_id: string
          description: Json
          id: number
          is_anonymous: boolean
          priority: number
          status: string
          title: string
          votes_abstain: number
          votes_against: number
          votes_for: number
        }[]
      }
      is_admin:
        | { Args: { user_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      millis_interval: {
        Args: { end_millis: number; start_millis: number }
        Returns: unknown
      }
      millis_to_ts: { Args: { millis: number }; Returns: string }
      random_alphanumeric: { Args: { length: number }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
      to_jsonb: { Args: { '': Json }; Returns: Json }
    }
    Enums: {
      lover_visibility: 'public' | 'member'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lover_visibility: ['public', 'member'],
    },
  },
} as const

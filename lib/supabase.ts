import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          content: string;
          file_type: 'pdf' | 'txt' | 'md' | 'docx' | 'csv' | 'json';
          file_size: number;
          storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          content: string;
          file_type: 'pdf' | 'txt' | 'md' | 'docx' | 'csv' | 'json';
          file_size?: number;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          content?: string;
          file_type?: 'pdf' | 'txt' | 'md' | 'docx' | 'csv' | 'json';
          file_size?: number;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          user_id: string | null;
          document_id: string | null;
          ai_provider: 'deepseek' | 'gemini';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          progress: number;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          document_id?: string | null;
          ai_provider: 'deepseek' | 'gemini';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          progress?: number;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          document_id?: string | null;
          ai_provider?: 'deepseek' | 'gemini';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          progress?: number;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      analysis_sections: {
        Row: {
          id: string;
          analysis_id: string | null;
          section_type: 'summary' | 'insights' | 'recommendations' | 'technical' | 'full_report';
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id?: string | null;
          section_type: 'summary' | 'insights' | 'recommendations' | 'technical' | 'full_report';
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string | null;
          section_type?: 'summary' | 'insights' | 'recommendations' | 'technical' | 'full_report';
          title?: string;
          content?: string;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          preferred_ai_provider: 'deepseek' | 'gemini';
          theme_preference: 'light' | 'dark' | 'system';
          deepseek_api_key: string | null;
          gemini_api_key: string | null;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_ai_provider?: 'deepseek' | 'gemini';
          theme_preference?: 'light' | 'dark' | 'system';
          deepseek_api_key?: string | null;
          gemini_api_key?: string | null;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_ai_provider?: 'deepseek' | 'gemini';
          theme_preference?: 'light' | 'dark' | 'system';
          deepseek_api_key?: string | null;
          gemini_api_key?: string | null;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
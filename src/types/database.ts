export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audios: {
        Row: {
          id: string;
          audio_name: string;
          storage_url: string;
          storage_path: string;
          language_tag: string | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          is_validated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audio_name: string;
          storage_url: string;
          storage_path: string;
          language_tag?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          is_validated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audio_name?: string;
          storage_url?: string;
          storage_path?: string;
          language_tag?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          is_validated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      models: {
        Row: {
          id: string;
          model_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcriptions: {
        Row: {
          id: string;
          audio_id: string;
          model_id: string;
          text: string;
          bleu_score: number | null;
          chrf_score: number | null;
          word_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audio_id: string;
          model_id: string;
          text: string;
          bleu_score?: number | null;
          chrf_score?: number | null;
          word_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audio_id?: string;
          model_id?: string;
          text?: string;
          bleu_score?: number | null;
          chrf_score?: number | null;
          word_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          audio_id: string;
          preferred_transcription_id: string | null;
          user_comments: string | null;
          user_identifier: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          audio_id: string;
          preferred_transcription_id?: string | null;
          user_comments?: string | null;
          user_identifier?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          audio_id?: string;
          preferred_transcription_id?: string | null;
          user_comments?: string | null;
          user_identifier?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      validation_stats: {
        Row: {
          audio_id: string;
          audio_name: string;
          language_tag: string | null;
          total_votes: number;
          peshawar_votes: number;
          whisper_votes: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Audio = Database['public']['Tables']['audios']['Row'];
export type AudioInsert = Database['public']['Tables']['audios']['Insert'];
export type Model = Database['public']['Tables']['models']['Row'];
export type Transcription = Database['public']['Tables']['transcriptions']['Row'];
export type TranscriptionInsert = Database['public']['Tables']['transcriptions']['Insert'];
export type Feedback = Database['public']['Tables']['feedback']['Row'];
export type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];
export type ValidationStats = Database['public']['Views']['validation_stats']['Row'];

// Extended types with relations
export interface AudioWithTranscriptions extends Audio {
  transcriptions: (Transcription & { model: Model })[];
}

export interface TranscriptionWithModel extends Transcription {
  model: Model;
}

/**
 * Non-secret database types generated from the authorized Jernih Supabase schema
 * on 2026-08-24. Regenerate after future schema migrations.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; role: "viewer" | "field_operator" | "admin"; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; role?: "viewer" | "field_operator" | "admin"; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; role?: "viewer" | "field_operator" | "admin"; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      readings: {
        Row: { id: string; station_id: string; ntu: number; source: string; equipment: string; created_at: string; recorded_by: string | null };
        Insert: { id?: string; station_id: string; ntu: number; source: string; equipment?: string; created_at?: string; recorded_by?: string | null };
        Update: { id?: string; station_id?: string; ntu?: number; source?: string; equipment?: string; created_at?: string; recorded_by?: string | null };
        Relationships: [];
      };
      station_memberships: {
        Row: { id: string; user_id: string; station_id: string; created_at: string };
        Insert: { id?: string; user_id: string; station_id: string; created_at?: string };
        Update: { id?: string; user_id?: string; station_id?: string; created_at?: string };
        Relationships: [];
      };
      stations: {
        Row: { id: string; name: string; subtitle: string; baseline: number; x: number; y: number; created_at: string };
        Insert: { id: string; name: string; subtitle: string; baseline: number; x: number; y: number; created_at?: string };
        Update: { id?: string; name?: string; subtitle?: string; baseline?: number; x?: number; y?: number; created_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { jernih_user_role: "viewer" | "field_operator" | "admin" };
    CompositeTypes: { [_ in never]: never };
  };
};

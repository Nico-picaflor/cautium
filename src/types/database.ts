export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "free" | "pro" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["organizations"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string | null;
          role: "owner" | "admin" | "member";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      vendors: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          website: string | null;
          industry: string | null;
          risk_tier: "critical" | "high" | "medium" | "low" | null;
          risk_score: number | null;
          status: "active" | "inactive" | "under_review";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vendors"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["vendors"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["vendors"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          vendor_id: string | null;
          name: string;
          type: "contract" | "policy" | "certificate" | "report" | "other";
          storage_path: string;
          file_size: number | null;
          mime_type: string | null;
          ai_summary: string | null;
          ai_risks: Json;
          ai_analyzed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["documents"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      questionnaires: {
        Row: {
          id: string;
          organization_id: string;
          vendor_id: string | null;
          title: string;
          description: string | null;
          status: "draft" | "sent" | "in_progress" | "completed" | "expired";
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["questionnaires"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["questionnaires"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["questionnaires"]["Insert"]>;
      };
      questions: {
        Row: {
          id: string;
          questionnaire_id: string;
          text: string;
          type: "text" | "yes_no" | "multiple_choice" | "scale" | "file";
          options: Json;
          required: boolean;
          order_index: number;
          category: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["questions"]["Row"], "id" | "created_at"> & Partial<Pick<Database["public"]["Tables"]["questions"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          questionnaire_id: string;
          response_value: string | null;
          response_json: Json | null;
          file_path: string | null;
          submitted_by: string | null;
          ai_flag: "ok" | "warning" | "critical" | null;
          ai_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["answers"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["answers"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["answers"]["Insert"]>;
      };
    };
  };
}

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chantiers: {
        Row: {
          chef_chantier: string
          created_at: string
          date_debut: string | null
          date_fin_prevue: string | null
          description: string
          id: string
          localisation: string
          nom_chantier: string
          projet_lie: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          chef_chantier?: string
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          description?: string
          id?: string
          localisation?: string
          nom_chantier?: string
          projet_lie?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          chef_chantier?: string
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          description?: string
          id?: string
          localisation?: string
          nom_chantier?: string
          projet_lie?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chantiers_projet_lie_fkey"
            columns: ["projet_lie"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      compteurs_documents: {
        Row: {
          dernier_numero: number
          type_document: string
          updated_at: string
        }
        Insert: {
          dernier_numero?: number
          type_document: string
          updated_at?: string
        }
        Update: {
          dernier_numero?: number
          type_document?: string
          updated_at?: string
        }
        Relationships: []
      }
      contrats_construction: {
        Row: {
          client: string
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at: string
        }
        Insert: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          nom_fichier?: string
          numero?: string
          pdf_base64?: string
          updated_at?: string
        }
        Relationships: []
      }
      contrats_employes: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          employe: string
          id: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          employe?: string
          id?: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          employe?: string
          id?: string
          nom_fichier?: string
          numero?: string
          pdf_base64?: string
          updated_at?: string
        }
        Relationships: []
      }
      descriptions_projets: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          projet: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          projet?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          nom_fichier?: string
          numero?: string
          pdf_base64?: string
          projet?: string
          updated_at?: string
        }
        Relationships: []
      }
      devis: {
        Row: {
          client: string
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          montant_total: number
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at: string
        }
        Insert: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          montant_total?: number
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          montant_total?: number
          nom_fichier?: string
          numero?: string
          pdf_base64?: string
          updated_at?: string
        }
        Relationships: []
      }
      employes: {
        Row: {
          adresse: string
          chantier_assigne: string | null
          created_at: string
          id: string
          matricule: string
          nom_complet: string
          poste: string
          salaire: number
          statut: string
          telephone: string
          updated_at: string
        }
        Insert: {
          adresse?: string
          chantier_assigne?: string | null
          created_at?: string
          id?: string
          matricule?: string
          nom_complet?: string
          poste?: string
          salaire?: number
          statut?: string
          telephone?: string
          updated_at?: string
        }
        Update: {
          adresse?: string
          chantier_assigne?: string | null
          created_at?: string
          id?: string
          matricule?: string
          nom_complet?: string
          poste?: string
          salaire?: number
          statut?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employes_chantier_assigne_fkey"
            columns: ["chantier_assigne"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          client: string
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          montant_total: number
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at: string
        }
        Insert: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          montant_total?: number
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          montant_total?: number
          nom_fichier?: string
          numero?: string
          pdf_base64?: string
          updated_at?: string
        }
        Relationships: []
      }
      projets: {
        Row: {
          budget_estime: number
          client: string
          created_at: string
          date_debut: string | null
          date_fin_prevue: string | null
          description: string
          id: string
          localisation: string
          nom_projet: string
          statut: string
          updated_at: string
        }
        Insert: {
          budget_estime?: number
          client?: string
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          description?: string
          id?: string
          localisation?: string
          nom_projet?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          budget_estime?: number
          client?: string
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          description?: string
          id?: string
          localisation?: string
          nom_projet?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      recus: {
        Row: {
          client: string
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          montant_total: number
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at: string
        }
        Insert: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          montant_total?: number
          nom_fichier: string
          numero: string
          pdf_base64: string
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          montant_total?: number
          nom_fichier?: string
          numero?: string
          pdf_base64?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acces_application_scm: { Args: never; Returns: boolean }
      generer_numero_document: {
        Args: { _prefixe: string; _type_document: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

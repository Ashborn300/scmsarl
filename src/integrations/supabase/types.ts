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
      admin_accounts: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom_complet: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom_complet?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom_complet?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      annonces: {
        Row: {
          auteur_admin_id: string | null
          contenu: string
          created_at: string
          id: string
          image_url: string
          publiee: boolean
          titre: string
          updated_at: string
        }
        Insert: {
          auteur_admin_id?: string | null
          contenu?: string
          created_at?: string
          id?: string
          image_url?: string
          publiee?: boolean
          titre?: string
          updated_at?: string
        }
        Update: {
          auteur_admin_id?: string | null
          contenu?: string
          created_at?: string
          id?: string
          image_url?: string
          publiee?: boolean
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      annonces_masquees: {
        Row: {
          annonce_id: string
          created_at: string
          employe_id: string
          id: string
        }
        Insert: {
          annonce_id: string
          created_at?: string
          employe_id: string
          id?: string
        }
        Update: {
          annonce_id?: string
          created_at?: string
          employe_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annonces_masquees_annonce_id_fkey"
            columns: ["annonce_id"]
            isOneToOne: false
            referencedRelation: "annonces"
            referencedColumns: ["id"]
          },
        ]
      }
      archives_chantiers: {
        Row: {
          adresse_projet: string
          budget_estime_debut: number
          budget_final: number
          created_at: string
          date_debut_construction: string | null
          date_finalisation_construction: string | null
          employes_participants: Json
          id: string
          nom_chantier: string
          nom_client: string
          nom_fichier: string
          pdf_base64: string
          updated_at: string
        }
        Insert: {
          adresse_projet?: string
          budget_estime_debut?: number
          budget_final?: number
          created_at?: string
          date_debut_construction?: string | null
          date_finalisation_construction?: string | null
          employes_participants?: Json
          id?: string
          nom_chantier?: string
          nom_client?: string
          nom_fichier?: string
          pdf_base64?: string
          updated_at?: string
        }
        Update: {
          adresse_projet?: string
          budget_estime_debut?: number
          budget_final?: number
          created_at?: string
          date_debut_construction?: string | null
          date_finalisation_construction?: string | null
          employes_participants?: Json
          id?: string
          nom_chantier?: string
          nom_client?: string
          nom_fichier?: string
          pdf_base64?: string
          updated_at?: string
        }
        Relationships: []
      }
      bilans_sante_employes: {
        Row: {
          allergies: string
          blessure: boolean
          created_at: string
          details_blessure: string
          employe_id: string
          employe_nom: string
          etat_global: string
          groupe_sanguin: string
          id: string
          semaine: string
          updated_at: string
        }
        Insert: {
          allergies?: string
          blessure?: boolean
          created_at?: string
          details_blessure?: string
          employe_id: string
          employe_nom?: string
          etat_global?: string
          groupe_sanguin?: string
          id?: string
          semaine?: string
          updated_at?: string
        }
        Update: {
          allergies?: string
          blessure?: boolean
          created_at?: string
          details_blessure?: string
          employe_id?: string
          employe_nom?: string
          etat_global?: string
          groupe_sanguin?: string
          id?: string
          semaine?: string
          updated_at?: string
        }
        Relationships: []
      }
      cartes_service: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          image_base64: string
          matricule: string
          nom_complet: string
          nom_fichier: string
          numero: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          image_base64: string
          matricule?: string
          nom_complet?: string
          nom_fichier: string
          numero: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          image_base64?: string
          matricule?: string
          nom_complet?: string
          nom_fichier?: string
          numero?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificats: {
        Row: {
          beneficiaire: string
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
          beneficiaire?: string
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
          beneficiaire?: string
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
      chantiers: {
        Row: {
          autoriser_budget_chef: boolean
          budget_global: number
          chef_chantier: string
          created_at: string
          date_debut: string | null
          date_fin_prevue: string | null
          description: string
          employes_assignes: string[]
          id: string
          images_chantier: string[]
          localisation: string
          nom_chantier: string
          projet_lie: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          autoriser_budget_chef?: boolean
          budget_global?: number
          chef_chantier?: string
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          description?: string
          employes_assignes?: string[]
          id?: string
          images_chantier?: string[]
          localisation?: string
          nom_chantier?: string
          projet_lie?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          autoriser_budget_chef?: boolean
          budget_global?: number
          chef_chantier?: string
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          description?: string
          employes_assignes?: string[]
          id?: string
          images_chantier?: string[]
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
      codes_qr_employes: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          employe_id: string
          employe_nom: string
          id: string
          matricule: string
          nom_fichier: string
          numero: string
          qr_base64: string
          updated_at: string
          url_publique: string
        }
        Insert: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          employe_id: string
          employe_nom?: string
          id?: string
          matricule?: string
          nom_fichier: string
          numero: string
          qr_base64: string
          updated_at?: string
          url_publique: string
        }
        Update: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          employe_id?: string
          employe_nom?: string
          id?: string
          matricule?: string
          nom_fichier?: string
          numero?: string
          qr_base64?: string
          updated_at?: string
          url_publique?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          titre: string
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
          titre?: string
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
          titre?: string
          updated_at?: string
        }
        Relationships: []
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
      connexions_scm: {
        Row: {
          admin_id: string | null
          connected_at: string
          created_at: string
          employe_id: string | null
          id: string
          matricule: string
          nom_utilisateur: string
          role: string
          type_connexion: string
        }
        Insert: {
          admin_id?: string | null
          connected_at?: string
          created_at?: string
          employe_id?: string | null
          id?: string
          matricule?: string
          nom_utilisateur?: string
          role: string
          type_connexion?: string
        }
        Update: {
          admin_id?: string | null
          connected_at?: string
          created_at?: string
          employe_id?: string | null
          id?: string
          matricule?: string
          nom_utilisateur?: string
          role?: string
          type_connexion?: string
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
      demandes_conges: {
        Row: {
          created_at: string
          employe_id: string
          employe_nom: string
          id: string
          image_url: string
          raison: string
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employe_id: string
          employe_nom?: string
          id?: string
          image_url?: string
          raison?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employe_id?: string
          employe_nom?: string
          id?: string
          image_url?: string
          raison?: string
          statut?: string
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
          contact_urgence: string
          created_at: string
          date_admission: string | null
          date_naissance: string | null
          email: string
          genre: string
          id: string
          matricule: string
          nom_complet: string
          numero_piece_identite: string
          peut_voir_budget: boolean
          photo_profil: string
          poste: string
          role: string
          salaire: number
          salaire_recu: number
          salaire_restant: number
          salaire_total: number
          statut: string
          telephone: string
          updated_at: string
        }
        Insert: {
          adresse?: string
          chantier_assigne?: string | null
          contact_urgence?: string
          created_at?: string
          date_admission?: string | null
          date_naissance?: string | null
          email?: string
          genre?: string
          id?: string
          matricule?: string
          nom_complet?: string
          numero_piece_identite?: string
          peut_voir_budget?: boolean
          photo_profil?: string
          poste?: string
          role?: string
          salaire?: number
          salaire_recu?: number
          salaire_restant?: number
          salaire_total?: number
          statut?: string
          telephone?: string
          updated_at?: string
        }
        Update: {
          adresse?: string
          chantier_assigne?: string | null
          contact_urgence?: string
          created_at?: string
          date_admission?: string | null
          date_naissance?: string | null
          email?: string
          genre?: string
          id?: string
          matricule?: string
          nom_complet?: string
          numero_piece_identite?: string
          peut_voir_budget?: boolean
          photo_profil?: string
          poste?: string
          role?: string
          salaire?: number
          salaire_recu?: number
          salaire_restant?: number
          salaire_total?: number
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
      fiches_employes: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          nom_fichier: string
          numero: string
          pdf_base64: string
          titre: string
          type_fiche: string
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
          titre?: string
          type_fiche?: string
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
          titre?: string
          type_fiche?: string
          updated_at?: string
        }
        Relationships: []
      }
      formulaires_personnalises: {
        Row: {
          champs: Json
          created_at: string
          description: string
          id: string
          publie: boolean
          titre: string
          updated_at: string
          url_publique: string
        }
        Insert: {
          champs?: Json
          created_at?: string
          description?: string
          id?: string
          publie?: boolean
          titre?: string
          updated_at?: string
          url_publique?: string
        }
        Update: {
          champs?: Json
          created_at?: string
          description?: string
          id?: string
          publie?: boolean
          titre?: string
          updated_at?: string
          url_publique?: string
        }
        Relationships: []
      }
      incidents_chantier: {
        Row: {
          chantier_id: string | null
          chantier_nom: string
          chef_chantier_id: string
          chef_chantier_nom: string
          created_at: string
          date_evenement: string
          explication: string
          id: string
          images: string[]
          statut: string
          type_evenement: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          chantier_nom?: string
          chef_chantier_id: string
          chef_chantier_nom?: string
          created_at?: string
          date_evenement?: string
          explication?: string
          id?: string
          images?: string[]
          statut?: string
          type_evenement?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          chantier_nom?: string
          chef_chantier_id?: string
          chef_chantier_nom?: string
          created_at?: string
          date_evenement?: string
          explication?: string
          id?: string
          images?: string[]
          statut?: string
          type_evenement?: string
          updated_at?: string
        }
        Relationships: []
      }
      jours_non_travailles: {
        Row: {
          actif: boolean
          created_at: string
          date_jour: string
          description: string
          id: string
          titre: string
          type_jour: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          date_jour: string
          description?: string
          id?: string
          titre?: string
          type_jour?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          date_jour?: string
          description?: string
          id?: string
          titre?: string
          type_jour?: string
          updated_at?: string
        }
        Relationships: []
      }
      organigrammes_entreprise: {
        Row: {
          actif: boolean
          blocs: Json
          created_at: string
          description: string
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          blocs?: Json
          created_at?: string
          description?: string
          id?: string
          titre?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          blocs?: Json
          created_at?: string
          description?: string
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      presences: {
        Row: {
          chantier_id: string
          chef_chantier_id: string
          created_at: string
          date: string
          employes_presence: Json
          id: string
          notes: string
          updated_at: string
        }
        Insert: {
          chantier_id: string
          chef_chantier_id: string
          created_at?: string
          date?: string
          employes_presence?: Json
          id?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string
          chef_chantier_id?: string
          created_at?: string
          date?: string
          employes_presence?: Json
          id?: string
          notes?: string
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
      rapports_materiel: {
        Row: {
          chantier_id: string | null
          chantier_nom: string
          chef_chantier_id: string
          chef_chantier_nom: string
          created_at: string
          id: string
          materiel_perdu: Json
          materiel_prevu: Json
          materiel_recupere: Json
          materiel_utilise: Json
          notes: string
          semaine: string
          statut: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          chantier_nom?: string
          chef_chantier_id: string
          chef_chantier_nom?: string
          created_at?: string
          id?: string
          materiel_perdu?: Json
          materiel_prevu?: Json
          materiel_recupere?: Json
          materiel_utilise?: Json
          notes?: string
          semaine?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          chantier_nom?: string
          chef_chantier_id?: string
          chef_chantier_nom?: string
          created_at?: string
          id?: string
          materiel_perdu?: Json
          materiel_prevu?: Json
          materiel_recupere?: Json
          materiel_utilise?: Json
          notes?: string
          semaine?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      realistic_sketchup: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          image_base64: string
          nom_fichier: string
          numero: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          image_base64: string
          nom_fichier: string
          numero: string
          titre?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          image_base64?: string
          nom_fichier?: string
          numero?: string
          titre?: string
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
      rendus_3d: {
        Row: {
          created_at: string
          date_document: string
          donnees_formulaire: Json
          id: string
          image_base64: string
          nom_fichier: string
          numero: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          image_base64: string
          nom_fichier: string
          numero: string
          titre?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_document?: string
          donnees_formulaire?: Json
          id?: string
          image_base64?: string
          nom_fichier?: string
          numero?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      reponses_formulaires: {
        Row: {
          created_at: string
          fichiers: Json
          formulaire_id: string
          id: string
          reponses: Json
        }
        Insert: {
          created_at?: string
          fichiers?: Json
          formulaire_id: string
          id?: string
          reponses?: Json
        }
        Update: {
          created_at?: string
          fichiers?: Json
          formulaire_id?: string
          id?: string
          reponses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "reponses_formulaires_formulaire_id_fkey"
            columns: ["formulaire_id"]
            isOneToOne: false
            referencedRelation: "formulaires_personnalises"
            referencedColumns: ["id"]
          },
        ]
      }
      scm_sessions: {
        Row: {
          admin_id: string | null
          created_at: string
          employe_id: string | null
          expires_at: string
          id: string
          last_seen_at: string
          role: string
          token_hash: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          employe_id?: string | null
          expires_at: string
          id?: string
          last_seen_at?: string
          role: string
          token_hash: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          employe_id?: string | null
          expires_at?: string
          id?: string
          last_seen_at?: string
          role?: string
          token_hash?: string
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
      scm_get_session: { Args: { _token_hash: string }; Returns: Json }
      scm_login_admin: {
        Args: { _token_hash: string; _username: string }
        Returns: Json
      }
      scm_login_employe: {
        Args: { _matricule: string; _token_hash: string }
        Returns: Json
      }
      scm_logout: { Args: { _token_hash: string }; Returns: boolean }
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

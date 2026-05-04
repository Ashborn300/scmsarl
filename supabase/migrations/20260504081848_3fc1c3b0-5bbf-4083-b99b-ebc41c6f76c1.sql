-- Table des demandes de paiement créées par les employés
CREATE TABLE public.demandes_paiement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  employe_nom TEXT NOT NULL DEFAULT '',
  matricule TEXT NOT NULL DEFAULT '',
  poste TEXT NOT NULL DEFAULT '',
  chantier_id UUID,
  chantier_nom TEXT NOT NULL DEFAULT '',
  montant NUMERIC NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'en_attente',
  date_traitement TIMESTAMP WITH TIME ZONE,
  reponse_admin TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demandes_paiement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les demandes paiement"
  ON public.demandes_paiement FOR INSERT TO anon, authenticated
  WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut lire les demandes paiement"
  ON public.demandes_paiement FOR SELECT TO anon, authenticated
  USING (acces_application_scm());

CREATE POLICY "Application peut modifier les demandes paiement"
  ON public.demandes_paiement FOR UPDATE TO anon, authenticated
  USING (acces_application_scm())
  WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut supprimer les demandes paiement"
  ON public.demandes_paiement FOR DELETE TO anon, authenticated
  USING (acces_application_scm());

CREATE TRIGGER trg_demandes_paiement_updated_at
  BEFORE UPDATE ON public.demandes_paiement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_demandes_paiement_employe ON public.demandes_paiement(employe_id);
CREATE INDEX idx_demandes_paiement_statut ON public.demandes_paiement(statut);
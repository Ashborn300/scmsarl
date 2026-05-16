
-- Stagiaires (interns)
CREATE TABLE public.stagiaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet text NOT NULL DEFAULT '',
  adresse text NOT NULL DEFAULT '',
  telephone text NOT NULL DEFAULT '',
  niveau_etude text NOT NULL DEFAULT '',
  ecole text NOT NULL DEFAULT '',
  motivation text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'en_attente',
  matricule text NOT NULL DEFAULT '',
  chantier_id uuid,
  photo_profil text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stagiaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les stagiaires" ON public.stagiaires FOR INSERT TO anon, authenticated WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut lire les stagiaires" ON public.stagiaires FOR SELECT TO anon, authenticated USING (acces_application_scm());
CREATE POLICY "Application peut modifier les stagiaires" ON public.stagiaires FOR UPDATE TO anon, authenticated USING (acces_application_scm()) WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut supprimer les stagiaires" ON public.stagiaires FOR DELETE TO anon, authenticated USING (acces_application_scm());

CREATE TRIGGER stagiaires_updated_at BEFORE UPDATE ON public.stagiaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Annonces destinées à des stagiaires précis
CREATE TABLE public.annonces_stagiaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL DEFAULT '',
  contenu text NOT NULL DEFAULT '',
  destinataires uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.annonces_stagiaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les annonces stagiaires" ON public.annonces_stagiaires FOR INSERT TO anon, authenticated WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut lire les annonces stagiaires" ON public.annonces_stagiaires FOR SELECT TO anon, authenticated USING (acces_application_scm());
CREATE POLICY "Application peut supprimer les annonces stagiaires" ON public.annonces_stagiaires FOR DELETE TO anon, authenticated USING (acces_application_scm());

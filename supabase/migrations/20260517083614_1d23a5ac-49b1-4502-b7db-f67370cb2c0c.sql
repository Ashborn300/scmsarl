CREATE TABLE public.candidatures_emploi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet text NOT NULL DEFAULT '',
  telephone text NOT NULL DEFAULT '',
  adresse text NOT NULL DEFAULT '',
  niveau_etude text NOT NULL DEFAULT '',
  poste_vise text NOT NULL DEFAULT '',
  poste_autre text NOT NULL DEFAULT '',
  motivation text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'en_attente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidatures_emploi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer candidatures emploi" ON public.candidatures_emploi FOR INSERT TO anon, authenticated WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut lire candidatures emploi" ON public.candidatures_emploi FOR SELECT TO anon, authenticated USING (acces_application_scm());
CREATE POLICY "Application peut modifier candidatures emploi" ON public.candidatures_emploi FOR UPDATE TO anon, authenticated USING (acces_application_scm()) WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut supprimer candidatures emploi" ON public.candidatures_emploi FOR DELETE TO anon, authenticated USING (acces_application_scm());

CREATE TRIGGER candidatures_emploi_updated_at BEFORE UPDATE ON public.candidatures_emploi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
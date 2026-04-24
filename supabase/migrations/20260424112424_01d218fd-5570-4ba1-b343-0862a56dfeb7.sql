CREATE TABLE public.rapports_materiel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_chantier_id UUID NOT NULL,
  chef_chantier_nom TEXT NOT NULL DEFAULT '',
  chantier_id UUID,
  chantier_nom TEXT NOT NULL DEFAULT '',
  semaine DATE NOT NULL DEFAULT CURRENT_DATE,
  materiel_prevu JSONB NOT NULL DEFAULT '[]'::jsonb,
  materiel_utilise JSONB NOT NULL DEFAULT '[]'::jsonb,
  materiel_recupere JSONB NOT NULL DEFAULT '[]'::jsonb,
  materiel_perdu JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'Rapport envoyé',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rapports_materiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les rapports materiel"
ON public.rapports_materiel
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les rapports materiel"
ON public.rapports_materiel
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les rapports materiel"
ON public.rapports_materiel
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les rapports materiel"
ON public.rapports_materiel
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE INDEX idx_rapports_materiel_chef ON public.rapports_materiel (chef_chantier_id);
CREATE INDEX idx_rapports_materiel_chantier ON public.rapports_materiel (chantier_id);
CREATE INDEX idx_rapports_materiel_semaine ON public.rapports_materiel (semaine DESC);

CREATE TRIGGER update_rapports_materiel_updated_at
BEFORE UPDATE ON public.rapports_materiel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
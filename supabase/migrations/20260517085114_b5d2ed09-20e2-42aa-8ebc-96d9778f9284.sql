CREATE TABLE public.arrivees_chantier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  employe_nom TEXT NOT NULL DEFAULT ''::text,
  matricule TEXT NOT NULL DEFAULT ''::text,
  poste TEXT NOT NULL DEFAULT ''::text,
  chantier_id UUID,
  chantier_nom TEXT NOT NULL DEFAULT ''::text,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_arrivee TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.arrivees_chantier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les arrivees chantier"
  ON public.arrivees_chantier FOR SELECT
  TO anon, authenticated
  USING (acces_application_scm());

CREATE POLICY "Application peut creer les arrivees chantier"
  ON public.arrivees_chantier FOR INSERT
  TO anon, authenticated
  WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut modifier les arrivees chantier"
  ON public.arrivees_chantier FOR UPDATE
  TO anon, authenticated
  USING (acces_application_scm())
  WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut supprimer les arrivees chantier"
  ON public.arrivees_chantier FOR DELETE
  TO anon, authenticated
  USING (acces_application_scm());

CREATE INDEX idx_arrivees_chantier_date ON public.arrivees_chantier (date DESC);
CREATE INDEX idx_arrivees_chantier_employe ON public.arrivees_chantier (employe_id);
CREATE INDEX idx_arrivees_chantier_chantier ON public.arrivees_chantier (chantier_id);
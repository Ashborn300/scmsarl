CREATE TABLE public.fiches_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  type_fiche TEXT NOT NULL DEFAULT 'individuelle',
  titre TEXT NOT NULL DEFAULT '',
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fiches_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux fiches employes"
ON public.fiches_employes
FOR ALL
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());
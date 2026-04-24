CREATE TABLE public.realistic_sketchup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  titre TEXT NOT NULL DEFAULT '',
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_base64 TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.realistic_sketchup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux rendus realistic sketchup"
ON public.realistic_sketchup
FOR ALL
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());
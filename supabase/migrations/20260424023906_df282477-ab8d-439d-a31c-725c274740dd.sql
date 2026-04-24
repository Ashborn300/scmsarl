CREATE TABLE public.rendus_3d (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  titre TEXT NOT NULL DEFAULT '',
  image_base64 TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rendus_3d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux rendus 3D"
ON public.rendus_3d
FOR ALL
TO public
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());
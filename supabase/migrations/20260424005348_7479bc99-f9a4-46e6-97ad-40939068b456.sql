CREATE TABLE public.communications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text NOT NULL,
  nom_fichier text NOT NULL,
  donnees_formulaire jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 text NOT NULL,
  titre text NOT NULL DEFAULT '',
  date_document date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les communications"
ON public.communications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Application peut lire les communications"
ON public.communications
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut modifier les communications"
ON public.communications
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Application peut supprimer les communications"
ON public.communications
FOR DELETE
TO anon, authenticated
USING (true);
CREATE TABLE public.versions_nuit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text NOT NULL,
  nom_fichier text NOT NULL,
  titre text NOT NULL DEFAULT 'Version nuit',
  donnees_formulaire jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_base64 text NOT NULL,
  date_document date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.versions_nuit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux versions nuit"
ON public.versions_nuit
FOR ALL
TO public
USING (acces_application_scm())
WITH CHECK (acces_application_scm());

CREATE TRIGGER update_versions_nuit_updated_at
BEFORE UPDATE ON public.versions_nuit
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
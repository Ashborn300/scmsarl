CREATE TABLE IF NOT EXISTS public.cartes_service (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text NOT NULL,
  nom_fichier text NOT NULL,
  nom_complet text NOT NULL DEFAULT '',
  matricule text NOT NULL DEFAULT '',
  donnees_formulaire jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_base64 text NOT NULL,
  date_document date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cartes_service ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux cartes service"
ON public.cartes_service
FOR ALL
TO public
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE TRIGGER update_cartes_service_updated_at
BEFORE UPDATE ON public.cartes_service
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
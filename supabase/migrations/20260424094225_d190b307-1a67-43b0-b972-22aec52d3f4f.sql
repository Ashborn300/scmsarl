CREATE TABLE IF NOT EXISTS public.organigrammes_entreprise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL DEFAULT 'Organigramme SCM SARL',
  description TEXT NOT NULL DEFAULT '',
  blocs JSONB NOT NULL DEFAULT '[]'::jsonb,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organigrammes_entreprise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les organigrammes entreprise"
ON public.organigrammes_entreprise
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les organigrammes entreprise actifs"
ON public.organigrammes_entreprise
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm() AND actif = true);

CREATE POLICY "Application peut modifier les organigrammes entreprise"
ON public.organigrammes_entreprise
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les organigrammes entreprise"
ON public.organigrammes_entreprise
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

DROP TRIGGER IF EXISTS update_organigrammes_entreprise_updated_at ON public.organigrammes_entreprise;
CREATE TRIGGER update_organigrammes_entreprise_updated_at
BEFORE UPDATE ON public.organigrammes_entreprise
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
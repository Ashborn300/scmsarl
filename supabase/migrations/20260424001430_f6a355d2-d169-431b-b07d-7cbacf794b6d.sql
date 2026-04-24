CREATE TABLE IF NOT EXISTS public.annonces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre text NOT NULL DEFAULT '',
  contenu text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  publiee boolean NOT NULL DEFAULT true,
  auteur_admin_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.annonces_masquees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annonce_id uuid NOT NULL REFERENCES public.annonces(id) ON DELETE CASCADE,
  employe_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (annonce_id, employe_id)
);

ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annonces_masquees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les annonces publiees"
ON public.annonces
FOR SELECT
TO anon, authenticated
USING (acces_application_scm() AND publiee = true);

CREATE POLICY "Application peut creer les annonces"
ON public.annonces
FOR INSERT
TO anon, authenticated
WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut modifier les annonces"
ON public.annonces
FOR UPDATE
TO anon, authenticated
USING (acces_application_scm())
WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut supprimer les annonces"
ON public.annonces
FOR DELETE
TO anon, authenticated
USING (acces_application_scm());

CREATE POLICY "Application peut lire les annonces masquees"
ON public.annonces_masquees
FOR SELECT
TO anon, authenticated
USING (acces_application_scm());

CREATE POLICY "Application peut masquer une annonce"
ON public.annonces_masquees
FOR INSERT
TO anon, authenticated
WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut modifier les annonces masquees"
ON public.annonces_masquees
FOR UPDATE
TO anon, authenticated
USING (acces_application_scm())
WITH CHECK (acces_application_scm());

CREATE POLICY "Application peut supprimer les annonces masquees"
ON public.annonces_masquees
FOR DELETE
TO anon, authenticated
USING (acces_application_scm());

DROP TRIGGER IF EXISTS update_annonces_updated_at ON public.annonces;
CREATE TRIGGER update_annonces_updated_at
BEFORE UPDATE ON public.annonces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON public.annonces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_masquees_employe ON public.annonces_masquees(employe_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('annonce-images', 'annonce-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Application peut lire les images annonces"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'annonce-images' AND public.acces_application_scm());

CREATE POLICY "Application peut ajouter les images annonces"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'annonce-images' AND public.acces_application_scm());

CREATE POLICY "Application peut modifier les images annonces"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'annonce-images' AND public.acces_application_scm())
WITH CHECK (bucket_id = 'annonce-images' AND public.acces_application_scm());

CREATE POLICY "Application peut supprimer les images annonces"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'annonce-images' AND public.acces_application_scm());
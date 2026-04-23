ALTER TABLE public.employes
ADD COLUMN IF NOT EXISTS photo_profil text NOT NULL DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('employe-photos', 'employe-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Application peut lire les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut ajouter les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut modifier les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut supprimer les photos employes" ON storage.objects;

CREATE POLICY "Application peut lire les photos employes"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'employe-photos');

CREATE POLICY "Application peut ajouter les photos employes"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'employe-photos' AND public.acces_application_scm());

CREATE POLICY "Application peut modifier les photos employes"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'employe-photos' AND public.acces_application_scm())
WITH CHECK (bucket_id = 'employe-photos' AND public.acces_application_scm());

CREATE POLICY "Application peut supprimer les photos employes"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'employe-photos' AND public.acces_application_scm());
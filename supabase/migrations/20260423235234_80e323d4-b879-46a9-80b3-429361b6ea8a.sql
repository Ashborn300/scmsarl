INSERT INTO storage.buckets (id, name, public)
VALUES
  ('chantier-images', 'chantier-images', true),
  ('employe-photos', 'employe-photos', true),
  ('scm-images', 'scm-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Application peut lire les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut ajouter les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut modifier les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut supprimer les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut lire les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut ajouter les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut modifier les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut supprimer les photos employes" ON storage.objects;
DROP POLICY IF EXISTS "Application peut lire les images scm" ON storage.objects;
DROP POLICY IF EXISTS "Application peut ajouter les images scm" ON storage.objects;
DROP POLICY IF EXISTS "Application peut modifier les images scm" ON storage.objects;
DROP POLICY IF EXISTS "Application peut supprimer les images scm" ON storage.objects;

CREATE POLICY "Application peut lire les images chantier"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chantier-images');

CREATE POLICY "Application peut ajouter les images chantier"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'chantier-images' AND public.acces_application_scm());

CREATE POLICY "Application peut modifier les images chantier"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'chantier-images' AND public.acces_application_scm())
WITH CHECK (bucket_id = 'chantier-images' AND public.acces_application_scm());

CREATE POLICY "Application peut supprimer les images chantier"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'chantier-images' AND public.acces_application_scm());

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

CREATE POLICY "Application peut lire les images scm"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'scm-images');

CREATE POLICY "Application peut ajouter les images scm"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'scm-images' AND public.acces_application_scm());

CREATE POLICY "Application peut modifier les images scm"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'scm-images' AND public.acces_application_scm())
WITH CHECK (bucket_id = 'scm-images' AND public.acces_application_scm());

CREATE POLICY "Application peut supprimer les images scm"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'scm-images' AND public.acces_application_scm());
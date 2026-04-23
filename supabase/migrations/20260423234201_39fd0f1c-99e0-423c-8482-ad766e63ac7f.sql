CREATE OR REPLACE FUNCTION public.acces_application_scm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT current_setting('request.role', true) IN ('anon', 'authenticated')
$$;

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
WITH CHECK (bucket_id = 'employe-photos');

CREATE POLICY "Application peut modifier les photos employes"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'employe-photos')
WITH CHECK (bucket_id = 'employe-photos');

CREATE POLICY "Application peut supprimer les photos employes"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'employe-photos');
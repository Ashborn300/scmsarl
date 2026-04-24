DROP POLICY IF EXISTS "Application peut creer les communications" ON public.communications;
DROP POLICY IF EXISTS "Application peut lire les communications" ON public.communications;
DROP POLICY IF EXISTS "Application peut modifier les communications" ON public.communications;
DROP POLICY IF EXISTS "Application peut supprimer les communications" ON public.communications;

CREATE POLICY "Application peut creer les communications"
ON public.communications
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les communications"
ON public.communications
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les communications"
ON public.communications
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les communications"
ON public.communications
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());
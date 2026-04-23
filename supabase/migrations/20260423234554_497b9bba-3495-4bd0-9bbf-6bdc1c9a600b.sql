CREATE OR REPLACE FUNCTION public.acces_application_scm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(auth.role(), current_setting('request.jwt.claim.role', true), current_setting('request.role', true)) IN ('anon', 'authenticated')
$$;
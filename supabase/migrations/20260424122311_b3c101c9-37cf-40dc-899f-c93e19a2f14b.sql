CREATE OR REPLACE FUNCTION public.scm_visible_employes(_token_hash text)
RETURNS SETOF public.employes
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  session_record public.scm_sessions%ROWTYPE;
BEGIN
  SELECT * INTO session_record
  FROM public.scm_sessions
  WHERE token_hash = _token_hash
    AND expires_at > now()
  LIMIT 1;

  IF session_record.id IS NULL THEN
    RETURN;
  END IF;

  IF session_record.role = 'admin' THEN
    RETURN QUERY SELECT e.* FROM public.employes e ORDER BY e.created_at DESC;
  ELSIF session_record.role = 'chef_chantier' THEN
    RETURN QUERY
    SELECT DISTINCT e.*
    FROM public.employes e
    WHERE e.id = session_record.employe_id
       OR EXISTS (
        SELECT 1
        FROM public.chantiers c
        WHERE c.chef_chantier = session_record.employe_id::text
          AND (
            e.id = ANY(c.employes_assignes)
            OR e.chantier_assigne = c.id
          )
       )
    ORDER BY e.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT e.*
    FROM public.employes e
    WHERE e.id = session_record.employe_id
    ORDER BY e.created_at DESC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.scm_update_own_profile_photo(_token_hash text, _photo_profil text)
RETURNS public.employes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record public.scm_sessions%ROWTYPE;
  updated_record public.employes%ROWTYPE;
BEGIN
  SELECT * INTO session_record
  FROM public.scm_sessions
  WHERE token_hash = _token_hash
    AND expires_at > now()
    AND role IN ('employe', 'chef_chantier')
  LIMIT 1;

  IF session_record.id IS NULL OR session_record.employe_id IS NULL THEN
    RAISE EXCEPTION 'Session employé invalide.';
  END IF;

  UPDATE public.employes
  SET photo_profil = COALESCE(_photo_profil, ''),
      updated_at = now()
  WHERE id = session_record.employe_id
  RETURNING * INTO updated_record;

  IF updated_record.id IS NULL THEN
    RAISE EXCEPTION 'Profil employé introuvable.';
  END IF;

  RETURN updated_record;
END;
$$;
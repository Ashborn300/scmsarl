CREATE OR REPLACE FUNCTION public.scm_login_admin(_username text, _token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record public.admin_accounts%ROWTYPE;
  expires_at_value timestamptz := now() + interval '12 hours';
BEGIN
  SELECT * INTO admin_record
  FROM public.admin_accounts
  WHERE username = trim(_username)
    AND actif = true
  LIMIT 1;

  IF admin_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Identifiant administrateur incorrect.');
  END IF;

  INSERT INTO public.scm_sessions (token_hash, role, admin_id, expires_at)
  VALUES (_token_hash, 'admin', admin_record.id, expires_at_value);

  RETURN jsonb_build_object(
    'success', true,
    'role', 'admin',
    'nom', admin_record.nom_complet,
    'adminId', admin_record.id,
    'employeId', null
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.scm_login_employe(_matricule text, _token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  employe_record public.employes%ROWTYPE;
  session_role text;
  expires_at_value timestamptz := now() + interval '12 hours';
BEGIN
  SELECT * INTO employe_record
  FROM public.employes
  WHERE matricule = trim(_matricule)
    AND statut = 'actif'
  LIMIT 1;

  IF employe_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Matricule introuvable ou employé inactif.');
  END IF;

  session_role := CASE WHEN employe_record.role = 'chef_chantier' THEN 'chef_chantier' ELSE 'employe' END;

  INSERT INTO public.scm_sessions (token_hash, role, employe_id, expires_at)
  VALUES (_token_hash, session_role, employe_record.id, expires_at_value);

  RETURN jsonb_build_object(
    'success', true,
    'role', session_role,
    'nom', employe_record.nom_complet,
    'adminId', null,
    'employeId', employe_record.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.scm_get_session(_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record public.scm_sessions%ROWTYPE;
  display_name text := 'Utilisateur SCM';
BEGIN
  SELECT * INTO session_record
  FROM public.scm_sessions
  WHERE token_hash = _token_hash
    AND expires_at > now()
  LIMIT 1;

  IF session_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  UPDATE public.scm_sessions
  SET last_seen_at = now()
  WHERE id = session_record.id;

  IF session_record.role = 'admin' THEN
    SELECT nom_complet INTO display_name FROM public.admin_accounts WHERE id = session_record.admin_id;
  ELSE
    SELECT nom_complet INTO display_name FROM public.employes WHERE id = session_record.employe_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'role', session_record.role,
    'nom', COALESCE(display_name, 'Utilisateur SCM'),
    'adminId', session_record.admin_id,
    'employeId', session_record.employe_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.scm_logout(_token_hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.scm_sessions WHERE token_hash = _token_hash;
  SELECT true;
$$;

UPDATE public.admin_accounts
SET username = 'SCM00123', updated_at = now()
WHERE username <> 'SCM00123';

INSERT INTO public.admin_accounts (username, password_hash, nom_complet, actif)
VALUES ('SCM00123', 'no-password-login', 'Administrateur SCM SARL', true)
ON CONFLICT (username) DO UPDATE
SET actif = true,
    nom_complet = EXCLUDED.nom_complet,
    updated_at = now();
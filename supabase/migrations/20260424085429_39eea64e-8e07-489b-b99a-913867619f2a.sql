CREATE TABLE public.connexions_scm (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL,
  nom_utilisateur text NOT NULL DEFAULT '',
  admin_id uuid NULL,
  employe_id uuid NULL,
  matricule text NOT NULL DEFAULT '',
  type_connexion text NOT NULL DEFAULT 'application',
  connected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.connexions_scm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les connexions SCM"
ON public.connexions_scm
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut creer les connexions SCM"
ON public.connexions_scm
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE INDEX idx_connexions_scm_connected_at ON public.connexions_scm (connected_at DESC);
CREATE INDEX idx_connexions_scm_role ON public.connexions_scm (role);

CREATE TABLE public.jours_non_travailles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_jour date NOT NULL,
  titre text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  type_jour text NOT NULL DEFAULT 'jour_ferie',
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jours_non_travailles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les jours non travailles"
ON public.jours_non_travailles
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm() AND actif = true);

CREATE POLICY "Application peut creer les jours non travailles"
ON public.jours_non_travailles
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut modifier les jours non travailles"
ON public.jours_non_travailles
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les jours non travailles"
ON public.jours_non_travailles
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE INDEX idx_jours_non_travailles_date ON public.jours_non_travailles (date_jour DESC);

CREATE TRIGGER update_jours_non_travailles_updated_at
BEFORE UPDATE ON public.jours_non_travailles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.scm_login_admin(_username text, _token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.connexions_scm (role, nom_utilisateur, admin_id, type_connexion)
  VALUES ('admin', admin_record.nom_complet, admin_record.id, 'admin');

  RETURN jsonb_build_object(
    'success', true,
    'role', 'admin',
    'nom', admin_record.nom_complet,
    'adminId', admin_record.id,
    'employeId', null
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.scm_login_employe(_matricule text, _token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.connexions_scm (role, nom_utilisateur, employe_id, matricule, type_connexion)
  VALUES (session_role, employe_record.nom_complet, employe_record.id, employe_record.matricule, 'matricule');

  RETURN jsonb_build_object(
    'success', true,
    'role', session_role,
    'nom', employe_record.nom_complet,
    'adminId', null,
    'employeId', employe_record.id
  );
END;
$function$;
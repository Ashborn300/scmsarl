CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nom_complet text NOT NULL DEFAULT 'Administrateur SCM SARL',
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scm_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  role text NOT NULL,
  employe_id uuid NULL,
  admin_id uuid NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scm_sessions_role_check') THEN
    ALTER TABLE public.scm_sessions ADD CONSTRAINT scm_sessions_role_check CHECK (role IN ('admin', 'employe', 'chef_chantier'));
  END IF;
END $$;

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scm_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aucun acces direct aux comptes admin" ON public.admin_accounts;
DROP POLICY IF EXISTS "Aucun acces direct aux sessions scm" ON public.scm_sessions;

CREATE POLICY "Aucun acces direct aux comptes admin"
ON public.admin_accounts
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Aucun acces direct aux sessions scm"
ON public.scm_sessions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_scm_sessions_token_hash ON public.scm_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_scm_sessions_expires_at ON public.scm_sessions(expires_at);

DROP TRIGGER IF EXISTS update_admin_accounts_updated_at ON public.admin_accounts;
CREATE TRIGGER update_admin_accounts_updated_at
BEFORE UPDATE ON public.admin_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.admin_accounts (username, password_hash, nom_complet)
VALUES ('admin', '41564f94d80594c0bd4ffbb3cae24a0f9d4f8501bbfb5c239430d1425989ff84', 'Administrateur SCM SARL')
ON CONFLICT (username) DO NOTHING;
ALTER TABLE public.employes
ADD COLUMN IF NOT EXISTS salaire_total numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS salaire_recu numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS salaire_restant numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'employe',
ADD COLUMN IF NOT EXISTS peut_voir_budget boolean NOT NULL DEFAULT false;

UPDATE public.employes
SET salaire_total = COALESCE(NULLIF(salaire, 0), salaire_total),
    salaire_restant = GREATEST(COALESCE(NULLIF(salaire, 0), salaire_total) - salaire_recu, 0)
WHERE salaire_total = 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employes_role_check') THEN
    ALTER TABLE public.employes ADD CONSTRAINT employes_role_check CHECK (role IN ('employe', 'chef_chantier'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employes_matricule_unique') THEN
    ALTER TABLE public.employes ADD CONSTRAINT employes_matricule_unique UNIQUE (matricule);
  END IF;
END $$;

ALTER TABLE public.chantiers
ADD COLUMN IF NOT EXISTS budget_global numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS employes_assignes uuid[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images_chantier text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS autoriser_budget_chef boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.presences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  chantier_id uuid NOT NULL,
  chef_chantier_id uuid NOT NULL,
  employes_presence jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Application peut lire les presences" ON public.presences;
DROP POLICY IF EXISTS "Application peut creer les presences" ON public.presences;
DROP POLICY IF EXISTS "Application peut modifier les presences" ON public.presences;
DROP POLICY IF EXISTS "Application peut supprimer les presences" ON public.presences;

CREATE POLICY "Application peut lire les presences"
ON public.presences
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut creer les presences"
ON public.presences
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut modifier les presences"
ON public.presences
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les presences"
ON public.presences
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE INDEX IF NOT EXISTS idx_presences_date ON public.presences(date DESC);
CREATE INDEX IF NOT EXISTS idx_presences_chantier ON public.presences(chantier_id);
CREATE INDEX IF NOT EXISTS idx_presences_chef ON public.presences(chef_chantier_id);
CREATE INDEX IF NOT EXISTS idx_employes_matricule ON public.employes(matricule);
CREATE INDEX IF NOT EXISTS idx_employes_role ON public.employes(role);
CREATE INDEX IF NOT EXISTS idx_chantiers_employes_assignes ON public.chantiers USING GIN(employes_assignes);

DROP TRIGGER IF EXISTS update_presences_updated_at ON public.presences;
CREATE TRIGGER update_presences_updated_at
BEFORE UPDATE ON public.presences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('chantier-images', 'chantier-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Application peut lire les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut ajouter les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut modifier les images chantier" ON storage.objects;
DROP POLICY IF EXISTS "Application peut supprimer les images chantier" ON storage.objects;

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
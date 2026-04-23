CREATE TABLE IF NOT EXISTS public.projets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_projet text NOT NULL DEFAULT '',
  client text NOT NULL DEFAULT '',
  localisation text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  budget_estime numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'Planifié',
  date_debut date,
  date_fin_prevue date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chantiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_chantier text NOT NULL DEFAULT '',
  localisation text NOT NULL DEFAULT '',
  chef_chantier text NOT NULL DEFAULT '',
  projet_lie uuid REFERENCES public.projets(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'Planifié',
  date_debut date,
  date_fin_prevue date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_complet text NOT NULL DEFAULT '',
  poste text NOT NULL DEFAULT '',
  matricule text NOT NULL DEFAULT '',
  telephone text NOT NULL DEFAULT '',
  adresse text NOT NULL DEFAULT '',
  salaire numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'Actif',
  chantier_assigne uuid REFERENCES public.chantiers(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employes_matricule_unique UNIQUE (matricule)
);

ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les projets" ON public.projets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Application peut creer les projets" ON public.projets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Application peut modifier les projets" ON public.projets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Application peut supprimer les projets" ON public.projets FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Application peut lire les chantiers" ON public.chantiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Application peut creer les chantiers" ON public.chantiers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Application peut modifier les chantiers" ON public.chantiers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Application peut supprimer les chantiers" ON public.chantiers FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Application peut lire les employes" ON public.employes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Application peut creer les employes" ON public.employes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Application peut modifier les employes" ON public.employes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Application peut supprimer les employes" ON public.employes FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_projets_statut ON public.projets(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON public.chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_projet_lie ON public.chantiers(projet_lie);
CREATE INDEX IF NOT EXISTS idx_employes_statut ON public.employes(statut);
CREATE INDEX IF NOT EXISTS idx_employes_chantier_assigne ON public.employes(chantier_assigne);

CREATE TRIGGER update_projets_updated_at
BEFORE UPDATE ON public.projets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chantiers_updated_at
BEFORE UPDATE ON public.chantiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employes_updated_at
BEFORE UPDATE ON public.employes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
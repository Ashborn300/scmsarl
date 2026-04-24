CREATE TABLE public.incidents_chantier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_chantier_id UUID NOT NULL,
  chef_chantier_nom TEXT NOT NULL DEFAULT '',
  chantier_id UUID,
  chantier_nom TEXT NOT NULL DEFAULT '',
  type_evenement TEXT NOT NULL DEFAULT 'Incident',
  date_evenement DATE NOT NULL DEFAULT CURRENT_DATE,
  explication TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  statut TEXT NOT NULL DEFAULT 'Alerte envoyée',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents_chantier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les incidents chantier"
ON public.incidents_chantier
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les incidents chantier"
ON public.incidents_chantier
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les incidents chantier"
ON public.incidents_chantier
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les incidents chantier"
ON public.incidents_chantier
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE TRIGGER update_incidents_chantier_updated_at
BEFORE UPDATE ON public.incidents_chantier
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.archives_chantiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_chantier TEXT NOT NULL DEFAULT '',
  nom_client TEXT NOT NULL DEFAULT '',
  date_debut_construction DATE,
  date_finalisation_construction DATE,
  budget_estime_debut NUMERIC NOT NULL DEFAULT 0,
  budget_final NUMERIC NOT NULL DEFAULT 0,
  adresse_projet TEXT NOT NULL DEFAULT '',
  employes_participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_base64 TEXT NOT NULL DEFAULT '',
  nom_fichier TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.archives_chantiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les archives chantiers"
ON public.archives_chantiers
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les archives chantiers"
ON public.archives_chantiers
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les archives chantiers"
ON public.archives_chantiers
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les archives chantiers"
ON public.archives_chantiers
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE TRIGGER update_archives_chantiers_updated_at
BEFORE UPDATE ON public.archives_chantiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE IF NOT EXISTS public.arrivages_materiel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_chantier_id UUID NOT NULL,
  chef_chantier_nom TEXT NOT NULL DEFAULT '',
  chantier_id UUID NULL,
  chantier_nom TEXT NOT NULL DEFAULT '',
  date_livraison DATE NOT NULL DEFAULT CURRENT_DATE,
  nom_materiel TEXT NOT NULL DEFAULT '',
  quantite NUMERIC NOT NULL DEFAULT 0,
  entreprise_partenaire TEXT NOT NULL DEFAULT '',
  prix_total NUMERIC NOT NULL DEFAULT 0,
  informations_supplementaires TEXT NOT NULL DEFAULT '',
  preuve_image_url TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'Rapport envoyé',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.arrivages_materiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les arrivages materiel"
ON public.arrivages_materiel
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les arrivages materiel"
ON public.arrivages_materiel
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les arrivages materiel"
ON public.arrivages_materiel
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les arrivages materiel"
ON public.arrivages_materiel
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE TRIGGER update_arrivages_materiel_updated_at
BEFORE UPDATE ON public.arrivages_materiel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.demandes_conges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  employe_nom TEXT NOT NULL DEFAULT '',
  raison TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'En attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demandes_conges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les demandes conges"
ON public.demandes_conges
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les demandes conges"
ON public.demandes_conges
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les demandes conges"
ON public.demandes_conges
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les demandes conges"
ON public.demandes_conges
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE TRIGGER update_demandes_conges_updated_at
BEFORE UPDATE ON public.demandes_conges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bilans_sante_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  employe_nom TEXT NOT NULL DEFAULT '',
  semaine DATE NOT NULL DEFAULT CURRENT_DATE,
  etat_global TEXT NOT NULL DEFAULT '',
  groupe_sanguin TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  blessure BOOLEAN NOT NULL DEFAULT false,
  details_blessure TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bilans_sante_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut creer les bilans sante employes"
ON public.bilans_sante_employes
FOR INSERT
TO anon, authenticated
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut lire les bilans sante employes"
ON public.bilans_sante_employes
FOR SELECT
TO anon, authenticated
USING (public.acces_application_scm());

CREATE POLICY "Application peut modifier les bilans sante employes"
ON public.bilans_sante_employes
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les bilans sante employes"
ON public.bilans_sante_employes
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());

CREATE TRIGGER update_bilans_sante_employes_updated_at
BEFORE UPDATE ON public.bilans_sante_employes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_demandes_conges_employe ON public.demandes_conges(employe_id);
CREATE INDEX idx_bilans_sante_employes_employe ON public.bilans_sante_employes(employe_id);
CREATE INDEX idx_bilans_sante_employes_semaine ON public.bilans_sante_employes(semaine);
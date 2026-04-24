CREATE TABLE public.factures_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  employe_id UUID,
  employe_nom TEXT NOT NULL DEFAULT '',
  matricule TEXT NOT NULL DEFAULT '',
  poste TEXT NOT NULL DEFAULT '',
  salaire_brut NUMERIC NOT NULL DEFAULT 0,
  total_deductions NUMERIC NOT NULL DEFAULT 0,
  salaire_net NUMERIC NOT NULL DEFAULT 0,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.factures_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux factures employes"
  ON public.factures_employes
  FOR ALL
  TO public
  USING (acces_application_scm())
  WITH CHECK (acces_application_scm());

CREATE TRIGGER update_factures_employes_updated_at
  BEFORE UPDATE ON public.factures_employes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
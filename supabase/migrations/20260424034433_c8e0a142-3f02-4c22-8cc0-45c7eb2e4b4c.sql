CREATE TABLE public.codes_qr_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  employe_id UUID NOT NULL,
  employe_nom TEXT NOT NULL DEFAULT '',
  matricule TEXT NOT NULL DEFAULT '',
  url_publique TEXT NOT NULL,
  qr_base64 TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.codes_qr_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux codes QR employes"
ON public.codes_qr_employes
FOR ALL
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE INDEX idx_codes_qr_employes_employe_id ON public.codes_qr_employes(employe_id);
CREATE INDEX idx_codes_qr_employes_numero ON public.codes_qr_employes(numero);
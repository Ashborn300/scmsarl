CREATE TABLE public.certificats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  beneficiaire TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certificats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces application SCM aux certificats"
ON public.certificats
FOR ALL
USING (public.acces_application_scm())
WITH CHECK (public.acces_application_scm());

CREATE TRIGGER update_certificats_updated_at
BEFORE UPDATE ON public.certificats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.compteurs_documents (type_document, dernier_numero)
VALUES ('certificat', 0)
ON CONFLICT (type_document) DO NOTHING;
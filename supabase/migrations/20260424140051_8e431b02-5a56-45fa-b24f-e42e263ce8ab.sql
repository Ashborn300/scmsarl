CREATE TABLE public.lettres_licenciement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  employe TEXT NOT NULL DEFAULT '',
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lettres_licenciement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lettres licenciement visibles par tous"
ON public.lettres_licenciement FOR SELECT USING (true);

CREATE POLICY "Lettres licenciement créables par tous"
ON public.lettres_licenciement FOR INSERT WITH CHECK (true);

CREATE POLICY "Lettres licenciement modifiables par tous"
ON public.lettres_licenciement FOR UPDATE USING (true);

CREATE POLICY "Lettres licenciement supprimables par tous"
ON public.lettres_licenciement FOR DELETE USING (true);

CREATE TRIGGER update_lettres_licenciement_updated_at
BEFORE UPDATE ON public.lettres_licenciement
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
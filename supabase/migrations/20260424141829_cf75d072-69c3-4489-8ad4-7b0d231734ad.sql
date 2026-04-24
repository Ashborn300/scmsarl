CREATE TABLE public.plans_architecturaux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  titre TEXT NOT NULL DEFAULT 'Plan architectural',
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_base64 TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plans_architecturaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans architecturaux visibles par tous"
ON public.plans_architecturaux FOR SELECT USING (true);

CREATE POLICY "Plans architecturaux créables par tous"
ON public.plans_architecturaux FOR INSERT WITH CHECK (true);

CREATE POLICY "Plans architecturaux modifiables par tous"
ON public.plans_architecturaux FOR UPDATE USING (true);

CREATE POLICY "Plans architecturaux supprimables par tous"
ON public.plans_architecturaux FOR DELETE USING (true);

CREATE TRIGGER update_plans_architecturaux_updated_at
BEFORE UPDATE ON public.plans_architecturaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
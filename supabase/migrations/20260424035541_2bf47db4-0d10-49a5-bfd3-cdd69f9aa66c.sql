CREATE TABLE public.formulaires_personnalises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL DEFAULT 'Formulaire personnalisé',
  description TEXT NOT NULL DEFAULT '',
  champs JSONB NOT NULL DEFAULT '[]'::jsonb,
  url_publique TEXT NOT NULL DEFAULT '',
  publie BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.reponses_formulaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulaire_id UUID NOT NULL REFERENCES public.formulaires_personnalises(id) ON DELETE CASCADE,
  reponses JSONB NOT NULL DEFAULT '{}'::jsonb,
  fichiers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formulaires_personnalises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reponses_formulaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published custom forms"
ON public.formulaires_personnalises
FOR SELECT
USING (publie = true);

CREATE POLICY "Anyone can create custom forms"
ON public.formulaires_personnalises
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update custom forms"
ON public.formulaires_personnalises
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete custom forms"
ON public.formulaires_personnalises
FOR DELETE
USING (true);

CREATE POLICY "Anyone can submit responses to published forms"
ON public.reponses_formulaires
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formulaires_personnalises f
    WHERE f.id = reponses_formulaires.formulaire_id
      AND f.publie = true
  )
);

CREATE POLICY "Anyone can view form responses"
ON public.reponses_formulaires
FOR SELECT
USING (true);

CREATE POLICY "Anyone can delete form responses"
ON public.reponses_formulaires
FOR DELETE
USING (true);

CREATE TRIGGER update_formulaires_personnalises_updated_at
BEFORE UPDATE ON public.formulaires_personnalises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_formulaires_personnalises_publie ON public.formulaires_personnalises(publie);
CREATE INDEX idx_reponses_formulaires_formulaire_id ON public.reponses_formulaires(formulaire_id);
CREATE INDEX idx_reponses_formulaires_created_at ON public.reponses_formulaires(created_at DESC);
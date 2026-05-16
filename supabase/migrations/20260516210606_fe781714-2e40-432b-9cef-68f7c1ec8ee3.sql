CREATE TABLE public.contrats_fournisseurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  client TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contrats_fournisseurs_created_at ON public.contrats_fournisseurs (created_at DESC);

ALTER TABLE public.contrats_fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les contrats fournisseurs" ON public.contrats_fournisseurs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Application peut creer les contrats fournisseurs" ON public.contrats_fournisseurs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Application peut modifier les contrats fournisseurs" ON public.contrats_fournisseurs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Application peut supprimer les contrats fournisseurs" ON public.contrats_fournisseurs FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_contrats_fournisseurs_updated_at BEFORE UPDATE ON public.contrats_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
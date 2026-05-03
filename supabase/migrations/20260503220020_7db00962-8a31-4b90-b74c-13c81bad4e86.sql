CREATE TABLE public.devis_estimatifs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  montant_total NUMERIC NOT NULL DEFAULT 0,
  client TEXT NOT NULL DEFAULT '',
  projet TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_devis_estimatifs_created_at ON public.devis_estimatifs (created_at DESC);

ALTER TABLE public.devis_estimatifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les devis estimatifs" ON public.devis_estimatifs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Application peut creer les devis estimatifs" ON public.devis_estimatifs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Application peut modifier les devis estimatifs" ON public.devis_estimatifs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Application peut supprimer les devis estimatifs" ON public.devis_estimatifs FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_devis_estimatifs_updated_at BEFORE UPDATE ON public.devis_estimatifs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
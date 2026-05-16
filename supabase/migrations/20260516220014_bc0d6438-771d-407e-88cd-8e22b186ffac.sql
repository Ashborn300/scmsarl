CREATE TABLE public.dettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_contractant TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  adresse TEXT NOT NULL DEFAULT '',
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'USD',
  date_dette DATE NOT NULL DEFAULT CURRENT_DATE,
  date_paiement DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'en_cours',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les dettes" ON public.dettes FOR SELECT TO anon, authenticated USING (acces_application_scm());
CREATE POLICY "Application peut creer les dettes" ON public.dettes FOR INSERT TO anon, authenticated WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut modifier les dettes" ON public.dettes FOR UPDATE TO anon, authenticated USING (acces_application_scm()) WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut supprimer les dettes" ON public.dettes FOR DELETE TO anon, authenticated USING (acces_application_scm());

CREATE TRIGGER update_dettes_updated_at BEFORE UPDATE ON public.dettes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dettes_date_paiement ON public.dettes(date_paiement);
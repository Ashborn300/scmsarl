CREATE TABLE public.mouvements_caisse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_mouvement text NOT NULL CHECK (type_mouvement IN ('depot','retrait')),
  montant numeric NOT NULL CHECK (montant >= 0),
  devise text NOT NULL DEFAULT 'USD',
  description text NOT NULL DEFAULT '',
  date_mouvement date NOT NULL DEFAULT CURRENT_DATE,
  auteur text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mouvements_caisse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les mouvements caisse" ON public.mouvements_caisse FOR SELECT TO anon, authenticated USING (acces_application_scm());
CREATE POLICY "Application peut creer les mouvements caisse" ON public.mouvements_caisse FOR INSERT TO anon, authenticated WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut modifier les mouvements caisse" ON public.mouvements_caisse FOR UPDATE TO anon, authenticated USING (acces_application_scm()) WITH CHECK (acces_application_scm());
CREATE POLICY "Application peut supprimer les mouvements caisse" ON public.mouvements_caisse FOR DELETE TO anon, authenticated USING (acces_application_scm());

CREATE INDEX idx_mouvements_caisse_date ON public.mouvements_caisse (date_mouvement DESC);

CREATE TRIGGER trg_mouvements_caisse_updated_at
BEFORE UPDATE ON public.mouvements_caisse
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
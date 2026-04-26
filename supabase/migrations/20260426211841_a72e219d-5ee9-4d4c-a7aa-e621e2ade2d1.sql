-- Table : salaires par chantier pour chaque employé
CREATE TABLE IF NOT EXISTS public.salaires_chantier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  chantier_id UUID NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (employe_id, chantier_id)
);

ALTER TABLE public.salaires_chantier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les salaires chantier"
  ON public.salaires_chantier FOR SELECT
  TO anon, authenticated
  USING (public.acces_application_scm());

CREATE POLICY "Application peut creer les salaires chantier"
  ON public.salaires_chantier FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut modifier les salaires chantier"
  ON public.salaires_chantier FOR UPDATE
  TO anon, authenticated
  USING (public.acces_application_scm())
  WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les salaires chantier"
  ON public.salaires_chantier FOR DELETE
  TO anon, authenticated
  USING (public.acces_application_scm());

CREATE INDEX IF NOT EXISTS idx_salaires_chantier_employe ON public.salaires_chantier(employe_id);
CREATE INDEX IF NOT EXISTS idx_salaires_chantier_chantier ON public.salaires_chantier(chantier_id);

-- Table : reçus envoyés aux employés (paiements)
CREATE TABLE IF NOT EXISTS public.recus_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  employe_id UUID NOT NULL,
  employe_nom TEXT NOT NULL DEFAULT '',
  matricule TEXT NOT NULL DEFAULT '',
  chantier_id UUID,
  chantier_nom TEXT NOT NULL DEFAULT '',
  montant NUMERIC NOT NULL DEFAULT 0,
  motif TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'en_attente',
  date_envoi DATE NOT NULL DEFAULT CURRENT_DATE,
  date_confirmation TIMESTAMP WITH TIME ZONE,
  pdf_base64 TEXT NOT NULL DEFAULT '',
  nom_fichier TEXT NOT NULL DEFAULT '',
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recus_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application peut lire les recus employes"
  ON public.recus_employes FOR SELECT
  TO anon, authenticated
  USING (public.acces_application_scm());

CREATE POLICY "Application peut creer les recus employes"
  ON public.recus_employes FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut modifier les recus employes"
  ON public.recus_employes FOR UPDATE
  TO anon, authenticated
  USING (public.acces_application_scm())
  WITH CHECK (public.acces_application_scm());

CREATE POLICY "Application peut supprimer les recus employes"
  ON public.recus_employes FOR DELETE
  TO anon, authenticated
  USING (public.acces_application_scm());

CREATE INDEX IF NOT EXISTS idx_recus_employes_employe ON public.recus_employes(employe_id);
CREATE INDEX IF NOT EXISTS idx_recus_employes_statut ON public.recus_employes(statut);

-- Triggers updated_at
DROP TRIGGER IF EXISTS trg_salaires_chantier_updated ON public.salaires_chantier;
CREATE TRIGGER trg_salaires_chantier_updated
  BEFORE UPDATE ON public.salaires_chantier
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_recus_employes_updated ON public.recus_employes;
CREATE TRIGGER trg_recus_employes_updated
  BEFORE UPDATE ON public.recus_employes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction : confirmer un reçu et déduire du salaire restant
CREATE OR REPLACE FUNCTION public.confirmer_recu_employe(_recu_id UUID, _employe_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recu_record public.recus_employes%ROWTYPE;
  emp_record public.employes%ROWTYPE;
BEGIN
  SELECT * INTO recu_record FROM public.recus_employes WHERE id = _recu_id LIMIT 1;
  IF recu_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Reçu introuvable.');
  END IF;
  IF recu_record.employe_id <> _employe_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ce reçu ne vous appartient pas.');
  END IF;
  IF recu_record.statut = 'confirme' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ce reçu a déjà été confirmé.');
  END IF;

  SELECT * INTO emp_record FROM public.employes WHERE id = _employe_id LIMIT 1;
  IF emp_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Employé introuvable.');
  END IF;

  UPDATE public.recus_employes
    SET statut = 'confirme',
        date_confirmation = now(),
        updated_at = now()
    WHERE id = _recu_id;

  UPDATE public.employes
    SET salaire_recu = COALESCE(salaire_recu, 0) + recu_record.montant,
        salaire_restant = GREATEST(COALESCE(salaire_restant, 0) - recu_record.montant, 0),
        updated_at = now()
    WHERE id = _employe_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
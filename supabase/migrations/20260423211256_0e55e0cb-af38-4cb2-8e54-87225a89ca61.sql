CREATE TABLE public.factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  montant_total NUMERIC NOT NULL DEFAULT 0,
  client TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  montant_total NUMERIC NOT NULL DEFAULT 0,
  client TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.recus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  montant_total NUMERIC NOT NULL DEFAULT 0,
  client TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.contrats_construction (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  client TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.contrats_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  employe TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.descriptions_projets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nom_fichier TEXT NOT NULL,
  donnees_formulaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_base64 TEXT NOT NULL,
  projet TEXT NOT NULL DEFAULT '',
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.compteurs_documents (
  type_document TEXT PRIMARY KEY,
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.compteurs_documents (type_document, dernier_numero) VALUES
  ('facture', 0),
  ('devis', 0),
  ('recu', 0),
  ('contrat_construction', 0),
  ('contrat_employe', 0),
  ('description_projet', 0);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recus_updated_at BEFORE UPDATE ON public.recus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contrats_construction_updated_at BEFORE UPDATE ON public.contrats_construction FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contrats_employes_updated_at BEFORE UPDATE ON public.contrats_employes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_descriptions_projets_updated_at BEFORE UPDATE ON public.descriptions_projets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generer_numero_document(_type_document TEXT, _prefixe TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nouveau_numero INTEGER;
BEGIN
  UPDATE public.compteurs_documents
  SET dernier_numero = dernier_numero + 1,
      updated_at = now()
  WHERE type_document = _type_document
  RETURNING dernier_numero INTO nouveau_numero;

  IF nouveau_numero IS NULL THEN
    INSERT INTO public.compteurs_documents (type_document, dernier_numero)
    VALUES (_type_document, 1)
    RETURNING dernier_numero INTO nouveau_numero;
  END IF;

  RETURN _prefixe || '-' || to_char(now(), 'YYYY') || '-' || lpad(nouveau_numero::text, 5, '0');
END;
$$;

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_construction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descriptions_projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compteurs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces public complet factures" ON public.factures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public complet devis" ON public.devis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public complet recus" ON public.recus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public complet contrats construction" ON public.contrats_construction FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public complet contrats employes" ON public.contrats_employes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces public complet descriptions projets" ON public.descriptions_projets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lecture publique compteurs" ON public.compteurs_documents FOR SELECT USING (true);
CREATE POLICY "Modification publique compteurs" ON public.compteurs_documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Creation publique compteurs" ON public.compteurs_documents FOR INSERT WITH CHECK (true);

CREATE INDEX idx_factures_created_at ON public.factures (created_at DESC);
CREATE INDEX idx_devis_created_at ON public.devis (created_at DESC);
CREATE INDEX idx_recus_created_at ON public.recus (created_at DESC);
CREATE INDEX idx_contrats_construction_created_at ON public.contrats_construction (created_at DESC);
CREATE INDEX idx_contrats_employes_created_at ON public.contrats_employes (created_at DESC);
CREATE INDEX idx_descriptions_projets_created_at ON public.descriptions_projets (created_at DESC);
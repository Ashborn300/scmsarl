ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_construction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descriptions_projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compteurs_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Documents factures accessibles par application" ON public.factures;
DROP POLICY IF EXISTS "Documents devis accessibles par application" ON public.devis;
DROP POLICY IF EXISTS "Documents recus accessibles par application" ON public.recus;
DROP POLICY IF EXISTS "Documents contrats construction accessibles par application" ON public.contrats_construction;
DROP POLICY IF EXISTS "Documents contrats employes accessibles par application" ON public.contrats_employes;
DROP POLICY IF EXISTS "Documents descriptions projets accessibles par application" ON public.descriptions_projets;
DROP POLICY IF EXISTS "Compteurs consultables par application" ON public.compteurs_documents;
DROP POLICY IF EXISTS "Compteurs creables par application" ON public.compteurs_documents;
DROP POLICY IF EXISTS "Compteurs modifiables par application" ON public.compteurs_documents;

CREATE POLICY "Application peut lire les factures"
ON public.factures FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les factures"
ON public.factures FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les factures"
ON public.factures FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
CREATE POLICY "Application peut supprimer les factures"
ON public.factures FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut lire les devis"
ON public.devis FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les devis"
ON public.devis FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les devis"
ON public.devis FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
CREATE POLICY "Application peut supprimer les devis"
ON public.devis FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut lire les recus"
ON public.recus FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les recus"
ON public.recus FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les recus"
ON public.recus FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
CREATE POLICY "Application peut supprimer les recus"
ON public.recus FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut lire les contrats construction"
ON public.contrats_construction FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les contrats construction"
ON public.contrats_construction FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les contrats construction"
ON public.contrats_construction FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
CREATE POLICY "Application peut supprimer les contrats construction"
ON public.contrats_construction FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut lire les contrats employes"
ON public.contrats_employes FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les contrats employes"
ON public.contrats_employes FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les contrats employes"
ON public.contrats_employes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
CREATE POLICY "Application peut supprimer les contrats employes"
ON public.contrats_employes FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut lire les descriptions projets"
ON public.descriptions_projets FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les descriptions projets"
ON public.descriptions_projets FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les descriptions projets"
ON public.descriptions_projets FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
CREATE POLICY "Application peut supprimer les descriptions projets"
ON public.descriptions_projets FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "Application peut lire les compteurs"
ON public.compteurs_documents FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Application peut creer les compteurs"
ON public.compteurs_documents FOR INSERT
TO anon, authenticated
WITH CHECK (true);
CREATE POLICY "Application peut modifier les compteurs"
ON public.compteurs_documents FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
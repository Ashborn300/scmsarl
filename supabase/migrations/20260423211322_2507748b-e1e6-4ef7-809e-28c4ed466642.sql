DROP POLICY IF EXISTS "Acces public complet factures" ON public.factures;
DROP POLICY IF EXISTS "Acces public complet devis" ON public.devis;
DROP POLICY IF EXISTS "Acces public complet recus" ON public.recus;
DROP POLICY IF EXISTS "Acces public complet contrats construction" ON public.contrats_construction;
DROP POLICY IF EXISTS "Acces public complet contrats employes" ON public.contrats_employes;
DROP POLICY IF EXISTS "Acces public complet descriptions projets" ON public.descriptions_projets;
DROP POLICY IF EXISTS "Lecture publique compteurs" ON public.compteurs_documents;
DROP POLICY IF EXISTS "Modification publique compteurs" ON public.compteurs_documents;
DROP POLICY IF EXISTS "Creation publique compteurs" ON public.compteurs_documents;

CREATE OR REPLACE FUNCTION public.acces_application_scm()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('request.role', true) IN ('anon', 'authenticated')
$$;

CREATE POLICY "Documents factures accessibles par application" ON public.factures FOR ALL USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Documents devis accessibles par application" ON public.devis FOR ALL USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Documents recus accessibles par application" ON public.recus FOR ALL USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Documents contrats construction accessibles par application" ON public.contrats_construction FOR ALL USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Documents contrats employes accessibles par application" ON public.contrats_employes FOR ALL USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Documents descriptions projets accessibles par application" ON public.descriptions_projets FOR ALL USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Compteurs consultables par application" ON public.compteurs_documents FOR SELECT USING (public.acces_application_scm());
CREATE POLICY "Compteurs modifiables par application" ON public.compteurs_documents FOR UPDATE USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Compteurs creables par application" ON public.compteurs_documents FOR INSERT WITH CHECK (public.acces_application_scm());
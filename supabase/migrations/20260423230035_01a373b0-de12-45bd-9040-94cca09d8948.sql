DROP POLICY IF EXISTS "Application peut lire les projets" ON public.projets;
DROP POLICY IF EXISTS "Application peut creer les projets" ON public.projets;
DROP POLICY IF EXISTS "Application peut modifier les projets" ON public.projets;
DROP POLICY IF EXISTS "Application peut supprimer les projets" ON public.projets;

DROP POLICY IF EXISTS "Application peut lire les chantiers" ON public.chantiers;
DROP POLICY IF EXISTS "Application peut creer les chantiers" ON public.chantiers;
DROP POLICY IF EXISTS "Application peut modifier les chantiers" ON public.chantiers;
DROP POLICY IF EXISTS "Application peut supprimer les chantiers" ON public.chantiers;

DROP POLICY IF EXISTS "Application peut lire les employes" ON public.employes;
DROP POLICY IF EXISTS "Application peut creer les employes" ON public.employes;
DROP POLICY IF EXISTS "Application peut modifier les employes" ON public.employes;
DROP POLICY IF EXISTS "Application peut supprimer les employes" ON public.employes;

CREATE POLICY "Application peut lire les projets" ON public.projets FOR SELECT TO anon, authenticated USING (public.acces_application_scm());
CREATE POLICY "Application peut creer les projets" ON public.projets FOR INSERT TO anon, authenticated WITH CHECK (public.acces_application_scm());
CREATE POLICY "Application peut modifier les projets" ON public.projets FOR UPDATE TO anon, authenticated USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Application peut supprimer les projets" ON public.projets FOR DELETE TO anon, authenticated USING (public.acces_application_scm());

CREATE POLICY "Application peut lire les chantiers" ON public.chantiers FOR SELECT TO anon, authenticated USING (public.acces_application_scm());
CREATE POLICY "Application peut creer les chantiers" ON public.chantiers FOR INSERT TO anon, authenticated WITH CHECK (public.acces_application_scm());
CREATE POLICY "Application peut modifier les chantiers" ON public.chantiers FOR UPDATE TO anon, authenticated USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Application peut supprimer les chantiers" ON public.chantiers FOR DELETE TO anon, authenticated USING (public.acces_application_scm());

CREATE POLICY "Application peut lire les employes" ON public.employes FOR SELECT TO anon, authenticated USING (public.acces_application_scm());
CREATE POLICY "Application peut creer les employes" ON public.employes FOR INSERT TO anon, authenticated WITH CHECK (public.acces_application_scm());
CREATE POLICY "Application peut modifier les employes" ON public.employes FOR UPDATE TO anon, authenticated USING (public.acces_application_scm()) WITH CHECK (public.acces_application_scm());
CREATE POLICY "Application peut supprimer les employes" ON public.employes FOR DELETE TO anon, authenticated USING (public.acces_application_scm());
CREATE POLICY "Application peut modifier les formulaires personnalises"
ON public.formulaires_personnalises
FOR UPDATE
TO anon, authenticated
USING (public.acces_application_scm())
WITH CHECK (
  public.acces_application_scm()
  AND char_length(titre) >= 1
  AND char_length(titre) <= 120
  AND char_length(description) <= 1000
  AND jsonb_typeof(champs) = 'array'
  AND jsonb_array_length(champs) >= 1
  AND jsonb_array_length(champs) <= 30
  AND char_length(url_publique) <= 500
);

CREATE POLICY "Application peut supprimer les formulaires personnalises"
ON public.formulaires_personnalises
FOR DELETE
TO anon, authenticated
USING (public.acces_application_scm());
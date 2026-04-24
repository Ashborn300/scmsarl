DROP POLICY IF EXISTS "Anyone can create custom forms" ON public.formulaires_personnalises;
DROP POLICY IF EXISTS "Anyone can update custom forms" ON public.formulaires_personnalises;
DROP POLICY IF EXISTS "Anyone can delete custom forms" ON public.formulaires_personnalises;
DROP POLICY IF EXISTS "Anyone can submit responses to published forms" ON public.reponses_formulaires;
DROP POLICY IF EXISTS "Anyone can delete form responses" ON public.reponses_formulaires;

CREATE POLICY "Public can create valid custom forms"
ON public.formulaires_personnalises
FOR INSERT
WITH CHECK (
  char_length(titre) BETWEEN 1 AND 120
  AND char_length(description) <= 1000
  AND jsonb_typeof(champs) = 'array'
  AND jsonb_array_length(champs) BETWEEN 1 AND 30
  AND char_length(url_publique) <= 500
);

CREATE POLICY "Public can submit valid form responses"
ON public.reponses_formulaires
FOR INSERT
WITH CHECK (
  jsonb_typeof(reponses) = 'object'
  AND jsonb_typeof(fichiers) = 'object'
  AND octet_length(reponses::text) <= 2000000
  AND octet_length(fichiers::text) <= 12000000
  AND EXISTS (
    SELECT 1 FROM public.formulaires_personnalises f
    WHERE f.id = reponses_formulaires.formulaire_id
      AND f.publie = true
  )
);
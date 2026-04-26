CREATE OR REPLACE FUNCTION public.scm_get_employe_public(_employe_id uuid)
RETURNS TABLE (
  id uuid,
  nom_complet text,
  matricule text,
  genre text,
  poste text,
  telephone text,
  email text,
  adresse text,
  date_admission date,
  statut text,
  photo_profil text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nom_complet, matricule, genre, poste, telephone, email, adresse, date_admission, statut, photo_profil
  FROM public.employes
  WHERE id = _employe_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.scm_get_employe_public(uuid) TO anon, authenticated;
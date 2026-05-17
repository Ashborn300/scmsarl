UPDATE public.employes
SET photo_profil = REPLACE(photo_profil, 'cinbbxiopocvkolexmhd.supabase.co', 'gprvojlbybgmfufciqvu.supabase.co')
WHERE photo_profil LIKE '%cinbbxiopocvkolexmhd%';

UPDATE public.annonces
SET image_url = REPLACE(image_url, 'cinbbxiopocvkolexmhd.supabase.co', 'gprvojlbybgmfufciqvu.supabase.co')
WHERE image_url LIKE '%cinbbxiopocvkolexmhd%';

UPDATE public.chantiers
SET images_chantier = ARRAY(
  SELECT REPLACE(u, 'cinbbxiopocvkolexmhd.supabase.co', 'gprvojlbybgmfufciqvu.supabase.co')
  FROM unnest(images_chantier) AS u
)
WHERE EXISTS (
  SELECT 1 FROM unnest(images_chantier) AS u WHERE u LIKE '%cinbbxiopocvkolexmhd%'
);
ALTER TABLE public.archives_chantiers
ADD COLUMN IF NOT EXISTS images_chantier TEXT[] NOT NULL DEFAULT '{}';
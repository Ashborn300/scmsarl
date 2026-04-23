ALTER TABLE public.employes
ADD COLUMN IF NOT EXISTS genre text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS date_admission date,
ADD COLUMN IF NOT EXISTS date_naissance date,
ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS numero_piece_identite text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_urgence text NOT NULL DEFAULT '';
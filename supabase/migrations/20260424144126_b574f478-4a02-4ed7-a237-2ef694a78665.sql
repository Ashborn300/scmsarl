ALTER TABLE public.cartes_service ADD COLUMN IF NOT EXISTS pdf_base64 text NOT NULL DEFAULT '';
ALTER TABLE public.cartes_service ALTER COLUMN image_base64 DROP NOT NULL;
ALTER TABLE public.cartes_service ALTER COLUMN image_base64 SET DEFAULT '';
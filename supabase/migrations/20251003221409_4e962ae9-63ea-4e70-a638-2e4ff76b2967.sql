-- Add new fields to medicines table for packaging information
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS packaging text,
ADD COLUMN IF NOT EXISTS units_per_package integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS price_per_package numeric DEFAULT 0;

-- Update existing records to set price_per_package from unit_price
UPDATE public.medicines 
SET price_per_package = unit_price 
WHERE price_per_package = 0;
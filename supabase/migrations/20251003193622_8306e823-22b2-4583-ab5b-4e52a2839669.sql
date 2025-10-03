-- Add removal tracking fields to pets table
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS removal_reason TEXT,
ADD COLUMN IF NOT EXISTS removal_date DATE,
ADD COLUMN IF NOT EXISTS removed BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering removed pets
CREATE INDEX IF NOT EXISTS idx_pets_removed ON public.pets(removed);

-- Add comment
COMMENT ON COLUMN public.pets.removal_reason IS 'Reason for pet removal: Expired, Cured, or Returned to owner';
COMMENT ON COLUMN public.pets.removal_date IS 'Date when pet was removed';
COMMENT ON COLUMN public.pets.removed IS 'Whether the pet has been removed from active list';
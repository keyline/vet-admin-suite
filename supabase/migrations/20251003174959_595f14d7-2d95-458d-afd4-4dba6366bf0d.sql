-- Add max_pet_count column to cages table
ALTER TABLE public.cages 
ADD COLUMN max_pet_count INTEGER NOT NULL DEFAULT 1;

-- Add a check constraint to ensure max_pet_count is positive
ALTER TABLE public.cages 
ADD CONSTRAINT cages_max_pet_count_positive CHECK (max_pet_count > 0);

-- Add a function to get current pet count for a cage
CREATE OR REPLACE FUNCTION public.get_cage_current_pet_count(cage_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.admissions
  WHERE cage_id = cage_uuid
    AND status IN ('admitted', 'pending')
$$;

-- Add a function to check if cage is available based on max count
CREATE OR REPLACE FUNCTION public.is_cage_available(cage_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN c.status = 'available' THEN 
        COALESCE(get_cage_current_pet_count(cage_uuid), 0) < c.max_pet_count
      ELSE 
        FALSE
    END
  FROM public.cages c
  WHERE c.id = cage_uuid
$$;
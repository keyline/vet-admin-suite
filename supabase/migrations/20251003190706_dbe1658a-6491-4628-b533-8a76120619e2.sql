-- Add role_mapping column to staff_types table
ALTER TABLE public.staff_types 
ADD COLUMN role_mapping app_role;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.staff_types.role_mapping IS 'Maps staff type to app_role enum for permission management';

-- Insert default mappings for common staff types if they exist
-- This helps existing data work with the new system
UPDATE public.staff_types 
SET role_mapping = 'doctor'::app_role 
WHERE LOWER(name) LIKE '%doctor%' OR LOWER(name) LIKE '%veterinar%';

UPDATE public.staff_types 
SET role_mapping = 'receptionist'::app_role 
WHERE LOWER(name) LIKE '%receptionist%' OR LOWER(name) LIKE '%front%';

UPDATE public.staff_types 
SET role_mapping = 'store_keeper'::app_role 
WHERE LOWER(name) LIKE '%store%' OR LOWER(name) LIKE '%inventory%';

UPDATE public.staff_types 
SET role_mapping = 'accountant'::app_role 
WHERE LOWER(name) LIKE '%account%' OR LOWER(name) LIKE '%financ%';
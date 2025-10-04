-- Drop trigger first
DROP TRIGGER IF EXISTS sync_staff_role_trigger ON public.staff CASCADE;

-- Drop the sync_staff_role function
DROP FUNCTION IF EXISTS public.sync_staff_role() CASCADE;

-- Now remove staff_type_id column from staff table
ALTER TABLE public.staff DROP COLUMN IF EXISTS staff_type_id CASCADE;

-- Drop the staff_types table
DROP TABLE IF EXISTS public.staff_types CASCADE;

-- Remove staff_types from app_module enum by recreating it
-- First drop the has_permission function that depends on it
DROP FUNCTION IF EXISTS public.has_permission(uuid, app_module, permission_type) CASCADE;

-- Rename old enum
ALTER TYPE public.app_module RENAME TO app_module_old;

-- Create new enum without staff_types
CREATE TYPE public.app_module AS ENUM (
  'pets',
  'pet_owners', 
  'admissions',
  'doctor_visits',
  'inventory',
  'billing',
  'medicines',
  'buildings',
  'rooms',
  'cages',
  'staff',
  'treatments',
  'pet_types',
  'role_management'
);

-- Update role_permissions table to use new enum
ALTER TABLE public.role_permissions 
  ALTER COLUMN module TYPE public.app_module 
  USING module::text::public.app_module;

-- Drop old enum
DROP TYPE public.app_module_old CASCADE;

-- Recreate has_permission function with new enum
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module app_module, _permission permission_type)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.module = _module
      AND rp.permission = _permission
  ) OR is_admin(_user_id)
$$;
-- Create a function to assign default staff role to new users
CREATE OR REPLACE FUNCTION public.assign_default_staff_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user already has any roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  ) THEN
    -- Assign default 'staff' role to new users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'staff')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign default staff role after profile creation
DROP TRIGGER IF EXISTS assign_default_staff_role_trigger ON public.profiles;
CREATE TRIGGER assign_default_staff_role_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_staff_role();

-- Update the sync_staff_role function to only sync if staff_type has role_mapping
-- This ensures manual role assignment through role management is preserved
CREATE OR REPLACE FUNCTION public.sync_staff_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_role app_role;
  old_role app_role;
BEGIN
  -- Get the role_mapping from the staff_types table for the new staff_type_id
  IF NEW.user_id IS NOT NULL AND NEW.staff_type_id IS NOT NULL THEN
    SELECT role_mapping INTO staff_role
    FROM public.staff_types
    WHERE id = NEW.staff_type_id;
    
    -- If updating, get the old role_mapping
    IF TG_OP = 'UPDATE' AND OLD.staff_type_id IS NOT NULL AND OLD.staff_type_id != NEW.staff_type_id THEN
      SELECT role_mapping INTO old_role
      FROM public.staff_types
      WHERE id = OLD.staff_type_id;
      
      -- Remove old role if it exists and is different, but keep staff as minimum
      IF old_role IS NOT NULL AND old_role != 'staff' THEN
        DELETE FROM public.user_roles
        WHERE user_id = NEW.user_id AND role = old_role;
      END IF;
    END IF;
    
    -- Insert new role if role_mapping exists and not already present
    -- But don't override if user already has admin/superadmin role
    IF staff_role IS NOT NULL THEN
      -- Only sync role if it's not trying to assign admin/superadmin
      -- Admin roles must be assigned manually through role management
      IF staff_role NOT IN ('admin', 'superadmin') THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, staff_role)
        ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
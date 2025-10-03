-- Function to sync staff type role_mapping to user_roles
CREATE OR REPLACE FUNCTION public.sync_staff_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      
      -- Remove old role if it exists and is different
      IF old_role IS NOT NULL THEN
        DELETE FROM public.user_roles
        WHERE user_id = NEW.user_id AND role = old_role;
      END IF;
    END IF;
    
    -- Insert new role if role_mapping exists and not already present
    IF staff_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, staff_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for staff table
DROP TRIGGER IF EXISTS sync_staff_role_trigger ON public.staff;
CREATE TRIGGER sync_staff_role_trigger
AFTER INSERT OR UPDATE OF user_id, staff_type_id ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.sync_staff_role();

-- Backfill existing staff members with role mappings
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.user_id, st.role_mapping
FROM public.staff s
JOIN public.staff_types st ON s.staff_type_id = st.id
WHERE s.user_id IS NOT NULL 
  AND st.role_mapping IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
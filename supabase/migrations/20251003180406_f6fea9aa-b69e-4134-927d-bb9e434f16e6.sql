-- Create enum for modules
CREATE TYPE public.app_module AS ENUM (
  'pets',
  'owners',
  'admissions',
  'medicines',
  'treatments',
  'staff',
  'buildings',
  'rooms',
  'cages',
  'pet_types',
  'staff_types',
  'billing',
  'donations',
  'purchase_orders',
  'doctor_visits'
);

-- Create enum for permissions
CREATE TYPE public.permission_type AS ENUM (
  'view',
  'add',
  'edit',
  'delete'
);

-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module app_module NOT NULL,
  permission permission_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, module, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins and superadmins can manage role permissions
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions
  FOR ALL
  USING (is_admin(auth.uid()));

-- Everyone can view their own role permissions
CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _module app_module,
  _permission permission_type
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
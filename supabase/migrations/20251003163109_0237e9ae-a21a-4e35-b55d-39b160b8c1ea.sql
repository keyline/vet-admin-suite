-- Bootstrap function to assign first signed-in user as superadmin
CREATE OR REPLACE FUNCTION public.ensure_first_superadmin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no roles exist yet, promote the caller to superadmin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'superadmin');
  END IF;
END;
$$;
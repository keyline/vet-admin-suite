-- Fix race condition in stock updates with atomic increment function
CREATE OR REPLACE FUNCTION public.increment_medicine_stock(
  medicine_id UUID,
  quantity_to_add INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE medicines
  SET stock_quantity = stock_quantity + quantity_to_add
  WHERE id = medicine_id;
$$;

-- Add INSERT policy for audit logs so they can be created
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add comment documenting immutability requirement
COMMENT ON TABLE public.audit_logs IS 'Audit logs are immutable. No UPDATE or DELETE policies should ever be added to maintain audit trail integrity.';
-- Fix search_path for generate_donation_number function
CREATE OR REPLACE FUNCTION public.generate_donation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(donation_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.donations
  WHERE donation_number LIKE 'DON-' || year_part || '%';
  
  RETURN 'DON-' || year_part || '-' || LPAD(next_number::TEXT, 5, '0');
END;
$$;
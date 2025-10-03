-- Add donation_number column to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS donation_number TEXT UNIQUE;

-- Add donor_id to link donations to pet owners (optional, can be null for anonymous donations)
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES public.pet_owners(id) ON DELETE SET NULL;

-- Create function to generate donation numbers
CREATE OR REPLACE FUNCTION public.generate_donation_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Set default value for donation_number column
ALTER TABLE public.donations 
ALTER COLUMN donation_number SET DEFAULT generate_donation_number();

-- Update existing records to have donation numbers (if any exist)
UPDATE public.donations 
SET donation_number = generate_donation_number() 
WHERE donation_number IS NULL;

-- Make donation_number NOT NULL after populating existing records
ALTER TABLE public.donations 
ALTER COLUMN donation_number SET NOT NULL;
-- Create function to generate pet tag numbers
CREATE OR REPLACE FUNCTION public.generate_pet_tag_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  base_number INTEGER := 27680;
BEGIN
  -- Get the highest tag number and increment
  SELECT COALESCE(
    MAX(CAST(microchip_id AS INTEGER)),
    base_number - 1
  ) + 1
  INTO next_number
  FROM public.pets
  WHERE microchip_id ~ '^[0-9]+$';
  
  -- Ensure we don't go below the base number
  IF next_number < base_number THEN
    next_number := base_number;
  END IF;
  
  RETURN next_number::TEXT;
END;
$function$;

-- Add default value for microchip_id in pets table
ALTER TABLE public.pets 
ALTER COLUMN microchip_id SET DEFAULT generate_pet_tag_number();
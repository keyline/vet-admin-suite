-- Create pet_types table
CREATE TABLE public.pet_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pet types"
ON public.pet_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and receptionists can manage pet types"
ON public.pet_types
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_pet_types_updated_at
BEFORE UPDATE ON public.pet_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
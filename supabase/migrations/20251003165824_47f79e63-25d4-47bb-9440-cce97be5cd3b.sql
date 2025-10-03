-- Create staff_types table
CREATE TABLE public.staff_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staff_types ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_types
CREATE POLICY "Authenticated users can view staff types"
ON public.staff_types
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage staff types"
ON public.staff_types
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_staff_types_updated_at
BEFORE UPDATE ON public.staff_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add staff_type_id column to staff table
ALTER TABLE public.staff ADD COLUMN staff_type_id UUID REFERENCES public.staff_types(id);

-- Insert some default staff types
INSERT INTO public.staff_types (name, description) VALUES
  ('Doctor', 'Licensed veterinary doctor'),
  ('Nurse', 'Veterinary nurse or technician'),
  ('Care Giver', 'Animal care specialist'),
  ('Receptionist', 'Front desk and administrative staff'),
  ('Store Keeper', 'Inventory and supplies management'),
  ('Accountant', 'Financial and billing management');
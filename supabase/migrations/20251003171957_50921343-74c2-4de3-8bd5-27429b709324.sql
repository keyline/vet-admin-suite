-- Add default value for admission_number using the generate_admission_number function
ALTER TABLE public.admissions 
ALTER COLUMN admission_number SET DEFAULT public.generate_admission_number();
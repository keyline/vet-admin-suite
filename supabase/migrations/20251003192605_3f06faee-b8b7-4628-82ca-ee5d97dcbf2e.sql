-- Add doctor_id column to admissions table to track assigned doctor
ALTER TABLE public.admissions 
ADD COLUMN doctor_id UUID REFERENCES public.staff(id);

-- Add index for better query performance
CREATE INDEX idx_admissions_doctor_id ON public.admissions(doctor_id);

-- Add comment
COMMENT ON COLUMN public.admissions.doctor_id IS 'Reference to the staff member (doctor) assigned to this admission';
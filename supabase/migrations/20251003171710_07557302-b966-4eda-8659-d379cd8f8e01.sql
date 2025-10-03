-- Add additional fields to admissions table for the admission form
ALTER TABLE public.admissions 
ADD COLUMN IF NOT EXISTS brought_by TEXT,
ADD COLUMN IF NOT EXISTS xray_date DATE,
ADD COLUMN IF NOT EXISTS operation_date DATE,
ADD COLUMN IF NOT EXISTS antibiotics_schedule JSONB,
ADD COLUMN IF NOT EXISTS blood_test_report TEXT,
ADD COLUMN IF NOT EXISTS payment_received NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.admissions.brought_by IS 'Person who brought the animal to shelter';
COMMENT ON COLUMN public.admissions.xray_date IS 'Date when X-ray was conducted';
COMMENT ON COLUMN public.admissions.operation_date IS 'Date when operation was conducted';
COMMENT ON COLUMN public.admissions.antibiotics_schedule IS 'Day-wise antibiotic administration schedule';
COMMENT ON COLUMN public.admissions.blood_test_report IS 'Blood test report details';
COMMENT ON COLUMN public.admissions.payment_received IS 'Payment amount received during admission';
-- Fix RLS policies for pet_types
DROP POLICY IF EXISTS "Admins and receptionists can manage pet types" ON public.pet_types;

CREATE POLICY "Admins and receptionists can manage pet types"
ON public.pet_types
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role));

-- Fix RLS policies for pet_owners
DROP POLICY IF EXISTS "Admins and receptionists can manage owners" ON public.pet_owners;

CREATE POLICY "Admins and receptionists can manage owners"
ON public.pet_owners
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role));

-- Fix RLS policies for buildings
DROP POLICY IF EXISTS "Admins and receptionists can manage buildings" ON public.buildings;

CREATE POLICY "Admins and receptionists can manage buildings"
ON public.buildings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role));

-- Fix RLS policies for rooms
DROP POLICY IF EXISTS "Admins and receptionists can manage rooms" ON public.rooms;

CREATE POLICY "Admins and receptionists can manage rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role));

-- Fix RLS policies for cages
DROP POLICY IF EXISTS "Admins and receptionists can manage cages" ON public.cages;

CREATE POLICY "Admins and receptionists can manage cages"
ON public.cages
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role));

-- Fix RLS policies for staff
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;

CREATE POLICY "Admins can manage staff"
ON public.staff
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix RLS policies for treatments
DROP POLICY IF EXISTS "Admins and doctors can manage treatments" ON public.treatments;

CREATE POLICY "Admins and doctors can manage treatments"
ON public.treatments
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'doctor'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'doctor'::app_role));

-- Fix RLS policies for medicines
DROP POLICY IF EXISTS "Admins, doctors and storekeepers can manage medicines" ON public.medicines;

CREATE POLICY "Admins, doctors and storekeepers can manage medicines"
ON public.medicines
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'store_keeper'::app_role) OR has_role(auth.uid(), 'doctor'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'store_keeper'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

-- Fix RLS policies for pets
DROP POLICY IF EXISTS "Admins, doctors and receptionists can manage pets" ON public.pets;

CREATE POLICY "Admins, doctors and receptionists can manage pets"
ON public.pets
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'doctor'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));
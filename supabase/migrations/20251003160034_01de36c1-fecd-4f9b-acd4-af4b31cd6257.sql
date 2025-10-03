-- Create enum types
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'doctor', 'receptionist', 'store_keeper', 'accountant');
CREATE TYPE public.admission_status AS ENUM ('pending', 'admitted', 'discharged', 'deceased');
CREATE TYPE public.cage_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE public.allotment_status AS ENUM ('pending', 'issued', 'returned', 'consumed');
CREATE TYPE public.po_status AS ENUM ('draft', 'submitted', 'approved', 'received', 'cancelled');
CREATE TYPE public.bill_status AS ENUM ('draft', 'pending', 'paid', 'cancelled');

-- User roles table (security definer pattern)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'admin')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Superadmins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Buildings table
CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view buildings"
ON public.buildings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and receptionists can manage buildings"
ON public.buildings FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Rooms table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    floor INTEGER,
    description TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and receptionists can manage rooms"
ON public.rooms FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Cages table
CREATE TABLE public.cages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    cage_number TEXT NOT NULL,
    size TEXT,
    status cage_status DEFAULT 'available' NOT NULL,
    notes TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (room_id, cage_number)
);

ALTER TABLE public.cages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cages"
ON public.cages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and receptionists can manage cages"
ON public.cages FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Staff table
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    license_number TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff"
ON public.staff FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage staff"
ON public.staff FOR ALL
USING (public.is_admin(auth.uid()));

-- Pet owners table
CREATE TABLE public.pet_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pet_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view owners"
ON public.pet_owners FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and receptionists can manage owners"
ON public.pet_owners FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Pets table
CREATE TABLE public.pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.pet_owners(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age INTEGER,
    gender TEXT,
    color TEXT,
    weight DECIMAL(10, 2),
    microchip_id TEXT,
    photo_url TEXT,
    medical_notes TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pets"
ON public.pets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins, doctors and receptionists can manage pets"
ON public.pets FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'doctor')
);

-- Medicines table
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    generic_name TEXT,
    category TEXT,
    unit TEXT NOT NULL,
    reorder_level INTEGER DEFAULT 10 NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    expiry_date DATE,
    manufacturer TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view medicines"
ON public.medicines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins, doctors and storekeepers can manage medicines"
ON public.medicines FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'store_keeper') OR
  public.has_role(auth.uid(), 'doctor')
);

-- Treatments table
CREATE TABLE public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_cost DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view treatments"
ON public.treatments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and doctors can manage treatments"
ON public.treatments FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'doctor')
);

-- Admissions table
CREATE TABLE public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number TEXT NOT NULL UNIQUE,
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
    cage_id UUID REFERENCES public.cages(id) ON DELETE SET NULL,
    admitted_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    admission_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    discharge_date TIMESTAMP WITH TIME ZONE,
    status admission_status DEFAULT 'pending' NOT NULL,
    reason TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admissions"
ON public.admissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins, doctors and receptionists can manage admissions"
ON public.admissions FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'doctor')
);

-- Doctor visits table
CREATE TABLE public.doctor_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.staff(id) ON DELETE SET NULL NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    vitals JSONB,
    observations TEXT,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.doctor_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visits"
ON public.doctor_visits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors can manage their visits"
ON public.doctor_visits FOR ALL
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can manage all visits"
ON public.doctor_visits FOR ALL
USING (public.is_admin(auth.uid()));

-- Prescriptions table
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.doctor_visits(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors can manage prescriptions"
ON public.prescriptions FOR ALL
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can manage all prescriptions"
ON public.prescriptions FOR ALL
USING (public.is_admin(auth.uid()));

-- Medicine allotments table
CREATE TABLE public.medicine_allotments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    quantity_issued INTEGER NOT NULL,
    quantity_returned INTEGER DEFAULT 0,
    issued_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    status allotment_status DEFAULT 'pending' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.medicine_allotments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view allotments"
ON public.medicine_allotments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Storekeepers can manage allotments"
ON public.medicine_allotments FOR ALL
USING (public.has_role(auth.uid(), 'store_keeper'));

CREATE POLICY "Admins can manage all allotments"
ON public.medicine_allotments FOR ALL
USING (public.is_admin(auth.uid()));

-- Donations table
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name TEXT NOT NULL,
    donor_email TEXT,
    donor_phone TEXT,
    donation_date DATE DEFAULT CURRENT_DATE NOT NULL,
    total_value DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view donations"
ON public.donations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and accountants can manage donations"
ON public.donations FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'accountant')
);

-- Donated stock table
CREATE TABLE public.donated_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    unit_value DECIMAL(10, 2) DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.donated_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view donated stock"
ON public.donated_stock FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can manage donated stock"
ON public.donated_stock FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'store_keeper')
);

-- Purchase orders table
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    vendor_name TEXT NOT NULL,
    vendor_contact TEXT,
    order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    expected_delivery DATE,
    status po_status DEFAULT 'draft' NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchase orders"
ON public.purchase_orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can manage purchase orders"
ON public.purchase_orders FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'store_keeper')
);

-- PO items table
CREATE TABLE public.po_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PO items"
ON public.po_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can manage PO items"
ON public.po_items FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'store_keeper')
);

-- Billing table
CREATE TABLE public.billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    status bill_status DEFAULT 'draft' NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bills"
ON public.billing FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins, accountants and receptionists can manage bills"
ON public.billing FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'accountant') OR
  public.has_role(auth.uid(), 'receptionist')
);

-- Bill items table
CREATE TABLE public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.billing(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bill items"
ON public.bill_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins, accountants and receptionists can manage bill items"
ON public.bill_items FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'accountant') OR
  public.has_role(auth.uid(), 'receptionist')
);

-- Audit log table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin(auth.uid()));

-- Function to auto-generate admission numbers
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(admission_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.admissions
  WHERE admission_number LIKE 'ADM-' || year_part || '%';
  
  RETURN 'ADM-' || year_part || '-' || LPAD(next_number::TEXT, 5, '0');
END;
$$;

-- Function to auto-generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 7) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.purchase_orders
  WHERE po_number LIKE 'PO-' || year_part || '%';
  
  RETURN 'PO-' || year_part || '-' || LPAD(next_number::TEXT, 5, '0');
END;
$$;

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.billing
  WHERE invoice_number LIKE 'INV-' || year_part || '%';
  
  RETURN 'INV-' || year_part || '-' || LPAD(next_number::TEXT, 5, '0');
END;
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cages_updated_at BEFORE UPDATE ON public.cages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_owners_updated_at BEFORE UPDATE ON public.pet_owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_visits_updated_at BEFORE UPDATE ON public.doctor_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_allotments_updated_at BEFORE UPDATE ON public.medicine_allotments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON public.billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
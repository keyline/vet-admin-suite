export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          admission_date: string
          admission_number: string
          admitted_by: string | null
          cage_id: string | null
          created_at: string
          diagnosis: string | null
          discharge_date: string | null
          id: string
          notes: string | null
          pet_id: string
          reason: string
          status: Database["public"]["Enums"]["admission_status"]
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          admission_date?: string
          admission_number: string
          admitted_by?: string | null
          cage_id?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_date?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          reason: string
          status?: Database["public"]["Enums"]["admission_status"]
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          admission_date?: string
          admission_number?: string
          admitted_by?: string | null
          cage_id?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_date?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          reason?: string
          status?: Database["public"]["Enums"]["admission_status"]
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_admitted_by_fkey"
            columns: ["admitted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_cage_id_fkey"
            columns: ["cage_id"]
            isOneToOne: false
            referencedRelation: "cages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bill_items: {
        Row: {
          bill_id: string
          created_at: string
          description: string
          id: string
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          description: string
          id?: string
          quantity?: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "billing"
            referencedColumns: ["id"]
          },
        ]
      }
      billing: {
        Row: {
          admission_id: string
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number
          status: Database["public"]["Enums"]["bill_status"]
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          admission_id: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          admission_id?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cages: {
        Row: {
          active: boolean
          cage_number: string
          created_at: string
          id: string
          notes: string | null
          room_id: string
          size: string | null
          status: Database["public"]["Enums"]["cage_status"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          cage_number: string
          created_at?: string
          id?: string
          notes?: string | null
          room_id: string
          size?: string | null
          status?: Database["public"]["Enums"]["cage_status"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          cage_number?: string
          created_at?: string
          id?: string
          notes?: string | null
          room_id?: string
          size?: string | null
          status?: Database["public"]["Enums"]["cage_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_visits: {
        Row: {
          admission_id: string
          created_at: string
          diagnosis: string | null
          doctor_id: string
          id: string
          notes: string | null
          observations: string | null
          updated_at: string
          visit_date: string
          vitals: Json | null
        }
        Insert: {
          admission_id: string
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          id?: string
          notes?: string | null
          observations?: string | null
          updated_at?: string
          visit_date?: string
          vitals?: Json | null
        }
        Update: {
          admission_id?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          observations?: string | null
          updated_at?: string
          visit_date?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_visits_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      donated_stock: {
        Row: {
          created_at: string
          donation_id: string
          expiry_date: string | null
          id: string
          medicine_id: string
          quantity: number
          unit_value: number | null
        }
        Insert: {
          created_at?: string
          donation_id: string
          expiry_date?: string | null
          id?: string
          medicine_id: string
          quantity: number
          unit_value?: number | null
        }
        Update: {
          created_at?: string
          donation_id?: string
          expiry_date?: string | null
          id?: string
          medicine_id?: string
          quantity?: number
          unit_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "donated_stock_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donated_stock_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          created_at: string
          donation_date: string
          donor_email: string | null
          donor_name: string
          donor_phone: string | null
          id: string
          notes: string | null
          total_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          donation_date?: string
          donor_email?: string | null
          donor_name: string
          donor_phone?: string | null
          id?: string
          notes?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          donation_date?: string
          donor_email?: string | null
          donor_name?: string
          donor_phone?: string | null
          id?: string
          notes?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      medicine_allotments: {
        Row: {
          created_at: string
          id: string
          issued_by: string | null
          issued_date: string
          medicine_id: string
          notes: string | null
          prescription_id: string
          quantity_issued: number
          quantity_returned: number | null
          status: Database["public"]["Enums"]["allotment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          medicine_id: string
          notes?: string | null
          prescription_id: string
          quantity_issued: number
          quantity_returned?: number | null
          status?: Database["public"]["Enums"]["allotment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          medicine_id?: string
          notes?: string | null
          prescription_id?: string
          quantity_issued?: number
          quantity_returned?: number | null
          status?: Database["public"]["Enums"]["allotment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_allotments_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_allotments_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_allotments_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          expiry_date: string | null
          generic_name: string | null
          id: string
          manufacturer: string | null
          name: string
          notes: string | null
          reorder_level: number
          stock_quantity: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          notes?: string | null
          reorder_level?: number
          stock_quantity?: number
          unit: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          notes?: string | null
          reorder_level?: number
          stock_quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_owners: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pet_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          active: boolean
          age: number | null
          breed: string | null
          color: string | null
          created_at: string
          gender: string | null
          id: string
          medical_notes: string | null
          microchip_id: string | null
          name: string
          owner_id: string
          photo_url: string | null
          species: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          active?: boolean
          age?: number | null
          breed?: string | null
          color?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          medical_notes?: string | null
          microchip_id?: string | null
          name: string
          owner_id: string
          photo_url?: string | null
          species: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          active?: boolean
          age?: number | null
          breed?: string | null
          color?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          medical_notes?: string | null
          microchip_id?: string | null
          name?: string
          owner_id?: string
          photo_url?: string | null
          species?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pet_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      po_items: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          po_id: string
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          po_id: string
          quantity: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          po_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medicine_id: string
          quantity: number
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medicine_id: string
          quantity: number
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medicine_id?: string
          quantity?: number
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "doctor_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: Database["public"]["Enums"]["po_status"]
          total_amount: number | null
          updated_at: string
          vendor_contact: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: Database["public"]["Enums"]["po_status"]
          total_amount?: number | null
          updated_at?: string
          vendor_contact?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"]
          total_amount?: number | null
          updated_at?: string
          vendor_contact?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          building_id: string
          created_at: string
          description: string | null
          floor: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          building_id: string
          created_at?: string
          description?: string | null
          floor?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          building_id?: string
          created_at?: string
          description?: string | null
          floor?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          license_number: string | null
          name: string
          phone: string | null
          specialization: string | null
          staff_type_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          name: string
          phone?: string | null
          specialization?: string | null
          staff_type_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          specialization?: string | null
          staff_type_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_staff_type_id_fkey"
            columns: ["staff_type_id"]
            isOneToOne: false
            referencedRelation: "staff_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      treatments: {
        Row: {
          active: boolean
          base_cost: number
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_cost?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_cost?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_first_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_admission_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admission_status: "pending" | "admitted" | "discharged" | "deceased"
      allotment_status: "pending" | "issued" | "returned" | "consumed"
      app_role:
        | "superadmin"
        | "admin"
        | "doctor"
        | "receptionist"
        | "store_keeper"
        | "accountant"
      bill_status: "draft" | "pending" | "paid" | "cancelled"
      cage_status: "available" | "occupied" | "maintenance" | "reserved"
      po_status: "draft" | "submitted" | "approved" | "received" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admission_status: ["pending", "admitted", "discharged", "deceased"],
      allotment_status: ["pending", "issued", "returned", "consumed"],
      app_role: [
        "superadmin",
        "admin",
        "doctor",
        "receptionist",
        "store_keeper",
        "accountant",
      ],
      bill_status: ["draft", "pending", "paid", "cancelled"],
      cage_status: ["available", "occupied", "maintenance", "reserved"],
      po_status: ["draft", "submitted", "approved", "received", "cancelled"],
    },
  },
} as const

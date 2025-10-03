import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppModule = 
  | "pets" 
  | "pet_owners" 
  | "admissions" 
  | "doctor_visits" 
  | "inventory" 
  | "billing"
  | "medicines"
  | "buildings"
  | "rooms"
  | "cages"
  | "staff"
  | "staff_types"
  | "treatments"
  | "pet_types"
  | "role_management";

type PermissionType = "view" | "add" | "edit" | "delete";

export function usePermissions() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Map<string, Set<PermissionType>>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin or superadmin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const adminRole = roles?.some(r => r.role === 'admin' || r.role === 'superadmin');
        setIsAdmin(!!adminRole);

        if (adminRole) {
          // Admins have all permissions
          setLoading(false);
          return;
        }

        // Fetch role permissions
        const { data: rolePermissions } = await supabase
          .from('role_permissions')
          .select('module, permission')
          .in('role', roles?.map(r => r.role) || []);

        const permMap = new Map<string, Set<PermissionType>>();
        rolePermissions?.forEach((p) => {
          if (!permMap.has(p.module)) {
            permMap.set(p.module, new Set());
          }
          permMap.get(p.module)?.add(p.permission as PermissionType);
        });

        setPermissions(permMap);
      } catch (error) {
        console.error('[usePermissions] Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (module: AppModule, permission: PermissionType): boolean => {
    if (isAdmin) return true;
    return permissions.get(module)?.has(permission) || false;
  };

  const canView = (module: AppModule) => hasPermission(module, 'view');
  const canAdd = (module: AppModule) => hasPermission(module, 'add');
  const canEdit = (module: AppModule) => hasPermission(module, 'edit');
  const canDelete = (module: AppModule) => hasPermission(module, 'delete');

  return {
    hasPermission,
    canView,
    canAdd,
    canEdit,
    canDelete,
    isAdmin,
    loading,
  };
}

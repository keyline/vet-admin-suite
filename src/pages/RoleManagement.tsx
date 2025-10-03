import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

type AppRole = "admin" | "doctor" | "receptionist" | "store_keeper" | "accountant";
type AppModule = "pets" | "owners" | "admissions" | "medicines" | "treatments" | "staff" | 
  "buildings" | "rooms" | "cages" | "pet_types" | "staff_types" | "billing" | 
  "donations" | "purchase_orders" | "doctor_visits";
type PermissionType = "view" | "add" | "edit" | "delete";

const MODULES: { id: AppModule; label: string }[] = [
  { id: "pets", label: "Pets" },
  { id: "owners", label: "Pet Owners" },
  { id: "admissions", label: "Admissions" },
  { id: "medicines", label: "Medicines" },
  { id: "treatments", label: "Treatments" },
  { id: "staff", label: "Staff" },
  { id: "buildings", label: "Buildings" },
  { id: "rooms", label: "Rooms" },
  { id: "cages", label: "Cages" },
  { id: "pet_types", label: "Pet Types" },
  { id: "staff_types", label: "Staff Types" },
  { id: "billing", label: "Billing" },
  { id: "donations", label: "Donations" },
  { id: "purchase_orders", label: "Purchase Orders" },
  { id: "doctor_visits", label: "Doctor Visits" },
];

const PERMISSIONS: { id: PermissionType; label: string }[] = [
  { id: "view", label: "View" },
  { id: "add", label: "Add" },
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete" },
];

const ROLES: { id: AppRole; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "doctor", label: "Doctor" },
  { id: "receptionist", label: "Receptionist" },
  { id: "store_keeper", label: "Store Keeper" },
  { id: "accountant", label: "Accountant" },
];

export default function RoleManagement() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole>(ROLES[0].id);

  // Fetch permissions for selected role
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["role-permissions", selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role", selectedRole);

      if (error) throw error;
      return data || [];
    },
  });

  // Create permission map for easy lookup
  const hasPermission = (module: string, permission: string) => {
    return permissions?.some(
      (p) => p.module === module && p.permission === permission
    );
  };

  // Mutation to update permissions
  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      module,
      permission,
      enabled,
    }: {
      module: AppModule;
      permission: PermissionType;
      enabled: boolean;
    }) => {
      if (enabled) {
        // Add permission
        const { error } = await supabase.from("role_permissions").insert([
          {
            role: selectedRole as any,
            module: module as any,
            permission: permission as any,
          },
        ]);
        if (error) throw error;
      } else {
        // Remove permission
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", selectedRole as any)
          .eq("module", module as any)
          .eq("permission", permission as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", selectedRole] });
      toast.success("Permission updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating permission:", error);
      toast.error(error.message || "Failed to update permission");
    },
  });

  const handlePermissionChange = (
    module: AppModule,
    permission: PermissionType,
    enabled: boolean
  ) => {
    updatePermissionMutation.mutate({ module, permission, enabled });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Role Management
            </h1>
            <p className="text-muted-foreground">
              Configure permissions for different roles
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Role</CardTitle>
            <CardDescription>Choose a role to manage its permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <Button
                  key={role.id}
                  variant={selectedRole === role.id ? "default" : "outline"}
                  onClick={() => setSelectedRole(role.id)}
                >
                  {role.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Permissions for {ROLES.find((r) => r.id === selectedRole)?.label}
            </CardTitle>
            <CardDescription>
              Check or uncheck to grant or revoke permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading permissions...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Module</th>
                      {PERMISSIONS.map((perm) => (
                        <th key={perm.id} className="text-center py-3 px-4 font-semibold">
                          {perm.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((module) => (
                      <tr key={module.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{module.label}</td>
                        {PERMISSIONS.map((perm) => (
                          <td key={perm.id} className="text-center py-3 px-4">
                            <Checkbox
                              checked={hasPermission(module.id, perm.id)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  module.id,
                                  perm.id,
                                  checked as boolean
                                )
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

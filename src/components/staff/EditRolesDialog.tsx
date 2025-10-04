import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "superadmin" | "admin" | "doctor" | "receptionist" | "store_keeper" | "accountant" | "staff";

interface StaffMember {
  id: string;
  name: string;
  user_id: string;
  roles?: AppRole[];
}

interface EditRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess: () => void;
}

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "superadmin", label: "Super Admin", description: "Full system access and control" },
  { value: "admin", label: "Admin", description: "Administrative privileges" },
  { value: "doctor", label: "Doctor", description: "Medical staff with patient access" },
  { value: "receptionist", label: "Receptionist", description: "Front desk and admission management" },
  { value: "store_keeper", label: "Store Keeper", description: "Inventory and medicine management" },
  { value: "accountant", label: "Accountant", description: "Financial and billing access" },
  { value: "staff", label: "Staff", description: "Basic staff access" },
];

export function EditRolesDialog({ open, onOpenChange, staff, onSuccess }: EditRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(new Set());

  // Fetch current roles when dialog opens
  const { data: currentRoles, isLoading } = useQuery({
    queryKey: ["user-roles", staff.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", staff.user_id);

      if (error) throw error;
      return data.map((r) => r.role as AppRole);
    },
    enabled: open && !!staff.user_id,
  });

  useEffect(() => {
    if (currentRoles) {
      setSelectedRoles(new Set(currentRoles));
    }
  }, [currentRoles]);

  const updateRolesMutation = useMutation({
    mutationFn: async (roles: AppRole[]) => {
      if (!staff.user_id) {
        throw new Error("Staff member has no user account");
      }

      // Delete all existing roles
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", staff.user_id);

      if (deleteError) throw deleteError;

      // Insert new roles if any selected
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(roles.map((role) => ({ user_id: staff.user_id, role })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success("Roles updated successfully");
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error updating roles:", error);
      toast.error(error.message || "Failed to update roles");
    },
  });

  const handleRoleToggle = (role: AppRole) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setSelectedRoles(newRoles);
  };

  const handleSave = () => {
    updateRolesMutation.mutate(Array.from(selectedRoles));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Roles for {staff.name}</DialogTitle>
          <DialogDescription>
            Select the roles you want to assign to this staff member. Multiple roles can be assigned.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading current roles...</div>
        ) : (
          <div className="space-y-4 py-4">
            {AVAILABLE_ROLES.map((role) => (
              <div
                key={role.value}
                className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50"
              >
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.has(role.value)}
                  onCheckedChange={() => handleRoleToggle(role.value)}
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={role.value}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {role.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateRolesMutation.isPending || isLoading}>
            {updateRolesMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

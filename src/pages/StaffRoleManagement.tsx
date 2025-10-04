import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCog, Search } from "lucide-react";
import { EditRolesDialog } from "@/components/staff/EditRolesDialog";

type AppRole = "superadmin" | "admin" | "doctor" | "receptionist" | "store_keeper" | "accountant" | "staff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  user_id: string;
  active: boolean;
  roles?: AppRole[];
}

const ROLE_COLORS: Record<AppRole, string> = {
  superadmin: "destructive",
  admin: "default",
  doctor: "secondary",
  receptionist: "outline",
  store_keeper: "outline",
  accountant: "outline",
  staff: "outline",
};

export default function StaffRoleManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");

  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["staff-with-roles"],
    queryFn: async () => {
      // Fetch all staff members
      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select("id, name, email, user_id, active")
        .order("name");

      if (staffError) throw staffError;

      // Fetch roles for each staff member
      const staffWithRoles = await Promise.all(
        staff.map(async (member) => {
          if (!member.user_id) return { ...member, roles: [] };

          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", member.user_id);

          return {
            ...member,
            roles: roles?.map((r) => r.role as AppRole) || [],
          };
        })
      );

      return staffWithRoles as StaffMember[];
    },
  });

  const handleEditRoles = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditDialogOpen(true);
  };

  const handleRolesUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["staff-with-roles"] });
    setEditDialogOpen(false);
    setSelectedStaff(null);
  };

  const filteredStaff = staffMembers?.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterRole === "all") return matchesSearch;
    if (filterRole === "no-role") return matchesSearch && (!member.roles || member.roles.length === 0);
    return matchesSearch && member.roles?.includes(filterRole as AppRole);
  });

  const getRoleCount = (role: string) => {
    if (role === "all") return staffMembers?.length || 0;
    if (role === "no-role") return staffMembers?.filter(m => !m.roles || m.roles.length === 0).length || 0;
    return staffMembers?.filter(m => m.roles?.includes(role as AppRole)).length || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCog className="h-8 w-8" />
              Staff Role Management
            </h1>
            <p className="text-muted-foreground">
              Assign and manage roles for staff members
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              View and manage which roles are assigned to each staff member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={filterRole} onValueChange={setFilterRole}>
                <TabsList>
                  <TabsTrigger value="all">All ({getRoleCount("all")})</TabsTrigger>
                  <TabsTrigger value="admin">Admins ({getRoleCount("admin")})</TabsTrigger>
                  <TabsTrigger value="doctor">Doctors ({getRoleCount("doctor")})</TabsTrigger>
                  <TabsTrigger value="receptionist">Receptionists ({getRoleCount("receptionist")})</TabsTrigger>
                  <TabsTrigger value="store_keeper">Store Keepers ({getRoleCount("store_keeper")})</TabsTrigger>
                  <TabsTrigger value="accountant">Accountants ({getRoleCount("accountant")})</TabsTrigger>
                  <TabsTrigger value="no-role">No Role ({getRoleCount("no-role")})</TabsTrigger>
                </TabsList>

                <TabsContent value={filterRole} className="mt-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading staff members...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff?.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>{member.email || "-"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {member.roles && member.roles.length > 0 ? (
                                  member.roles.map((role) => (
                                    <Badge
                                      key={role}
                                      variant={ROLE_COLORS[role] as any}
                                      className="capitalize"
                                    >
                                      {role.replace("_", " ")}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No roles assigned</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.active ? "default" : "secondary"}>
                                {member.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRoles(member)}
                                disabled={!member.user_id}
                              >
                                Edit Roles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!filteredStaff?.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No staff members found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {selectedStaff && (
          <EditRolesDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            staff={selectedStaff}
            onSuccess={handleRolesUpdated}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

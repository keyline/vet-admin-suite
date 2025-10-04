import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Key } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffDialog } from "@/components/masters/StaffDialog";
import { CreateStaffPasswordDialog } from "@/components/staff/CreateStaffPasswordDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Staff = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [staffForAuth, setStaffForAuth] = useState<{ id: string; email: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const queryClient = useQueryClient();
  const { canAdd, canEdit, canDelete, isAdmin } = usePermissions();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select(`
          *,
          staff_types (
            id,
            name
          )
        `)
        .order("name");
      if (staffError) throw staffError;

      // Fetch all users with roles
      const { data: usersWithRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      // Fetch profiles for users with roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone");
      if (profilesError) throw profilesError;

      // Create a map of user_ids from staff table
      const staffUserIds = new Set(staffData?.map(s => s.user_id).filter(Boolean));

      // Create a map of roles by user_id
      const rolesByUserId = new Map(usersWithRoles?.map(ur => [ur.user_id, ur.role]) || []);

      // Create a map of profiles by id
      const profilesById = new Map(profiles?.map(p => [p.id, p]) || []);

      // Add users with roles who are not in staff table
      const additionalUsers = usersWithRoles
        ?.filter(ur => ur.user_id && !staffUserIds.has(ur.user_id))
        .map(ur => {
          const profile = profilesById.get(ur.user_id);
          return {
            id: ur.user_id,
            user_id: ur.user_id,
            name: profile?.full_name || 'Unknown',
            email: profile?.email || null,
            phone: profile?.phone || null,
            specialization: null,
            license_number: null,
            staff_type_id: null,
            staff_types: null,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: ur.role,
            isRoleOnly: true,
          };
        }) || [];

      // Add role info to existing staff members
      const staffWithRoles = staffData?.map(s => ({
        ...s,
        role: s.user_id ? rolesByUserId.get(s.user_id) : null,
      })) || [];

      // Combine staff and role-only users
      const combined = [...staffWithRoles, ...additionalUsers].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );

      return combined;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Check if current user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!roleData || !["admin", "superadmin"].includes(roleData.role)) {
        throw new Error("Only administrators can create staff members");
      }

      let userId = null;
      
      // Create auth user if password is provided
      if (values.password && values.email) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.name,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (authError) throw new Error(`Authentication error: ${authError.message}`);
        userId = authData.user?.id;
      }
      
      // Remove password from staff data
      const { password, ...staffData } = values;
      
      // Insert staff record with user_id if created
      const { data, error } = await supabase
        .from("staff")
        .insert([{ ...staffData, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Staff member created successfully" });
      setDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating staff member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { password, ...staffData } = values;
      
      // First, get the staff member to check if they have a user_id
      const { data: staffMember } = await supabase
        .from("staff")
        .select("user_id")
        .eq("id", id)
        .single();
      
      // Update password if provided and user_id exists
      if (password && password.length >= 6 && staffMember?.user_id) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          staffMember.user_id,
          { password }
        );
        
        if (passwordError) {
          // If admin API fails, try regular user update (works if current user is updating their own password)
          const { error: regularError } = await supabase.auth.updateUser({
            password
          });
          
          if (regularError) {
            throw new Error(`Failed to update password: ${regularError.message}`);
          }
        }
      }
      
      // Update staff record
      const { data, error } = await supabase
        .from("staff")
        .update(staffData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Staff member updated successfully" });
      setDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating staff member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Staff member deleted successfully" });
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting staff member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (selectedStaff) {
      updateMutation.mutate({ id: selectedStaff.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (staff: any) => {
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleDelete = (staff: any) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  const createAuthMutation = useMutation({
    mutationFn: async ({ staffId, email, name, password }: { staffId: string; email: string; name: string; password: string }) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          staffId,
          email,
          password,
          fullName: name,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create auth account');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setPasswordDialogOpen(false);
      setStaffForAuth(null);
      toast({ title: "Login account created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating login account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAuth = (staffId: string, email: string, name: string) => {
    setStaffForAuth({ id: staffId, email, name });
    setPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = (password: string) => {
    if (staffForAuth) {
      createAuthMutation.mutate({
        staffId: staffForAuth.id,
        email: staffForAuth.email,
        name: staffForAuth.name,
        password,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
            <p className="text-muted-foreground">Manage hospital staff members</p>
          </div>
          {canAdd('staff') && (
            <Button
              className="gap-2"
              onClick={() => {
                setSelectedStaff(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>View and manage hospital staff by status</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="active">
                  Active ({staff?.filter(s => s.active).length || 0})
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Inactive ({staff?.filter(s => !s.active).length || 0})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({staff?.length || 0})
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <TabsContent value="active">
                    {!staff || staff.filter(s => s.active).length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        No active staff members found.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Staff Type / Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staff.filter(s => s.active).map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>
                                {member.staff_types?.name || (member.role ? <Badge variant="outline">{member.role}</Badge> : "-")}
                              </TableCell>
                              <TableCell>{member.email || "-"}</TableCell>
                              <TableCell>{member.phone || "-"}</TableCell>
                              <TableCell>{member.specialization || "-"}</TableCell>
                              <TableCell>{member.license_number || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="default">Active</Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {isAdmin && !member.user_id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCreateAuth(member.id, member.email, member.name)}
                                    title="Create login account"
                                  >
                                    <Key className="h-4 w-4" />
                                  </Button>
                                )}
                                {canEdit('staff') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(member)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete('staff') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(member)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="inactive">
                    {!staff || staff.filter(s => !s.active).length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        No inactive staff members found.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Staff Type / Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staff.filter(s => !s.active).map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>
                                {member.staff_types?.name || (member.role ? <Badge variant="outline">{member.role}</Badge> : "-")}
                              </TableCell>
                              <TableCell>{member.email || "-"}</TableCell>
                              <TableCell>{member.phone || "-"}</TableCell>
                              <TableCell>{member.specialization || "-"}</TableCell>
                              <TableCell>{member.license_number || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">Inactive</Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {isAdmin && !member.user_id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCreateAuth(member.id, member.email, member.name)}
                                    title="Create login account"
                                  >
                                    <Key className="h-4 w-4" />
                                  </Button>
                                )}
                                {canEdit('staff') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(member)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete('staff') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(member)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="all">
                    {!staff || staff.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        No staff members found. Click "Add Staff" to get started.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Staff Type / Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staff.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>
                                {member.staff_types?.name || (member.role ? <Badge variant="outline">{member.role}</Badge> : "-")}
                              </TableCell>
                              <TableCell>{member.email || "-"}</TableCell>
                              <TableCell>{member.phone || "-"}</TableCell>
                              <TableCell>{member.specialization || "-"}</TableCell>
                              <TableCell>{member.license_number || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={member.active ? "default" : "secondary"}>
                                  {member.active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {isAdmin && !member.user_id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCreateAuth(member.id, member.email, member.name)}
                                    title="Create login account"
                                  >
                                    <Key className="h-4 w-4" />
                                  </Button>
                                )}
                                {canEdit('staff') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(member)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete('staff') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(member)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <StaffDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedStaff(null);
          }
        }}
        staff={selectedStaff}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => staffToDelete && deleteMutation.mutate(staffToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateStaffPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onSubmit={handlePasswordSubmit}
        email={staffForAuth?.email || ""}
      />
    </DashboardLayout>
  );
};

export default Staff;

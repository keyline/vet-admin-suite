import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { OwnerDialog } from "@/components/owners/OwnerDialog";
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

const Owners = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  const { canAdd, canEdit, canDelete } = usePermissions();

  const { data: owners, isLoading } = useQuery({
    queryKey: ["pet_owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_owners")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("pet_owners")
        .insert([values])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      toast({ title: "Owner created successfully" });
      setDialogOpen(false);
      setSelectedOwner(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { data, error } = await supabase
        .from("pet_owners")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      toast({ title: "Owner updated successfully" });
      setDialogOpen(false);
      setSelectedOwner(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pet_owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      toast({ title: "Owner deleted successfully" });
      setDeleteDialogOpen(false);
      setOwnerToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (selectedOwner) {
      updateMutation.mutate({ id: selectedOwner.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (owner: any) => {
    setSelectedOwner(owner);
    setDialogOpen(true);
  };

  const handleDelete = (owner: any) => {
    setOwnerToDelete(owner);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pet Owners</h2>
            <p className="text-muted-foreground">Manage your client database</p>
          </div>
          {canAdd('pet_owners') && (
            <Button
              className="gap-2"
              onClick={() => {
                setSelectedOwner(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Owner
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Owners</CardTitle>
            <CardDescription>View and manage pet owners</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !owners || owners.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No owners found. Click "Add Owner" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell>{owner.email || "-"}</TableCell>
                      <TableCell>{owner.phone}</TableCell>
                      <TableCell>{owner.address || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={owner.active ? "default" : "secondary"}>
                          {owner.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {canEdit('pet_owners') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(owner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete('pet_owners') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(owner)}
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
          </CardContent>
        </Card>
      </div>

      <OwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        owner={selectedOwner}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ownerToDelete && deleteMutation.mutate(ownerToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Owners;

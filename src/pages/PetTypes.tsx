import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PetTypeDialog } from "@/components/masters/PetTypeDialog";
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

const PetTypes = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [petTypeToDelete, setPetTypeToDelete] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: petTypes, isLoading } = useQuery({
    queryKey: ["pet_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("pet_types")
        .insert([values])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_types"] });
      toast({ title: "Pet type created successfully" });
      setDialogOpen(false);
      setSelectedPetType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating pet type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { data, error } = await supabase
        .from("pet_types")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_types"] });
      toast({ title: "Pet type updated successfully" });
      setDialogOpen(false);
      setSelectedPetType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating pet type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pet_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_types"] });
      toast({ title: "Pet type deleted successfully" });
      setDeleteDialogOpen(false);
      setPetTypeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting pet type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (selectedPetType) {
      updateMutation.mutate({ id: selectedPetType.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (petType: any) => {
    setSelectedPetType(petType);
    setDialogOpen(true);
  };

  const handleDelete = (petType: any) => {
    setPetTypeToDelete(petType);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pet Types</h2>
            <p className="text-muted-foreground">Manage pet species catalog</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setSelectedPetType(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Pet Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Pet Types</CardTitle>
            <CardDescription>View and manage pet species</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !petTypes || petTypes.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No pet types found. Click "Add Pet Type" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {petTypes.map((petType) => (
                    <TableRow key={petType.id}>
                      <TableCell className="font-medium">{petType.name}</TableCell>
                      <TableCell>{petType.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={petType.active ? "default" : "secondary"}>
                          {petType.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(petType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(petType)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <PetTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        petType={selectedPetType}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pet type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => petTypeToDelete && deleteMutation.mutate(petTypeToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PetTypes;

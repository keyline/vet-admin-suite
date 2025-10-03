import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MedicineDialog } from "@/components/masters/MedicineDialog";
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

const Medicines = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("medicines")
        .insert([values])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Medicine created successfully" });
      setDialogOpen(false);
      setSelectedMedicine(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { data, error } = await supabase
        .from("medicines")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Medicine updated successfully" });
      setDialogOpen(false);
      setSelectedMedicine(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Medicine deleted successfully" });
      setDeleteDialogOpen(false);
      setMedicineToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (selectedMedicine) {
      updateMutation.mutate({ id: selectedMedicine.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (medicine: any) => {
    setSelectedMedicine(medicine);
    setDialogOpen(true);
  };

  const handleDelete = (medicine: any) => {
    setMedicineToDelete(medicine);
    setDeleteDialogOpen(true);
  };

  const isLowStock = (medicine: any) => {
    return medicine.stock_quantity <= medicine.reorder_level;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Medicines</h2>
            <p className="text-muted-foreground">Manage medicine inventory</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setSelectedMedicine(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Medicines</CardTitle>
            <CardDescription>View and manage medicine stock</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !medicines || medicines.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No medicines found. Click "Add Medicine" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{medicine.name}</span>
                          {isLowStock(medicine) && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        {medicine.generic_name && (
                          <div className="text-sm text-muted-foreground">
                            {medicine.generic_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{medicine.category || "-"}</TableCell>
                      <TableCell>
                        <span className={isLowStock(medicine) ? "text-warning font-medium" : ""}>
                          {medicine.stock_quantity} {medicine.unit}
                        </span>
                      </TableCell>
                      <TableCell>₹{Number(medicine.unit_price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={medicine.active ? "default" : "secondary"}>
                          {medicine.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(medicine)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(medicine)}
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

      <MedicineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        medicine={selectedMedicine}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the medicine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => medicineToDelete && deleteMutation.mutate(medicineToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Medicines;

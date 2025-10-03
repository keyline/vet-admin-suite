import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { StaffTypeDialog } from "@/components/masters/StaffTypeDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export default function StaffTypes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaffType, setSelectedStaffType] = useState<any>(null);
  const { canAdd, canEdit, canDelete } = usePermissions();

  const { data: staffTypes, refetch } = useQuery({
    queryKey: ["staff-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (staffType: any) => {
    setSelectedStaffType(staffType);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStaffType) return;

    try {
      const { error } = await supabase
        .from("staff_types")
        .delete()
        .eq("id", selectedStaffType.id);

      if (error) throw error;

      toast.success("Staff type deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setSelectedStaffType(null);
    } catch (error) {
      console.error("Error deleting staff type:", error);
      toast.error("Failed to delete staff type");
    }
  };

  const openDeleteDialog = (staffType: any) => {
    setSelectedStaffType(staffType);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Types</h1>
          <p className="text-muted-foreground">
            Manage staff type classifications
          </p>
        </div>
        {canAdd('staff_types') && (
          <Button
            onClick={() => {
              setSelectedStaffType(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Type
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Types</CardTitle>
          <CardDescription>
            List of all staff type categories in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {staffTypes?.map((staffType) => (
                <TableRow key={staffType.id}>
                  <TableCell className="font-medium">{staffType.name}</TableCell>
                  <TableCell>{staffType.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={staffType.active ? "default" : "secondary"}>
                      {staffType.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit('staff_types') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(staffType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete('staff_types') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(staffType)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!staffTypes?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No staff types found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StaffTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staffType={selectedStaffType}
        onSuccess={refetch}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the staff type "{selectedStaffType?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { CageDialog } from "@/components/masters/CageDialog";
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

export default function Cages() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCage, setSelectedCage] = useState<any>(null);

  const { data: cages, refetch } = useQuery({
    queryKey: ["cages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cages")
        .select(`
          *,
          rooms (
            id,
            name,
            room_number,
            buildings (
              id,
              name
            )
          )
        `)
        .order("cage_number");

      if (error) throw error;
      
      // Get current pet count for each cage
      const cagesWithCount = await Promise.all(
        (data || []).map(async (cage) => {
          const { data: countData } = await supabase.rpc(
            'get_cage_current_pet_count',
            { cage_uuid: cage.id }
          );
          return {
            ...cage,
            current_pet_count: countData || 0,
          };
        })
      );
      
      return cagesWithCount;
    },
  });

  const handleEdit = (cage: any) => {
    setSelectedCage(cage);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCage) return;

    try {
      const { error } = await supabase
        .from("cages")
        .delete()
        .eq("id", selectedCage.id);

      if (error) throw error;

      toast.success("Cage deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setSelectedCage(null);
    } catch (error) {
      console.error("Error deleting cage:", error);
      toast.error("Failed to delete cage");
    }
  };

  const openDeleteDialog = (cage: any) => {
    setSelectedCage(cage);
    setDeleteDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "occupied":
        return "secondary";
      case "maintenance":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cages</h1>
            <p className="text-muted-foreground">
              Manage cages across all rooms
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedCage(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Cage
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Cages</CardTitle>
            <CardDescription>List of all cages in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Building</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Cage Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cages?.map((cage) => (
                  <TableRow key={cage.id}>
                    <TableCell className="font-medium">
                      {cage.rooms?.buildings?.name}
                    </TableCell>
                    <TableCell>
                      {cage.rooms?.name}
                      {cage.rooms?.room_number &&
                        ` (${cage.rooms.room_number})`}
                    </TableCell>
                    <TableCell>{cage.cage_number}</TableCell>
                    <TableCell>{cage.name || "-"}</TableCell>
                    <TableCell>{cage.size || "-"}</TableCell>
                    <TableCell>
                      <span className={cage.current_pet_count >= cage.max_pet_count ? "text-destructive font-medium" : ""}>
                        {cage.current_pet_count || 0} / {cage.max_pet_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(cage.status)}>
                        {cage.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cage.active ? "default" : "secondary"}>
                        {cage.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cage)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(cage)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!cages?.length && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      No cages found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <CageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          cage={selectedCage}
          onSuccess={refetch}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete cage "{selectedCage?.cage_number}". This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

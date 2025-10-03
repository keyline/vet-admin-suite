import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AssignCageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  petName: string;
  admissionId: string;
  onSuccess: () => void;
}

export function AssignCageDialog({
  open,
  onOpenChange,
  petId,
  petName,
  admissionId,
  onSuccess,
}: AssignCageDialogProps) {
  const [selectedCageId, setSelectedCageId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: availableCages, isLoading } = useQuery({
    queryKey: ["available-cages"],
    queryFn: async () => {
      const { data: cages, error } = await supabase
        .from("cages")
        .select(
          `
          id,
          cage_number,
          name,
          max_pet_count,
          rooms (
            name,
            buildings (
              name
            )
          )
        `
        )
        .eq("active", true)
        .eq("status", "available")
        .order("cage_number");

      if (error) throw error;

      // Get current pet count for each cage
      const cagesWithCount = await Promise.all(
        (cages || []).map(async (cage) => {
          const { data: count } = await supabase.rpc("get_cage_current_pet_count", {
            cage_uuid: cage.id,
          });
          return {
            ...cage,
            current_count: count || 0,
          };
        })
      );

      // Filter only cages with available space
      return cagesWithCount.filter((cage) => cage.current_count < cage.max_pet_count);
    },
    enabled: open,
  });

  const assignCageMutation = useMutation({
    mutationFn: async (cageId: string) => {
      const { error } = await supabase
        .from("admissions")
        .update({ cage_id: cageId })
        .eq("id", admissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Cage Assigned",
        description: `Successfully assigned cage to ${petName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-cages"] });
      onSuccess();
      onOpenChange(false);
      setSelectedCageId("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign cage. Please try again.",
        variant: "destructive",
      });
      console.error("Error assigning cage:", error);
    },
  });

  const handleAssign = () => {
    if (!selectedCageId) {
      toast({
        title: "Error",
        description: "Please select a cage",
        variant: "destructive",
      });
      return;
    }
    assignCageMutation.mutate(selectedCageId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Cage to {petName}</DialogTitle>
          <DialogDescription>
            Select an available cage for this pet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cage">Available Cages</Label>
            <Select value={selectedCageId} onValueChange={setSelectedCageId}>
              <SelectTrigger id="cage">
                <SelectValue placeholder="Select a cage" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading cages...
                  </SelectItem>
                ) : !availableCages || availableCages.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available cages
                  </SelectItem>
                ) : (
                  availableCages.map((cage) => (
                    <SelectItem key={cage.id} value={cage.id}>
                      {cage.rooms?.buildings?.name} - {cage.rooms?.name} - Cage{" "}
                      {cage.cage_number}
                      {cage.name ? ` (${cage.name})` : ""} - {cage.current_count}/
                      {cage.max_pet_count} occupied
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedCageId("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedCageId || assignCageMutation.isPending}
          >
            {assignCageMutation.isPending ? "Assigning..." : "Assign Cage"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

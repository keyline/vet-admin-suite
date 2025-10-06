import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface OwnerPetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: any;
}

export const OwnerPetsModal = ({ open, onOpenChange, owner }: OwnerPetsModalProps) => {
  const { data: admittedPets, isLoading } = useQuery({
    queryKey: ["owner-pets", owner?.id],
    queryFn: async () => {
      if (!owner?.id) return [];
      
      const { data, error } = await supabase
        .from("admissions")
        .select(`
          id,
          admission_number,
          admission_date,
          status,
          pets (
            id,
            name,
            species,
            breed,
            microchip_id
          )
        `)
        .eq("pets.owner_id", owner.id)
        .order("admission_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!owner?.id,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admitted Pets</DialogTitle>
          <DialogDescription>
            {owner?.name}'s pet admission history
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !admittedPets || admittedPets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pet admissions found for this owner.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet Name</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Tag Number</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admittedPets.map((admission: any) => (
                  <TableRow key={admission.id}>
                    <TableCell className="font-medium">
                      {admission.pets?.name || "N/A"}
                    </TableCell>
                    <TableCell>{admission.pets?.species || "N/A"}</TableCell>
                    <TableCell>{admission.pets?.breed || "N/A"}</TableCell>
                    <TableCell>{admission.pets?.microchip_id || "N/A"}</TableCell>
                    <TableCell>{admission.admission_number}</TableCell>
                    <TableCell>
                      {format(new Date(admission.admission_date), "PPP")}
                    </TableCell>
                    <TableCell className="capitalize">{admission.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

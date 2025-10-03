import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Plus, Edit, DoorOpen, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RemovePetDialog } from "@/components/pets/RemovePetDialog";
import { AssignCageDialog } from "@/components/pets/AssignCageDialog";

const Pets = () => {
  const navigate = useNavigate();
  const { canAdd, canEdit } = usePermissions();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<{ id: string; name: string } | null>(null);
  const [assignCageDialogOpen, setAssignCageDialogOpen] = useState(false);
  const [selectedPetForCage, setSelectedPetForCage] = useState<{ 
    id: string; 
    name: string; 
    admissionId: string;
  } | null>(null);

  const { data: pets, isLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select(`
          *,
          pet_owners (
            id,
            name
          ),
          admissions!inner (
            id,
            admission_date,
            status,
            cage_id,
            cages (
              cage_number,
              name
            )
          )
        `)
        .eq("removed", false)
        .neq("species", "donation")
        .in("admissions.status", ["admitted", "pending"])
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleRemovePet = (petId: string, petName: string) => {
    setSelectedPet({ id: petId, name: petName });
    setRemoveDialogOpen(true);
  };

  const handleAssignCage = (petId: string, petName: string, admissionId: string) => {
    setSelectedPetForCage({ id: petId, name: petName, admissionId });
    setAssignCageDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pets</h2>
            <p className="text-muted-foreground">Manage pet records</p>
          </div>
          {canAdd('pets') && (
            <Button className="gap-2" onClick={() => navigate("/admissions")}>
              <Plus className="h-4 w-4" />
              Add Pet
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Admitted Pets</CardTitle>
            <CardDescription>View and manage pet records</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !pets || pets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No pets found.</p>
                <p className="text-sm">Pets are added through the admission process.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tag Number</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Cage Number</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit('pets') && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pets.map((pet) => {
                    const latestAdmission = pet.admissions?.[0];
                    const cage = latestAdmission?.cages;
                    
                    return (
                      <TableRow key={pet.id}>
                        <TableCell className="font-medium">{pet.name}</TableCell>
                        <TableCell>{pet.microchip_id || "-"}</TableCell>
                        <TableCell>{pet.pet_owners?.name || "-"}</TableCell>
                        <TableCell>{pet.species}</TableCell>
                        <TableCell>{pet.breed || "-"}</TableCell>
                        <TableCell>{pet.age ? `${pet.age} years` : "-"}</TableCell>
                        <TableCell className="capitalize">{pet.gender || "-"}</TableCell>
                        <TableCell>
                          {cage ? (
                            `${cage.cage_number} - ${cage.name}`
                          ) : (
                            <Badge variant="secondary">Pending Allocation</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {latestAdmission?.admission_date 
                            ? format(new Date(latestAdmission.admission_date), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pet.active ? "default" : "secondary"} className="text-xs">
                            Under Treatment
                          </Badge>
                        </TableCell>
                        {canEdit('pets') && (
                          <TableCell>
                            <div className="flex gap-2">
                              {!cage ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignCage(pet.id, pet.name, latestAdmission.id)}
                                >
                                  <Home className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigate(`/admissions?petId=${pet.id}`);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePet(pet.id, pet.name)}
                                  >
                                    <DoorOpen className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedPet && (
        <RemovePetDialog
          petId={selectedPet.id}
          petName={selectedPet.name}
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
        />
      )}
      {selectedPetForCage && (
        <AssignCageDialog
          petId={selectedPetForCage.id}
          petName={selectedPetForCage.name}
          admissionId={selectedPetForCage.admissionId}
          open={assignCageDialogOpen}
          onOpenChange={setAssignCageDialogOpen}
          onSuccess={() => {}}
        />
      )}
    </DashboardLayout>
  );
};

export default Pets;

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, ClipboardList, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { TreatmentRecordDialog } from "@/components/doctors/TreatmentRecordDialog";
import { format } from "date-fns";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [selectedAdmission, setSelectedAdmission] = useState<{
    id: string;
    petName: string;
    admissionNumber: string;
  } | null>(null);

  // Fetch doctor's staff record
  const { data: doctorStaff } = useQuery({
    queryKey: ["doctor-staff", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch assigned pets
  const { data: assignedPets, isLoading } = useQuery({
    queryKey: ["doctor-patients", doctorStaff?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select(`
          id,
          admission_number,
          admission_date,
          status,
          reason,
          pets!inner(
            id,
            name,
            species,
            breed,
            age,
            pet_owners!inner(
              name,
              phone
            )
          ),
          cages(
            cage_number,
            rooms(
              name,
              buildings(
                name
              )
            )
          )
        `)
        .eq("doctor_id", doctorStaff?.id)
        .in("status", ["admitted", "pending"])
        .order("admission_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!doctorStaff?.id,
  });

  // Fetch today's treatment count
  const { data: todayTreatmentCount } = useQuery({
    queryKey: ["today-treatments", doctorStaff?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from("doctor_visits")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorStaff?.id)
        .gte("visit_date", `${today}T00:00:00`)
        .lte("visit_date", `${today}T23:59:59`);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!doctorStaff?.id,
  });

  const stats = [
    {
      title: "Assigned Pets",
      value: isLoading ? <Skeleton className="h-8 w-16" /> : assignedPets?.length || 0,
      description: "Currently under your care",
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      title: "Treatments Today",
      value: todayTreatmentCount || 0,
      description: "Recorded today",
      icon: Stethoscope,
      color: "text-accent",
    },
    {
      title: "Pending Visits",
      value: isLoading ? <Skeleton className="h-8 w-16" /> : (assignedPets?.length || 0) - (todayTreatmentCount || 0),
      description: "Not yet treated today",
      icon: AlertCircle,
      color: "text-warning",
    },
  ];

  const getCageLocation = (cage: any) => {
    if (!cage) return "-";
    const building = cage.rooms?.buildings?.name || "-";
    const room = cage.rooms?.name || "-";
    return `${building} / ${room} / ${cage.cage_number}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Patients</h2>
          <p className="text-muted-foreground">
            Welcome Dr. {doctorStaff?.name || "Doctor"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Pets</CardTitle>
            <CardDescription>Pets currently under your care</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : assignedPets && assignedPets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Species/Breed</TableHead>
                    <TableHead>Cage Location</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedPets.map((admission: any) => (
                    <TableRow key={admission.id}>
                      <TableCell className="font-medium">
                        {admission.admission_number}
                      </TableCell>
                      <TableCell>
                        {admission.pets?.species}
                        {admission.pets?.breed && ` / ${admission.pets.breed}`}
                      </TableCell>
                      <TableCell>{getCageLocation(admission.cages)}</TableCell>
                      <TableCell>
                        {format(new Date(admission.admission_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            admission.status === "admitted" ? "default" : "secondary"
                          }
                        >
                          {admission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() =>
                            setSelectedAdmission({
                              id: admission.id,
                              petName: admission.pets?.name,
                              admissionNumber: admission.admission_number,
                            })
                          }
                        >
                          Record Treatment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pets currently assigned to you</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedAdmission && (
        <TreatmentRecordDialog
          open={!!selectedAdmission}
          onOpenChange={(open) => !open && setSelectedAdmission(null)}
          admissionId={selectedAdmission.id}
          petName={selectedAdmission.petName}
          admissionNumber={selectedAdmission.admissionNumber}
          doctorId={doctorStaff?.id || ""}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorDashboard;

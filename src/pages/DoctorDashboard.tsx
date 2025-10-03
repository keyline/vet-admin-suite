import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, ClipboardList, AlertCircle, MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { TreatmentRecordDialog } from "@/components/doctors/TreatmentRecordDialog";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

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
            microchip_id,
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">Assigned Pets</h3>
              <p className="text-sm text-muted-foreground">Pets currently under your care</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : assignedPets && assignedPets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedPets.map((admission: any) => (
                <Card key={admission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {admission.pets?.name || "Unnamed Pet"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Tag: {admission.pets?.microchip_id || "N/A"}
                              </p>
                            </div>
                            <Badge
                              variant={
                                admission.status === "admitted" ? "default" : "secondary"
                              }
                              className="ml-2"
                            >
                              {admission.status}
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Stethoscope className="h-4 w-4" />
                              <span>
                                {admission.pets?.species}
                                {admission.pets?.breed && ` • ${admission.pets.breed}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{getCageLocation(admission.cages)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Admitted: {format(new Date(admission.admission_date), "MMM dd, yyyy")}
                              </span>
                            </div>
                          </div>

                          {admission.reason && (
                            <div className="pt-2 border-t">
                              <p className="text-sm">
                                <span className="font-medium">Reason: </span>
                                {admission.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          className="w-full sm:w-auto"
                          onClick={() =>
                            setSelectedAdmission({
                              id: admission.id,
                              petName: admission.pets?.name,
                              admissionNumber: admission.admission_number,
                            })
                          }
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Record Treatment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No pets currently assigned to you</p>
                  <p className="text-sm mt-2">Check back later for new assignments</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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

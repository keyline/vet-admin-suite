import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TreatmentHistory = () => {
  const { petId } = useParams();
  const navigate = useNavigate();

  const { data: petData, isLoading: isPetLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select(`
          *,
          pet_owners (
            id,
            name,
            phone,
            email
          )
        `)
        .eq("id", petId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: treatmentHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["treatment-history", petId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select(`
          *,
          doctor_visits (
            *,
            prescriptions (
              *,
              medicines (
                name,
                unit
              )
            )
          ),
          cages (
            cage_number,
            name
          )
        `)
        .eq("pet_id", petId)
        .order("admission_date", { ascending: false });

      if (error) throw error;
      
      // Fetch doctor names and medicine units separately
      const admissionsWithDoctors = await Promise.all(
        (data || []).map(async (admission) => {
          let doctorName = "-";
          if (admission.doctor_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", admission.doctor_id)
              .maybeSingle();
            doctorName = profile?.full_name || "-";
          }

          const visitsWithDoctors = await Promise.all(
            (admission.doctor_visits || []).map(async (visit: any) => {
              let visitDoctorName = "-";
              if (visit.doctor_id) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", visit.doctor_id)
                  .maybeSingle();
                visitDoctorName = profile?.full_name || "-";
              }
              return { ...visit, doctor_name: visitDoctorName };
            })
          );

          // Fetch medicine units for antibiotics_schedule
          let scheduleWithUnits = admission.antibiotics_schedule;
          if (Array.isArray(admission.antibiotics_schedule) && admission.antibiotics_schedule.length > 0) {
            const medicineIds = admission.antibiotics_schedule
              .map((item: any) => item.medicine_id)
              .filter(Boolean);
            
            if (medicineIds.length > 0) {
              const { data: medicines } = await supabase
                .from("medicines")
                .select("id, unit")
                .in("id", medicineIds);
              
              const medicineUnitsMap = new Map(
                medicines?.map((m) => [m.id, m.unit]) || []
              );
              
              scheduleWithUnits = admission.antibiotics_schedule.map((item: any) => ({
                ...item,
                unit: medicineUnitsMap.get(item.medicine_id) || ""
              }));
            }
          }

          return { 
            ...admission, 
            doctor_name: doctorName,
            doctor_visits: visitsWithDoctors,
            antibiotics_schedule: scheduleWithUnits
          };
        })
      );

      return admissionsWithDoctors;
    },
  });

  const isLoading = isPetLoading || isHistoryLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pets")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Treatment History</h2>
            <p className="text-muted-foreground">
              {petData && `${petData.name} (Tag: ${petData.microchip_id || "N/A"})`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Pet Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pet Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Species</p>
                    <p className="font-medium">{petData?.species}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Breed</p>
                    <p className="font-medium">{petData?.breed || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{petData?.age ? `${petData.age} years` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{petData?.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{petData?.pet_owners?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{petData?.pet_owners?.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{petData?.pet_owners?.email || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment History */}
            {!treatmentHistory || treatmentHistory.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">No treatment history found for this pet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {treatmentHistory.map((admission) => (
                  <Card key={admission.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            {admission.admission_number}
                            <Badge 
                              variant={admission.status === "discharged" ? "secondary" : "default"}
                              className="capitalize"
                            >
                              {admission.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-base">
                            <span className="font-medium">Admitted:</span> {format(new Date(admission.admission_date), "dd MMM yyyy")}
                            {admission.discharge_date && 
                              <> • <span className="font-medium">Discharged:</span> {format(new Date(admission.discharge_date), "dd MMM yyyy")}</>
                            }
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {/* Admission Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</p>
                          <p className="text-sm font-medium">{admission.reason}</p>
                        </div>
                        {admission.diagnosis && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Diagnosis</p>
                            <p className="text-sm font-medium">{admission.diagnosis}</p>
                          </div>
                        )}
                        {admission.symptoms && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Symptoms</p>
                            <p className="text-sm font-medium">{admission.symptoms}</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Doctor</p>
                          <p className="text-sm font-medium">{admission.doctor_name || "-"}</p>
                        </div>
                        {admission.cages && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cage Assignment</p>
                            <p className="text-sm font-medium">{admission.cages.cage_number} - {admission.cages.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Doctor Visits */}
                      {admission.doctor_visits && admission.doctor_visits.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-lg font-semibold">Doctor Visits</h4>
                          <div className="space-y-4">
                            {admission.doctor_visits.map((visit: any) => (
                              <Card key={visit.id} className="border-l-4 border-l-primary">
                                <CardContent className="pt-6 space-y-4">
                                  <div className="flex items-center justify-between pb-3 border-b">
                                    <p className="font-semibold">
                                      {format(new Date(visit.visit_date), "dd MMM yyyy, hh:mm a")}
                                    </p>
                                    <Badge variant="outline">
                                      Dr. {visit.doctor_name || "Unknown"}
                                    </Badge>
                                  </div>
                                  
                                  {visit.observations && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Observations</p>
                                      <p className="text-sm leading-relaxed">{visit.observations}</p>
                                    </div>
                                  )}
                                  
                                  {visit.diagnosis && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Diagnosis</p>
                                      <p className="text-sm leading-relaxed">{visit.diagnosis}</p>
                                    </div>
                                  )}

                                  {/* Prescriptions */}
                                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prescriptions</p>
                                      <div className="rounded-md border overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-muted/50">
                                              <TableHead className="font-semibold">Medicine</TableHead>
                                              <TableHead className="font-semibold">Dosage</TableHead>
                                              <TableHead className="font-semibold">Frequency</TableHead>
                                              <TableHead className="font-semibold">Duration</TableHead>
                                              <TableHead className="font-semibold">Quantity</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {visit.prescriptions.map((prescription: any) => (
                                              <TableRow key={prescription.id}>
                                                <TableCell className="font-medium">{prescription.medicines?.name || "-"}</TableCell>
                                                <TableCell>{prescription.dosage}</TableCell>
                                                <TableCell>{prescription.frequency}</TableCell>
                                                <TableCell>{prescription.duration}</TableCell>
                                                <TableCell>
                                                  {prescription.quantity} {prescription.medicines?.unit || ""}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medicine Schedule from Admission */}
                      {admission.antibiotics_schedule && Array.isArray(admission.antibiotics_schedule) && admission.antibiotics_schedule.length > 0 && (
                        <div className="space-y-3 pt-4 border-t">
                          <h4 className="text-lg font-semibold">Medicine Schedule</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(() => {
                              // Group medicines by day
                              const medicinesByDay = admission.antibiotics_schedule.reduce((acc: any, item: any) => {
                                const day = item.day || 1;
                                if (!acc[day]) acc[day] = [];
                                acc[day].push(item);
                                return acc;
                              }, {});

                              return Object.keys(medicinesByDay).sort((a, b) => Number(a) - Number(b)).map((day) => (
                                <div key={day} className="rounded-lg border bg-card p-4 space-y-3">
                                  <div className="font-semibold text-sm border-b pb-2">
                                    Day {day}
                                  </div>
                                  <div className="space-y-2.5">
                                    {medicinesByDay[day].map((med: any) => (
                                      <div key={med.id} className="text-xs space-y-1">
                                        <div className="font-medium text-foreground">{med.medicine_name}</div>
                                        <div className="text-muted-foreground space-y-0.5">
                                          <div>
                                            <span className="font-medium">Dose:</span> {med.dose} {med.unit}
                                          </div>
                                          {med.time && (
                                            <div>
                                              <span className="font-medium">Time:</span> {med.time}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TreatmentHistory;

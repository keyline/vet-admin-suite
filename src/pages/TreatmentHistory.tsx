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
      
      // Fetch doctor names separately
      const admissionsWithDoctors = await Promise.all(
        (data || []).map(async (admission) => {
          let doctorName = "-";
          if (admission.doctor_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", admission.doctor_id)
              .single();
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
                  .single();
                visitDoctorName = profile?.full_name || "-";
              }
              return { ...visit, doctor_name: visitDoctorName };
            })
          );

          return { 
            ...admission, 
            doctor_name: doctorName,
            doctor_visits: visitsWithDoctors 
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p>No treatment history found for this pet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {treatmentHistory.map((admission) => (
                  <Card key={admission.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Admission: {admission.admission_number}
                            <Badge variant={admission.status === "discharged" ? "secondary" : "default"}>
                              {admission.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Admitted: {format(new Date(admission.admission_date), "dd MMM yyyy")}
                            {admission.discharge_date && 
                              ` | Discharged: ${format(new Date(admission.discharge_date), "dd MMM yyyy")}`
                            }
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Admission Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                        <div>
                          <p className="text-sm text-muted-foreground">Reason</p>
                          <p className="font-medium">{admission.reason}</p>
                        </div>
                        {admission.diagnosis && (
                          <div>
                            <p className="text-sm text-muted-foreground">Diagnosis</p>
                            <p className="font-medium">{admission.diagnosis}</p>
                          </div>
                        )}
                        {admission.symptoms && (
                          <div>
                            <p className="text-sm text-muted-foreground">Symptoms</p>
                            <p className="font-medium">{admission.symptoms}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Doctor</p>
                          <p className="font-medium">{admission.doctor_name || "-"}</p>
                        </div>
                        {admission.cages && (
                          <div>
                            <p className="text-sm text-muted-foreground">Cage</p>
                            <p className="font-medium">{admission.cages.cage_number} - {admission.cages.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Doctor Visits */}
                      {admission.doctor_visits && admission.doctor_visits.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Doctor Visits</h4>
                          <div className="space-y-4">
                            {admission.doctor_visits.map((visit: any) => (
                              <div key={visit.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    {format(new Date(visit.visit_date), "dd MMM yyyy, hh:mm a")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Dr. {visit.doctor_name || "Unknown"}
                                  </p>
                                </div>
                                
                                {visit.observations && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Observations</p>
                                    <p className="text-sm">{visit.observations}</p>
                                  </div>
                                )}
                                
                                {visit.diagnosis && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Diagnosis</p>
                                    <p className="text-sm">{visit.diagnosis}</p>
                                  </div>
                                )}

                                {/* Prescriptions */}
                                {visit.prescriptions && visit.prescriptions.length > 0 && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Prescriptions</p>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Medicine</TableHead>
                                          <TableHead>Dosage</TableHead>
                                          <TableHead>Frequency</TableHead>
                                          <TableHead>Duration</TableHead>
                                          <TableHead>Quantity</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {visit.prescriptions.map((prescription: any) => (
                                          <TableRow key={prescription.id}>
                                            <TableCell>{prescription.medicines?.name || "-"}</TableCell>
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
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medicine Schedule from Admission */}
                      {admission.antibiotics_schedule && (
                        <div>
                          <h4 className="font-semibold mb-3">Medicine Schedule</h4>
                          <div className="text-sm">
                            {typeof admission.antibiotics_schedule === 'object' ? (
                              <pre className="bg-muted p-3 rounded-md overflow-auto">
                                {JSON.stringify(admission.antibiotics_schedule, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-muted-foreground">{admission.antibiotics_schedule}</p>
                            )}
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

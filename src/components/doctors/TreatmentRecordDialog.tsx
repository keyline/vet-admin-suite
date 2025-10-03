import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TreatmentRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  petName: string;
  admissionNumber: string;
  doctorId: string;
}

interface TreatmentData {
  date: Date;
  morning: {
    temperature: string;
    urine: "yes" | "no" | "";
    urineAmount: string;
    stool: "yes" | "no" | "";
    stoolAmount: string;
    medication: string;
  };
  evening: {
    temperature: string;
    urine: "yes" | "no" | "";
    urineAmount: string;
    stool: "yes" | "no" | "";
    stoolAmount: string;
    medication: string;
  };
  observations: string;
}

export function TreatmentRecordDialog({
  open,
  onOpenChange,
  admissionId,
  petName,
  admissionNumber,
  doctorId,
}: TreatmentRecordDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [treatmentData, setTreatmentData] = useState<TreatmentData>({
    date: new Date(),
    morning: {
      temperature: "",
      urine: "",
      urineAmount: "",
      stool: "",
      stoolAmount: "",
      medication: "",
    },
    evening: {
      temperature: "",
      urine: "",
      urineAmount: "",
      stool: "",
      stoolAmount: "",
      medication: "",
    },
    observations: "",
  });

  const [existingVisitId, setExistingVisitId] = useState<string | null>(null);

  // Fetch existing treatment record for today
  const { data: existingVisit } = useQuery({
    queryKey: ["treatment-record", admissionId, format(treatmentData.date, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateStr = format(treatmentData.date, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("admission_id", admissionId)
        .gte("visit_date", `${dateStr}T00:00:00`)
        .lte("visit_date", `${dateStr}T23:59:59`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open && !!admissionId,
  });

  // Load existing data into form when found
  useEffect(() => {
    if (existingVisit) {
      setExistingVisitId(existingVisit.id);
      const vitals = existingVisit.vitals as any;
      
      setTreatmentData({
        date: new Date(existingVisit.visit_date),
        morning: {
          temperature: vitals?.morning?.temperature?.toString() || "",
          urine: vitals?.morning?.urine || "",
          urineAmount: vitals?.morning?.urineAmount || "",
          stool: vitals?.morning?.stool || "",
          stoolAmount: vitals?.morning?.stoolAmount || "",
          medication: vitals?.morning?.medication || "",
        },
        evening: {
          temperature: vitals?.evening?.temperature?.toString() || "",
          urine: vitals?.evening?.urine || "",
          urineAmount: vitals?.evening?.urineAmount || "",
          stool: vitals?.evening?.stool || "",
          stoolAmount: vitals?.evening?.stoolAmount || "",
          medication: vitals?.evening?.medication || "",
        },
        observations: existingVisit.observations || "",
      });
    } else {
      setExistingVisitId(null);
      // Reset form to empty when no existing data
      setTreatmentData((prev) => ({
        ...prev,
        morning: {
          temperature: "",
          urine: "",
          urineAmount: "",
          stool: "",
          stoolAmount: "",
          medication: "",
        },
        evening: {
          temperature: "",
          urine: "",
          urineAmount: "",
          stool: "",
          stoolAmount: "",
          medication: "",
        },
        observations: "",
      }));
    }
  }, [existingVisit]);

  const saveTreatmentMutation = useMutation({
    mutationFn: async (data: TreatmentData) => {
      const vitals = {
        date: format(data.date, "yyyy-MM-dd"),
        morning: {
          temperature: data.morning.temperature ? parseFloat(data.morning.temperature) : null,
          urine: data.morning.urine,
          urineAmount: data.morning.urine === "yes" ? data.morning.urineAmount : null,
          stool: data.morning.stool,
          stoolAmount: data.morning.stool === "yes" ? data.morning.stoolAmount : null,
          medication: data.morning.medication,
        },
        evening: {
          temperature: data.evening.temperature ? parseFloat(data.evening.temperature) : null,
          urine: data.evening.urine,
          urineAmount: data.evening.urine === "yes" ? data.evening.urineAmount : null,
          stool: data.evening.stool,
          stoolAmount: data.evening.stool === "yes" ? data.evening.stoolAmount : null,
          medication: data.evening.medication,
        },
      };

      // Update if record exists, otherwise insert
      if (existingVisitId) {
        const { error } = await supabase
          .from("doctor_visits")
          .update({
            vitals,
            observations: data.observations || null,
          })
          .eq("id", existingVisitId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("doctor_visits").insert({
          admission_id: admissionId,
          doctor_id: doctorId,
          visit_date: data.date.toISOString(),
          vitals,
          observations: data.observations || null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: existingVisitId ? "Treatment Updated" : "Treatment Recorded",
        description: existingVisitId 
          ? "Treatment record has been updated successfully." 
          : "Treatment record has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
      queryClient.invalidateQueries({ queryKey: ["today-treatments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-record"] });
      onOpenChange(false);
      // Reset form
      setTreatmentData({
        date: new Date(),
        morning: {
          temperature: "",
          urine: "",
          urineAmount: "",
          stool: "",
          stoolAmount: "",
          medication: "",
        },
        evening: {
          temperature: "",
          urine: "",
          urineAmount: "",
          stool: "",
          stoolAmount: "",
          medication: "",
        },
        observations: "",
      });
      setExistingVisitId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save treatment record.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Basic validation
    const hasAnyData =
      treatmentData.morning.temperature ||
      treatmentData.morning.urine ||
      treatmentData.morning.stool ||
      treatmentData.morning.medication ||
      treatmentData.evening.temperature ||
      treatmentData.evening.urine ||
      treatmentData.evening.stool ||
      treatmentData.evening.medication ||
      treatmentData.observations;

    if (!hasAnyData) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least one field before saving.",
        variant: "destructive",
      });
      return;
    }

    saveTreatmentMutation.mutate(treatmentData);
  };

  const updateMorning = (field: string, value: string) => {
    setTreatmentData((prev) => ({
      ...prev,
      morning: {
        ...prev.morning,
        [field]: value,
        // Clear amount if status changes to "no"
        ...(field === "urine" && value === "no" && { urineAmount: "" }),
        ...(field === "stool" && value === "no" && { stoolAmount: "" }),
      },
    }));
  };

  const updateEvening = (field: string, value: string) => {
    setTreatmentData((prev) => ({
      ...prev,
      evening: {
        ...prev.evening,
        [field]: value,
        // Clear amount if status changes to "no"
        ...(field === "urine" && value === "no" && { urineAmount: "" }),
        ...(field === "stool" && value === "no" && { stoolAmount: "" }),
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Record Treatment</DialogTitle>
          <DialogDescription>
            Recording treatment for {petName} (Admission: {admissionNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Label className="sm:min-w-fit">Treatment Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
                    !treatmentData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {treatmentData.date ? format(treatmentData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={treatmentData.date}
                  onSelect={(date) =>
                    date && setTreatmentData((prev) => ({ ...prev, date }))
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Column */}
            <div className="space-y-4 md:border-r md:pr-6">
              <h3 className="text-lg font-semibold text-center bg-muted/50 py-2 rounded-md">Morning</h3>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="morning-temp">Temperature (°F)</Label>
                <Input
                  id="morning-temp"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 101.5"
                  value={treatmentData.morning.temperature}
                  onChange={(e) => updateMorning("temperature", e.target.value)}
                />
              </div>

              {/* Urine Status */}
              <div className="space-y-2">
                <Label>Urine</Label>
                <RadioGroup
                  value={treatmentData.morning.urine}
                  onValueChange={(value) => updateMorning("urine", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="morning-urine-yes" />
                    <Label htmlFor="morning-urine-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="morning-urine-no" />
                    <Label htmlFor="morning-urine-no">No</Label>
                  </div>
                </RadioGroup>
                {treatmentData.morning.urine === "yes" && (
                  <Input
                    placeholder="Amount (e.g., 50ml, normal)"
                    value={treatmentData.morning.urineAmount}
                    onChange={(e) => updateMorning("urineAmount", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Stool Status */}
              <div className="space-y-2">
                <Label>Stool</Label>
                <RadioGroup
                  value={treatmentData.morning.stool}
                  onValueChange={(value) => updateMorning("stool", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="morning-stool-yes" />
                    <Label htmlFor="morning-stool-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="morning-stool-no" />
                    <Label htmlFor="morning-stool-no">No</Label>
                  </div>
                </RadioGroup>
                {treatmentData.morning.stool === "yes" && (
                  <Input
                    placeholder="Amount (e.g., normal, watery)"
                    value={treatmentData.morning.stoolAmount}
                    onChange={(e) => updateMorning("stoolAmount", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Medication */}
              <div className="space-y-2">
                <Label htmlFor="morning-med">Medication</Label>
                <Textarea
                  id="morning-med"
                  placeholder="Enter medications given"
                  value={treatmentData.morning.medication}
                  onChange={(e) => updateMorning("medication", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Evening Column */}
            <div className="space-y-4 md:pl-6">
              <h3 className="text-lg font-semibold text-center bg-muted/50 py-2 rounded-md">Evening</h3>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="evening-temp">Temperature (°F)</Label>
                <Input
                  id="evening-temp"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 100.8"
                  value={treatmentData.evening.temperature}
                  onChange={(e) => updateEvening("temperature", e.target.value)}
                />
              </div>

              {/* Urine Status */}
              <div className="space-y-2">
                <Label>Urine</Label>
                <RadioGroup
                  value={treatmentData.evening.urine}
                  onValueChange={(value) => updateEvening("urine", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="evening-urine-yes" />
                    <Label htmlFor="evening-urine-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="evening-urine-no" />
                    <Label htmlFor="evening-urine-no">No</Label>
                  </div>
                </RadioGroup>
                {treatmentData.evening.urine === "yes" && (
                  <Input
                    placeholder="Amount (e.g., 50ml, normal)"
                    value={treatmentData.evening.urineAmount}
                    onChange={(e) => updateEvening("urineAmount", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Stool Status */}
              <div className="space-y-2">
                <Label>Stool</Label>
                <RadioGroup
                  value={treatmentData.evening.stool}
                  onValueChange={(value) => updateEvening("stool", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="evening-stool-yes" />
                    <Label htmlFor="evening-stool-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="evening-stool-no" />
                    <Label htmlFor="evening-stool-no">No</Label>
                  </div>
                </RadioGroup>
                {treatmentData.evening.stool === "yes" && (
                  <Input
                    placeholder="Amount (e.g., normal, watery)"
                    value={treatmentData.evening.stoolAmount}
                    onChange={(e) => updateEvening("stoolAmount", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Medication */}
              <div className="space-y-2">
                <Label htmlFor="evening-med">Medication</Label>
                <Textarea
                  id="evening-med"
                  placeholder="Enter medications given"
                  value={treatmentData.evening.medication}
                  onChange={(e) => updateEvening("medication", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Additional Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">Additional Observations</Label>
            <Textarea
              id="observations"
              placeholder="General observations, behavior, appetite, etc."
              value={treatmentData.observations}
              onChange={(e) =>
                setTreatmentData((prev) => ({
                  ...prev,
                  observations: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTreatmentMutation.isPending}
            className="w-full sm:w-auto"
          >
            {saveTreatmentMutation.isPending 
              ? "Saving..." 
              : existingVisitId 
              ? "Update Treatment" 
              : "Save Treatment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

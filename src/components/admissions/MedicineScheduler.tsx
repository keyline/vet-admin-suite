import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MedicineScheduleEntry {
  id: string;
  day: number;
  medicine_id: string;
  medicine_name: string;
  dose: string;
  time: string;
}

interface MedicineSchedulerProps {
  value: MedicineScheduleEntry[];
  onChange: (value: MedicineScheduleEntry[]) => void;
}

export const MedicineScheduler = ({ value = [], onChange }: MedicineSchedulerProps) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Fetch medicines
  const { data: medicines } = useQuery({
    queryKey: ["medicines", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMedicineEntry = () => {
    const newEntry: MedicineScheduleEntry = {
      id: crypto.randomUUID(),
      day: selectedDay,
      medicine_id: "",
      medicine_name: "",
      dose: "",
      time: new Date().toTimeString().slice(0, 5),
    };
    onChange([...value, newEntry]);
  };

  const removeMedicineEntry = (id: string) => {
    onChange(value.filter((entry) => entry.id !== id));
  };

  const updateMedicineEntry = (id: string, field: keyof MedicineScheduleEntry, fieldValue: string) => {
    onChange(
      value.map((entry) => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: fieldValue };
          // If medicine is changed, update medicine_name too
          if (field === "medicine_id") {
            const medicine = medicines?.find((m) => m.id === fieldValue);
            updated.medicine_name = medicine?.name || "";
          }
          return updated;
        }
        return entry;
      })
    );
  };

  const days = [1, 2, 3, 4, 5, 6, 7];
  const entriesForSelectedDay = value.filter((entry) => entry.day === selectedDay);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>Select Day:</Label>
        <div className="flex gap-2">
          {days.map((day) => {
            const dayEntries = value.filter((e) => e.day === day);
            return (
              <Button
                key={day}
                type="button"
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className="relative"
              >
                Day {day}
                {dayEntries.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {dayEntries.length}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {entriesForSelectedDay.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              No medicines scheduled for Day {selectedDay}
            </CardContent>
          </Card>
        ) : (
          entriesForSelectedDay.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-4 items-end">
                  <div>
                    <Label>Medicine</Label>
                    <Select
                      value={entry.medicine_id}
                      onValueChange={(val) => updateMedicineEntry(entry.id, "medicine_id", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines?.map((medicine) => (
                          <SelectItem key={medicine.id} value={medicine.id}>
                            {medicine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dose</Label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={entry.dose}
                      onChange={(e) => updateMedicineEntry(entry.id, "dose", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={(e) => updateMedicineEntry(entry.id, "time", e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedicineEntry(entry.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addMedicineEntry} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Medicine for Day {selectedDay}
      </Button>
    </div>
  );
};

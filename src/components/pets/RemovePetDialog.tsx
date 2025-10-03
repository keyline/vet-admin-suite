import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RemovePetDialogProps {
  petId: string;
  petName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RemovePetDialog = ({
  petId,
  petName,
  open,
  onOpenChange,
}: RemovePetDialogProps) => {
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalDate, setRemovalDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  const removePetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pets")
        .update({
          removed: true,
          removal_reason: removalReason,
          removal_date: format(removalDate, "yyyy-MM-dd"),
        })
        .eq("id", petId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast({
        title: "Pet Removed",
        description: `${petName} has been removed from the active list.`,
      });
      onOpenChange(false);
      setRemovalReason("");
      setRemovalDate(new Date());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove pet: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!removalReason) {
      toast({
        title: "Validation Error",
        description: "Please select a removal reason.",
        variant: "destructive",
      });
      return;
    }
    removePetMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove Pet</DialogTitle>
          <DialogDescription>
            Remove {petName} from the active pets list. This action can be reviewed in the reports.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Removal Reason</Label>
            <RadioGroup value={removalReason} onValueChange={setRemovalReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Expired" id="expired" />
                <Label htmlFor="expired" className="font-normal cursor-pointer">
                  Expired
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cured" id="cured" />
                <Label htmlFor="cured" className="font-normal cursor-pointer">
                  Cured
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Returned to owner" id="returned" />
                <Label htmlFor="returned" className="font-normal cursor-pointer">
                  Returned to owner
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Removal Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !removalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {removalDate ? format(removalDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={removalDate}
                  onSelect={(date) => date && setRemovalDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={removePetMutation.isPending}
          >
            {removePetMutation.isPending ? "Removing..." : "Remove Pet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

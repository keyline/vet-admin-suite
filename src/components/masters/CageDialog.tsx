import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  room_id: z.string().min(1, "Room is required"),
  name: z.string().optional(),
  cage_number: z.string().min(1, "Cage number is required"),
  size: z.string().optional(),
  max_pet_count: z.number().min(1, "Maximum pet count must be at least 1"),
  status: z.enum(["available", "occupied", "maintenance"]).default("available"),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cage?: any;
  onSuccess: () => void;
}

export function CageDialog({
  open,
  onOpenChange,
  cage,
  onSuccess,
}: CageDialogProps) {
  const { data: rooms } = useQuery({
    queryKey: ["rooms-with-buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          buildings (
            id,
            name
          )
        `)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room_id: "",
      name: "",
      cage_number: "",
      size: "",
      max_pet_count: 1,
      status: "available",
      notes: "",
      active: true,
    },
  });

  useEffect(() => {
    if (cage) {
      form.reset({
        room_id: cage.room_id,
        name: cage.name || "",
        cage_number: cage.cage_number,
        size: cage.size || "",
        max_pet_count: cage.max_pet_count || 1,
        status: cage.status,
        notes: cage.notes || "",
        active: cage.active,
      });
    } else {
      form.reset({
        room_id: "",
        name: "",
        cage_number: "",
        size: "",
        max_pet_count: 1,
        status: "available",
        notes: "",
        active: true,
      });
    }
  }, [cage, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        room_id: data.room_id,
        name: data.name || null,
        cage_number: data.cage_number,
        size: data.size || null,
        max_pet_count: data.max_pet_count,
        status: data.status,
        notes: data.notes || null,
        active: data.active,
      };

      if (cage) {
        const { error } = await supabase
          .from("cages")
          .update(payload)
          .eq("id", cage.id);

        if (error) throw error;
        toast.success("Cage updated successfully");
      } else {
        const { error } = await supabase.from("cages").insert([payload]);

        if (error) throw error;
        toast.success("Cage created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving cage:", error);
      toast.error("Failed to save cage");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{cage ? "Edit Cage" : "Add Cage"}</DialogTitle>
          <DialogDescription>
            {cage ? "Update cage information" : "Add a new cage to a room"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="room_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.buildings?.name} - {room.name}
                          {room.room_number && ` (${room.room_number})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Large Dog Cage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cage_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cage Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., C-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Small, Medium, Large"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_pet_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Pet Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g., 1"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Is this cage currently active?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{cage ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface StaffTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffType?: any;
  onSuccess: () => void;
}

export function StaffTypeDialog({
  open,
  onOpenChange,
  staffType,
  onSuccess,
}: StaffTypeDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  useEffect(() => {
    if (staffType) {
      form.reset({
        name: staffType.name,
        description: staffType.description || "",
        active: staffType.active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        active: true,
      });
    }
  }, [staffType, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        active: data.active,
      };

      if (staffType) {
        const { error } = await supabase
          .from("staff_types")
          .update(payload)
          .eq("id", staffType.id);

        if (error) throw error;
        toast.success("Staff type updated successfully");
      } else {
        const { error } = await supabase.from("staff_types").insert([payload]);

        if (error) throw error;
        toast.success("Staff type created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving staff type:", error);
      toast.error("Failed to save staff type");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {staffType ? "Edit Staff Type" : "Add Staff Type"}
          </DialogTitle>
          <DialogDescription>
            {staffType
              ? "Update staff type information"
              : "Add a new staff type to the system"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Doctor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description..."
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
                      Is this staff type currently active?
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
              <Button type="submit">
                {staffType ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address").min(1, "Email is required for login").max(255, "Email too long"),
  phone: z.string().max(20, "Phone number too long").optional().or(z.literal("")),
  specialization: z.string().max(255, "Specialization too long").optional().or(z.literal("")),
  license_number: z.string().max(100, "License number too long").optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: any;
  onSubmit: (values: StaffFormValues) => void;
  isLoading?: boolean;
}

export function StaffDialog({
  open,
  onOpenChange,
  staff,
  onSubmit,
  isLoading,
}: StaffDialogProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
      license_number: "",
      password: "",
      active: true,
    },
  });

  // Reset form when dialog opens with staff data
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: staff?.name || "",
        email: staff?.email || "",
        phone: staff?.phone || "",
        specialization: staff?.specialization || "",
        license_number: staff?.license_number || "",
        password: "",
        active: staff?.active ?? true,
      });
    }
  }, [open, staff, form]);

  const handleSubmit = (values: StaffFormValues) => {
    // Validate password for new staff
    if (!staff && (!values.password || values.password.length < 6)) {
      form.setError("password", {
        type: "manual",
        message: "Password must be at least 6 characters for new staff"
      });
      return;
    }
    // Validate password for edit if provided
    if (staff && values.password && values.password.length < 6) {
      form.setError("password", {
        type: "manual",
        message: "Password must be at least 6 characters"
      });
      return;
    }
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff" : "Add Staff"}</DialogTitle>
          <DialogDescription>
            {staff ? "Update staff member information" : "Add a new staff member"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password {staff && <span className="text-muted-foreground text-xs">(Leave blank to keep current)</span>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={staff ? "Enter new password to change" : "Login password"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Veterinarian, Surgeon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Professional license number" {...field} />
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
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {staff ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

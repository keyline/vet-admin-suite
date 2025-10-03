import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const donationFormSchema = z.object({
  donorName: z.string().min(1, "Donor name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  email: z.string().email().optional().or(z.literal("")),
  amount: z.number().min(1, "Amount must be greater than 0"),
});

type DonationFormValues = z.infer<typeof donationFormSchema>;

const Donations = () => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null);
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearchValue, setDonorSearchValue] = useState("");

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      donorName: "",
      phone: "",
      address: "",
      email: "",
      amount: 0,
    },
  });

  // Fetch all pet owners for autocomplete
  const { data: allOwners } = useQuery({
    queryKey: ["all_pet_owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_owners")
        .select("id, name, phone, address, email")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const generateDonationReceipt = async (
    donorName: string,
    donorAddress: string,
    amount: number,
    receiptNumber: string
  ) => {
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.setFontSize(20);
    doc.text("Donation Receipt", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Receipt Number: ${receiptNumber}`, 20, 40);
    doc.text(`Date: ${format(new Date(), "PPP")}`, 20, 50);
    
    doc.setFontSize(14);
    doc.text("Donor Information:", 20, 70);
    doc.setFontSize(12);
    doc.text(`Name: ${donorName}`, 20, 80);
    doc.text(`Address: ${donorAddress}`, 20, 90);
    
    doc.setFontSize(14);
    doc.text("Donation Details:", 20, 110);
    doc.setFontSize(12);
    doc.text(`Amount Received: ₹${amount.toFixed(2)}`, 20, 120);
    
    doc.setFontSize(10);
    doc.text("Thank you for your generous donation to our veterinary shelter.", 20, 150);
    doc.text("This receipt serves as confirmation of your contribution.", 20, 160);
    
    // Generate blob URL for preview
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setReceiptPdfUrl(pdfUrl);
    setShowReceiptDialog(true);
    
    // Return the blob for storage
    return pdfBlob;
  };

  const createDonation = useMutation({
    mutationFn: async (values: DonationFormValues) => {
      // First, ensure the donor exists in pet_owners
      const { data: existingOwner } = await supabase
        .from("pet_owners")
        .select("id")
        .eq("phone", values.phone)
        .maybeSingle();

      let ownerId: string;

      if (existingOwner) {
        // Update existing owner
        await supabase
          .from("pet_owners")
          .update({
            name: values.donorName,
            address: values.address,
            email: values.email || null,
          })
          .eq("id", existingOwner.id);
        ownerId = existingOwner.id;
      } else {
        // Create new owner
        const { data: newOwner, error: ownerError } = await supabase
          .from("pet_owners")
          .insert({
            name: values.donorName,
            phone: values.phone,
            address: values.address,
            email: values.email || null,
          })
          .select()
          .single();

        if (ownerError) throw ownerError;
        ownerId = newOwner.id;
      }

      // Create a dummy pet for the donation (required by admissions table)
      const { data: pet, error: petError } = await supabase
        .from("pets")
        .insert({
          name: "Donation Entry",
          owner_id: ownerId,
          species: "Donation",
          gender: "male",
        })
        .select()
        .single();

      if (petError) throw petError;

      // Create admission record as donation
      const { data: admission, error: admissionError } = await supabase
        .from("admissions")
        .insert({
          pet_id: pet.id,
          reason: "Direct Donation",
          payment_received: values.amount,
          status: "discharged",
        })
        .select()
        .single();

      if (admissionError) throw admissionError;

      return { admission, values };
    },
    onSuccess: async ({ admission, values }) => {
      // Generate receipt
      const receiptNumber = admission.admission_number;
      await generateDonationReceipt(
        values.donorName,
        values.address,
        values.amount,
        receiptNumber
      );

      toast.success("Donation recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["owner_donations"] });
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record donation");
    },
  });

  const onSubmit = async (values: DonationFormValues) => {
    setIsSubmitting(true);
    try {
      await createDonation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDonorSelect = (owner: any) => {
    form.setValue("donorName", owner.name);
    form.setValue("phone", owner.phone);
    form.setValue("address", owner.address || "");
    form.setValue("email", owner.email || "");
    setDonorSearchOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Record Donation</h2>
          <p className="text-muted-foreground">Add a new donation and generate receipt</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Donation Details</CardTitle>
            <CardDescription>Enter donor information and donation amount</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="donorName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Donor Name *</FormLabel>
                      <Popover open={donorSearchOpen} onOpenChange={setDonorSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Select or enter donor name"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search donor..."
                              value={donorSearchValue}
                              onValueChange={setDonorSearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2">
                                  <p className="text-sm text-muted-foreground mb-2">
                                    No donor found.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      form.setValue("donorName", donorSearchValue);
                                      setDonorSearchOpen(false);
                                    }}
                                  >
                                    Use "{donorSearchValue}"
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {allOwners
                                  ?.filter((owner) =>
                                    owner.name
                                      .toLowerCase()
                                      .includes(donorSearchValue.toLowerCase())
                                  )
                                  .map((owner) => (
                                    <CommandItem
                                      key={owner.id}
                                      value={owner.name}
                                      onSelect={() => handleDonorSelect(owner)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          owner.name === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {owner.name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
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
                        <Input placeholder="Enter email (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donation Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Recording..." : "Record Donation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Donation Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {receiptPdfUrl && (
              <iframe
                src={receiptPdfUrl}
                className="w-full h-[600px] border rounded"
                title="Donation Receipt"
              />
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (receiptPdfUrl) {
                    const link = document.createElement("a");
                    link.href = receiptPdfUrl;
                    link.download = `donation-receipt-${format(new Date(), "yyyy-MM-dd")}.pdf`;
                    link.click();
                  }
                }}
              >
                Download PDF
              </Button>
              <Button
                onClick={() => {
                  setShowReceiptDialog(false);
                  if (receiptPdfUrl) {
                    URL.revokeObjectURL(receiptPdfUrl);
                    setReceiptPdfUrl(null);
                  }
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Donations;

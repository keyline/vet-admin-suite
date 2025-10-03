import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OwnerDialog } from "@/components/owners/OwnerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Owners = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<any>(null);
  const [donationsDialogOpen, setDonationsDialogOpen] = useState(false);
  const [selectedOwnerForDonations, setSelectedOwnerForDonations] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { canAdd, canEdit, canDelete } = usePermissions();

  const { data: owners, isLoading } = useQuery({
    queryKey: ["pet_owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_owners")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: donations } = useQuery({
    queryKey: ["owner_donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select(`
          payment_received, 
          admission_date, 
          admission_number,
          pets!inner (
            owner_id,
            pet_owners!inner (
              id,
              name
            )
          )
        `)
        .gt("payment_received", 0)
        .order("admission_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getDonationTotal = (ownerId: string) => {
    if (!donations) return 0;
    return donations
      .filter(d => d.pets?.pet_owners?.id === ownerId)
      .reduce((sum, d) => sum + (Number(d.payment_received) || 0), 0);
  };

  const getOwnerDonations = (ownerId: string) => {
    if (!donations) return [];
    return donations.filter(d => d.pets?.pet_owners?.id === ownerId);
  };

  const handleDonationClick = (owner: any) => {
    setSelectedOwnerForDonations(owner);
    setDonationsDialogOpen(true);
  };

  const generateDonationReceipt = (donation: any, owner: any) => {
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.setFontSize(20);
    doc.text("Donation Receipt", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Receipt Number: ${donation.admission_number}`, 20, 40);
    doc.text(`Date: ${format(new Date(donation.admission_date), "PPP")}`, 20, 50);
    
    doc.setFontSize(14);
    doc.text("Donor Information:", 20, 70);
    doc.setFontSize(12);
    doc.text(`Name: ${owner.name}`, 20, 80);
    doc.text(`Address: ${owner.address || "N/A"}`, 20, 90);
    doc.text(`Phone: ${owner.phone}`, 20, 100);
    if (owner.email) {
      doc.text(`Email: ${owner.email}`, 20, 110);
    }
    
    doc.setFontSize(14);
    doc.text("Donation Details:", 20, 130);
    doc.setFontSize(12);
    doc.text(`Amount Received: ₹${Number(donation.payment_received).toFixed(2)}`, 20, 140);
    
    doc.setFontSize(10);
    doc.text("Thank you for your generous donation to our veterinary shelter.", 20, 170);
    doc.text("This receipt serves as confirmation of your contribution.", 20, 180);
    
    // Generate blob URL for preview
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setReceiptPdfUrl(pdfUrl);
    setReceiptDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("pet_owners")
        .insert([values])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      toast({ title: "Owner created successfully" });
      setDialogOpen(false);
      setSelectedOwner(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { data, error } = await supabase
        .from("pet_owners")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      toast({ title: "Owner updated successfully" });
      setDialogOpen(false);
      setSelectedOwner(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pet_owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_owners"] });
      toast({ title: "Owner deleted successfully" });
      setDeleteDialogOpen(false);
      setOwnerToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (selectedOwner) {
      updateMutation.mutate({ id: selectedOwner.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (owner: any) => {
    setSelectedOwner(owner);
    setDialogOpen(true);
  };

  const handleDelete = (owner: any) => {
    setOwnerToDelete(owner);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pet Owners</h2>
            <p className="text-muted-foreground">Manage your client database</p>
          </div>
          {canAdd('pet_owners') && (
            <Button
              className="gap-2"
              onClick={() => {
                setSelectedOwner(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Owner
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Owners</CardTitle>
            <CardDescription>View and manage pet owners</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !owners || owners.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No owners found. Click "Add Owner" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Total Donations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((owner) => {
                    const totalDonations = getDonationTotal(owner.id);
                    return (
                      <TableRow key={owner.id}>
                        <TableCell className="font-medium">{owner.name}</TableCell>
                        <TableCell>{owner.email || "-"}</TableCell>
                        <TableCell>{owner.phone}</TableCell>
                        <TableCell>{owner.address || "-"}</TableCell>
                        <TableCell>
                          {totalDonations > 0 ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-semibold text-primary"
                              onClick={() => handleDonationClick(owner)}
                            >
                              ₹{totalDonations.toFixed(2)}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">₹0.00</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={owner.active ? "default" : "secondary"}>
                            {owner.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {canEdit('pet_owners') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(owner)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete('pet_owners') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(owner)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <OwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        owner={selectedOwner}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ownerToDelete && deleteMutation.mutate(ownerToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={donationsDialogOpen} onOpenChange={setDonationsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Donation History</DialogTitle>
            <DialogDescription>
              {selectedOwnerForDonations?.name}'s donation records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOwnerForDonations && getOwnerDonations(selectedOwnerForDonations.id).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getOwnerDonations(selectedOwnerForDonations.id).map((donation, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(donation.admission_date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>{donation.admission_number}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{Number(donation.payment_received).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => generateDonationReceipt(donation, selectedOwnerForDonations)}
                        >
                          <FileText className="h-4 w-4" />
                          View PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No donation records found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
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
                  setReceiptDialogOpen(false);
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

export default Owners;

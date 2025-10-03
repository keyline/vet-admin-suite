import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, CheckCircle, Mail, Eye } from "lucide-react";
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
import { PurchaseOrderDialog } from "@/components/purchases/PurchaseOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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

const PurchaseOrders = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [poToReceive, setPoToReceive] = useState<any>(null);
  const queryClient = useQueryClient();
  const { canAdd, canEdit } = usePermissions();

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          po_items (
            id,
            quantity,
            unit_price,
            total_price,
            medicine_id,
            medicines (
              name,
              unit
            )
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { po_items, ...poData } = values;
      
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert([poData])
        .select()
        .single();
      
      if (poError) throw poError;

      if (po_items && po_items.length > 0) {
        const items = po_items.map((item: any) => ({
          ...item,
          po_id: po.id,
        }));

        const { error: itemsError } = await supabase
          .from("po_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase order created successfully" });
      setDialogOpen(false);
      setSelectedPO(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating purchase order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { po_items, ...poData } = values;
      
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .update(poData)
        .eq("id", id)
        .select()
        .single();
      
      if (poError) throw poError;

      // Delete existing items
      await supabase.from("po_items").delete().eq("po_id", id);

      // Insert new items
      if (po_items && po_items.length > 0) {
        const items = po_items.map((item: any) => ({
          ...item,
          po_id: id,
        }));

        const { error: itemsError } = await supabase
          .from("po_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase order updated successfully" });
      setDialogOpen(false);
      setSelectedPO(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating purchase order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get PO items
      const { data: items, error: itemsError } = await supabase
        .from("po_items")
        .select("medicine_id, quantity")
        .eq("po_id", id);

      if (itemsError) throw itemsError;

      // Update stock for each medicine
      for (const item of items || []) {
        const { data: medicine } = await supabase
          .from("medicines")
          .select("stock_quantity")
          .eq("id", item.medicine_id)
          .single();

        if (medicine) {
          await supabase
            .from("medicines")
            .update({ stock_quantity: medicine.stock_quantity + item.quantity })
            .eq("id", item.medicine_id);
        }
      }

      // Update PO status
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({ status: "received" })
        .eq("id", id);

      if (poError) throw poError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Stock updated successfully" });
      setReceiveDialogOpen(false);
      setPoToReceive(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error receiving purchase order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (selectedPO) {
      updateMutation.mutate({ id: selectedPO.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (po: any) => {
    setSelectedPO(po);
    setDialogOpen(true);
  };

  const handleReceive = (po: any) => {
    setPoToReceive(po);
    setReceiveDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      submitted: "default",
      approved: "default",
      received: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
            <p className="text-muted-foreground">Manage medicine purchase orders</p>
          </div>
          {canAdd('medicines') && (
            <Button
              className="gap-2"
              onClick={() => {
                setSelectedPO(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Purchase Order
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
            <CardDescription>View and manage medicine purchase orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !purchaseOrders || purchaseOrders.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No purchase orders found. Click "New Purchase Order" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{po.vendor_name}</div>
                          {po.vendor_contact && (
                            <div className="text-sm text-muted-foreground">{po.vendor_contact}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(po.order_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{po.po_items?.length || 0} items</TableCell>
                      <TableCell>₹{Number(po.total_amount).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {canEdit('medicines') && po.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(po)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit('medicines') && po.status === 'submitted' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReceive(po)}
                            title="Mark as Received"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <PurchaseOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchaseOrder={selectedPO}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Receive Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the stock quantities for all items in this purchase order and mark it as received.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => poToReceive && receiveMutation.mutate(poToReceive.id)}
            >
              Confirm Receipt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PurchaseOrders;
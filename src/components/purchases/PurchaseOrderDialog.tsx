import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const poSchema = z.object({
  vendor_name: z.string().min(2, "Vendor name is required").max(255, "Vendor name too long"),
  vendor_contact: z.string().max(255, "Contact too long").optional(),
  order_date: z.string().min(1, "Order date is required"),
  expected_delivery: z.string().optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  status: z.enum(["draft", "submitted", "approved", "received", "cancelled"]).default("draft"),
  po_items: z.array(
    z.object({
      medicine_id: z.string().min(1, "Medicine is required"),
      quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(1000000, "Quantity too large"),
      unit_price: z.coerce.number().min(0, "Price must be positive").max(10000000, "Price too large"),
      total_price: z.coerce.number().min(0),
    })
  ).min(1, "At least one item is required"),
  total_amount: z.coerce.number().min(0),
});

type POFormValues = z.infer<typeof poSchema>;

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder?: any;
  onSubmit: (values: POFormValues) => void;
  isLoading?: boolean;
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSubmit,
  isLoading,
}: PurchaseOrderDialogProps) {
  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, unit, price_per_package")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendor_name: purchaseOrder?.vendor_name || "",
      vendor_contact: purchaseOrder?.vendor_contact || "",
      order_date: purchaseOrder?.order_date || new Date().toISOString().split('T')[0],
      expected_delivery: purchaseOrder?.expected_delivery || "",
      notes: purchaseOrder?.notes || "",
      status: purchaseOrder?.status || "draft",
      po_items: purchaseOrder?.po_items?.map((item: any) => ({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })) || [{ medicine_id: "", quantity: 1, unit_price: 0, total_price: 0 }],
      total_amount: purchaseOrder?.total_amount || 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "po_items",
  });

  React.useEffect(() => {
    if (purchaseOrder) {
      form.reset({
        vendor_name: purchaseOrder.vendor_name || "",
        vendor_contact: purchaseOrder.vendor_contact || "",
        order_date: purchaseOrder.order_date || new Date().toISOString().split('T')[0],
        expected_delivery: purchaseOrder.expected_delivery || "",
        notes: purchaseOrder.notes || "",
        status: purchaseOrder.status || "draft",
        po_items: purchaseOrder.po_items?.map((item: any) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })) || [{ medicine_id: "", quantity: 1, unit_price: 0, total_price: 0 }],
        total_amount: purchaseOrder.total_amount || 0,
      });
    }
  }, [purchaseOrder, form]);

  const calculateTotals = () => {
    const items = form.watch("po_items");
    const total = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    form.setValue("total_amount", total);
  };

  const handleMedicineChange = (index: number, medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (medicine) {
      form.setValue(`po_items.${index}.unit_price`, medicine.price_per_package);
      const quantity = form.watch(`po_items.${index}.quantity`);
      form.setValue(`po_items.${index}.total_price`, quantity * medicine.price_per_package);
      calculateTotals();
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const unitPrice = form.watch(`po_items.${index}.unit_price`);
    form.setValue(`po_items.${index}.total_price`, quantity * unitPrice);
    calculateTotals();
  };

  const handlePriceChange = (index: number, price: number) => {
    const quantity = form.watch(`po_items.${index}.quantity`);
    form.setValue(`po_items.${index}.total_price`, quantity * price);
    calculateTotals();
  };

  const handleSubmit = (values: POFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchaseOrder ? "Edit Purchase Order" : "New Purchase Order"}
          </DialogTitle>
          <DialogDescription>
            {purchaseOrder ? "Update purchase order details" : "Create a new medicine purchase order"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendor_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone or email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expected_delivery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ medicine_id: "", quantity: 1, unit_price: 0, total_price: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`po_items.${index}.medicine_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medicine</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleMedicineChange(index, value);
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select medicine" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {medicines.map((med) => (
                                    <SelectItem key={med.id} value={med.id}>
                                      {med.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`po_items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleQuantityChange(index, Number(e.target.value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`po_items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handlePriceChange(index, Number(e.target.value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`po_items.${index}.total_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            remove(index);
                            calculateTotals();
                          }}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} disabled />
                  </FormControl>
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
                    <Textarea placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {purchaseOrder ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
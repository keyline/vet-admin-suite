import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Package, AlertTriangle } from "lucide-react";

export default function Inventory() {
  const { data: medicines, isLoading } = useQuery({
    queryKey: ["medicines-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const getStockStatus = (stockQuantity: number, reorderLevel: number) => {
    if (stockQuantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stockQuantity <= reorderLevel) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">
              Current stock levels for all medicines
            </p>
          </div>
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medicine Stock</CardTitle>
            <CardDescription>
              Real-time inventory levels and reorder alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading inventory...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead className="text-right">Stock Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines?.map((medicine) => {
                    const status = getStockStatus(medicine.stock_quantity, medicine.reorder_level);
                    const needsReorder = medicine.stock_quantity <= medicine.reorder_level;
                    
                    return (
                      <TableRow key={medicine.id} className={needsReorder ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {needsReorder && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                            {medicine.name}
                          </div>
                        </TableCell>
                        <TableCell>{medicine.generic_name || "-"}</TableCell>
                        <TableCell>{medicine.manufacturer || "-"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {medicine.stock_quantity}
                        </TableCell>
                        <TableCell>{medicine.unit}</TableCell>
                        <TableCell className="text-right font-mono">
                          {medicine.reorder_level}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{medicine.unit_price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!medicines?.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No medicines found in inventory
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

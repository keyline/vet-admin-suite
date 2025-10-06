import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Donors = () => {
  const { data: donors, isLoading } = useQuery({
    queryKey: ["donors_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("donor_name, donor_phone, donor_email, total_value");
      
      if (error) throw error;

      // Group by donor_name and sum total_value
      const donorMap = new Map<string, { name: string; phone: string; email: string; total: number }>();
      
      data.forEach((donation) => {
        const key = donation.donor_phone || donation.donor_name;
        if (donorMap.has(key)) {
          const existing = donorMap.get(key)!;
          existing.total += Number(donation.total_value || 0);
        } else {
          donorMap.set(key, {
            name: donation.donor_name,
            phone: donation.donor_phone || "",
            email: donation.donor_email || "",
            total: Number(donation.total_value || 0),
          });
        }
      });

      return Array.from(donorMap.values()).sort((a, b) => b.total - a.total);
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Donors</h2>
          <p className="text-muted-foreground">View all donors and their total contributions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Donor Summary</CardTitle>
            <CardDescription>List of all donors with their total donation amounts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total Donated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors && donors.length > 0 ? (
                    donors.map((donor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{donor.name}</TableCell>
                        <TableCell>{donor.phone}</TableCell>
                        <TableCell>{donor.email || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{donor.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No donors found
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
};

export default Donors;

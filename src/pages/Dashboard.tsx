import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Users, Bed, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Fetch total pets (excluding expired and returned to owner)
  const { data: totalPets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["dashboard-pets"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .or("removed.eq.false,and(removed.eq.true,removal_reason.eq.Cured)");
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch pet owners
  const { data: totalOwners, isLoading: isOwnersLoading } = useQuery({
    queryKey: ["dashboard-owners"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pet_owners")
        .select("*", { count: "exact", head: true })
        .eq("active", true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch cage statistics and admitted pets
  const { data: cageStats, isLoading: isCagesLoading } = useQuery({
    queryKey: ["dashboard-cages"],
    queryFn: async () => {
      const { data: cages, error } = await supabase
        .from("cages")
        .select("id, max_pet_count")
        .eq("active", true);
      
      if (error) throw error;

      const totalCapacity = cages?.reduce((sum, cage) => sum + cage.max_pet_count, 0) || 0;
      
      // Get count of currently admitted pets (excluding removed)
      const { count: admittedCount } = await supabase
        .from("admissions")
        .select("pets!inner(*)", { count: "exact", head: true })
        .in("status", ["admitted", "pending"])
        .eq("pets.removed", false);
      
      // Get count of occupied cages
      const { count: occupiedCount } = await supabase
        .from("admissions")
        .select("cage_id", { count: "exact", head: true })
        .not("cage_id", "is", null)
        .in("status", ["admitted", "pending"]);
      
      return {
        admittedPets: admittedCount || 0,
        totalCapacity: totalCapacity,
        occupied: occupiedCount || 0,
        total: cages?.length || 0,
      };
    },
  });

  // Fetch donations for current month
  const { data: monthlyDonations, isLoading: isDonationsLoading } = useQuery({
    queryKey: ["dashboard-donations"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from("donations")
        .select("total_value")
        .gte("donation_date", startOfMonth.toISOString().split('T')[0])
        .lte("donation_date", endOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const total = data?.reduce((sum, donation) => sum + (Number(donation.total_value) || 0), 0) || 0;
      return total;
    },
  });

  const stats = [
    {
      title: "Admitted Pets",
      value: isCagesLoading ? <Skeleton className="h-8 w-24" /> : `${cageStats?.admittedPets || 0}/${cageStats?.totalCapacity || 0}`,
      description: "Admitted / Available spaces",
      icon: PawPrint,
      color: "text-primary",
    },
    {
      title: "Pet Owners",
      value: isOwnersLoading ? <Skeleton className="h-8 w-16" /> : totalOwners?.toString() || "0",
      description: "Active owners",
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Occupied Cages",
      value: isCagesLoading ? <Skeleton className="h-8 w-16" /> : `${cageStats?.occupied || 0}/${cageStats?.total || 0}`,
      description: "Available cages",
      icon: Bed,
      color: "text-warning",
    },
    {
      title: "Donation",
      value: isDonationsLoading ? <Skeleton className="h-8 w-24" /> : `₹${monthlyDonations?.toLocaleString('en-IN') || '0'}`,
      description: "This month",
      icon: DollarSign,
      color: "text-success",
    },
  ];

  const recentActivities = [
    {
      title: "Welcome to Veterinary Hospital ERP",
      description: "Start by adding pet owners and pets to the system",
      icon: AlertCircle,
    },
    {
      title: "Set Up Master Data",
      description: "Configure buildings, rooms, and cages",
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your veterinary practice management system</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates in your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <activity.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <button onClick={() => navigate('/admissions')} className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Add New Pet Owner</p>
                    <p className="text-xs text-muted-foreground">Register a new client</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors">
                  <PawPrint className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Admission a new Pet</p>
                    <p className="text-xs text-muted-foreground">Add a new pet to the system</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors">
                  <Bed className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium">New Admission</p>
                    <p className="text-xs text-muted-foreground">Admit a pet for treatment</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

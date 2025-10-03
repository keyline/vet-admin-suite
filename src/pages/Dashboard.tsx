import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Users, Bed, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Pets",
      value: "0",
      description: "Registered pets",
      icon: PawPrint,
      color: "text-primary",
    },
    {
      title: "Pet Owners",
      value: "0",
      description: "Active owners",
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Occupied Cages",
      value: "0/0",
      description: "Available cages",
      icon: Bed,
      color: "text-warning",
    },
    {
      title: "Revenue (MTD)",
      value: "$0",
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
                <button className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Add New Pet Owner</p>
                    <p className="text-xs text-muted-foreground">Register a new client</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors">
                  <PawPrint className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Register Pet</p>
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

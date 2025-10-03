import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Buildings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Buildings</h2>
            <p className="text-muted-foreground">Manage your facility structure</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Building
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Buildings</CardTitle>
            <CardDescription>Configure buildings, rooms, and cages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No buildings found. Click "Add Building" to get started.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Buildings;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import StaffLogin from "./pages/StaffLogin";
import Dashboard from "./pages/Dashboard";
import Owners from "./pages/Owners";
import Pets from "./pages/Pets";
import TreatmentHistory from "./pages/TreatmentHistory";
import Admissions from "./pages/Admissions";
import Donations from "./pages/Donations";
import Donors from "./pages/Donors";
import Buildings from "./pages/Buildings";
import Rooms from "./pages/Rooms";
import Cages from "./pages/Cages";
import Staff from "./pages/Staff";
import StaffRoleManagement from "./pages/StaffRoleManagement";
import Treatments from "./pages/Treatments";
import Medicines from "./pages/Medicines";
import PetTypes from "./pages/PetTypes";
import RoleManagement from "./pages/RoleManagement";
import DoctorDashboard from "./pages/DoctorDashboard";
import PurchaseOrders from "./pages/PurchaseOrders";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owners"
              element={
                <ProtectedRoute>
                  <Owners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pets"
              element={
                <ProtectedRoute>
                  <Pets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/treatment-history/:petId"
              element={
                <ProtectedRoute>
                  <TreatmentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions"
              element={
                <ProtectedRoute>
                  <Admissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations"
              element={
                <ProtectedRoute>
                  <Donations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donors"
              element={
                <ProtectedRoute>
                  <Donors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/buildings"
              element={
                <ProtectedRoute>
                  <Buildings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/rooms"
              element={
                <ProtectedRoute>
                  <Rooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/cages"
              element={
                <ProtectedRoute>
                  <Cages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/staff"
              element={
                <ProtectedRoute>
                  <Staff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff-roles"
              element={
                <ProtectedRoute>
                  <StaffRoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/treatments"
              element={
                <ProtectedRoute>
                  <Treatments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicines"
              element={
                <ProtectedRoute>
                  <Medicines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute>
                  <PurchaseOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters/pet-types"
              element={
                <ProtectedRoute>
                  <PetTypes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/role-management"
              element={
                <ProtectedRoute>
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Stethoscope,
  PawPrint,
  Pill,
  ClipboardList,
  Receipt,
  Package,
  Heart,
  LogOut,
  ChevronDown,
  Shield,
  Banknote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: null },
  { title: "Pet Owners", url: "/owners", icon: Users, module: "pet_owners" },
  { title: "Pets", url: "/pets", icon: PawPrint, module: "pets" },
  { title: "Admissions", url: "/admissions", icon: ClipboardList, module: "admissions" },
  { title: "Donations", url: "/donations", icon: Banknote, module: null },
  { title: "Inventory", url: "/inventory", icon: Package, module: "inventory" },
  { title: "Billing", url: "/billing", icon: Receipt, module: "billing" },
];

const masterItems = [
  { title: "Medicines", url: "/medicines", icon: Pill, module: "medicines" },
  { title: "Buildings", url: "/masters/buildings", icon: Building2, module: "buildings" },
  { title: "Rooms", url: "/masters/rooms", icon: Building2, module: "rooms" },
  { title: "Cages", url: "/masters/cages", icon: Building2, module: "cages" },
  { title: "Staff", url: "/masters/staff", icon: Users, module: "staff" },
  { title: "Staff Types", url: "/masters/staff-types", icon: Users, module: "staff_types" },
  { title: "Treatments", url: "/masters/treatments", icon: Heart, module: "treatments" },
  { title: "Pet Types", url: "/masters/pet-types", icon: PawPrint, module: "pet_types" },
];

const adminItems = [
  { title: "Role Management", url: "/role-management", icon: Shield, module: "role_management" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  const [mainMenuOpen, setMainMenuOpen] = useState(true);
  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) return;

      console.log('[AppSidebar] Fetching permissions for user:', user.id);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('[AppSidebar] User roles:', roles);

      if (!roles || roles.length === 0) {
        console.log('[AppSidebar] No roles found for user');
        setUserPermissions(new Set());
        setIsAdmin(false);
        return;
      }

      // Check if user is admin or superadmin
      const adminRole = roles.some(r => r.role === 'admin' || r.role === 'superadmin');
      setIsAdmin(adminRole);
      console.log('[AppSidebar] Is admin?', adminRole);

      // Check if user is a doctor
      const doctorRole = roles.some(r => r.role === 'doctor');
      setIsDoctor(doctorRole);
      console.log('[AppSidebar] Is doctor?', doctorRole);

      if (adminRole) {
        // Admins see everything, no need to fetch permissions
        return;
      }

      const { data: permissions } = await supabase
        .from('role_permissions')
        .select('module, permission')
        .in('role', roles.map(r => r.role))
        .eq('permission', 'view'); // Only check for view permissions

      console.log('[AppSidebar] Permissions fetched:', permissions);

      const permissionSet = new Set(permissions?.map(p => p.module) || []);
      console.log('[AppSidebar] Permission set:', Array.from(permissionSet));
      setUserPermissions(permissionSet);
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (module: string | null) => {
    if (!module) return true; // Dashboard is always accessible
    if (isAdmin) return true; // Admins see everything
    return userPermissions.has(module);
  };

  const filteredNavItems = navigationItems.filter(item => hasPermission(item.module));
  const filteredMasterItems = masterItems.filter(item => hasPermission(item.module));
  const filteredAdminItems = adminItems.filter(item => hasPermission(item.module));

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Heart className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="font-semibold text-sidebar-foreground">Vet ERP</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isDoctor && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/doctor-dashboard" end className={getNavCls}>
                      <Stethoscope className="h-4 w-4" />
                      {!collapsed && <span>My Patients</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Collapsible open={mainMenuOpen} onOpenChange={setMainMenuOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className={`cursor-pointer ${collapsed ? "sr-only" : "flex items-center justify-between"}`}>
                <span>Main Menu</span>
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${mainMenuOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={masterDataOpen} onOpenChange={setMasterDataOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className={`cursor-pointer ${collapsed ? "sr-only" : "flex items-center justify-between"}`}>
                <span>Master Data</span>
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${masterDataOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMasterItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className={`cursor-pointer ${collapsed ? "sr-only" : "flex items-center justify-between"}`}>
                <span>Administration</span>
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${adminMenuOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

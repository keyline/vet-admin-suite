import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
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
} from "lucide-react";
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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Pet Owners", url: "/owners", icon: Users },
  { title: "Admissions", url: "/admissions", icon: ClipboardList },
  { title: "Doctor Visits", url: "/visits", icon: Stethoscope },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Billing", url: "/billing", icon: Receipt },
];

const masterItems = [
  { title: "Pets", url: "/pets", icon: PawPrint },
  { title: "Medicines", url: "/medicines", icon: Pill },
  { title: "Buildings", url: "/masters/buildings", icon: Building2 },
  { title: "Staff", url: "/masters/staff", icon: Users },
  { title: "Treatments", url: "/masters/treatments", icon: Heart },
  { title: "Pet Types", url: "/masters/pet-types", icon: PawPrint },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  const [mainMenuOpen, setMainMenuOpen] = useState(true);
  const [masterDataOpen, setMasterDataOpen] = useState(true);

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
                  {navigationItems.map((item) => (
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
                  {masterItems.map((item) => (
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

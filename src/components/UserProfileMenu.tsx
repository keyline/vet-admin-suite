import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Lock } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: string;
}

export const UserProfileMenu = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRole();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
    setFormData({
      full_name: data.full_name || "",
      phone: data.phone || "",
      email: data.email || "",
      password: "",
    });
  };

  const fetchRole = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .single();

    setRole(data?.role || null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq("id", user?.id);

    if (profileError) {
      toast.error("Failed to update profile");
      return;
    }

    if (formData.password) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (passwordError) {
        toast.error("Failed to update password");
        return;
      }
    }

    toast.success("Profile updated successfully");
    setIsDialogOpen(false);
    fetchProfile();
  };

  const getInitials = () => {
    if (!profile?.full_name) return "U";
    return profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = () => {
    if (role === "superadmin") return "default";
    if (role === "admin") return "secondary";
    return "outline";
  };

  if (!profile) return null;

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 px-3 py-2 h-auto"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{profile.full_name}</span>
              {role && (
                <Badge variant={getRoleBadgeVariant()} className="text-xs">
                  {role}
                </Badge>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile.full_name}</span>
                <span className="text-xs text-muted-foreground">{profile.email}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPopoverOpen(false);
                setIsDialogOpen(true);
              }}
            >
              Edit Profile
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and password
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  className="pl-9"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={formData.email}
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-9"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password (Optional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

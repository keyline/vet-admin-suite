import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Defer any Supabase calls to avoid deadlocks
      if (session?.user) {
        setTimeout(() => {
          (async () => {
            try {
              await supabase.rpc("ensure_first_superadmin");
            } catch (_) {}
          })();
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        (async () => {
          try {
            await supabase.rpc("ensure_first_superadmin");
          } catch (_) {}
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast.error("Invalid email or password");
        return { error: { message: "Invalid email or password" } };
      }

      // Ensure initial admin bootstrap if roles are empty
      try {
        await supabase.rpc("ensure_first_superadmin");
      } catch (_) {}

      toast.success("Welcome back!");
      navigate("/dashboard");
      return { error: null };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      toast.error("Authentication failed. Please try again.");
      return { error: { message: "Authentication failed. Please try again." } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        if (error.message?.toLowerCase().includes('already registered') ||
            error.message?.toLowerCase().includes('already exists')) {
          toast.error("Unable to complete registration. Please contact support.");
          return { error: { message: "Unable to complete registration. Please contact support." } };
        }
        toast.error("Registration failed. Please try again.");
        return { error: { message: "Registration failed. Please try again." } };
      }

      try {
        await supabase.rpc("ensure_first_superadmin");
      } catch (_) {}

      toast.success("Account created successfully!");
      navigate("/dashboard");
      return { error: null };
    } catch (error: any) {
      console.error('Sign up exception:', error);
      toast.error("Registration failed. Please try again.");
      return { error: { message: "Registration failed. Please try again." } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

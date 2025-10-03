import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const passwordSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const otpRequestSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
});

const otpVerifySchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const StaffLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { phone: "", password: "" },
  });

  const otpRequestForm = useForm({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { phone: "" },
  });

  const otpVerifyForm = useForm({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { phone: "", otp: "" },
  });

  const handlePasswordLogin = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        phone: values.phone,
        password: values.password,
      });

      if (error) throw error;

      toast({ title: "Login successful" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (values: z.infer<typeof otpRequestSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: values.phone,
      });

      if (error) throw error;

      setOtpSent(true);
      otpVerifyForm.setValue("phone", values.phone);
      toast({ title: "OTP sent to your phone" });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (values: z.infer<typeof otpVerifySchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: values.phone,
        token: values.otp,
        type: "sms",
      });

      if (error) throw error;

      toast({ title: "Login successful" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Staff Login</CardTitle>
          <CardDescription>Login to access the veterinary hospital system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="otp">
              {!otpSent ? (
                <Form {...otpRequestForm}>
                  <form onSubmit={otpRequestForm.handleSubmit(handleOtpRequest)} className="space-y-4">
                    <FormField
                      control={otpRequestForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending..." : "Send OTP"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...otpVerifyForm}>
                  <form onSubmit={otpVerifyForm.handleSubmit(handleOtpVerify)} className="space-y-4">
                    <FormField
                      control={otpVerifyForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enter OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setOtpSent(false)}
                    >
                      Back
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLogin;

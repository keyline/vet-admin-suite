import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const admissionFormSchema = z.object({
  // Owner information
  unknownOwner: z.boolean().default(false),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  broughtBy: z.string().optional(),
  
  // Pet information
  petName: z.string().optional(),
  species: z.string().min(1, "Species is required"),
  gender: z.enum(["male", "female"], { required_error: "Gender is required" }),
  age: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  color: z.string().optional(),
  breed: z.string().optional(),
  
  // Admission details
  admissionDate: z.date(),
  cageId: z.string().optional(),
  doctorId: z.string().optional(),
  reason: z.string().min(1, "Reason for admission is required"),
  
  // Medical information
  xrayDate: z.date().optional(),
  operationDate: z.date().optional(),
  antibioticDay1: z.string().optional(),
  antibioticDay2: z.string().optional(),
  antibioticDay3: z.string().optional(),
  antibioticDay5: z.string().optional(),
  bloodTestReport: z.string().optional(),
  
  // Payment
  paymentReceived: z.number().min(0).optional(),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

const Admissions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const petId = searchParams.get("petId");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      admissionDate: new Date(),
      gender: "male",
      paymentReceived: 0,
      unknownOwner: false,
    },
  });

  const unknownOwner = form.watch("unknownOwner");

  // Fetch pet and admission data if petId is provided
  const { data: petData, isLoading: isPetLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase
        .from("pets")
        .select(`
          *,
          pet_owners (
            id,
            name,
            phone,
            address,
            email
          ),
          admissions (
            id,
            admission_date,
            cage_id,
            doctor_id,
            reason,
            brought_by,
            xray_date,
            operation_date,
            antibiotics_schedule,
            blood_test_report,
            payment_received
          )
        `)
        .eq("id", petId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!petId,
  });

  // Pre-fill form when pet data is loaded
  useEffect(() => {
    if (petData && petData.admissions && petData.admissions[0]) {
      const admission = petData.admissions[0];
      const owner = petData.pet_owners;
      const antibiotics = admission.antibiotics_schedule as any;

      form.reset({
        // Owner information
        unknownOwner: owner?.name === "Unknown Owner",
        ownerName: owner?.name !== "Unknown Owner" ? owner?.name : "",
        ownerPhone: owner?.phone !== "0000000000" ? owner?.phone : "",
        ownerAddress: owner?.address !== "Unknown" ? owner?.address : "",
        ownerEmail: owner?.email || "",
        broughtBy: admission.brought_by || "",
        
        // Pet information
        species: petData.species,
        gender: petData.gender as "male" | "female",
        age: petData.age || undefined,
        weight: petData.weight || undefined,
        color: petData.color || "",
        breed: petData.breed || "",
        
        // Admission details
        admissionDate: new Date(admission.admission_date),
        cageId: admission.cage_id || "",
        doctorId: (admission as any).doctor_id || "",
        reason: admission.reason,
        
        // Medical information
        xrayDate: admission.xray_date ? new Date(admission.xray_date) : undefined,
        operationDate: admission.operation_date ? new Date(admission.operation_date) : undefined,
        antibioticDay1: antibiotics?.day1 || "",
        antibioticDay2: antibiotics?.day2 || "",
        antibioticDay3: antibiotics?.day3 || "",
        antibioticDay5: antibiotics?.day5 || "",
        bloodTestReport: admission.blood_test_report || "",
        
        // Payment
        paymentReceived: admission.payment_received || 0,
      });
    }
  }, [petData, form]);

  // Fetch available cages
  const { data: cages } = useQuery({
    queryKey: ["cages", "available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cages")
        .select("id, cage_number, name, max_pet_count, rooms(name)")
        .eq("active", true)
        .order("cage_number");
      
      if (error) throw error;
      
      // Get current count for each cage to display occupancy
      const cagesWithCount = await Promise.all(
        (data || []).map(async (cage) => {
          const { data: currentCount } = await supabase.rpc(
            'get_cage_current_pet_count',
            { cage_uuid: cage.id }
          );
          
          return {
            ...cage,
            current_count: currentCount || 0,
            is_available: (currentCount || 0) < cage.max_pet_count,
          };
        })
      );
      
      // Show all cages that have space available
      return cagesWithCount.filter(cage => cage.is_available);
    },
  });

  // Fetch pet types
  const { data: petTypes } = useQuery({
    queryKey: ["pet_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_types")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch staff
  const { data: staff } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch doctors only (staff with doctor type)
  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select(`
          id,
          name,
          staff_types!inner (
            name,
            role_mapping
          )
        `)
        .eq("active", true)
        .eq("staff_types.role_mapping", "doctor")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (values: AdmissionFormValues) => {
    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create an admission");
        return;
      }

      const isEditMode = !!petId && !!petData;

      // 1. Create or update owner
      let ownerId: string;
      
      if (isEditMode) {
        // Update existing owner
        ownerId = petData.pet_owners?.id;
        
        if (!values.unknownOwner) {
          await supabase
            .from("pet_owners")
            .update({
              name: values.ownerName!,
              phone: values.ownerPhone!,
              address: values.ownerAddress,
              email: values.ownerEmail || null,
            })
            .eq("id", ownerId);
        }
      } else {
        // Create new owner (existing logic)
        if (values.unknownOwner) {
          const { data: unknownOwnerData, error: unknownOwnerError } = await supabase
            .from("pet_owners")
            .insert({
              name: "Unknown Owner",
              phone: "0000000000",
              address: "Unknown",
            })
            .select()
            .single();

          if (unknownOwnerError) throw unknownOwnerError;
          ownerId = unknownOwnerData.id;
        } else {
          const { data: existingOwner } = await supabase
            .from("pet_owners")
            .select("id")
            .eq("phone", values.ownerPhone!)
            .maybeSingle();

          if (existingOwner) {
            ownerId = existingOwner.id;
            await supabase
              .from("pet_owners")
              .update({
                name: values.ownerName!,
                address: values.ownerAddress,
                email: values.ownerEmail || null,
              })
              .eq("id", ownerId);
          } else {
            const { data: newOwner, error: ownerError } = await supabase
              .from("pet_owners")
              .insert({
                name: values.ownerName!,
                phone: values.ownerPhone!,
                address: values.ownerAddress,
                email: values.ownerEmail || null,
              })
              .select()
              .single();

            if (ownerError) throw ownerError;
            ownerId = newOwner.id;
          }
        }
      }

      // 2. Create or update pet
      let petRecordId: string;
      
      if (isEditMode) {
        // Update existing pet
        const { error: petError } = await supabase
          .from("pets")
          .update({
            species: values.species,
            gender: values.gender,
            age: values.age,
            weight: values.weight,
            color: values.color,
            breed: values.breed,
          })
          .eq("id", petId);

        if (petError) throw petError;
        petRecordId = petId;
      } else {
        // Create new pet
        const { data: pet, error: petError } = await supabase
          .from("pets")
          .insert({
            name: values.petName || "Unknown",
            owner_id: ownerId,
            species: values.species,
            gender: values.gender,
            age: values.age,
            weight: values.weight,
            color: values.color,
            breed: values.breed,
          })
          .select()
          .single();

        if (petError) throw petError;
        petRecordId = pet.id;
      }

      // 3. Prepare antibiotics schedule
      const antibioticsSchedule = {
        day1: values.antibioticDay1 || null,
        day2: values.antibioticDay2 || null,
        day3: values.antibioticDay3 || null,
        day5: values.antibioticDay5 || null,
      };

      // 4. Create or update admission
      if (isEditMode && petData.admissions && petData.admissions[0]) {
        // Update existing admission
        const admissionId = petData.admissions[0].id;
        const { error: admissionError } = await supabase
          .from("admissions")
          .update({
            admission_date: values.admissionDate.toISOString(),
            cage_id: values.cageId || null,
            doctor_id: values.doctorId || null,
            reason: values.reason,
            brought_by: values.broughtBy === "unknown" ? null : values.broughtBy,
            xray_date: values.xrayDate?.toISOString().split('T')[0] || null,
            operation_date: values.operationDate?.toISOString().split('T')[0] || null,
            antibiotics_schedule: antibioticsSchedule as any,
            blood_test_report: values.bloodTestReport || null,
            payment_received: values.paymentReceived || 0,
          })
          .eq("id", admissionId);

        if (admissionError) throw admissionError;
      } else {
        // Create new admission
        const { error: admissionError } = await supabase
          .from("admissions")
          .insert([{
            pet_id: petRecordId,
            admission_date: values.admissionDate.toISOString(),
            cage_id: values.cageId || null,
            doctor_id: values.doctorId || null,
            admitted_by: null,
            reason: values.reason,
            brought_by: values.broughtBy === "unknown" ? null : values.broughtBy,
            xray_date: values.xrayDate?.toISOString().split('T')[0] || null,
            operation_date: values.operationDate?.toISOString().split('T')[0] || null,
            antibiotics_schedule: antibioticsSchedule as any,
            blood_test_report: values.bloodTestReport || null,
            payment_received: values.paymentReceived || 0,
            status: "admitted" as any,
          }])
          .select()
          .single();

        if (admissionError) throw admissionError;
      }

      // 5. Update cage status if assigned
      if (values.cageId) {
        await supabase
          .from("cages")
          .update({ status: "occupied" })
          .eq("id", values.cageId);
      }

      toast.success(isEditMode ? "Admission updated successfully" : "Admission created successfully");
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      navigate("/pets");
    } catch (error: any) {
      console.error("Error saving admission:", error);
      toast.error(error.message || "Failed to save admission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Admission</h2>
          <p className="text-muted-foreground">Create a new pet admission record</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle>Admission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admissionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Admission *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cage No.</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cage (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {cages?.map((cage) => (
                              <SelectItem key={cage.id} value={cage.id}>
                                {cage.cage_number} - {cage.name} ({cage.rooms?.name}) - {cage.current_count}/{cage.max_pet_count}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Doctor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover z-50">
                          {doctors?.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="unknownOwner"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Unknown Owner</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admitted By</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Owner name" 
                          {...field} 
                          disabled={unknownOwner}
                          className={unknownOwner ? "opacity-50 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Address" 
                          {...field} 
                          disabled={unknownOwner}
                          className={unknownOwner ? "opacity-50 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Phone number" 
                            {...field} 
                            disabled={unknownOwner}
                            className={unknownOwner ? "opacity-50 cursor-not-allowed" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Email (optional)" 
                            {...field} 
                            disabled={unknownOwner}
                            className={unknownOwner ? "opacity-50 cursor-not-allowed" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="broughtBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brought to the Shelter By</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          {staff?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pet Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details of Animals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="species"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Species *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select species" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {petTypes?.map((type) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Male</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Female</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (years)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Age"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Weight"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colour</FormLabel>
                        <FormControl>
                          <Input placeholder="Black / Brown / Fawn / White / Ash" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed / Others</FormLabel>
                        <FormControl>
                          <Input placeholder="Breed or other details" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason of Admission *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the reason for admission" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="xrayDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of X-Ray</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Operation</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Antibiotic Given</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="antibioticDay1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Medicine" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="antibioticDay2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Medicine" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="antibioticDay3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day 3</FormLabel>
                          <FormControl>
                            <Input placeholder="Medicine" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="antibioticDay5"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day 5</FormLabel>
                          <FormControl>
                            <Input placeholder="Medicine" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="bloodTestReport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Test Report</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter blood test report details" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Received</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/pets")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (petId ? "Updating..." : "Creating...") 
                  : (petId ? "Update Admission" : "Create Admission")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
};

export default Admissions;

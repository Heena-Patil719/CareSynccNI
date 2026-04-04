import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.string().min(1, "Blood Group is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  emergencyName: z.string().min(1, "Emergency Contact Name required"),
  emergencyRelation: z.string().min(1, "Relation required"),
  emergencyPhone: z.string().min(1, "Emergency Phone required"),
  address: z.string().min(1, "Address is required"),
  ward: z.string().min(1, "Ward is required"),
  bedNumber: z.string().min(1, "Bed Number is required"),
  admittedAt: z.string().min(1, "Admitted Date is required"),
  assignedDoctor: z.string().min(1, "Doctor is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  status: z.enum(["admitted", "discharged", "critical", "stable", "under observation"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPatientModal({ open, onOpenChange }: AddPatientModalProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "Male",
      status: "admitted",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        contact: {
          phone: data.phone,
          email: data.email || undefined,
          emergencyContact: {
            name: data.emergencyName,
            relation: data.emergencyRelation,
            phone: data.emergencyPhone,
          },
        },
        address: data.address,
        ward: data.ward,
        bedNumber: data.bedNumber,
        admittedAt: new Date(data.admittedAt).toISOString(),
        status: data.status,
        assignedDoctor: data.assignedDoctor,
        diagnosis: data.diagnosis,
        notes: data.notes,
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create patient");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient added successfully");
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Age *</Label>
              <Input type="number" {...register("age")} />
              {errors.age && <p className="text-red-500 text-xs">{errors.age.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select
                onValueChange={(val: "Male" | "Female" | "Other") => setValue("gender", val)}
                defaultValue={watch("gender")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Blood Group *</Label>
              <Input {...register("bloodGroup")} placeholder="e.g. O+" />
              {errors.bloodGroup && <p className="text-red-500 text-xs">{errors.bloodGroup.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...register("emergencyName")} />
                {errors.emergencyName && <p className="text-red-500 text-xs">{errors.emergencyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Relation *</Label>
                <Input {...register("emergencyRelation")} />
                {errors.emergencyRelation && <p className="text-red-500 text-xs">{errors.emergencyRelation.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input {...register("emergencyPhone")} />
                {errors.emergencyPhone && <p className="text-red-500 text-xs">{errors.emergencyPhone.message}</p>}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Address *</Label>
              <Input {...register("address")} />
              {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Ward *</Label>
              <Input {...register("ward")} placeholder="e.g. ICU" />
              {errors.ward && <p className="text-red-500 text-xs">{errors.ward.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Bed Number *</Label>
              <Input {...register("bedNumber")} />
              {errors.bedNumber && <p className="text-red-500 text-xs">{errors.bedNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Admitted Date *</Label>
              <Input type="date" {...register("admittedAt")} />
              {errors.admittedAt && <p className="text-red-500 text-xs">{errors.admittedAt.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                onValueChange={(val: "admitted" | "discharged" | "critical" | "stable" | "under observation") => setValue("status", val)}
                defaultValue={watch("status")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admitted">Admitted</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="under observation">Under Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned Doctor *</Label>
              <Input {...register("assignedDoctor")} />
              {errors.assignedDoctor && <p className="text-red-500 text-xs">{errors.assignedDoctor.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Diagnosis *</Label>
              <Input {...register("diagnosis")} />
              {errors.diagnosis && <p className="text-red-500 text-xs">{errors.diagnosis.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Notes</Label>
              <Textarea {...register("notes")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Save Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

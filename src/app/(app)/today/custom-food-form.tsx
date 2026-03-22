"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const customFoodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  servingLabel: z.string().min(1, "Serving label required"),
  servingGrams: z.coerce.number().positive("Must be positive"),
  calories: z.coerce.number().min(0, "Cannot be negative"),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0),
});

type CustomFoodFormData = z.infer<typeof customFoodSchema>;

interface CustomFoodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (food: { id: string; name: string }) => void;
}

export function CustomFoodForm({ open, onOpenChange, onCreated }: CustomFoodFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomFoodFormData>({
    resolver: zodResolver(customFoodSchema),
    defaultValues: {
      servingLabel: "100g",
      servingGrams: 100,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  });

  async function onSubmit(data: CustomFoodFormData) {
    try {
      const res = await fetch("/api/v1/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        toast.error("Failed to create food");
        return;
      }
      const created = await res.json() as { id: string; name: string };
      toast.success(`"${data.name}" added to My Foods`);
      reset();
      onOpenChange(false);
      onCreated(created);
    } catch {
      toast.error("Failed to create food. Please try again.");
    }
  }

  function field(
    id: keyof CustomFoodFormData,
    label: string,
    type: string = "text",
    placeholder?: string
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}
        >
          {label}
        </label>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          step={type === "number" ? "0.1" : undefined}
          {...register(id)}
        />
        {errors[id] && (
          <p style={{ fontSize: 12, color: "var(--color-rose)" }}>
            {errors[id]?.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Create Custom Food</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 overflow-y-auto p-4"
          style={{ maxHeight: "70vh" }}
        >
          {field("name", "Food Name", "text", "e.g. My Protein Bar")}
          {field("brand", "Brand (optional)", "text", "e.g. Brand Co")}

          <div className="grid grid-cols-2 gap-3">
            {field("servingLabel", "Serving Size Label", "text", "e.g. 1 bar")}
            {field("servingGrams", "Serving Weight (g)", "number", "100")}
          </div>

          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-muted)", marginTop: 4 }}>
            Nutrition per 100g
          </p>

          <div className="grid grid-cols-2 gap-3">
            {field("calories", "Calories (kcal)", "number", "0")}
            {field("protein", "Protein (g)", "number", "0")}
            {field("carbs", "Carbs (g)", "number", "0")}
            {field("fat", "Fat (g)", "number", "0")}
            {field("fiber", "Fiber (g)", "number", "0")}
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Saving..." : "Save to My Foods"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

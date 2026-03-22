"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UtensilsCrossed, Clock, ChevronLeft, Flame } from "lucide-react";
import { toast } from "sonner";

interface Ingredient {
  id: string;
  foodId: string;
  displayLabel: string;
  quantityG: number;
  sortOrder: number;
  optional: boolean;
}

interface RecipeDetail {
  id: string;
  title: string;
  description: string | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing: number;
  servings: number;
  prepTimeMins: number;
  cookTimeMins: number;
  difficulty: string;
  tags: string[];
  steps: string[];
  ingredients: Ingredient[];
  coverImageUrl: string | null;
}

const MEAL_SLOTS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "morning_snack", label: "Morning Snack" },
  { id: "lunch", label: "Lunch" },
  { id: "afternoon_snack", label: "Afternoon Snack" },
  { id: "dinner", label: "Dinner" },
  { id: "evening_snack", label: "Evening Snack" },
  { id: "other", label: "Other" },
];

async function fetchRecipe(id: string): Promise<RecipeDetail> {
  const res = await fetch(`/api/v1/recipes/${id}`);
  if (!res.ok) throw new Error("Recipe not found");
  return res.json();
}

async function logRecipe(recipeId: string, mealSlot: string, date: string) {
  const res = await fetch(`/api/v1/recipes/${recipeId}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealSlot, date }),
  });
  if (!res.ok) throw new Error("Failed to log recipe");
  return res.json();
}

function MacroBar({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        backgroundColor: `color-mix(in srgb, ${color} 8%, var(--color-surface))`,
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        flex: 1,
        minWidth: 70,
      }}
    >
      <span style={{ fontSize: "1.1rem", fontWeight: 700, color }}>
        {Math.round(value)}
        <span style={{ fontSize: "0.65rem", fontWeight: 500 }}>{unit}</span>
      </span>
      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 2 }}>
        {label}
      </span>
    </div>
  );
}

function LogModal({
  recipeId,
  onClose,
}: {
  recipeId: string;
  onClose: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState("breakfast");
  const today = new Date().toISOString().slice(0, 10);

  const mutation = useMutation({
    mutationFn: () => logRecipe(recipeId, selectedSlot, today),
    onSuccess: () => {
      toast.success("Recipe logged!");
      onClose();
    },
    onError: () => {
      toast.error("Failed to log recipe. Are you signed in?");
    },
  });

  return (
    <div
      style={{
        position: "fixed" as const,
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
        padding: "0 0 0 0",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          padding: "24px",
          width: "100%",
          maxWidth: 480,
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>
          Log recipe to meal
        </h3>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 20 }}>
          {MEAL_SLOTS.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid",
                borderColor: selectedSlot === slot.id ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: selectedSlot === slot.id
                  ? "color-mix(in srgb, var(--color-primary) 8%, transparent)"
                  : "transparent",
                color: selectedSlot === slot.id ? "var(--color-primary)" : "var(--color-text)",
                textAlign: "left" as const,
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: selectedSlot === slot.id ? 600 : 400,
                transition: "all 150ms ease",
              }}
            >
              {slot.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{ flex: 1, backgroundColor: "var(--color-primary)", color: "white" }}
          >
            {mutation.isPending ? "Logging…" : "Log meal"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="animate-pulse"
      aria-busy="true"
      style={{ padding: "24px 24px 40px", maxWidth: 720 }}
    >
      <div style={{ height: 220, borderRadius: "var(--radius-xl)", backgroundColor: "var(--color-surface-alt)", marginBottom: 24 }} />
      <div style={{ height: 24, width: "60%", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-border)", marginBottom: 12 }} />
      <div style={{ height: 14, width: "80%", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-border)" }} />
    </div>
  );
}

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [showLogModal, setShowLogModal] = useState(false);

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !recipe) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <UtensilsCrossed size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "var(--color-text-muted)" }} />
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 8 }}>Recipe not found</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>
          This recipe doesn&apos;t exist or may have been removed.
        </p>
        <Link href="/recipes">
          <Button variant="outline">Browse recipes</Button>
        </Link>
      </div>
    );
  }

  const totalTime = recipe.prepTimeMins + recipe.cookTimeMins;

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 720 }}>
      {/* Back link */}
      <Link
        href="/recipes"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontSize: "0.85rem",
          marginBottom: 20,
        }}
      >
        <ChevronLeft size={16} />
        All recipes
      </Link>

      {/* Hero */}
      <div
        style={{
          height: "200px",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-surface-alt)), var(--color-surface-alt))",
          borderRadius: "var(--radius-xl)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <UtensilsCrossed size={56} style={{ color: "var(--color-primary)", opacity: 0.45 }} />
      </div>

      {/* Title + metadata */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", flex: 1 }}>
            {recipe.title}
          </h1>
          <Button
            onClick={() => setShowLogModal(true)}
            style={{ backgroundColor: "var(--color-primary)", color: "white", flexShrink: 0 }}
          >
            Log as meal
          </Button>
        </div>

        {recipe.description && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
            {recipe.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Flame size={13} style={{ color: "var(--color-accent)" }} />
            <strong style={{ color: "var(--color-accent)" }}>{Math.round(recipe.caloriesPerServing)}</strong> kcal / serving
          </span>
          {totalTime > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={13} />
              {totalTime} min total
            </span>
          )}
          <span style={{ textTransform: "capitalize" as const }}>{recipe.difficulty}</span>
          <span>{recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Macro bars */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        <MacroBar label="Protein" value={recipe.proteinPerServing} unit="g" color="var(--color-macro-protein)" />
        <MacroBar label="Carbs" value={recipe.carbsPerServing} unit="g" color="var(--color-macro-carbs)" />
        <MacroBar label="Fat" value={recipe.fatPerServing} unit="g" color="var(--color-macro-fat)" />
        <MacroBar label="Fiber" value={recipe.fiberPerServing} unit="g" color="var(--color-macro-fiber)" />
      </div>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader>
            <CardTitle style={{ fontSize: "1rem" }}>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {recipe.ingredients
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((ing) => (
                  <li
                    key={ing.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid var(--color-border)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "var(--color-text)" }}>{ing.displayLabel}</span>
                    {ing.optional && (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>(optional)</span>
                    )}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {recipe.steps.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader>
            <CardTitle style={{ fontSize: "1rem" }}>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {recipe.steps.map((step, i) => (
                <li key={i} style={{ display: "flex", gap: 14 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      color: "var(--color-primary)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text)", paddingTop: 4, lineHeight: "1.6" }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <Button
        onClick={() => setShowLogModal(true)}
        style={{
          backgroundColor: "var(--color-primary)",
          color: "white",
          width: "100%",
          padding: "12px",
          fontSize: "0.95rem",
        }}
      >
        Log as meal
      </Button>

      {showLogModal && (
        <LogModal
          recipeId={recipe.id}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  );
}

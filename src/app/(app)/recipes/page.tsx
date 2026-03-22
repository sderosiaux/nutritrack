"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UtensilsCrossed, Clock, Flame } from "lucide-react";

interface RecipeSummary {
  id: string;
  title: string;
  description: string | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  servings: number;
  prepTimeMins: number;
  cookTimeMins: number;
  difficulty: string;
  tags: string[];
  coverImageUrl: string | null;
}

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
  { id: "dessert", label: "Dessert" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--color-primary)",
  medium: "var(--color-accent)",
  hard: "var(--color-macro-fat)",
};

async function fetchRecipes(category?: string): Promise<{ recipes: RecipeSummary[]; total: number }> {
  const params = new URLSearchParams({ limit: "100" });
  if (category) params.set("category", category);
  const res = await fetch(`/api/v1/recipes?${params}`);
  if (!res.ok) throw new Error("Failed to load recipes");
  return res.json();
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = DIFFICULTY_COLORS[difficulty] ?? "var(--color-text-muted)";
  return (
    <span
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderRadius: "var(--radius-full)",
        padding: "2px 10px",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "capitalize" as const,
        display: "inline-block",
      }}
    >
      {difficulty}
    </span>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const totalTime = recipe.prepTimeMins + recipe.cookTimeMins;
  return (
    <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: "none" }}>
      <Card
        style={{
          height: "100%",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          cursor: "pointer",
        }}
        className="hover:shadow-md hover:-translate-y-0.5"
      >
        {/* Thumbnail */}
        <div
          style={{
            height: "130px",
            background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-alt)), var(--color-surface-alt))",
            borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UtensilsCrossed
            size={36}
            style={{ color: "var(--color-primary)", opacity: 0.5 }}
          />
        </div>

        <CardHeader style={{ paddingBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
          </div>
          <CardTitle style={{ fontSize: "0.92rem", lineHeight: "1.35" }}>
            {recipe.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {recipe.description && (
            <CardDescription style={{ marginBottom: 8, fontSize: "0.8rem" }}>
              {recipe.description.slice(0, 70)}{recipe.description.length > 70 ? "…" : ""}
            </CardDescription>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--color-accent)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Flame size={12} />
              {Math.round(recipe.caloriesPerServing)} kcal
            </span>
            {totalTime > 0 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Clock size={12} />
                {totalTime} min
              </span>
            )}
          </div>

          {/* Macro pills */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[
              { label: "P", value: recipe.proteinPerServing, color: "var(--color-macro-protein)" },
              { label: "C", value: recipe.carbsPerServing, color: "var(--color-macro-carbs)" },
              { label: "F", value: recipe.fatPerServing, color: "var(--color-macro-fat)" },
            ].map(({ label, value, color }) => (
              <span
                key={label}
                style={{
                  fontSize: "0.68rem",
                  color,
                  backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                  borderRadius: "var(--radius-sm)",
                  padding: "1px 6px",
                  fontWeight: 600,
                }}
              >
                {label} {Math.round(value)}g
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div style={{ height: 130, backgroundColor: "var(--color-surface-alt)" }} />
      <div style={{ padding: "16px 24px 24px" }}>
        <div style={{ height: 10, width: 60, borderRadius: "var(--radius-full)", backgroundColor: "var(--color-border)", marginBottom: 10 }} />
        <div style={{ height: 14, width: "80%", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-border)", marginBottom: 8 }} />
        <div style={{ height: 10, width: "55%", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-border)" }} />
      </div>
    </div>
  );
}

function EmptyState({ category }: { category: string }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "64px 24px",
        color: "var(--color-text-muted)",
      }}
    >
      <UtensilsCrossed size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>
        {category ? `No ${category} recipes found` : "No recipes yet"}
      </h2>
      <p style={{ fontSize: "0.875rem", maxWidth: 320, margin: "0 auto" }}>
        {category
          ? "Try a different category or browse all recipes."
          : "Browse all recipes to find something delicious."}
      </p>
    </div>
  );
}

export default function RecipesPage() {
  const [activeCategory, setActiveCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["recipes", activeCategory],
    queryFn: () => fetchRecipes(activeCategory || undefined),
  });

  const recipeList = data?.recipes ?? [];

  return (
    <div style={{ padding: "24px 24px 40px", maxWidth: 1200 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: 4,
        }}
      >
        Recipes
      </h1>
      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
          marginBottom: 24,
        }}
      >
        Discover nutritious meals and log them instantly
      </p>

      {/* Category filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: "1px solid",
              borderColor: activeCategory === cat.id ? "var(--color-primary)" : "var(--color-border)",
              backgroundColor: activeCategory === cat.id
                ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                : "var(--color-surface)",
              color: activeCategory === cat.id ? "var(--color-primary)" : "var(--color-text-muted)",
              fontSize: "0.82rem",
              fontWeight: activeCategory === cat.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div
          aria-busy="true"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recipeList.length === 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          <EmptyState category={activeCategory} />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {recipeList.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

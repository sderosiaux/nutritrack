"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeScanner, type FoodItem } from "./barcode-scanner";
import { CustomFoodForm } from "./custom-food-form";

type SearchFilter = "all" | "my_foods" | "branded" | "generic";

interface FoodSearchResult {
  id: string;
  name: string;
  brandName: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSizes: Array<{ id: string; label: string; weightG: number }>;
}

interface SelectedFood {
  food: FoodSearchResult;
  servingSizeId: string;
  quantity: number;
}

interface FoodSearchProps {
  onSelect: (selection: SelectedFood) => void;
  mealType: string;
  date: string;
}

export function FoodSearch({ onSelect, mealType, date }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [servingSizeId, setServingSizeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchFoods = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "20" });
      if (filter === "my_foods") params.set("source", "user_created");
      if (filter === "branded") params.set("source", "open_food_facts");
      if (filter === "generic") params.set("source", "usda");
      const res = await fetch(`/api/v1/foods/search?${params}`);
      if (res.ok) {
        const data = await res.json() as { foods: FoodSearchResult[] };
        setResults(data.foods ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchFoods(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filter, searchFoods]);

  function handleSelectFood(food: FoodSearchResult) {
    setSelectedFood(food);
    setServingSizeId(food.servingSizes[0]?.id ?? "");
    setQuantity(1);
  }

  function handleConfirm() {
    if (!selectedFood || !servingSizeId) return;
    onSelect({ food: selectedFood, servingSizeId, quantity });
    setSelectedFood(null);
    setQuery("");
    setResults([]);
  }

  function handleBarcodeFound(food: FoodItem) {
    setShowBarcode(false);
    handleSelectFood(food);
  }

  const filters: { id: SearchFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "my_foods", label: "My Foods" },
    { id: "branded", label: "Branded" },
    { id: "generic", label: "Generic" },
  ];

  if (showBarcode) {
    return (
      <BarcodeScanner
        onFoodFound={handleBarcodeFound}
        onClose={() => setShowBarcode(false)}
      />
    );
  }

  if (selectedFood) {
    const selectedServing = selectedFood.servingSizes.find((s) => s.id === servingSizeId);
    const totalG = selectedServing ? quantity * selectedServing.weightG : 0;
    const previewCal = (selectedFood.caloriesPer100g * totalG) / 100;

    return (
      <div className="flex flex-col gap-4 p-4">
        <button
          onClick={() => setSelectedFood(null)}
          style={{ fontSize: 13, color: "var(--color-primary)", textAlign: "left" }}
          aria-label="Back to search"
        >
          ← Back to search
        </button>

        <div>
          <h3 style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 16 }}>
            {selectedFood.name}
          </h3>
          {selectedFood.brandName && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {selectedFood.brandName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
            Serving size
          </label>
          <select
            value={servingSizeId}
            onChange={(e) => setServingSizeId(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: 14,
              color: "var(--color-text)",
              background: "var(--color-surface)",
            }}
          >
            {selectedFood.servingSizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.weightG}g)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
            Quantity
          </label>
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
          />
        </div>

        {totalG > 0 && (
          <div
            style={{
              background: "var(--color-surface-alt)",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>
              {Math.round(previewCal)} kcal
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              {" "}· {Math.round(totalG)}g total
            </span>
          </div>
        )}

        <Button onClick={handleConfirm} disabled={!servingSizeId}>
          Add to {mealType.replace("_", " ")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Input
        type="search"
        placeholder="Search foods..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        aria-label="Search foods"
      />

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: 12,
              fontWeight: 500,
              border: `1px solid ${filter === f.id ? "var(--color-primary)" : "var(--color-border)"}`,
              background: filter === f.id ? "var(--color-primary)" : "transparent",
              color: filter === f.id ? "white" : "var(--color-text)",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1" style={{ maxHeight: 280, overflowY: "auto" }}>
        {loading && (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>
            Searching...
          </p>
        )}
        {!loading && query && results.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>
            No results for "{query}"
          </p>
        )}
        {results.map((food) => (
          <button
            key={food.id}
            onClick={() => handleSelectFood(food)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 8px",
              borderRadius: "var(--radius-md)",
              border: "1px solid transparent",
              textAlign: "left",
              cursor: "pointer",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-alt)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
                {food.name}
              </p>
              {food.brandName && (
                <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {food.brandName}
                </p>
              )}
            </div>
            <span style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 600 }}>
              {Math.round(food.caloriesPer100g)} kcal
            </span>
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button
          onClick={() => setShowBarcode(true)}
          style={{
            fontSize: 13,
            color: "var(--color-primary)",
            fontWeight: 500,
            textAlign: "left",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "4px 0",
          }}
        >
          📷 Scan barcode
        </button>
        <button
          onClick={() => setShowCustomForm(true)}
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            textAlign: "left",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "4px 0",
          }}
        >
          + Create custom food
        </button>
      </div>

      <CustomFoodForm
        open={showCustomForm}
        onOpenChange={setShowCustomForm}
        onCreated={(food) => {
          setShowCustomForm(false);
          toast(`"${food.name}" created`);
        }}
      />
    </div>
  );
}

// Minimal toast import for inline use
function toast(msg: string) {
  // Sonner toast called via side-effect when available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast: sonnerToast } = require("sonner");
    sonnerToast(msg);
  } catch {
    // ignore in tests
  }
}

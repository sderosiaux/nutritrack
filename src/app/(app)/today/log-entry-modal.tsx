"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FoodSearch } from "./food-search";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface LogEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  defaultMealType?: string;
}

type TabType = "food" | "water" | "weight";

export function LogEntryModal({
  open,
  onOpenChange,
  date,
  defaultMealType = "breakfast",
}: LogEntryModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("food");
  const [waterAmount, setWaterAmount] = useState(250);
  const [weightKg, setWeightKg] = useState("");
  const [submittingWater, setSubmittingWater] = useState(false);
  const [submittingWeight, setSubmittingWeight] = useState(false);
  const queryClient = useQueryClient();

  async function handleWaterSubmit() {
    if (waterAmount <= 0) return;
    setSubmittingWater(true);
    try {
      const res = await fetch(`/api/v1/logs/${date}/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl: waterAmount }),
      });
      if (!res.ok) {
        toast.error("Failed to log water");
        return;
      }
      toast.success(`${waterAmount}ml water logged`);
      queryClient.invalidateQueries({ queryKey: ["daily-log", date] });
      onOpenChange(false);
    } catch {
      toast.error("Failed to log water. Try again.");
    } finally {
      setSubmittingWater(false);
    }
  }

  async function handleWeightSubmit() {
    const kg = parseFloat(weightKg);
    if (!kg || kg < 20 || kg > 300) return;
    setSubmittingWeight(true);
    try {
      const res = await fetch(`/api/v1/logs/${date}/weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: kg }),
      });
      if (!res.ok) {
        toast.error("Failed to log weight");
        return;
      }
      toast.success(`${kg} kg weight logged`);
      queryClient.invalidateQueries({ queryKey: ["daily-log", date] });
      queryClient.invalidateQueries({ queryKey: ["weight-entries"] });
      onOpenChange(false);
    } catch {
      toast.error("Failed to log weight. Try again.");
    } finally {
      setSubmittingWeight(false);
    }
  }

  async function handleFoodSelected(selection: {
    food: { id: string; name: string };
    servingSizeId: string;
    quantity: number;
  }) {
    try {
      const res = await fetch(`/api/v1/logs/${date}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: selection.food.id,
          servingSizeId: selection.servingSizeId,
          quantity: selection.quantity,
          mealType: defaultMealType,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to log food");
        return;
      }
      toast.success(`${selection.food.name} logged`);
      queryClient.invalidateQueries({ queryKey: ["daily-log", date] });
      onOpenChange(false);
    } catch {
      toast.error("Failed to log food. Try again.");
    }
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "food", label: "Food" },
    { id: "water", label: "Water" },
    { id: "weight", label: "Weight" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Log Entry</SheetTitle>
        </SheetHeader>

        {/* Tab bar */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid var(--color-border)", marginBottom: 0 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color:
                  activeTab === tab.id
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                borderBottom: activeTab === tab.id
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                transition: "color 150ms",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Food tab */}
        {activeTab === "food" && (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <FoodSearch
              onSelect={handleFoodSelected}
              mealType={defaultMealType}
              date={date}
            />
          </div>
        )}

        {/* Water tab */}
        {activeTab === "water" && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="water-amount"
                style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}
              >
                Amount (ml)
              </label>
              <Input
                id="water-amount"
                type="number"
                min={1}
                step={50}
                value={waterAmount}
                onChange={(e) => setWaterAmount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex gap-2">
              {[100, 200, 250, 330, 500].map((ml) => (
                <button
                  key={ml}
                  onClick={() => setWaterAmount(ml)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: 12,
                    fontWeight: 500,
                    border: `1px solid ${waterAmount === ml ? "var(--color-info)" : "var(--color-border)"}`,
                    background: waterAmount === ml ? "#eff6ff" : "transparent",
                    color: waterAmount === ml ? "var(--color-info)" : "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  {ml}ml
                </button>
              ))}
            </div>
            <Button
              onClick={handleWaterSubmit}
              disabled={submittingWater || waterAmount <= 0}
            >
              {submittingWater ? "Logging..." : "Log Water"}
            </Button>
          </div>
        )}

        {/* Weight tab */}
        {activeTab === "weight" && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="weight-input"
                style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}
              >
                Weight (kg)
              </label>
              <Input
                id="weight-input"
                type="number"
                min={20}
                max={300}
                step={0.1}
                inputMode="decimal"
                placeholder="e.g. 72.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWeightSubmit}
              disabled={submittingWeight || !weightKg || parseFloat(weightKg) < 20 || parseFloat(weightKg) > 300}
            >
              {submittingWeight ? "Logging..." : "Log Weight"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

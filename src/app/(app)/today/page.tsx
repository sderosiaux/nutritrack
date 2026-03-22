"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalorieRing } from "./calorie-ring";
import { MacroBars } from "./macro-bars";
import { LogEntryModal } from "./log-entry-modal";
import { useUIStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface DailyLogEntry {
  id: string;
  foodId: string | null;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity: number;
  servingSizeLabel: string | null;
  mealType: string;
}

interface MealSlot {
  mealType: string;
  entries: DailyLogEntry[];
  totalKcal: number;
}

interface DailyLog {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  waterMl: number;
  meals: MealSlot[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function isToday(iso: string): boolean {
  return iso === new Date().toISOString().split("T")[0];
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
  evening_snack: "Evening Snack",
  other: "Other",
};

const MEAL_ORDER = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
  "other",
];

// ── Meal Card ──────────────────────────────────────────────────────────────

function MealCard({
  slot,
  onAddFood,
  onDeleteEntry,
}: {
  slot?: MealSlot;
  mealType: string;
  onAddFood: () => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  const mealType = slot?.mealType ?? "";
  const label = MEAL_LABELS[mealType] ?? mealType;
  const [expanded, setExpanded] = useState(false);
  const entries = slot?.entries ?? [];
  const totalKcal = slot?.totalKcal ?? 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        >
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
              {label}
            </p>
            {entries.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {entries.map((e) => e.foodName).slice(0, 2).join(", ")}
                {entries.length > 2 ? ` +${entries.length - 2} more` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalKcal > 0 && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-accent)" }}>
                {Math.round(totalKcal)} kcal
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddFood();
              }}
              aria-label={`Add food to ${label}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-full)",
                background: "var(--color-primary)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
          </div>
        </div>

        {expanded && entries.length > 0 && (
          <div className="flex flex-col gap-2 mt-3" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
                    {entry.foodName}
                  </p>
                  <div className="flex gap-2" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    <span style={{ color: "var(--color-macro-protein)" }}>P {Math.round(entry.protein)}g</span>
                    <span style={{ color: "var(--color-macro-carbs)" }}>C {Math.round(entry.carbs)}g</span>
                    <span style={{ color: "var(--color-macro-fat)" }}>F {Math.round(entry.fat)}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-accent)" }}>
                    {Math.round(entry.calories)} kcal
                  </span>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    aria-label={`Delete ${entry.foodName}`}
                    style={{
                      padding: "2px 6px",
                      fontSize: 12,
                      color: "var(--color-rose)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

import { useState } from "react";

const DEFAULT_TARGETS = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  fiber: 25,
  water: 2000,
};

export default function TodayPage() {
  const { selectedDate, setSelectedDate, logModalOpen, openLogModal, closeLogModal, logModalMealType } = useUIStore();
  const queryClient = useQueryClient();

  const { data: log, isLoading } = useQuery<DailyLog>({
    queryKey: ["daily-log", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/v1/logs/${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch daily log");
      return res.json();
    },
    staleTime: 30_000,
  });

  const addWaterMutation = useMutation({
    mutationFn: async (ml: number) => {
      const res = await fetch(`/api/v1/logs/${selectedDate}/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl: ml }),
      });
      if (!res.ok) throw new Error("Failed to log water");
      return res.json();
    },
    onSuccess: (_, ml) => {
      toast.success(`${ml}ml water logged`);
      queryClient.invalidateQueries({ queryKey: ["daily-log", selectedDate] });
    },
    onError: () => toast.error("Failed to log water"),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/v1/logs/meals/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries({ queryKey: ["daily-log", selectedDate] });
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  const consumed = log?.totalCalories ?? 0;
  const waterMl = log?.waterMl ?? 0;

  // Build full meal slot list (with empty slots for all standard meals)
  const mealSlotsMap = new Map<string, MealSlot>(
    (log?.meals ?? []).map((m) => [m.mealType, m])
  );
  const displayedSlots = MEAL_ORDER.slice(0, 4).map((mt) => ({
    mealType: mt,
    slot: mealSlotsMap.get(mt),
  }));

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          aria-label="Previous day"
          style={{
            padding: "8px 12px",
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ‹
        </button>
        <div className="text-center">
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>
            {isToday(selectedDate) ? "Today" : formatDate(selectedDate)}
          </p>
          {!isToday(selectedDate) && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {selectedDate}
            </p>
          )}
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          aria-label="Next day"
          style={{
            padding: "8px 12px",
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ›
        </button>
      </div>

      {isLoading ? (
        <div
          style={{
            height: 180,
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      ) : (
        <>
          {/* Calorie ring + macro bars */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex-shrink-0">
                  <CalorieRing
                    consumed={consumed}
                    target={DEFAULT_TARGETS.calories}
                    size={180}
                  />
                </div>
                <div className="flex-1 w-full">
                  <MacroBars
                    protein={log?.totalProtein ?? 0}
                    carbs={log?.totalCarbs ?? 0}
                    fat={log?.totalFat ?? 0}
                    fiber={log?.totalFiber ?? 0}
                    targets={{
                      protein: DEFAULT_TARGETS.protein,
                      carbs: DEFAULT_TARGETS.carbs,
                      fat: DEFAULT_TARGETS.fat,
                      fiber: DEFAULT_TARGETS.fiber,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal cards */}
          <div className="flex flex-col gap-3">
            {displayedSlots.map(({ mealType, slot }) => (
              <MealCard
                key={mealType}
                slot={slot}
                mealType={mealType}
                onAddFood={() => openLogModal(mealType)}
                onDeleteEntry={(id) => deleteEntryMutation.mutate(id)}
              />
            ))}
          </div>

          {/* Hydration tile */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>💧</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
                      Water
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {waterMl} / {DEFAULT_TARGETS.water} ml
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ width: 80, height: 8, background: "var(--color-border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min((waterMl / DEFAULT_TARGETS.water) * 100, 100)}%`,
                      background: "var(--color-info)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 600ms ease-out",
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addWaterMutation.mutate(250)}
                  disabled={addWaterMutation.isPending}
                >
                  +250ml
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addWaterMutation.mutate(500)}
                  disabled={addWaterMutation.isPending}
                >
                  +500ml
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Log entry modal */}
      <LogEntryModal
        open={logModalOpen}
        onOpenChange={(open) => { if (!open) closeLogModal(); }}
        date={selectedDate}
        defaultMealType={logModalMealType}
      />
    </div>
  );
}

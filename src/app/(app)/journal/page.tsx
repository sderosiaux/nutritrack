"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogEntryModal } from "@/app/(app)/today/log-entry-modal";
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
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// Generate last 7 days including today for calendar strip
function lastSevenDays(anchor: string): string[] {
  const result: string[] = [];
  for (let i = -3; i <= 3; i++) {
    result.push(addDays(anchor, i));
  }
  return result;
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

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ onLog }: { onLog: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{ padding: "48px 24px", textAlign: "center" }}
    >
      <div style={{ fontSize: 48 }}>🍽️</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
        No meals logged yet
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", maxWidth: 280 }}>
        Start your day — log your first meal to start tracking your nutrition.
      </p>
      <Button onClick={onLog}>Log food</Button>
    </div>
  );
}

// ── Meal Accordion ─────────────────────────────────────────────────────────

function MealAccordion({
  slot,
  onDeleteEntry,
}: {
  slot: MealSlot;
  onDeleteEntry: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const label = MEAL_LABELS[slot.mealType] ?? slot.mealType;

  return (
    <Card>
      <CardContent className="p-4">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
            {label}
          </span>
          <span style={{ fontSize: 14, color: "var(--color-accent)", fontWeight: 600 }}>
            {Math.round(slot.totalKcal)} kcal
          </span>
        </button>

        {open && (
          <div className="flex flex-col gap-3 mt-3" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
            {slot.entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-2">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
                    {entry.foodName}
                  </p>
                  {entry.servingSizeLabel && (
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {entry.servingSizeLabel}
                    </p>
                  )}
                  <div className="flex gap-3 mt-1">
                    <span style={{ fontSize: 11, color: "var(--color-macro-protein)" }}>
                      P {Math.round(entry.protein)}g
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-macro-carbs)" }}>
                      C {Math.round(entry.carbs)}g
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-macro-fat)" }}>
                      F {Math.round(entry.fat)}g
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-macro-fiber)" }}>
                      Fi {Math.round(entry.fiber)}g
                    </span>
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
                      fontSize: 13,
                      color: "var(--color-rose)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
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

// ── Journal Page ───────────────────────────────────────────────────────────

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [logModalOpen, setLogModalOpen] = useState(false);
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

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/v1/logs/meals/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries({ queryKey: ["daily-log", selectedDate] });
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  const calendarDays = lastSevenDays(selectedDate);
  const hasEntries = (log?.meals?.length ?? 0) > 0;

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>
        Journal
      </h1>

      {/* Calendar strip */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {calendarDays.map((day) => {
          const isSelected = day === selectedDate;
          const isToday = day === todayIso();
          const parts = day.split("-");
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(day)}
              style={{
                flex: "0 0 auto",
                width: 44,
                height: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                borderRadius: "var(--radius-md)",
                border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                background: isSelected ? "var(--color-primary)" : "transparent",
                color: isSelected ? "white" : isToday ? "var(--color-primary)" : "var(--color-text)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              <span style={{ fontSize: 9, textTransform: "uppercase" }}>
                {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Day header with navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          aria-label="Previous day"
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text)" }}
        >
          ‹
        </button>
        <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
          {formatDate(selectedDate)}
        </p>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          aria-label="Next day"
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text)" }}
        >
          ›
        </button>
      </div>

      {isLoading ? (
        <div
          style={{
            height: 120,
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
          {/* Day totals */}
          {hasEntries && (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 justify-around">
                  <div className="text-center">
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)" }}>
                      {Math.round(log?.totalCalories ?? 0)}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>kcal</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-macro-protein)" }}>
                      {Math.round(log?.totalProtein ?? 0)}g
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>protein</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-macro-carbs)" }}>
                      {Math.round(log?.totalCarbs ?? 0)}g
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>carbs</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-macro-fat)" }}>
                      {Math.round(log?.totalFat ?? 0)}g
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>fat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meals */}
          {!hasEntries ? (
            <EmptyState onLog={() => setLogModalOpen(true)} />
          ) : (
            <div className="flex flex-col gap-3">
              {(log?.meals ?? []).map((slot) => (
                <MealAccordion
                  key={slot.mealType}
                  slot={slot}
                  onDeleteEntry={(id) => deleteEntryMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {/* Water section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>💧</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
                      Water
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {log?.waterMl ?? 0} ml today
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add food CTA */}
          <Button onClick={() => setLogModalOpen(true)} className="w-full">
            + Log food
          </Button>
        </>
      )}

      <LogEntryModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        date={selectedDate}
        defaultMealType="breakfast"
      />
    </div>
  );
}

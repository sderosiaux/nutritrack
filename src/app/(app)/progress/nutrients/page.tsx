"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Nutrient = "calories" | "protein" | "carbs" | "fat" | "fiber";

const NUTRIENT_LABELS: Record<Nutrient, string> = {
  calories: "Calories (kcal)",
  protein: "Protein (g)",
  carbs: "Carbs (g)",
  fat: "Fat (g)",
  fiber: "Fiber (g)",
};

const NUTRIENT_COLORS: Record<Nutrient, string> = {
  calories: "var(--color-accent)",
  protein: "var(--color-macro-protein)",
  carbs: "var(--color-macro-carbs)",
  fat: "var(--color-macro-fat)",
  fiber: "var(--color-macro-fiber)",
};

interface DailyNutrient {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

interface TopFood {
  foodId: string;
  foodName: string;
  count: number;
}

function NutrientBarChart({
  data,
  nutrient,
}: {
  data: DailyNutrient[];
  nutrient: Nutrient;
}) {
  if (data.length === 0)
    return (
      <div className="text-[var(--color-text-muted)] text-sm py-4 text-center">
        No data
      </div>
    );

  const values = data.map((d) => d[nutrient] as number);
  const maxVal = Math.max(...values, 1);
  const barWidth = 100 / data.length;
  const color = NUTRIENT_COLORS[nutrient];

  return (
    <svg
      viewBox="0 0 100 60"
      className="w-full h-32"
      aria-label={`${NUTRIENT_LABELS[nutrient]} trend`}
    >
      {data.map((d, i) => {
        const val = d[nutrient] as number;
        const h = Math.max(2, (val / maxVal) * 56);
        return (
          <rect
            key={d.date}
            x={i * barWidth + barWidth * 0.1}
            y={60 - h}
            width={barWidth * 0.8}
            height={h}
            fill={color}
            rx="1"
          />
        );
      })}
    </svg>
  );
}

function Skeleton() {
  return (
    <div
      data-testid="skeleton"
      className="animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] h-32"
    />
  );
}

export default function NutrientsPage() {
  const [selected, setSelected] = useState<Nutrient>("protein");

  const end = new Date().toISOString().slice(0, 10);
  const startDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const { data: nutrients, isLoading } = useQuery<DailyNutrient[]>({
    queryKey: ["analytics-nutrients", startDate, end],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/analytics/nutrients?startDate=${startDate}&endDate=${end}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    initialData: [],
  });

  const { data: topFoods, isLoading: topLoading } = useQuery<TopFood[]>({
    queryKey: ["analytics-top-foods", startDate, end],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/analytics/foods/top?startDate=${startDate}&endDate=${end}&limit=5`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    initialData: [],
  });

  const data = nutrients ?? [];
  const values = data.map((d) => d[selected] as number);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/progress"
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-alt)] transition-colors"
          aria-label="Back to progress"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Nutrient deep-dive
        </h1>
      </div>

      {/* Nutrient selector */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Select nutrient">
        {(Object.keys(NUTRIENT_LABELS) as Nutrient[]).map((n) => (
          <button
            key={n}
            onClick={() => setSelected(n)}
            className={[
              "px-3 py-1.5 rounded-[var(--radius-full)] text-sm font-medium transition-colors",
              selected === n
                ? "text-white"
                : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]",
            ].join(" ")}
            style={
              selected === n
                ? { background: NUTRIENT_COLORS[n] }
                : {}
            }
            aria-pressed={selected === n}
          >
            {n.charAt(0).toUpperCase() + n.slice(1)}
          </button>
        ))}
      </div>

      {/* Average stat */}
      {!isLoading && data.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            30-day average
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: NUTRIENT_COLORS[selected] }}
          >
            {Math.round(avg * 10) / 10}
            <span className="text-base font-normal text-[var(--color-text-muted)] ml-1">
              {selected === "calories" ? "kcal" : "g"} / day
            </span>
          </div>
        </div>
      )}

      {/* Daily breakdown chart */}
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <h2 className="font-medium text-[var(--color-text)]">
            Daily breakdown — {NUTRIENT_LABELS[selected]}
          </h2>
          <NutrientBarChart data={data} nutrient={selected} />
        </div>
      )}

      {/* Top foods */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <h2 className="font-medium text-[var(--color-text)]">Most logged foods</h2>
        {topLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                data-testid="skeleton"
                className="animate-pulse h-8 rounded bg-[var(--color-surface-alt)]"
              />
            ))}
          </div>
        ) : (topFoods ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No foods logged yet</p>
        ) : (
          <ul className="space-y-2">
            {(topFoods ?? []).map((f, i) => (
              <li key={f.foodId} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-[var(--radius-full)] bg-[var(--color-surface-alt)] flex items-center justify-center text-xs text-[var(--color-text-muted)]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--color-text)]">{f.foodName}</span>
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {f.count}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Droplets, Flame, Trophy, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

type Range = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

interface SummaryData {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
  avgWaterMl: number;
  daysLogged: number;
  currentStreak: number;
  longestStreak: number;
}

interface DailyNutrient {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

interface WeightEntry {
  date: string;
  weightKg: number;
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

// ── Simple SVG Charts ────────────────────────────────────────────────────

function CalorieTrendChart({ data }: { data: DailyNutrient[] }) {
  if (data.length === 0) return <div className="text-[var(--color-text-muted)] text-sm py-4 text-center">No data</div>;

  const maxCal = Math.max(...data.map((d) => d.calories), 100);
  const width = 100;
  const height = 60;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - (d.calories / maxCal) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" aria-label="Calorie trend">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
        const y = height - (d.calories / maxCal) * (height - 4) - 2;
        return <circle key={d.date} cx={x} cy={y} r="2" fill="var(--color-accent)" />;
      })}
    </svg>
  );
}

function MacroStackedChart({ data }: { data: DailyNutrient[] }) {
  if (data.length === 0) return <div className="text-[var(--color-text-muted)] text-sm py-4 text-center">No data</div>;

  const barWidth = 100 / data.length;

  return (
    <svg viewBox="0 0 100 60" className="w-full h-20" aria-label="Macro composition">
      {data.map((d, i) => {
        const total = d.protein * 4 + d.carbs * 4 + d.fat * 9;
        if (total === 0) return null;
        const proteinH = (d.protein * 4 / total) * 56;
        const carbsH = (d.carbs * 4 / total) * 56;
        const fatH = (d.fat * 9 / total) * 56;
        const x = i * barWidth + barWidth * 0.1;
        const w = barWidth * 0.8;
        let y = 60;

        const segments = [
          { h: fatH, color: "var(--color-macro-fat)" },
          { h: carbsH, color: "var(--color-macro-carbs)" },
          { h: proteinH, color: "var(--color-macro-protein)" },
        ];

        return segments.map(({ h, color }, si) => {
          y -= h;
          return (
            <rect key={`${i}-${si}`} x={x} y={y} width={w} height={h} fill={color} />
          );
        });
      })}
    </svg>
  );
}

function WeightChart({ data }: { data: WeightEntry[] }) {
  if (data.length === 0) return <div className="text-[var(--color-text-muted)] text-sm py-4 text-center">No weight data</div>;

  const weights = data.map((d) => d.weightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const rangeW = maxW - minW || 1;
  const width = 100;
  const height = 60;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - ((d.weightKg - minW) / rangeW) * (height - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" aria-label="Weight trend">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
        const y = height - ((d.weightKg - minW) / rangeW) * (height - 8) - 4;
        return <circle key={d.date} cx={x} cy={y} r="2" fill="var(--color-primary)" />;
      })}
    </svg>
  );
}

function WaterChart({ data }: { data: DailyNutrient[] }) {
  if (data.length === 0) return <div className="text-[var(--color-text-muted)] text-sm py-4 text-center">No data</div>;

  const maxW = Math.max(...data.map((d) => d.waterMl), 100);
  const barWidth = 100 / data.length;

  return (
    <svg viewBox="0 0 100 60" className="w-full h-20" aria-label="Water intake">
      {data.map((d, i) => {
        const h = Math.max(2, (d.waterMl / maxW) * 56);
        return (
          <rect
            key={d.date}
            x={i * barWidth + barWidth * 0.1}
            y={60 - h}
            width={barWidth * 0.8}
            height={h}
            fill="var(--color-info)"
            rx="1"
          />
        );
      })}
    </svg>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div
      data-testid="skeleton"
      className="animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] h-32"
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [range, setRange] = useState<Range>("30d");
  const { startDate, endDate } = getDateRange(RANGE_DAYS[range]);

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery<SummaryData>({
    queryKey: ["analytics-summary", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/analytics/summary?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const {
    data: nutrients,
    isLoading: nutrientsLoading,
  } = useQuery<DailyNutrient[]>({
    queryKey: ["analytics-nutrients", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/analytics/nutrients?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch nutrients");
      return res.json();
    },
    initialData: [],
  });

  const {
    data: weight,
    isLoading: weightLoading,
  } = useQuery<WeightEntry[]>({
    queryKey: ["analytics-weight", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/analytics/weight?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch weight");
      return res.json();
    },
    initialData: [],
  });

  const isLoading = summaryLoading || nutrientsLoading || weightLoading;
  const daysLogged = summary?.daysLogged ?? 0;
  const hasEnoughData = daysLogged >= 3;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Progress</h1>

      {/* Date range selector */}
      <div
        className="flex gap-2"
        role="group"
        aria-label="Date range"
      >
        {(["7d", "30d", "90d"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={[
              "px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-colors",
              range === r
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]",
            ].join(" ")}
            aria-pressed={range === r}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && !hasEnoughData && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8 text-center space-y-3">
          <TrendingUp className="w-10 h-10 text-[var(--color-text-muted)] mx-auto" />
          <p className="font-medium text-[var(--color-text)]">Not enough data yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Log for 3+ days to see trends
          </p>
          <Link
            href="/journal"
            className="inline-block mt-2 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Go to journal
          </Link>
        </div>
      )}

      {/* Streak banner */}
      {!isLoading && hasEnoughData && summary && (
        <div className="flex gap-4">
          <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3">
            <Flame className="w-6 h-6 text-[var(--color-accent)]" />
            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Current streak</div>
              <div className="text-xl font-bold text-[var(--color-text)]">
                {summary.currentStreak} <span className="text-sm font-normal">days</span>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[var(--color-primary)]" />
            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Best streak</div>
              <div className="text-xl font-bold text-[var(--color-text)]">
                {summary.longestStreak} <span className="text-sm font-normal">days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calorie trend */}
      {isLoading ? (
        <ChartSkeleton />
      ) : hasEnoughData ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <h2 className="font-medium text-[var(--color-text)] flex items-center gap-2">
            <Flame className="w-4 h-4 text-[var(--color-accent)]" />
            Calorie trend
          </h2>
          {summary && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Avg {summary.avgCalories} kcal/day
            </p>
          )}
          <CalorieTrendChart data={nutrients ?? []} />
        </div>
      ) : null}

      {/* Macro composition */}
      {isLoading ? (
        <ChartSkeleton />
      ) : hasEnoughData ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <h2 className="font-medium text-[var(--color-text)]">Macro composition</h2>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "var(--color-macro-protein)" }} />
              Protein
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "var(--color-macro-carbs)" }} />
              Carbs
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "var(--color-macro-fat)" }} />
              Fat
            </span>
          </div>
          <MacroStackedChart data={nutrients ?? []} />
        </div>
      ) : null}

      {/* Weight trend */}
      {isLoading ? (
        <ChartSkeleton />
      ) : hasEnoughData && (weight?.length ?? 0) > 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <h2 className="font-medium text-[var(--color-text)]">Weight trend</h2>
          <WeightChart data={weight ?? []} />
        </div>
      ) : null}

      {/* Water intake */}
      {isLoading ? (
        <ChartSkeleton />
      ) : hasEnoughData ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
          <h2 className="font-medium text-[var(--color-text)] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[var(--color-info)]" />
            Water intake
          </h2>
          {summary && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Avg {Math.round(summary.avgWaterMl / 100) / 10} L/day
            </p>
          )}
          <WaterChart data={nutrients ?? []} />
        </div>
      ) : null}

      {/* Nutrient deep-dive link */}
      {hasEnoughData && !isLoading && (
        <Link
          href="/progress/nutrients"
          className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <span className="font-medium text-[var(--color-text)]">Nutrient deep-dive</span>
          <LinkIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
        </Link>
      )}

      {/* Export */}
      {hasEnoughData && !isLoading && (
        <div className="flex gap-2">
          <a
            href={`/api/v1/analytics/export?format=csv&startDate=${startDate}&endDate=${endDate}`}
            download
            className="flex-1 text-center px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Export CSV
          </a>
          <a
            href={`/api/v1/analytics/export?format=json&startDate=${startDate}&endDate=${endDate}`}
            download
            className="flex-1 text-center px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Export JSON
          </a>
        </div>
      )}
    </div>
  );
}

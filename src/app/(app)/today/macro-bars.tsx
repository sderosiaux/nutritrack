"use client";

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

function MacroBar({ label, value, target, color, unit = "g" }: MacroBarProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
          {Math.round(value)}{unit}
          {target > 0 && (
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
              &nbsp;/ {Math.round(target)}{unit}
            </span>
          )}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--color-border)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "var(--radius-full)",
            transition: "width 600ms ease-out",
          }}
        />
      </div>
    </div>
  );
}

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  targets?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export function MacroBars({ protein, carbs, fat, fiber, targets }: MacroBarsProps) {
  return (
    <div className="flex flex-col gap-3">
      <MacroBar
        label="Protein"
        value={protein}
        target={targets?.protein ?? 0}
        color="var(--color-macro-protein)"
      />
      <MacroBar
        label="Carbs"
        value={carbs}
        target={targets?.carbs ?? 0}
        color="var(--color-macro-carbs)"
      />
      <MacroBar
        label="Fat"
        value={fat}
        target={targets?.fat ?? 0}
        color="var(--color-macro-fat)"
      />
      <MacroBar
        label="Fiber"
        value={fiber}
        target={targets?.fiber ?? 0}
        color="var(--color-macro-fiber)"
      />
    </div>
  );
}

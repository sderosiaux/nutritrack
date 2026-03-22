"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
}

export function CalorieRing({ consumed, target, size = 180 }: CalorieRingProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const overflow = target > 0 && consumed > target;
  const dashOffset = circumference - pct * circumference;

  const ringColor = overflow
    ? "var(--color-rose)"
    : "var(--color-accent)";
  const textColor = overflow
    ? "var(--color-rose)"
    : "var(--color-text)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
          aria-label={`Calorie progress: ${consumed} of ${target} kcal`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={12}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 600ms ease-out, stroke 300ms" }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: textColor,
              lineHeight: 1,
            }}
          >
            {Math.round(consumed)}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              marginTop: 2,
            }}
          >
            / {Math.round(target)} kcal
          </span>
        </div>
      </div>
      {overflow && (
        <span style={{ fontSize: 12, color: "var(--color-rose)", fontWeight: 500 }}>
          Over target
        </span>
      )}
    </div>
  );
}

"use client";

/**
 * OnboardingWizard — 6-step onboarding flow (CHK-019)
 * Steps: 1=Goal, 2=Activity, 3=Demographics, 4=Height+Weight, 5=Dietary, 6=Summary
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateTDEE, ageFromBirthDate, type TDEEInput } from "@/server/services/tdee";

// ── Types ──────────────────────────────────────────────────────────────────

type Goal = "lose_weight" | "maintain" | "build_muscle" | "eat_healthier";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type BiologicalSex = "male" | "female" | "other" | "prefer_not_to_say";

interface WizardState {
  goal: Goal | null;
  activityLevel: ActivityLevel | null;
  biologicalSex: BiologicalSex | null;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  dietaryRestrictions: string[];
  allergies: string[];
  weeklyPaceKg: number | null;
}

const INITIAL_STATE: WizardState = {
  goal: null,
  activityLevel: null,
  biologicalSex: null,
  birthDate: "",
  heightCm: "",
  weightKg: "",
  dietaryRestrictions: [],
  allergies: [],
  weeklyPaceKg: null,
};

const TOTAL_STEPS = 6;

// ── Step components ────────────────────────────────────────────────────────

function StepGoal({ value, onChange }: { value: Goal | null; onChange: (g: Goal) => void }) {
  const goals: { value: Goal; label: string; desc: string }[] = [
    { value: "lose_weight", label: "Lose Weight", desc: "Reduce body fat gradually" },
    { value: "build_muscle", label: "Build Muscle", desc: "Increase lean mass" },
    { value: "maintain", label: "Maintain Weight", desc: "Keep current weight stable" },
    { value: "eat_healthier", label: "Eat Healthier", desc: "Improve nutrition quality" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        What&apos;s your goal?
      </h2>
      <div className="flex flex-col gap-3">
        {goals.map((g) => (
          <button
            key={g.value}
            onClick={() => onChange(g.value)}
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: `2px solid ${value === g.value ? "var(--color-primary)" : "var(--color-border)"}`,
              background: value === g.value ? "color-mix(in srgb, var(--color-primary) 10%, white)" : "var(--color-surface)",
              textAlign: "left",
              cursor: "pointer",
              transition: "border-color 200ms, background 200ms",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 15 }}>{g.label}</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>{g.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepActivity({ value, onChange }: { value: ActivityLevel | null; onChange: (a: ActivityLevel) => void }) {
  const levels: { value: ActivityLevel; label: string; desc: string }[] = [
    { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
    { value: "light", label: "Lightly Active", desc: "1–3 days/week exercise" },
    { value: "moderate", label: "Moderately Active", desc: "3–5 days/week exercise" },
    { value: "active", label: "Active", desc: "6–7 days/week exercise" },
    { value: "very_active", label: "Very Active", desc: "Physical job or 2× daily training" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        What&apos;s your activity level?
      </h2>
      <div className="flex flex-col gap-3">
        {levels.map((l) => (
          <button
            key={l.value}
            onClick={() => onChange(l.value)}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              border: `2px solid ${value === l.value ? "var(--color-primary)" : "var(--color-border)"}`,
              background: value === l.value ? "color-mix(in srgb, var(--color-primary) 10%, white)" : "var(--color-surface)",
              textAlign: "left",
              cursor: "pointer",
              transition: "border-color 200ms",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 14 }}>{l.label}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{l.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDemographics({
  state,
  onChange,
}: {
  state: Pick<WizardState, "biologicalSex" | "birthDate">;
  onChange: (updates: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        About you
      </h2>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="biological-sex"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}
        >
          Biological Sex
        </label>
        <select
          id="biological-sex"
          aria-label="Biological sex"
          value={state.biologicalSex ?? ""}
          onChange={(e) => onChange({ biologicalSex: e.target.value as BiologicalSex || null })}
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            fontSize: 14,
            background: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        >
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="birth-date"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}
        >
          Date of Birth
        </label>
        <Input
          id="birth-date"
          aria-label="Date of birth"
          type="date"
          value={state.birthDate}
          onChange={(e) => onChange({ birthDate: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>
    </div>
  );
}

function StepHeightWeight({
  state,
  onChange,
}: {
  state: Pick<WizardState, "heightCm" | "weightKg">;
  onChange: (updates: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Height &amp; Weight
      </h2>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="height"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}
        >
          Height (cm)
        </label>
        <Input
          id="height"
          aria-label="Height in centimeters"
          type="number"
          min={100}
          max={250}
          placeholder="e.g. 175"
          value={state.heightCm}
          onChange={(e) => onChange({ heightCm: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="weight"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}
        >
          Current Weight (kg)
        </label>
        <Input
          id="weight"
          aria-label="Weight in kilograms"
          type="number"
          min={20}
          max={500}
          placeholder="e.g. 75"
          value={state.weightKg}
          onChange={(e) => onChange({ weightKg: e.target.value })}
        />
      </div>
    </div>
  );
}

function StepDietary({
  state,
  onChange,
}: {
  state: Pick<WizardState, "dietaryRestrictions">;
  onChange: (updates: Partial<WizardState>) => void;
}) {
  const options = ["Vegetarian", "Vegan", "Gluten-free", "Lactose-free", "Halal", "Kosher", "None"];

  const toggle = (opt: string) => {
    const current = state.dietaryRestrictions;
    const lc = opt.toLowerCase().replace("-", "_").replace(" ", "_");
    if (current.includes(lc)) {
      onChange({ dietaryRestrictions: current.filter((r) => r !== lc) });
    } else {
      onChange({ dietaryRestrictions: [...current.filter((r) => r !== "none"), lc] });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Dietary preferences
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>Select all that apply</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const lc = opt.toLowerCase().replace("-", "_").replace(" ", "_");
          const selected = state.dietaryRestrictions.includes(lc);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                border: `2px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                background: selected ? "var(--color-primary)" : "var(--color-surface)",
                color: selected ? "white" : "var(--color-text)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 200ms",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSummary({ state }: { state: WizardState }) {
  const tdeeInput = buildTDEEInput(state);
  const result = tdeeInput ? calculateTDEE(tdeeInput) : null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Your daily target
      </h2>

      {result ? (
        <>
          <div
            style={{
              padding: "24px",
              borderRadius: "var(--radius-lg)",
              background: "color-mix(in srgb, var(--color-primary) 8%, white)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 30%, white)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "var(--color-primary)",
                lineHeight: 1,
              }}
            >
              {result.calorieTarget.toLocaleString()}
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 }}>kcal / day</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {[
              { label: "Protein", value: result.targets.proteinG, color: "var(--color-macro-protein)" },
              { label: "Carbs", value: result.targets.carbsG, color: "var(--color-macro-carbs)" },
              { label: "Fat", value: result.targets.fatG, color: "var(--color-macro-fat)" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-alt)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}g</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
            Water: {result.targets.waterMl.toLocaleString()} ml · Fiber: {result.targets.fiberG}g
          </p>
        </>
      ) : (
        <p style={{ color: "var(--color-text-muted)" }}>
          Complete your profile to see your personalized targets.
        </p>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildTDEEInput(state: WizardState): TDEEInput | null {
  if (
    !state.goal ||
    !state.activityLevel ||
    !state.biologicalSex ||
    !state.birthDate ||
    !state.heightCm ||
    !state.weightKg
  ) {
    return null;
  }
  return {
    biologicalSex: state.biologicalSex,
    weightKg: Number(state.weightKg),
    heightCm: Number(state.heightCm),
    ageYears: ageFromBirthDate(state.birthDate),
    activityLevel: state.activityLevel,
    goal: state.goal,
    weeklyPaceKg: state.weeklyPaceKg,
  };
}

function canAdvance(step: number, state: WizardState): boolean {
  switch (step) {
    case 1: return state.goal !== null;
    case 2: return state.activityLevel !== null;
    case 3: return Boolean(state.biologicalSex && state.birthDate);
    case 4: return Boolean(state.heightCm && state.weightKg);
    case 5: return true; // dietary is optional
    case 6: return true;
    default: return false;
  }
}

// ── Main Wizard ────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      goal: state.goal,
      activityLevel: state.activityLevel,
      biologicalSex: state.biologicalSex,
      birthDate: state.birthDate || undefined,
      heightCm: state.heightCm ? Number(state.heightCm) : undefined,
      currentWeightKg: state.weightKg ? Number(state.weightKg) : undefined,
      dietaryRestrictions: state.dietaryRestrictions,
      weeklyPaceKg: state.weeklyPaceKg,
    };

    try {
      const res = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save profile");
      }

      router.push("/today");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
          Step {step} of {TOTAL_STEPS}
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        style={{
          height: 4,
          background: "var(--color-border)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--color-primary)",
            borderRadius: "var(--radius-full)",
            transition: "width 300ms ease-out",
          }}
        />
      </div>

      {/* Step content */}
      <div style={{ flex: 1 }}>
        {step === 1 && (
          <StepGoal value={state.goal} onChange={(g) => updateState({ goal: g })} />
        )}
        {step === 2 && (
          <StepActivity value={state.activityLevel} onChange={(a) => updateState({ activityLevel: a })} />
        )}
        {step === 3 && (
          <StepDemographics state={state} onChange={updateState} />
        )}
        {step === 4 && (
          <StepHeightWeight state={state} onChange={updateState} />
        )}
        {step === 5 && (
          <StepDietary state={state} onChange={updateState} />
        )}
        {step === 6 && (
          <StepSummary state={state} />
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: "var(--color-rose)", textAlign: "center" }}>{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack} style={{ flex: 1 }}>
            Back
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button
            onClick={handleNext}
            disabled={!canAdvance(step, state)}
            style={{ flex: 1 }}
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? "Saving…" : "Get Started"}
          </Button>
        )}
      </div>
    </div>
  );
}

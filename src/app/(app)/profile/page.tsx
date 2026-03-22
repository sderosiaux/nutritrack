"use client";

/**
 * Profile editor page (CHK-022)
 * S-PROFILE-1: Overview, My Goals, Body Metrics, Dietary Preferences
 * S-PROFILE-3: Data & Privacy, Account deletion (CHK-055)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface UserProfile {
  userId: string;
  displayName: string | null;
  biologicalSex: string | null;
  goal: string | null;
  activityLevel: string | null;
  currentWeightKg: string | null;
  heightCm: string | null;
  birthDate: string | null;
  units: string;
  language: string;
  timezone: string;
  dietaryRestrictions: string[];
  allergies: string[];
}

interface DailyTargets {
  caloriesKcal: number;
  proteinG: string | number;
  carbsG: string | number;
  fatG: string | number;
  fiberG: string | number;
  waterMl: number;
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight",
  maintain: "Maintain Weight",
  build_muscle: "Build Muscle",
  eat_healthier: "Eat Healthier",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Moderately Active",
  active: "Active",
  very_active: "Very Active",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>
      {title}
    </h2>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>
          Delete Account
        </h3>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 20 }}>
          Are you sure you want to delete your account? This action is irreversible and will
          permanently erase all your data.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              background: "var(--color-destructive)",
              color: "var(--color-destructive-foreground)",
            }}
          >
            {loading ? "Deleting…" : "Delete Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading } = useQuery<{ profile: UserProfile; targets: DailyTargets | null }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    staleTime: 60_000,
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/profile/recalculate-targets", { method: "POST" });
      if (!res.ok) throw new Error("Failed to recalculate");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Targets recalculated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to recalculate targets"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/users/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
    },
    onSuccess: () => {
      toast.success("Account deleted");
      window.location.href = "/";
    },
    onError: () => toast.error("Failed to delete account"),
  });

  if (isLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div
          style={{
            height: 200,
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-lg)",
          }}
        />
      </div>
    );
  }

  const profile = data?.profile;
  const targets = data?.targets;

  return (
    <div className="p-4 flex flex-col gap-6 max-w-2xl mx-auto">
      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--color-text)" }}
        role="heading"
        aria-level={1}
      >
        Profile
      </h1>

      {/* My Goals */}
      <Card>
        <CardContent className="p-4">
          <SectionHeader title="My Goals" />
          <ProfileField
            label="Goal"
            value={profile?.goal ? GOAL_LABELS[profile.goal] : null}
          />
          <ProfileField
            label="Activity Level"
            value={profile?.activityLevel ? ACTIVITY_LABELS[profile.activityLevel] : null}
          />
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
            >
              {recalculateMutation.isPending ? "Recalculating…" : "Recalculate Targets"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Body Metrics */}
      <Card>
        <CardContent className="p-4">
          <SectionHeader title="Body Metrics" />
          <ProfileField
            label="Height"
            value={profile?.heightCm ? `${profile.heightCm} cm` : null}
          />
          <ProfileField
            label="Weight"
            value={profile?.currentWeightKg ? `${profile.currentWeightKg} kg` : null}
          />
          <ProfileField label="Biological Sex" value={profile?.biologicalSex ?? null} />
        </CardContent>
      </Card>

      {/* Nutrition Targets */}
      <Card>
        <CardContent className="p-4">
          <SectionHeader title="Nutrition Targets" />
          {targets ? (
            <>
              <ProfileField label="Calories" value={`${targets.caloriesKcal} kcal`} />
              <ProfileField label="Protein" value={`${Math.round(Number(targets.proteinG))}g`} />
              <ProfileField label="Carbs" value={`${Math.round(Number(targets.carbsG))}g`} />
              <ProfileField label="Fat" value={`${Math.round(Number(targets.fatG))}g`} />
              <ProfileField label="Fiber" value={`${Math.round(Number(targets.fiberG))}g`} />
              <ProfileField label="Water" value={`${targets.waterMl} ml`} />
            </>
          ) : (
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              Complete your profile to see personalized targets.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <CardContent className="p-4">
          <SectionHeader title="Dietary Preferences" />
          <ProfileField
            label="Restrictions"
            value={
              profile?.dietaryRestrictions?.length
                ? profile.dietaryRestrictions.join(", ")
                : "None"
            }
          />
          <ProfileField
            label="Allergies"
            value={profile?.allergies?.length ? profile.allergies.join(", ") : "None"}
          />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardContent className="p-4">
          <SectionHeader title="Data &amp; Privacy" />
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
            Permanently delete all your NutriTrack data and account.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            style={{
              color: "var(--color-destructive)",
              borderColor: "var(--color-destructive)",
            }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export default ProfilePage;

"use client";

/**
 * WeeklyCheckinModal — CHK-058
 * Simple localStorage-based weekly check-in modal.
 * Shows once per week, can be dismissed forever.
 */

import { useState } from "react";

const STORAGE_KEY = "nutritrack-weekly-checkin";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface CheckinState {
  lastCheckin?: string;
  lastResponse?: string;
  dismissedForever?: boolean;
}

function loadState(): CheckinState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: CheckinState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function shouldShow(state: CheckinState): boolean {
  if (state.dismissedForever) return false;
  if (!state.lastCheckin) return true;
  const diff = Date.now() - new Date(state.lastCheckin).getTime();
  return diff > WEEK_MS;
}

const EMOJI_OPTIONS = [
  { emoji: "😄", label: "Great", value: "great" },
  { emoji: "🙂", label: "Good", value: "good" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😔", label: "Tough week", value: "tough" },
  { emoji: "💪", label: "Crushed it!", value: "crushed" },
];

export function WeeklyCheckinModal() {
  const [visible, setVisible] = useState(() =>
    typeof window === "undefined" ? false : shouldShow(loadState())
  );

  const handleResponse = (value: string) => {
    saveState({ lastCheckin: new Date().toISOString(), lastResponse: value });
    setVisible(false);
  };

  const handleDismissForever = () => {
    saveState({ ...loadState(), dismissedForever: true });
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Weekly check-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
        padding: "0 16px 24px",
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
            How&apos;s your week going?
          </h3>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "var(--color-text-muted)",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 20 }}>
          Tap an emoji to log your weekly check-in.
        </p>

        {/* Emoji options */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "space-around",
            marginBottom: 20,
          }}
        >
          {EMOJI_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              data-emoji={opt.value}
              onClick={() => handleResponse(opt.value)}
              aria-label={opt.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "12px 8px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-alt)",
                cursor: "pointer",
                minWidth: 56,
                transition: "background 200ms, border-color 200ms",
              }}
            >
              <span style={{ fontSize: 28 }}>{opt.emoji}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Don't ask again */}
        <button
          onClick={handleDismissForever}
          style={{
            width: "100%",
            padding: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: "var(--color-text-muted)",
            textAlign: "center",
          }}
        >
          Don&apos;t ask again
        </button>
      </div>
    </div>
  );
}

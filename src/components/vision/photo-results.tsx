"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface RecognizedItem {
  name: string;
  weightG: number;
  confidence: number;
}

interface PhotoResultsProps {
  items: RecognizedItem[];
  loading?: boolean;
  onConfirm: (selected: RecognizedItem[]) => void;
  onCancel: () => void;
}

// Rough kcal/g estimates for common food categories
const APPROX_KCAL_PER_G = 2.0; // conservative average (actual varies 0.4–9)

function estimateKcal(item: RecognizedItem): number {
  return Math.round(item.weightG * APPROX_KCAL_PER_G);
}

export function PhotoResults({ items, loading = false, onConfirm, onCancel }: PhotoResultsProps) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(items.map((_, i) => i))
  );

  function toggleItem(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleConfirm() {
    const confirmed = items.filter((_, i) => selected.has(i));
    onConfirm(confirmed);
  }

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 32,
          color: "var(--color-text-muted)",
        }}
      >
        <div style={{ fontSize: 14 }}>Analyzing photo...</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Processing your food image</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          No foods detected. Try a clearer photo.
        </div>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          style={{ marginTop: 12 }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
        Detected Foods ({items.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <label
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: "var(--radius-md)",
              border: `1px solid ${selected.has(i) ? "var(--color-primary)" : "var(--color-border)"}`,
              background: selected.has(i) ? "#f0fdf4" : "transparent",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggleItem(i)}
              style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                ~{item.weightG}g · ~{estimateKcal(item)} kcal
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color:
                  item.confidence > 0.8
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                fontWeight: 500,
              }}
            >
              {Math.round(item.confidence * 100)}%
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          style={{ flex: 1 }}
          aria-label="Add selected foods"
        >
          Add {selected.size} Item{selected.size !== 1 ? "s" : ""}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" aria-label="Cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FoodItem = {
  id: string;
  name: string;
  brandName: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSizes: Array<{ id: string; label: string; weightG: number }>;
};

interface BarcodeScannerProps {
  onFoodFound: (food: FoodItem) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onFoodFound, onClose }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCamera = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  async function handleLookup() {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/foods/barcode/${encodeURIComponent(barcode.trim())}`);
      if (!res.ok) {
        setError("No product found. Try a different barcode or add food manually.");
        return;
      }
      const food = await res.json() as FoodItem;
      onFoodFound(food);
    } catch {
      setError("Failed to look up barcode. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLookup();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Scan Barcode
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close barcode scanner">
          ✕
        </Button>
      </div>

      {hasCamera && (
        <div
          style={{
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "32px 16px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: 14,
          }}
        >
          <p>Camera scanning available</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Point camera at barcode</p>
        </div>
      )}

      {!hasCamera && (
        <div
          style={{
            background: "var(--color-surface-alt)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: 13,
          }}
        >
          Camera not available in this browser
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="barcode-manual"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-muted)",
          }}
        >
          Enter barcode manually
        </label>
        <div className="flex gap-2">
          <Input
            id="barcode-manual"
            type="text"
            placeholder="e.g. 1234567890"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Barcode number"
          />
          <Button
            onClick={handleLookup}
            disabled={loading || !barcode.trim()}
            aria-label="Search barcode"
          >
            {loading ? "..." : "Search"}
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: 13,
            color: "var(--color-rose)",
            background: "#fef2f2",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

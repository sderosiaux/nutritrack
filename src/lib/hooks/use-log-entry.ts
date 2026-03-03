"use client";

/**
 * useLogEntry — unified logging hook that routes IndexedDB-first for guests.
 *
 * When isGuest=true:  entries go to IndexedDB (Dexie.js) via guest-log.ts
 * When authenticated: entries go to the server API (lane 4 implementation)
 *
 * This is the single entry point for all meal/water/weight logging in the app.
 */
import { useGuestStore } from "@/lib/stores/guest-store";
import {
  addGuestMealEntry,
  addGuestWaterEntry,
  addGuestWeightEntry,
  type GuestMealInput,
  type GuestWaterInput,
  type GuestWeightInput,
} from "@/lib/guest/guest-log";

export function useLogEntry() {
  const isGuest = useGuestStore((s) => s.isGuest);

  async function logMealEntry(entry: GuestMealInput): Promise<number> {
    if (isGuest) return addGuestMealEntry(entry);
    // Lane 4: POST /api/v1/logs/:date/meals
    const res = await fetch(`/api/v1/logs/${entry.date}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to log meal");
    const data = await res.json();
    return data.id as number;
  }

  async function logWaterEntry(entry: GuestWaterInput): Promise<number> {
    if (isGuest) return addGuestWaterEntry(entry);
    const res = await fetch(`/api/v1/logs/${entry.date}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to log water");
    const data = await res.json();
    return data.id as number;
  }

  async function logWeightEntry(entry: GuestWeightInput): Promise<number> {
    if (isGuest) return addGuestWeightEntry(entry);
    const res = await fetch(`/api/v1/logs/${entry.date}/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to log weight");
    const data = await res.json();
    return data.id as number;
  }

  return { logMealEntry, logWaterEntry, logWeightEntry, isGuest };
}

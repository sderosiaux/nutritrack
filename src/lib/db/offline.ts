import Dexie, { type EntityTable } from "dexie";

export interface OfflineMealEntry {
  id: number;
  date: string;         // YYYY-MM-DD
  foodId: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  createdAt: number;    // epoch ms
}

export interface OfflineWaterEntry {
  id: number;
  date: string;
  ml: number;
  createdAt: number;
}

export interface OfflineWeightEntry {
  id: number;
  date: string;
  kg: number;
  createdAt: number;
}

export interface SyncQueueItem {
  id: number;
  action: "add" | "update" | "delete";
  table: string;
  payload: string;      // JSON
  createdAt: number;
  attempts: number;
}

export class NutriDB extends Dexie {
  mealEntries!: EntityTable<OfflineMealEntry, "id">;
  waterEntries!: EntityTable<OfflineWaterEntry, "id">;
  weightEntries!: EntityTable<OfflineWeightEntry, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("NutriTrack");
    this.version(1).stores({
      mealEntries: "++id, date, mealType, foodId",
      waterEntries: "++id, date",
      weightEntries: "++id, date",
      syncQueue: "++id, table, createdAt",
    });
  }
}

// Singleton — instantiated lazily (browser-only)
let _db: NutriDB | null = null;

export function getOfflineDB(): NutriDB {
  if (!_db) {
    _db = new NutriDB();
  }
  return _db;
}

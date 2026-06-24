import type { AppData } from "./types";
import { buildSeedData } from "./seed";

// Single source of truth for persistence. Today it uses localStorage.
// To move to Supabase/Firebase later, only this file needs to change.

const KEY = "manjunath_milk_data_v1";

export function loadData(): AppData {
  if (typeof window === "undefined") return buildSeedData();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seed = buildSeedData();
      saveData(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Basic shape guard
    if (!parsed.customers || !parsed.products || !parsed.deliveries) {
      const seed = buildSeedData();
      saveData(seed);
      return seed;
    }
    return parsed;
  } catch {
    const seed = buildSeedData();
    saveData(seed);
    return seed;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

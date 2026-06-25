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
    // Migration: older saved data has no stock entries.
    if (!parsed.stockEntries) parsed.stockEntries = [];
    // Migration to v2: ensure the HAP MAIN shop exists (added later).
    if ((parsed.version ?? 1) < 2) {
      const exists = parsed.customers.some(
        (c) => c.name.trim().toLowerCase() === "hap main"
      );
      if (!exists) {
        parsed.customers.push({
          id: newId(),
          name: "HAP MAIN",
          isDealer: false,
          createdAt: new Date().toISOString(),
        });
      }
      parsed.version = 2;
      saveData(parsed);
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

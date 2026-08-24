import type { Reading, ReadingSource, StationState } from "./types";

export type DashboardSnapshot = {
  stations: StationState[];
  history: Record<string, Reading[]>;
  activeId: string;
  recordCount: number;
  sourceByStation: Record<string, ReadingSource>;
};

export const STORAGE_KEY = "jernih-next-dashboard-v2";

export function loadSnapshot(key = STORAGE_KEY): Partial<DashboardSnapshot> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: DashboardSnapshot, key = STORAGE_KEY): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(snapshot)); } catch { /* storage may be unavailable */ }
}

export function clearSnapshot(key = STORAGE_KEY): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch { /* noop */ }
}

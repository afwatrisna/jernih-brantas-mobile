import type { Reading, ReadingSource } from "./types";

export const MAX_NTU = 500;

export function normalizeNtu(value: number) {
  return Math.round(value * 10) / 10;
}

export function makeReading(ntu: number, source: ReadingSource, equipment: string, timestamp = Date.now()): Reading {
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    ntu: normalizeNtu(ntu),
    timestamp,
    source,
    equipment,
  };
}

export function isValidNtu(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= MAX_NTU;
}

import type { Reading, StationState } from "./types";

export type TimeRange = "24H" | "7D" | "30D" | "90D";
export type History = Record<string, Reading[]>;

export const RANGE_MS: Record<TimeRange, number> = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "90D": 90 * 24 * 60 * 60 * 1000,
};

export function filterReadings(readings: Reading[], range: TimeRange, now = Date.now()) {
  const cutoff = now - RANGE_MS[range];
  return readings.filter((reading) => reading.timestamp >= cutoff);
}

export function summarizeReadings(readings: Reading[]) {
  if (!readings.length) return { min: 0, max: 0, average: 0, count: 0 };
  const values = readings.map((reading) => reading.ntu);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    count: values.length,
  };
}

export function stationSummary(station: StationState, readings: Reading[], range: TimeRange, now = Date.now()) {
  const filtered = filterReadings(readings, range, now);
  return { station, ...summarizeReadings(filtered), readings: filtered };
}

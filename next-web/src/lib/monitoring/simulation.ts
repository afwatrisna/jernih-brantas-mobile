import type { Reading, StationState } from "./types";

export const MAX_HISTORY = 160;
export const SIMULATION_INTERVAL_MS = 4_000;

export function makeReading(ntu: number, source: Reading["source"], equipment: string, timestamp = Date.now()): Reading {
  return { id: `${timestamp}-${Math.random().toString(36).slice(2, 7)}`, ntu: Math.round(ntu * 10) / 10, timestamp, source, equipment };
}

export function seedHistory(stations: StationState[], rangeMs: number): Record<string, Reading[]> {
  const now = Date.now();
  return Object.fromEntries(stations.map((station, stationIndex) => {
    const archive = Array.from({ length: 48 }, (_, index) => {
      const age = ((48 - index) / 48) * rangeMs;
      const seasonal = Math.sin(index * 0.78 + stationIndex) * (1.8 + stationIndex * 0.35);
      const variation = ((index + stationIndex * 2) % 5 - 2) * 0.38;
      const demoSpike = station.id === "mojokerto" && index === 43 ? 19 : 0;
      return makeReading(Math.max(1, station.baseline + seasonal + variation + demoSpike), "simulation", "Arsip demo (simulasi)", now - age);
    });
    const recent = [-3, -2, -1, 0].map((i) => makeReading(station.baseline + i * 0.6, "simulation", "NTU-Logger demo", now + i * SIMULATION_INTERVAL_MS));
    return [station.id, [...archive, ...recent]];
  }));
}

export function nextSimulatedValue(station: StationState, previous: number): number {
  const drift = (Math.random() - 0.5) * 2.2;
  const anomaly = Math.random() < 0.035 ? 10 + Math.random() * 25 : 0;
  return Math.max(0, Math.min(120, previous + drift + anomaly));
}

import type { Reading, StationState } from "../monitoring/types";

export type StationResponse = StationState & { lastReading?: Reading };
export type ReadingsQuery = { stationId: string; from?: string; to?: string; limit?: number };
export type CreateReadingInput = { stationId: string; ntu: number; source: Reading["source"]; equipment: string; timestamp?: string };
export type AnalyticsResponse = { stationId: string; from: string; to: string; min: number; max: number; average: number; baseline: number; anomalyCount: number };

export const API_ROUTES = {
  stations: "/api/stations",
  readings: (stationId: string) => `/api/stations/${stationId}/readings`,
  analytics: (stationId: string) => `/api/stations/${stationId}/analytics`,
  alerts: "/api/alerts",
} as const;

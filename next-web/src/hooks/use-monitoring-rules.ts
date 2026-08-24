"use client";

import { useMemo } from "react";
import { getStationInsight, type StationInsight } from "../lib/monitoring/rules";
import type { Reading, StationState } from "../lib/monitoring/types";

export function useMonitoringRules(stations: StationState[], history: Record<string, Reading[]>): Record<string, StationInsight> {
  return useMemo(() => Object.fromEntries(stations.map((station) => [station.id, getStationInsight(station, history[station.id] ?? [])])), [stations, history]);
}

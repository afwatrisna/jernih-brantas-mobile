"use client";

import { useEffect } from "react";
import { SIMULATION_INTERVAL_MS, nextSimulatedValue } from "../lib/monitoring/simulation";
import type { StationState } from "../lib/monitoring/types";

export function useSimulation(enabled: boolean, stations: StationState[], onTick: (stationId: string, value: number) => void) {
  useEffect(() => {
    if (!enabled || stations.length === 0) return;
    const timer = window.setInterval(() => {
      stations.forEach((station) => onTick(station.id, nextSimulatedValue(station, station.ntu)));
    }, SIMULATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, stations, onTick]);
}

import type { Reading, StationState } from "./types";

export type Severity = "normal" | "warning" | "high" | "critical";
export type AlertState = "active" | "resolved" | "none";

export type StationInsight = {
  severity: Severity;
  label: string;
  color: string;
  softColor: string;
  deviation: number;
  anomaly: string | null;
  alertState: AlertState;
};

export const SEVERITY_META: Record<Severity, Pick<StationInsight, "label" | "color" | "softColor">> = {
  normal: { label: "Normal", color: "#2D6A5C", softColor: "#DCEBE5" },
  warning: { label: "Warning", color: "#A27719", softColor: "#F5ECD0" },
  high: { label: "High", color: "#C4622D", softColor: "#F6E2D6" },
  critical: { label: "Critical", color: "#8B3A1F", softColor: "#F0D9D0" },
};

export function getSeverity(ntu: number, baseline: number): Severity {
  const deviation = ((ntu - baseline) / Math.max(1, baseline)) * 100;
  if (ntu >= 75 || deviation >= 190) return "critical";
  if (ntu >= 50 || deviation >= 100) return "high";
  if (ntu > 25 || deviation >= 60) return "warning";
  return "normal";
}

export function getStationInsight(station: StationState, readings: Reading[]): StationInsight {
  const deviation = ((station.ntu - station.baseline) / Math.max(1, station.baseline)) * 100;
  const severity = getSeverity(station.ntu, station.baseline);
  const recent = readings.slice(-4);
  const rapidChange = recent.length >= 3 && recent[recent.length - 1].ntu - recent[0].ntu >= Math.max(12, station.baseline * 0.55);
  const persistent = recent.length >= 3 && recent.slice(-3).every((reading) => reading.ntu > Math.max(25, station.baseline * 1.4));
  const baselineDeviation = deviation >= 60;
  const anomaly = rapidChange ? "Kenaikan cepat" : persistent ? "Abnormal berlanjut" : baselineDeviation ? "Menyimpang dari baseline" : null;
  const hadAlert = readings.some((reading) => reading.ntu > 25);
  const alertState: AlertState = severity === "normal" ? (hadAlert ? "resolved" : "none") : "active";
  return { severity, ...SEVERITY_META[severity], deviation, anomaly, alertState };
}

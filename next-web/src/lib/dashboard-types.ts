import type { Reading, ReadingSource, StationState } from "./jernih-data";

export type Section = "monitor" | "field" | "analytics" | "settings";
export type History = Record<string, Reading[]>;
export type SourceByStation = Record<string, ReadingSource>;
export type Severity = "normal" | "warning" | "high" | "critical";
export type MapFilter = "all" | "normal" | "warning" | "alert" | "anomaly";
export type TimeRange = "24H" | "7D" | "30D" | "90D";
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

export type IconName =
  | "grid"
  | "field"
  | "chart"
  | "settings"
  | "water"
  | "map"
  | "plus"
  | "check"
  | "restart"
  | "shield"
  | "database"
  | "alert"
  | "trend"
  | "download";

export type { Reading, ReadingSource, StationState };

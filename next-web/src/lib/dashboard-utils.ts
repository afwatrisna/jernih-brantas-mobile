import type { Reading, ReadingSource, StationState } from "./jernih-data";
import type {
  AlertState,
  History,
  Severity,
  StationInsight,
  TimeRange,
} from "./dashboard-types";

export const STORAGE_KEY = "jernih-next-dashboard-v2";
export const MAX_HISTORY = 160;

export const RANGE_MS: Record<TimeRange, number> = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "90D": 90 * 24 * 60 * 60 * 1000,
};

export const SEVERITY_META: Record<
  Severity,
  Pick<StationInsight, "label" | "color" | "softColor">
> = {
  normal: { label: "Normal", color: "#2D6A5C", softColor: "#DCEBE5" },
  warning: { label: "Warning", color: "#A27719", softColor: "#F5ECD0" },
  high: { label: "High", color: "#C4622D", softColor: "#F6E2D6" },
  critical: { label: "Critical", color: "#8B3A1F", softColor: "#F0D9D0" },
};

export function makeReading(
  ntu: number,
  source: ReadingSource,
  equipment: string,
  timestamp = Date.now(),
): Reading {
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    ntu: Math.round(ntu * 10) / 10,
    timestamp,
    source,
    equipment,
  };
}

export function seedHistory(stations: StationState[]): History {
  const now = Date.now();
  const ninetyDays = RANGE_MS["90D"];
  return Object.fromEntries(
    stations.map((station, stationIndex) => {
      const archive = Array.from({ length: 48 }, (_, index) => {
        const age = ((48 - index) / 48) * ninetyDays;
        const seasonal = Math.sin(index * 0.78 + stationIndex) * (1.8 + stationIndex * 0.35);
        const variation = ((index + stationIndex * 2) % 5 - 2) * 0.38;
        const demoSpike = station.id === "mojokerto" && index === 43 ? 19 : 0;
        return makeReading(
          Math.max(1, station.baseline + seasonal + variation + demoSpike),
          "simulation",
          "Arsip demo (simulasi)",
          now - age,
        );
      });
      const recent = [-3, -2, -1, 0].map((index) =>
        makeReading(
          station.baseline + index * 0.6,
          "simulation",
          "NTU-Logger demo",
          now + index * 4_000,
        ),
      );
      return [station.id, [...archive, ...recent]];
    }),
  );
}

export function trustCopy(source: ReadingSource, simulation: boolean) {
  if (source === "manual") {
    return {
      label: "INPUT MANUAL",
      detail: "Perlu verifikasi lapangan",
      note: "Pembacaan manual perlu dibandingkan dengan alat referensi sebelum dipublikasikan.",
    };
  }
  if (source === "sensor") {
    return {
      label: "SENSOR",
      detail: "Siap ditinjau",
      note: "Pembacaan berasal dari perangkat sensor yang terhubung.",
    };
  }
  return {
    label: simulation ? "SIMULASI" : "SIMULASI DIJEDA",
    detail: "Perlu verifikasi",
    note: "Nilai simulasi berguna untuk demo alur kerja; bukan data lingkungan resmi.",
  };
}

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function formatPercent(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function getSeverity(ntu: number, baseline: number): Severity {
  const deviation = ((ntu - baseline) / Math.max(1, baseline)) * 100;
  if (ntu >= 75 || deviation >= 190) return "critical";
  if (ntu >= 50 || deviation >= 100) return "high";
  if (ntu > 25 || deviation >= 60) return "warning";
  return "normal";
}

export function getStationInsight(
  station: StationState,
  readings: Reading[],
): StationInsight {
  const deviation =
    ((station.ntu - station.baseline) / Math.max(1, station.baseline)) * 100;
  const severity = getSeverity(station.ntu, station.baseline);
  const recent = readings.slice(-4);
  const rapidChange =
    recent.length >= 3 &&
    recent[recent.length - 1].ntu - recent[0].ntu >=
      Math.max(12, station.baseline * 0.55);
  const persistent =
    recent.length >= 3 &&
    recent
      .slice(-3)
      .every((reading) => reading.ntu > Math.max(25, station.baseline * 1.4));
  const baselineDeviation = deviation >= 60;
  const anomaly = rapidChange
    ? "Kenaikan cepat"
    : persistent
      ? "Abnormal berlanjut"
      : baselineDeviation
        ? "Menyimpang dari baseline"
        : null;
  const hadAlert = readings.some((reading) => {
    const readingSeverity = getSeverity(reading.ntu, station.baseline);
    return readingSeverity === "high" || readingSeverity === "critical";
  });
  const alertState: AlertState =
    severity === "high" || severity === "critical"
      ? "active"
      : hadAlert
        ? "resolved"
        : "none";
  return {
    severity,
    ...SEVERITY_META[severity],
    deviation,
    anomaly,
    alertState,
  };
}

export function getConditionCopy(insight: StationInsight) {
  if (insight.severity === "critical") {
    return {
      title: "Kondisi: sangat perlu ditinjau.",
      detail: "Nilai berada jauh di atas baseline dan perlu verifikasi lapangan.",
    };
  }
  if (insight.severity === "high") {
    return {
      title: "Kondisi: perlu ditinjau.",
      detail: "Nilai melewati ambang perhatian dan perlu verifikasi lapangan.",
    };
  }
  if (insight.severity === "warning") {
    return {
      title: "Kondisi: perlu diperhatikan.",
      detail: "Air agak lebih keruh dari biasanya.",
    };
  }
  return {
    title: "Kondisi: dalam pola normal.",
    detail: "Nilai masih berada di sekitar baseline stasiun.",
  };
}

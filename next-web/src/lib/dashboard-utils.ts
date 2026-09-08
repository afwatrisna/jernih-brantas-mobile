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
  warning: { label: "Waspada", color: "#A27719", softColor: "#F5ECD0" },
  high: { label: "Keruh", color: "#C4622D", softColor: "#F6E2D6" },
  critical: { label: "Kritis", color: "#8B3A1F", softColor: "#F0D9D0" },
};

/**
 * Skala kekeruhan sungai (NTU) — satu sumber kebenaran.
 * Bukan baku mutu air minum; indikatif untuk pemantauan tren.
 * Kalibrasi ulang di sini saja setelah sensor riil tersedia.
 */
export type NtuCategoryId =
  | "sangat_jernih"
  | "jernih"
  | "waspada"
  | "keruh"
  | "sangat_keruh"
  | "ekstrem";

export type NtuCategory = {
  id: NtuCategoryId;
  label: string;
  severity: Severity;
  extreme: boolean;
  rangeLabel: string;
};

/** Upper bounds for each tier (next tier starts above this value). */
export const NTU_CATEGORY_BOUNDS = {
  sangat_jernih: 5,
  jernih: 15,
  waspada: 30,
  keruh: 60,
  sangat_keruh: 150,
} as const;

export function getNtuCategory(ntu: number): NtuCategory {
  const value = Number.isFinite(ntu) ? ntu : 0;
  if (value > NTU_CATEGORY_BOUNDS.sangat_keruh) {
    return {
      id: "ekstrem",
      label: "Ekstrem",
      severity: "critical",
      extreme: true,
      rangeLabel: ">150 NTU",
    };
  }
  if (value > NTU_CATEGORY_BOUNDS.keruh) {
    return {
      id: "sangat_keruh",
      label: "Sangat Keruh",
      severity: "critical",
      extreme: false,
      rangeLabel: "60–150 NTU",
    };
  }
  if (value > NTU_CATEGORY_BOUNDS.waspada) {
    return {
      id: "keruh",
      label: "Keruh",
      severity: "high",
      extreme: false,
      rangeLabel: "30–60 NTU",
    };
  }
  if (value > NTU_CATEGORY_BOUNDS.jernih) {
    return {
      id: "waspada",
      label: "Waspada",
      severity: "warning",
      extreme: false,
      rangeLabel: "15–30 NTU",
    };
  }
  if (value > NTU_CATEGORY_BOUNDS.sangat_jernih) {
    return {
      id: "jernih",
      label: "Jernih / Normal",
      severity: "normal",
      extreme: false,
      rangeLabel: "5–15 NTU",
    };
  }
  return {
    id: "sangat_jernih",
    label: "Sangat Jernih",
    severity: "normal",
    extreme: false,
    rangeLabel: "0–5 NTU",
  };
}

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

export function getSeverity(ntu: number, _baseline?: number): Severity {
  return getNtuCategory(ntu).severity;
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
  const category = getNtuCategory(station.ntu);
  const label =
    category.extreme ? `${SEVERITY_META[severity].label} · Ekstrem` : SEVERITY_META[severity].label;
  return {
    severity,
    label,
    color: SEVERITY_META[severity].color,
    softColor: SEVERITY_META[severity].softColor,
    deviation,
    anomaly: category.extreme ? anomaly ?? "Kekeruhan ekstrem" : anomaly,
    alertState,
  };
}

export function getConditionCopy(insight: StationInsight) {
  if (insight.severity === "critical") {
    const extreme = insight.label.includes("Ekstrem") || insight.anomaly === "Kekeruhan ekstrem";
    return {
      title: extreme ? "Kondisi: kekeruhan ekstrem." : "Kondisi: sangat keruh.",
      detail: extreme
        ? "Nilai di atas 150 NTU — prioritaskan verifikasi lapangan."
        : "Nilai 60–150 NTU — perlu verifikasi lapangan.",
    };
  }
  if (insight.severity === "high") {
    return {
      title: "Kondisi: keruh.",
      detail: "Nilai 30–60 NTU — pantau dan verifikasi bila berlanjut.",
    };
  }
  if (insight.severity === "warning") {
    return {
      title: "Kondisi: waspada.",
      detail: "Nilai 15–30 NTU — air lebih keruh dari rentang normal pemantauan.",
    };
  }
  return {
    title: "Kondisi: jernih / normal.",
    detail: "Nilai dalam rentang 0–15 NTU untuk skala pemantauan sungai ini.",
  };
}

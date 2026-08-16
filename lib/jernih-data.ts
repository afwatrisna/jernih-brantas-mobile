export type Station = {
  id: string;
  name: string;
  subtitle: string;
  baseline: number;
  x: number;
  y: number;
};

export type StationState = Station & {
  ntu: number;
};

export type ReadingSource = "sensor" | "manual";

export type Reading = {
  id: string;
  ntu: number;
  waktu: string;
  ts: number;
  sumber: ReadingSource;
  alat: string;
};

export type HistoryByStation = Record<string, Reading[]>;

export type WaterClass = {
  label: "Sangat Jernih" | "Jernih" | "Keruh" | "Sangat Keruh";
  grade: "I" | "II" | "III" | "IV";
  color: string;
  softColor: string;
};

export const STORAGE_KEY = "jernih_brantas_v2";
export const MAX_HISTORY = 40;

export const EQUIPMENT = [
  "Turbidimeter T-100",
  "Turbidimeter HI-98703",
  "Sensor NTU-Logger V2",
] as const;

export const INITIAL_STATIONS: Station[] = [
  { id: "malang", name: "Malang (Hulu)", subtitle: "Bendungan Sengguruh", baseline: 9, x: 12, y: 14 },
  { id: "kediri", name: "Kediri", subtitle: "Jembatan Mrican", baseline: 16, x: 30, y: 40 },
  { id: "jombang", name: "Jombang", subtitle: "Ploso", baseline: 21, x: 46, y: 52 },
  { id: "mojokerto", name: "Mojokerto", subtitle: "Bendung Lengkong Baru", baseline: 27, x: 55, y: 62 },
  { id: "surabaya", name: "Surabaya (Hilir)", subtitle: "Karangpilang", baseline: 34, x: 78, y: 80 },
];

export const initialStationStates = (): StationState[] =>
  INITIAL_STATIONS.map((station) => ({ ...station, ntu: station.baseline }));

export function classifyNtu(ntu: number): WaterClass {
  if (ntu <= 5) {
    return { label: "Sangat Jernih", grade: "I", color: "#2D6A5C", softColor: "#DCEBE5" };
  }
  if (ntu <= 25) {
    return { label: "Jernih", grade: "II", color: "#4C8B7A", softColor: "#E3F0EA" };
  }
  if (ntu <= 50) {
    return { label: "Keruh", grade: "III", color: "#C4622D", softColor: "#F6E2D6" };
  }
  return { label: "Sangat Keruh", grade: "IV", color: "#8B3A1F", softColor: "#F0D9D0" };
}

export const formatNtu = (value: number) => value.toFixed(1);

export function formatTime(timestamp = Date.now()): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createReading(
  ntu: number,
  source: ReadingSource,
  equipment: string,
  timestamp = Date.now(),
): Reading {
  return {
    id: `${timestamp.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    ntu: Math.round(ntu * 10) / 10,
    waktu: formatTime(timestamp),
    ts: timestamp,
    sumber: source,
    alat: equipment,
  };
}

export function sanitizeHistory(value: unknown): HistoryByStation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: HistoryByStation = {};
  Object.entries(value as Record<string, unknown>).forEach(([stationId, entries]) => {
    if (!Array.isArray(entries)) return;
    const validEntries = entries
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => {
        const ntu = Number(entry.ntu);
        const timestamp = Number(entry.ts);
        if (!Number.isFinite(ntu) || ntu < 0 || !Number.isFinite(timestamp)) return null;
        return {
          id: typeof entry.id === "string" ? entry.id : `${timestamp}-${Math.random()}`,
          ntu: Math.round(ntu * 10) / 10,
          waktu: typeof entry.waktu === "string" ? entry.waktu : formatTime(timestamp),
          ts: timestamp,
          sumber: entry.sumber === "manual" ? "manual" : "sensor",
          alat: typeof entry.alat === "string" ? entry.alat : "Sensor NTU-Logger V2",
        } satisfies Reading;
      })
      .filter((entry): entry is Reading => entry !== null)
      .sort((a, b) => a.ts - b.ts)
      .slice(-MAX_HISTORY);

    if (validEntries.length) result[stationId] = validEntries;
  });
  return result;
}

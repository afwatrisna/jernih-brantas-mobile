export type ReadingSource = "simulation" | "manual" | "sensor";

export type WaterClass = {
  label: "Sangat Jernih" | "Jernih" | "Keruh" | "Sangat Keruh";
  grade: "I" | "II" | "III" | "IV";
  color: string;
  softColor: string;
};

export type Station = {
  id: string;
  name: string;
  subtitle: string;
  baseline: number;
  x: number;
  y: number;
};

export type StationState = Station & { ntu: number };

export type Reading = {
  id: string;
  ntu: number;
  timestamp: number;
  source: ReadingSource;
  equipment: string;
};

export const EQUIPMENT = [
  "NTU-Logger demo",
  "Turbidimeter T-100",
  "Turbidimeter HI-98703",
] as const;

export const STATIONS: Station[] = [
  { id: "malang", name: "Malang Hulu", subtitle: "Bendungan Sengguruh", baseline: 9, x: 13, y: 17 },
  { id: "kediri", name: "Kediri", subtitle: "Jembatan Mrican", baseline: 16, x: 29, y: 38 },
  { id: "jombang", name: "Jombang", subtitle: "Ploso", baseline: 21, x: 47, y: 54 },
  { id: "mojokerto", name: "Mojokerto", subtitle: "Bendung Lengkong", baseline: 27, x: 62, y: 68 },
  { id: "surabaya", name: "Surabaya Hilir", subtitle: "Karangpilang", baseline: 34, x: 81, y: 82 },
];

export const initialStationStates = (): StationState[] =>
  STATIONS.map((station) => ({ ...station, ntu: station.baseline }));

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

export const formatNtu = (ntu: number) => ntu.toFixed(1);

export const formatTime = (timestamp: number) =>
  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(timestamp);

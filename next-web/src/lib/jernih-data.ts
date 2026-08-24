import { classifyNtu } from "./monitoring/classification";
import type { Reading, ReadingSource, Station, StationState, WaterClass } from "./monitoring/types";

export type { Reading, ReadingSource, Station, StationState, WaterClass } from "./monitoring/types";
export { classifyNtu } from "./monitoring/classification";

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

export const formatNtu = (ntu: number) => ntu.toFixed(1);

export const formatTime = (timestamp: number) =>
  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(timestamp);

// Keep the domain rule referenced here during the compatibility phase so existing
// imports from jernih-data continue to work while page.tsx is incrementally split.
void classifyNtu;
void (null as unknown as Reading);

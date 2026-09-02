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
  lat: number;
  lng: number;
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
  { id: "malang", name: "Malang Hulu", subtitle: "Bendungan Sengguruh", baseline: 9, x: 13, y: 17, lat: -7.9966, lng: 112.6374 },
  { id: "kediri", name: "Kediri", subtitle: "Jembatan Mrican", baseline: 16, x: 29, y: 38, lat: -7.8219, lng: 112.0095 },
  { id: "jombang", name: "Jombang", subtitle: "Ploso", baseline: 21, x: 47, y: 54, lat: -7.4902, lng: 112.1927 },
  { id: "mojokerto", name: "Mojokerto", subtitle: "Bendung Lengkong", baseline: 27, x: 62, y: 68, lat: -7.4602, lng: 112.4309 },
  { id: "porong", name: "Porong / Sidoarjo Hilir", subtitle: "Kali Porong", baseline: 34, x: 81, y: 82, lat: -7.5337, lng: 112.8701 },
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

/**
 * Satu kalimat pendek yang menjelaskan arti NTU untuk pengunjung yang belum
 * familiar dengan istilah kekeruhan air. Dipakai sebagai anotasi inline di
 * bawah angka NTU, bukan disembunyikan di tooltip, supaya selalu terlihat.
 */
export const NTU_PLAIN_EXPLANATION = "NTU mengukur seberapa keruh air — makin tinggi angkanya, makin banyak partikel yang membuat air terlihat tidak jernih.";

/**
 * Deskripsi kelas air PP No. 22/2021 dalam bahasa sehari-hari, dipasangkan
 * dengan label teknis (grade I-IV) yang sudah ada di classifyNtu().
 */
export const WATER_CLASS_PLAIN_LABEL: Record<WaterClass["grade"], string> = {
  I: "standar tertinggi — cocok untuk air baku minum",
  II: "standar baik — cocok untuk rekreasi air dan perikanan",
  III: "standar sedang — umumnya untuk irigasi dan perikanan tertentu",
  IV: "standar paling longgar — untuk irigasi dan keperluan lain di luar konsumsi",
};

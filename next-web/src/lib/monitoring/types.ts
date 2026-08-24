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

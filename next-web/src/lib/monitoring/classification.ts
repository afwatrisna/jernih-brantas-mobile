import type { WaterClass } from "./types";

/**
 * Prototype NTU classification used by the current demo.
 * Keep this rule isolated so it can later be replaced by versioned
 * regulatory/domain rules without coupling them to React components.
 */
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

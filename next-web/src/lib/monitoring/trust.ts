import type { ReadingSource } from "./types";

export function getTrustCopy(source: ReadingSource, simulation: boolean) {
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

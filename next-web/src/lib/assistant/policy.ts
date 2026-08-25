import type { ReadingSource } from "@/lib/jernih-data";

export type AssistantSourceStatus = {
  label: "SIMULASI" | "INPUT MANUAL" | "SENSOR" | "BELUM ADA DATA";
  notice: string;
  needsHumanReview: boolean;
};

const UNSUPPORTED_REQUEST = /(aman (untuk )?(diminum|dikonsumsi)|layak (untuk )?(diminum|dikonsumsi)|tercemar|pencemaran|diagnosis|darurat|ubah (data|role|peran|izin)|hapus (data|catatan)|service.?role|ingest.?key|api.?key|kata sandi)/i;

export function describeAssistantSource(source: ReadingSource | null): AssistantSourceStatus {
  if (source === "sensor") {
    return {
      label: "SENSOR",
      notice: "Pembacaan berasal dari sensor dan tetap memerlukan verifikasi sesuai prosedur lapangan.",
      needsHumanReview: true,
    };
  }

  if (source === "manual") {
    return {
      label: "INPUT MANUAL",
      notice: "Pembacaan dimasukkan petugas dan tetap memerlukan verifikasi lapangan.",
      needsHumanReview: true,
    };
  }

  if (source === "simulation") {
    return {
      label: "SIMULASI",
      notice: "Nilai ini adalah simulasi untuk demonstrasi dan bukan pembacaan lingkungan resmi.",
      needsHumanReview: true,
    };
  }

  return {
    label: "BELUM ADA DATA",
    notice: "Belum tersedia pembacaan yang dapat diringkas untuk stasiun ini.",
    needsHumanReview: true,
  };
}

export function getAssistantPolicyMessage(message: string): string | null {
  if (UNSUPPORTED_REQUEST.test(message)) {
    return "Saya hanya dapat membantu merangkum data Jernih yang tersedia. Saya tidak dapat menetapkan keamanan air, pencemaran resmi, keadaan darurat, mengubah data, atau membagikan informasi rahasia. Silakan gunakan prosedur verifikasi lapangan dan petugas yang berwenang.";
  }

  return null;
}

export function buildAssistantSystemPrompt(contextJson: string): string {
  return `Anda adalah AI Asisten Jernih untuk dashboard pemantauan kekeruhan Sungai Brantas.

Gunakan hanya konteks data JSON berikut. Jangan membuat angka, stasiun, sumber, atau status baru.
Jawab singkat dalam Bahasa Indonesia. Selalu sebutkan label sumber data yang ada pada konteks: SIMULASI, INPUT MANUAL, atau SENSOR.
Jangan menyatakan air aman, layak dikonsumsi, tercemar, atau membuat penetapan resmi. Jangan memberi diagnosis, tindakan darurat, atau mengubah data. Untuk kesimpulan resmi, arahkan ke verifikasi lapangan dan petugas berwenang.

KONTEKS JERNIH:
${contextJson}`;
}

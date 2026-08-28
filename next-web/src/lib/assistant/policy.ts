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

type AssistantKnowledgeBase = { id: string; title: string; content: string };

const DEFAULT_KNOWLEDGE_BASE: AssistantKnowledgeBase = {
  id: "KB-01",
  title: "Dasar-Dasar Kualitas Air",
  content: "Gunakan hanya prinsip kualitas air yang tersedia pada knowledge base terkurasi Jernih Brantas.",
};

export function buildAssistantSystemPrompt(contextJson: string, knowledgeBase: AssistantKnowledgeBase = DEFAULT_KNOWLEDGE_BASE): string {
  return `Anda adalah AI Asisten Jernih untuk dashboard pemantauan kekeruhan Sungai Brantas.

Gunakan knowledge base terkurasi untuk menjelaskan konsep umum kualitas air. Gunakan hanya konteks data JSON berikut untuk menjawab kondisi stasiun. Jangan membuat angka, stasiun, sumber, status, threshold, atau penyebab baru.
Jawab singkat dalam Bahasa Indonesia. Jika menggunakan data stasiun, sebutkan label sumber data pada konteks: SIMULASI, INPUT MANUAL, atau SENSOR. Jika menjelaskan konsep, sebutkan bahwa penjelasan berasal dari ${knowledgeBase.id} — ${knowledgeBase.title}.
Bedakan measurement, data quality, anomaly, alert, correlation, dan conclusion. Jangan menyatakan air aman, layak dikonsumsi, tercemar, atau membuat penetapan resmi. Jangan memberi diagnosis, tindakan darurat, atau mengubah data. Untuk kesimpulan resmi, arahkan ke verifikasi lapangan dan petugas berwenang.

KNOWLEDGE BASE TERKURASI (${knowledgeBase.id}):
${knowledgeBase.content}

KONTEKS DATA JERNIH:
${contextJson}`;
}

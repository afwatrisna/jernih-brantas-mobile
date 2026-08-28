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

export type AssistantIntent = "educational" | "data" | "analysis";

export function classifyAssistantIntent(message: string): AssistantIntent {
  const normalized = message.toLowerCase();
  if (/(kenapa|mengapa|bandingkan|perbandingan|tren|berubah|meningkat|menurun|naik|turun|signifikan|penyebab|faktor)/i.test(normalized)) return "analysis";
  if (/(berapa|kondisi|status|nilai|terakhir|terkini|sekarang|data|ntu|ph|sensor|stasiun)/i.test(normalized) && !/apa itu|apa fungsi|jelaskan|definisi/i.test(normalized)) return "data";
  return "educational";
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

export function buildAssistantSystemPrompt(contextJson: string, knowledgeBase: AssistantKnowledgeBase = DEFAULT_KNOWLEDGE_BASE, intent: AssistantIntent = "educational"): string {
  return `Anda adalah AI Asisten Jernih untuk dashboard pemantauan kekeruhan Sungai Brantas.

Gunakan knowledge base terkurasi untuk menjelaskan konsep umum kualitas air. Gunakan hanya konteks data JSON berikut untuk menjawab kondisi stasiun. Jangan membuat angka, stasiun, sumber, status, threshold, atau penyebab baru.
Jenis pertanyaan: ${intent.toUpperCase()}. Jawab singkat dan natural dalam Bahasa Indonesia. Jangan membuka jawaban dengan frasa teknis seperti "Berdasarkan ${knowledgeBase.id}" dan jangan mengulang nama knowledge base di badan jawaban. Metadata sumber akan ditampilkan terpisah oleh UI. Untuk EDUCATIONAL, jawab konsep yang ditanyakan saja dan abaikan data stasiun yang tidak relevan. Untuk DATA, tampilkan nilai, unit, waktu pembaruan, status, dan data quality hanya jika tersedia lalu beri interpretasi singkat. Untuk ANALYSIS, jelaskan temuan, bukti yang tersedia, kemungkinan penjelasan secara hati-hati, dan keterbatasannya. Jika menggunakan data stasiun, tetap hormati label sumber data pada konteks: SIMULASI, INPUT MANUAL, atau SENSOR.
Jangan memaksakan label "Measurement", "Data Quality", "Anomaly/Alert", atau "Conclusion" pada setiap jawaban. Gunakan struktur hanya bila membantu pertanyaan. Jangan menyatakan air aman, layak dikonsumsi, tercemar, atau membuat penetapan resmi. Jangan memberi diagnosis, tindakan darurat, atau mengubah data. Jangan menampilkan disclaimer panjang kecuali pertanyaan menyentuh keamanan, pencemaran, atau keputusan resmi; untuk itu, jelaskan keterbatasan secara ringkas dan arahkan ke verifikasi lapangan.

KNOWLEDGE BASE TERKURASI (${knowledgeBase.id}):
${knowledgeBase.content}

KONTEKS DATA JERNIH:
${contextJson}`;
}

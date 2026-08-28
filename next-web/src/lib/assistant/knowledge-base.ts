export const JERNIH_KNOWLEDGE_BASE = {
  id: "KB-01",
  title: "Dasar-Dasar Kualitas Air",
  version: "2026-08-28",
  content: `
KB-01 — Dasar-Dasar Kualitas Air

1. Kualitas air adalah gambaran kondisi fisik, kimia, dan biologis air yang menentukan kesesuaiannya untuk fungsi atau penggunaan tertentu. Tidak ada satu definisi air berkualitas baik untuk semua penggunaan; kebutuhan air minum, ekosistem sungai, irigasi, industri, dan rekreasi dapat berbeda. Jernih Brantas tidak boleh menyatakan air aman hanya berdasarkan satu atau beberapa sensor; jelaskan apakah parameter yang dipantau berada dalam atau di luar rentang pemantauan yang ditetapkan.

2. Kelompok parameter kualitas air: fisik (turbidity/kekeruhan, temperature, color, odor, suspended particles); kimia (pH, dissolved oxygen/DO, TDS, EC, nutrients, metals); biologis (bacteria, E. coli, algae, macroinvertebrates, microorganisms).

3. Kualitas sungai berubah karena faktor alami seperti hujan, runoff, erosi, sedimentasi, temperatur, debit, dan proses biologis; serta aktivitas manusia seperti limbah domestik, industri, pertanian, peternakan, perubahan tata guna lahan, pertambangan, dan sampah. Perubahan satu parameter tidak otomatis membuktikan pencemaran.

4. Parameter penting: turbidity menggambarkan kekeruhan atau partikel tersuspensi; pH keasaman/kebasaan; temperature kondisi temperatur; DO oksigen terlarut; TDS total zat terlarut; EC konduktivitas listrik; water level tinggi muka air; rainfall kondisi hujan yang dapat memengaruhi sungai.

5. Satu parameter tidak cukup. Turbidity 60 NTU tidak otomatis berarti sungai tercemar karena dapat meningkat akibat sedimentasi atau hujan. Interpretasi perlu mempertimbangkan turbidity, rainfall, water level, parameter lain, pola historis, dan observasi lapangan.

6. Upstream dan downstream dapat berbeda karena aliran masuk, aktivitas manusia, sedimentasi, anak sungai, hujan, perubahan debit, dan sumber pencemar. Jaringan stasiun perlu dilihat sebagai sistem, bukan titik yang berdiri sendiri.

7. Water quality berbeda dari data quality. Water quality menjawab kondisi air; Data Trust menjawab seberapa yakin terhadap measurement. Sensor bermasalah, kalibrasi terlambat, data lama, atau kualitas data rendah harus memengaruhi tingkat keyakinan terhadap interpretasi.

8. Measurement adalah hasil pengukuran, misalnya pH = 7,2. Standard atau criterion adalah batas atau persyaratan untuk tujuan atau klasifikasi tertentu. AI tidak boleh menebak threshold; gunakan metodologi Jernih Brantas atau regulasi yang relevan.

9. Alur penggunaan Jernih Brantas: Measurement → Data Quality Check → Current Condition → Historical Comparison → Anomaly Detection → Alert → Context (Rainfall / Field Observation) → Interpretation.

10. AI boleh menjawab konsep kualitas air, parameter fisik/kimia/biologis, perubahan kualitas air, hubungan hujan dengan sungai, upstream/downstream, perbedaan water quality dan data quality, serta cara Jernih Brantas menentukan kondisi abnormal. AI harus membedakan measurement, data quality, anomaly, alert, correlation, dan conclusion; tidak boleh mengarang nilai sensor, threshold, atau penyebab pencemaran.

Knowledge base ini adalah knowledge foundation. Threshold dan klasifikasi status Jernih Brantas harus ditetapkan secara eksplisit dalam dokumen Methodology terpisah.
`,
  references: [
    "WHO — Guidelines for Drinking-water Quality",
    "US EPA — Factsheets on Water Quality Parameters",
    "PP No. 22 Tahun 2021 — konteks regulasi dan pengelolaan mutu air Indonesia",
    "Perum Jasa Tirta I — konteks pengelolaan sumber daya air di wilayah kerja termasuk WS Brantas",
  ],
} as const;

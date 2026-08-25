# Rekomendasi model AI untuk Asisten Jernih

## Rekomendasi singkat

Untuk **AI Asisten Jernih V1**, gunakan **Gemini 3.1 Flash-Lite** melalui paket `@ai-sdk/google` sebagai model utama. Model tersebut secara resmi diposisikan Google sebagai model hemat biaya untuk pekerjaan ber-volume tinggi, terjemahan, dan pemrosesan sederhana—karakter yang sesuai untuk asisten read-only yang merangkum tren, alert, dan status sumber data.[1]

Gunakan **OpenRouter free models** hanya untuk prototipe internal singkat, bukan untuk demo penting atau produksi. Pilihan fallback biaya rendah yang lebih stabil adalah **OpenAI GPT-OSS 20B melalui Groq** dengan paket `@ai-sdk/groq`.[2] [3]

> **Catatan penting:** Vercel AI SDK menyederhanakan integrasi dan pergantian provider, tetapi tidak membuat model menjadi gratis. Biaya inferensi tetap mengikuti provider/model yang dipilih.

## Perbandingan pilihan

| Pilihan | Integrasi AI SDK | Biaya provider saat ini | Kelayakan untuk Jernih | Keputusan |
|---|---|---:|---|---|
| **Gemini 3.1 Flash-Lite** | `@ai-sdk/google` | Free tier tersedia dengan kuota; paid Standard **$0,25/1M input** dan **$1,50/1M output** | Sangat sesuai untuk chat data terkurasi; pilihan utama untuk pilot dan produksi biaya rendah | **Pilih sebagai utama** |
| **OpenAI GPT-OSS 20B via Groq** | `@ai-sdk/groq` | **$0,075/1M input** dan **$0,30/1M output** pada Developer plan | Sangat murah dan cepat; jadikan fallback setelah lolos uji Bahasa Indonesia dan safety | **Pilih sebagai fallback** |
| **OpenRouter model `:free` / `openrouter/free`** | `@openrouter/ai-sdk-provider` | $0 token untuk model gratis, tetapi ada cap dan kapasitas bervariasi | Cocok untuk eksperimen awal, tidak cukup andal sebagai layanan SaaS | **Prototype saja** |
| **Gemini 3.5 Flash-Lite** | `@ai-sdk/google` | Free tier tersedia; paid Standard **$0,30/1M input** dan **$2,50/1M output** | Opsi bila pengujian menunjukkan kualitas jawaban yang lebih baik, dengan biaya lebih tinggi | **Cadangan kualitas** |

Harga dan ketersediaan dapat berubah; periksa dashboard provider sebelum mengaktifkan produksi.[1] [2] [3]

## Arti “gratis” untuk SaaS

Gratis sebaiknya dipakai sebagai **tahap evaluasi**, bukan janji biaya produksi nol.

| Provider | Batas atau pertimbangan gratis | Rekomendasi penggunaan |
|---|---|---|
| Gemini Developer API | Free tier memberi token gratis pada model tertentu; limit nyata bergantung tier/proyek. Dokumentasi Google menyatakan konten free tier digunakan untuk meningkatkan produk, berbeda dari paid tier. | Gunakan hanya dengan context terkurasi, tanpa PII, key, atau data sensitif; baik untuk pilot internal. |
| OpenRouter free | Tanpa pembelian kredit: **20 RPM** dan **50 request/hari** untuk free variants. Setelah total pembelian kredit minimal $10, cap naik menjadi **1.000 request/hari**. Dokumentasi mereka menyatakan free models biasanya tidak cocok untuk produksi. | Gunakan untuk eksperimen UI atau demo cadangan yang tidak kritis. |
| Groq | Halaman model resmi menunjukkan harga Developer plan per token untuk GPT-OSS 20B; jangan mengasumsikan kuota gratis tetap untuk produksi. | Gunakan sebagai fallback berbiaya rendah dengan budget limit. |

## Ilustrasi biaya yang terkendali

Contoh ini menggunakan context kecil: sekitar **1.200 input token** (system prompt + ringkasan satu stasiun) dan **500 output token** (jawaban singkat). Ini bukan tagihan pasti; jumlah nyata bergantung prompt, jawaban, provider, dan fitur tambahan.

| Model | Estimasi per pesan | Estimasi per 1.000 pesan |
|---|---:|---:|
| Gemini 3.1 Flash-Lite | **$0,00105** | **$1,05** |
| GPT-OSS 20B via Groq | **$0,00024** | **$0,24** |
| Gemini 3.5 Flash-Lite | **$0,00161** | **$1,61** |

Dengan asumsi di atas, budget model **$5/bulan** setara kira-kira **4.761** pesan Gemini 3.1 Flash-Lite atau **20.833** pesan GPT-OSS 20B via Groq. Tetap sisakan margin untuk variasi token, log, dan biaya layanan lain; angka ini hanya menghitung inferensi model.

## Konfigurasi yang disarankan

Gunakan abstraction kecil agar model utama dapat diganti tanpa mengubah komponen chat.

```ts
// src/lib/assistant/model.ts
import { google } from "@ai-sdk/google";

export const assistantModel = google("gemini-3.1-flash-lite");
```

Route `/api/assistant` tetap bertanggung jawab untuk memeriksa sesi Supabase, role, station membership, rate limit, serta context data. Jangan pernah memanggil model dari browser secara langsung.

| Environment variable | Fungsi | Perlakuan |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Key model utama Gemini | Server-only secret; tidak memakai `NEXT_PUBLIC_` |
| `GROQ_API_KEY` | Key model fallback Groq | Server-only secret; aktifkan hanya bila fallback sudah diuji |
| `AI_ASSISTANT_MODEL` | Nama model yang dipilih | Boleh berupa konfigurasi non-rahasia |
| `AI_ASSISTANT_MONTHLY_LIMIT_USD` | Batas internal biaya model | Non-rahasia, tetapi wajib diterapkan pada server |

Saat implementasi dimulai, tambahkan secret melalui alur aman proyek dan juga Vercel. Jangan memasukkan API key ke GitHub, frontend, Supabase table, atau prompt.

## Guardrail biaya dan kualitas untuk V1

1. Batasi jawaban sekitar 300–500 token dan context ke satu stasiun aktif serta ringkasan 24 jam.
2. Batasi 10 pesan/jam/pengguna pada pilot awal; kembalikan pesan yang jelas jika limit tercapai.
3. Gunakan **Gemini 3.1 Flash-Lite** sebagai utama; jika gagal karena quota/provider, coba satu fallback Groq—jangan melakukan retry tanpa batas.
4. Tampilkan `SIMULASI`, `INPUT MANUAL`, atau `SENSOR` dalam setiap jawaban agar data demo tidak diklaim sebagai data resmi.
5. Simpan audit metadata minimal: model, waktu, user ID terhash/UUID, stasiun, status sumber data, jumlah token, dan outcome. Jangan simpan secret.
6. Buat 20 pertanyaan uji Bahasa Indonesia sebelum produksi, termasuk prompt injection, pertanyaan tentang simulasi, permintaan menentukan pencemaran, dan permintaan mengakses stasiun di luar role.

## Keputusan yang saya sarankan

Mulai dengan **Gemini 3.1 Flash-Lite pada free tier** hanya untuk pilot internal dengan context non-sensitif dan batas penggunaan ketat. Sebelum dipakai oleh banyak pengguna, pindah ke paid tier agar kebijakan data dan kuota lebih sesuai untuk produksi. Siapkan **GPT-OSS 20B via Groq** sebagai fallback murah setelah hasil uji Bahasa Indonesia dan safety dapat diterima.

Jangan memilih model berdasarkan harga saja. Untuk Jernih, kontrol context, RLS, label sumber data, rate limit, dan evaluasi jawaban lebih menentukan keamanan produk daripada perbedaan kecil biaya token.

## Referensi

[1]: https://ai.google.dev/gemini-api/docs/pricing "Google Gemini Developer API pricing"
[2]: https://console.groq.com/docs/models "Groq Supported Models and Developer plan pricing"
[3]: https://openrouter.ai/docs/api_reference/limits "OpenRouter limits for free variants"
[4]: https://ai-sdk.dev/cookbook/guides/gemini "Vercel AI SDK — Gemini guide"
[5]: https://ai-sdk.dev/providers/ai-sdk-providers/groq "Vercel AI SDK — Groq provider"
[6]: https://ai-sdk.dev/providers/community-providers/openrouter "Vercel AI SDK — OpenRouter provider"

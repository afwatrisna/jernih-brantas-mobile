# Blueprint implementasi AI Asisten Jernih

## Tujuan versi pertama

**AI Asisten Jernih** sebaiknya menjadi asisten *read-only* yang membantu pengguna memahami data pada dashboard. Versi pertama menjawab pertanyaan seperti “Bagaimana tren Malang Hulu dalam 24 jam terakhir?”, “Stasiun mana yang memiliki alert?”, atau “Apakah angka ini simulasi atau input manual?” berdasarkan konteks data yang disiapkan server.

> **Posisi produk:** AI menjelaskan data dan prosedur verifikasi. AI tidak menetapkan pencemaran, status kepatuhan resmi, keselamatan air, diagnosis kesehatan, atau tindakan darurat.

| Diizinkan pada V1 | Tidak diizinkan pada V1 |
|---|---|
| Merangkum tren NTU, alert, dan anomali | Mengubah `readings`, profil, role, atau setting |
| Menjelaskan perbedaan sumber `simulation`, `manual`, dan `sensor` | Mengakses SQL bebas atau menjalankan perintah basis data dari bahasa alami |
| Membandingkan stasiun yang memang dapat dibaca pengguna | Menyatakan bahwa air aman/tidak aman atau terjadi pencemaran |
| Memberi langkah verifikasi lapangan dari SOP yang disetujui | Memberi saran medis, hukum, atau tanggap darurat |

## Arsitektur yang direkomendasikan

Gunakan satu route server Next.js, bukan panggilan model langsung dari browser. Next.js Route Handlers dapat menangani permintaan `POST` dan respons streaming; AI SDK menyediakan antarmuka TypeScript lintas penyedia model serta hooks chat untuk UI.[1] [2]

```mermaid
flowchart LR
  U[Pengguna dashboard] --> C[UI chat Asisten Jernih]
  C -->|Pesan + token sesi| R[/api/assistant]
  R --> A[Supabase Auth: validasi pengguna]
  R --> P[Policy check: role + stasiun]
  P --> D[Context builder terkurasi]
  D --> S[(Supabase: readings, alerts, profiles)]
  D --> M[Provider model AI]
  M --> R
  R -->|Jawaban + sumber + status data| C
```

Supabase RLS harus tetap menjadi lapisan perlindungan basis data. Untuk data yang mengambil peran pengguna, server memeriksa sesi dan scope stasiun terlebih dahulu, lalu hanya membangun ringkasan yang diizinkan. RLS dan grant harus dibatasi per operasi; `service_role` selalu tetap di server karena melewati RLS.[3]

## Struktur file yang disarankan

| Lokasi | Tanggung jawab |
|---|---|
| `src/app/api/assistant/route.ts` | Memvalidasi input, sesi, rate limit, memanggil context builder dan model, lalu melakukan streaming jawaban. |
| `src/lib/assistant/context.ts` | Mengambil dan merangkum data stasiun yang diizinkan; tidak menerima SQL dari pengguna. |
| `src/lib/assistant/policy.ts` | Menentukan pertanyaan yang boleh/tidak boleh dijawab dan template disclaimer. |
| `src/lib/assistant/schema.ts` | Skema Zod untuk pesan, respons terstruktur, dan sumber data. |
| `src/components/assistant-panel.tsx` | Panel chat, contoh pertanyaan, status streaming, sumber data, dan tombol reset. |
| `src/app/page.tsx` | Menempatkan tombol/panel AI tanpa mengubah alur Monitor, Field Mode, atau Analytics yang ada. |

## Kontrak context data

AI tidak menerima seluruh tabel `readings`. Route server membangun objek ringkas dan terbatas seperti berikut.

```ts
type AssistantContext = {
  generatedAt: string;
  dataMode: "live" | "demo";
  selectedStation: {
    id: string;
    name: string;
    latestNtu: number | null;
    latestAt: string | null;
    source: "simulation" | "manual" | "sensor" | null;
    equipment: string | null;
    trend24h: "naik" | "turun" | "stabil" | "belum-cukup-data";
    alertState: "active" | "resolved" | "none";
  };
  permittedStationIds: string[];
  dataNotice: string;
};
```

Aturan penting untuk context tersebut adalah sebagai berikut.

1. Jika sumber `simulation`, `dataNotice` wajib menyatakan bahwa angka hanya untuk demonstrasi dan bukan pembacaan lingkungan resmi.
2. Jika sumber `manual`, jawaban wajib menyatakan bahwa pembacaan memerlukan verifikasi lapangan.
3. Jika sumber `sensor`, jawaban boleh menjelaskan nilai dan tren, tetapi tetap tidak boleh menyatakan kesimpulan kualitas air resmi.
4. Untuk `field_operator`, context hanya boleh berisi `station_memberships` miliknya; `admin` dapat melihat lima stasiun; `viewer` hanya memperoleh ringkasan publik bila fitur ini dibuka untuk viewer.

## Alur route `/api/assistant`

| Tahap | Implementasi |
|---|---|
| 1. Validasi request | Batasi `message` hingga sekitar 1.000 karakter, terima `stationId` opsional, dan tolak field yang tidak dikenal. |
| 2. Validasi sesi | Ambil access token Supabase dari sesi pengguna, lalu validasi pengguna pada server. Tidak menerima identitas pengguna dari body request. |
| 3. Otorisasi | Baca profile dan station membership; tolak permintaan ke stasiun di luar scope operator. |
| 4. Context builder | Ambil hanya ringkasan terbaru, tren agregat, dan alert yang diperlukan untuk satu pertanyaan. |
| 5. Safety policy | Tolak/ubah pertanyaan yang meminta diagnosis, penetapan pencemaran, perubahan data, atau rahasia. |
| 6. Model call | Kirim system prompt tetap, context terstruktur, dan pertanyaan pengguna. Stream jawaban ke UI. |
| 7. Response UI | Kembalikan `answer`, `dataStatus`, `sources`, dan `needsHumanReview` agar antarmuka dapat menunjukkan asal data. |

Contoh instruksi sistem yang aman:

```text
Anda adalah AI Asisten Jernih untuk dashboard pemantauan kekeruhan Sungai Brantas.
Gunakan hanya context yang diberikan. Jangan membuat angka, sumber, atau status baru.
Selalu sebutkan status sumber data: simulasi, input manual, atau sensor.
Jangan menyatakan air aman, tercemar, layak konsumsi, atau memberikan diagnosis/tindakan darurat.
Untuk pertanyaan di luar context atau yang memerlukan penetapan resmi, arahkan pengguna ke petugas lapangan dan prosedur verifikasi.
Jawab dalam Bahasa Indonesia yang ringkas.
```

## Pilihan integrasi model

Untuk aplikasi Next.js, **Vercel AI SDK** merupakan pilihan teknis yang baik karena menstandarkan pemanggilan berbagai provider dan menyediakan dukungan Core/UI untuk teks, streaming, structured output, dan tool calls.[2] Provider model tetap dapat dipilih kemudian sesuai biaya, kualitas Bahasa Indonesia, dan kebijakan organisasi.

| Pilihan | Kapan dipilih | Catatan |
|---|---|---|
| AI SDK + provider API | Pilihan awal yang paling fleksibel | Route Next.js menjaga key dan context tetap di server. |
| AI Gateway/provider gateway | Saat ingin observabilitas dan pergantian model lebih mudah | Tetap terapkan scope context, rate limit, dan audit sendiri. |
| RAG + Supabase pgvector | Setelah ada SOP lapangan, dokumen operasional, atau FAQ internal yang disetujui | Tambahkan setelah V1 data dashboard stabil, bukan sebelum itu. |

Simpan key provider sebagai environment variable server-only, misalnya `AI_PROVIDER_API_KEY`; **jangan** menggunakan awalan `NEXT_PUBLIC_`. Saat integrasi nyata dimulai, key perlu ditambahkan melalui alur secret aman untuk development dan Vercel production.

## UI chat V1

Panel AI dapat diletakkan sebagai tombol “Tanya Asisten Jernih” pada Monitor dan Analytics. Mulai dengan tiga contoh pertanyaan:

1. “Ringkas kondisi stasiun yang dipilih.”
2. “Apa perubahan NTU dalam 24 jam terakhir?”
3. “Apakah data yang sedang ditampilkan simulasi, manual, atau sensor?”

Setiap jawaban menampilkan label konteks seperti **SIMULASI**, **INPUT MANUAL**, atau **SENSOR**, beserta waktu pembaruan dan catatan “Perlu verifikasi lapangan” bila relevan. Jangan menampilkan chat di Field Mode sebagai pengganti prosedur input dan verifikasi.

## Keamanan, biaya, dan audit

| Kontrol | Keputusan V1 |
|---|---|
| Akses | Wajib login untuk pertanyaan berbasis data stasiun; opsi ringkasan publik dapat diputuskan kemudian. |
| Rate limit | Batas per user dan per IP; mulai konservatif, misalnya 10–20 pesan per jam per user. |
| Ukuran context | Satu stasiun aktif, ringkasan 24 jam, dan alert terkait; jangan seluruh histori mentah. |
| Ukuran jawaban | Batasi jawaban singkat agar biaya terkendali dan mudah dibaca petugas. |
| Audit | Simpan metadata non-rahasia: user ID, waktu, station scope, status sumber data, model, dan outcome. |
| Data sensitif | Jangan kirim service role key, ingest key, token, email pengguna lain, atau raw policy data ke model. |
| Prompt injection | Perlakukan pesan pengguna dan dokumen RAG sebagai data, bukan instruksi sistem. |

## Database tambahan (fase setelah V1)

Tambahkan tabel audit hanya ketika kebutuhan riwayat jelas.

| Tabel | Kolom utama | RLS yang disarankan |
|---|---|---|
| `ai_conversations` | `id`, `user_id`, `created_at`, `title` | Pengguna hanya membaca percakapannya sendiri; admin audit melalui server. |
| `ai_messages` | `conversation_id`, `role`, `content`, `sources`, `created_at` | Pengguna hanya membaca pesan dalam percakapannya sendiri. |
| `ai_usage_events` | `user_id`, `model`, `input_size`, `outcome`, `created_at` | Hanya server/admin; tidak dapat ditulis langsung browser. |

Masing-masing tabel harus mendapat migration, grant minimal, policy RLS per operasi, dan test allow/deny terpisah.[3]

## Urutan implementasi yang saya rekomendasikan

1. **Tentukan kebijakan produk:** chat hanya untuk staff login, bahasa Indonesia, read-only, dan status data wajib tampil.
2. **Pilih provider/model:** pilih satu provider melalui AI SDK dan tambahkan key server-only secara aman.
3. **Buat context builder:** selesaikan fungsi ringkasan stasiun dan test scope role sebelum model dipanggil.
4. **Buat `/api/assistant`:** validasi sesi, input, rate limit, policy, context, dan streaming response.
5. **Tambahkan panel UI:** mulai dari tiga pertanyaan contoh dan tampilkan sumber data di setiap jawaban.
6. **Tambahkan tes:** anon ditolak, operator tidak dapat meminta stasiun lain, `simulation` selalu berlabel, pertanyaan injeksi tidak mengubah policy, dan provider failure tidak mengekspos error/key.
7. **Pilot internal:** aktifkan untuk satu atau dua petugas, tinjau audit dan biaya, lalu perluas scope.
8. **Tambahkan RAG:** hanya setelah SOP/dokumen internal disetujui dan metadata sumber telah dirancang.

## Kriteria siap demo

Sebelum dipresentasikan, pastikan hal berikut berhasil.

| Pemeriksaan | Kriteria lulus |
|---|---|
| Simulasi | AI menyebut data adalah simulasi dan bukan data resmi. |
| Input manual | AI menjelaskan kebutuhan verifikasi, tanpa menyimpulkan kualitas air. |
| Role | Operator tidak dapat meminta ringkasan stasiun di luar penugasannya. |
| Keamanan | Tidak ada key atau SQL mentah dalam browser, respons, log, atau chat. |
| Kegagalan provider | UI menunjukkan pesan umum dan dashboard utama tetap berfungsi. |
| Biaya | Rate limit, batas context, dan batas jawaban aktif. |

## Keputusan yang diperlukan sebelum implementasi

Sebelum kode dibuat, tetapkan tiga hal: provider/model yang digunakan, apakah chat hanya untuk pengguna login atau juga pengunjung publik, dan batas biaya per bulan. Setelah keputusan itu, implementasi V1 dapat dimulai tanpa mengubah pengamanan Supabase yang sudah ada.

## Referensi

[1]: https://nextjs.org/docs/app/api-reference/file-conventions/route "Next.js Docs — Route Handlers"
[2]: https://ai-sdk.dev/docs/introduction "AI SDK Docs — Introduction"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Docs — Row Level Security"

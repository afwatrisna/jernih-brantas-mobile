# Panduan Operasional AI Asisten Jernih

## Ruang lingkup implementasi

Asisten Jernih adalah fitur **baca-saja** untuk pengguna yang telah masuk dan memiliki role Jernih yang valid. Fitur ini memakai Gemini melalui Vercel AI SDK pada route server `POST /api/assistant`; browser hanya mengirim pertanyaan, ID stasiun aktif, status tampilan, dan access token Supabase pengguna. Kunci Gemini tidak dikirim ke browser dan tidak boleh diberi awalan `NEXT_PUBLIC_`.

| Area | Perilaku yang diterapkan |
|---|---|
| Akses | Session Supabase diverifikasi kembali di server. |
| Scope | `admin` dan `viewer` dapat melihat konteks stasiun yang dipilih; `field_operator` hanya dapat meminta konteks stasiun dengan membership aktif. |
| Konteks | Hanya identitas stasiun, pembacaan terakhir, ringkasan 24 jam, tren, serta label sumber. Tidak ada SQL mentah, secret, atau tabel penuh di prompt. |
| Keselamatan | Asisten menolak penetapan air aman, layak minum, tercemar, diagnosis, perubahan data/peran, serta permintaan secret. |
| Data demo | Context simulasi selalu dilabeli `SIMULASI` dan bukan data lingkungan resmi. |
| Batas awal | Viewer: maksimum 5 pertanyaan per jam; Field Operator/Admin: maksimum 10 pertanyaan per jam pada satu instance aplikasi. |

> Gemini free tier dapat memiliki ketentuan pemrosesan data yang berbeda dari layanan berbayar. Gunakan konteks minimum, jangan sertakan data pribadi atau operasional sensitif, dan evaluasi paket produksi sebelum penggunaan operasional berskala besar.

## Konfigurasi lokal dan Vercel

Tambahkan variabel berikut di lingkungan server. Nilai asli hanya disimpan pada Secret Vault atau konfigurasi environment Vercel.

```bash
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Untuk Vercel, buka **Project Settings → Environment Variables**, tambahkan `GOOGLE_GENERATIVE_AI_API_KEY` untuk Production, Preview, dan Development sesuai kebutuhan, lalu lakukan redeploy. Jangan memasukkan nilai kunci ke source code, file contoh environment, formulir browser, GitHub, atau variabel `NEXT_PUBLIC_*`.

## Pengujian dan keterbatasan pilot

Pengujian otomatis meliputi validasi request, session yang wajib ada, kontrak kebijakan sumber data, serta validasi metadata credential Gemini. Penggunaan model baru hanya terjadi setelah autentikasi, pemeriksaan kebijakan, rate limit, dan pemilihan stasiun yang sah.

Rate limit saat ini bersifat in-memory sehingga tidak dibagi antar-instance serverless dan akan ter-reset ketika instance berubah. Pada implementasi saat ini, Viewer dibatasi 5 pertanyaan per jam, sedangkan Field Operator dan Admin masing-masing 10 pertanyaan per jam. Sebelum fitur digunakan oleh banyak petugas, ganti limiter ini dengan counter yang durable, misalnya di database dengan RLS yang sesuai atau layanan rate limiting terkelola. Pertahankan tanpa web search pada V1 agar jawaban hanya berbasis context monitoring yang dikurasi.

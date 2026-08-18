# Jernih Brantas — Next.js + TypeScript

Website responsif untuk demo pemantauan kejernihan Sungai Brantas. Proyek ini dibuat sebagai frontend web terpisah dari APK Expo dan memakai **Next.js App Router**, **TypeScript**, serta penyimpanan browser lokal.

## Fitur

- **Monitor** dengan lima titik pantau, peta SVG, nilai NTU, klasifikasi, dan Data Trust.
- **Simulasi NTU** yang berubah setiap empat detik dan dapat dijeda dari Pengaturan.
- **Field Mode** untuk input manual 0–500 NTU dengan review klasifikasi dan catatan sumber data.
- **Analitik** berupa ringkasan minimum/maksimum/rata-rata, grafik tren, dan riwayat pembacaan.
- **Pengaturan** untuk menjeda simulasi, mereset data demo, dan melihat ambang klasifikasi.
- Layout yang mendukung browser desktop maupun mobile.

## Menjalankan di Windows

Pasang Node.js LTS dan pnpm, lalu jalankan perintah berikut dari folder `next-web`:

```powershell
corepack enable
pnpm install
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000). File utama aplikasi adalah `src/app/page.tsx`; model stasiun, pembacaan, dan aturan klasifikasi ada di `src/lib/jernih-data.ts`.

## Validasi dan Build

```powershell
pnpm lint
pnpm build
```

Script build memakai `cross-env` dan Webpack fallback agar konsisten di Windows dan Linux.

## Data Demo

Riwayat Field Mode disimpan pada `localStorage` browser. Data simulasi dan input manual sengaja diberi label jelas dan tidak boleh diperlakukan sebagai data lingkungan resmi.

## Langkah Berikutnya

Ketika backend tersedia, gantikan simulator dengan API pembacaan sensor: `ESP32 → backend → browser Next.js`. Jangan menempatkan token, URL privat, atau kredensial sensor langsung di browser.

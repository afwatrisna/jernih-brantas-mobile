# Roadmap Migrasi Jernih ke Next.js + TypeScript

## Tujuan dan Prinsip Utama

> **Jangan mengganti proyek Expo yang berjalan secara langsung.** Buat aplikasi Next.js sebagai frontend web terpisah, migrasikan fitur satu per satu, lalu pertahankan Expo untuk APK Android/iOS.

Dengan pendekatan ini, Jernih akan memiliki dua klien yang memakai aturan data yang sama:

| Klien | Peran setelah migrasi | Implementasi saat ini |
|---|---|---|
| **Expo React Native** | APK Android/iOS untuk petugas lapangan | Tetap di `app/(tabs)/index.tsx` |
| **Next.js + TypeScript** | Website desktop dan mobile browser | Proyek baru, misalnya `web-next/` |
| **Shared domain logic** | Klasifikasi NTU, stasiun, model pembacaan | Ambil dari `lib/jernih-data.ts` |

Next.js mendukung TypeScript, App Router, ESLint, dan alias impor melalui `create-next-app`; Node.js 20.9 atau lebih baru diperlukan untuk versi dokumentasi saat ini. [1]

## 1. Buat Proyek Baru, Jangan Menimpa Proyek Lama

Di Windows, buka PowerShell pada folder hasil clone repository Anda. Aktifkan Corepack agar pnpm tersedia, lalu buat aplikasi baru di dalam folder terpisah:

```powershell
corepack enable
cd C:\Projects\jernih-brantas-mobile
pnpm create next-app@latest web-next --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd web-next
pnpm dev
```

Kemudian buka `http://localhost:3000`. Perintah tersebut membuat aplikasi Next.js dengan **TypeScript**, **App Router**, Tailwind CSS, ESLint, folder `src`, dan alias `@/*`. [1]

Struktur target yang disarankan adalah:

```text
web-next/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                 # Monitor / halaman utama
│  │  ├─ field/page.tsx           # Field Mode
│  │  ├─ analytics/page.tsx       # Analitik
│  │  └─ settings/page.tsx        # Pengaturan simulasi
│  ├─ components/
│  │  ├─ monitoring/
│  │  ├─ field/
│  │  ├─ analytics/
│  │  └─ ui/
│  ├─ lib/jernih/
│  │  ├─ data.ts                  # Station, Reading, classifyNtu
│  │  ├─ simulation.ts            # Simulator empat-detik
│  │  └─ storage.ts               # localStorage aman untuk browser
│  └─ styles/
├─ public/
│  └─ icons/
├─ next.config.ts
└─ package.json
```

## 2. Migrasikan Logika Data Terlebih Dahulu

Mulailah dari `lib/jernih-data.ts`, bukan dari tampilan. Salin atau pindahkan tipe dan fungsi yang tidak bergantung pada React Native:

```ts
export type Station = { id: string; name: string; subtitle: string; baseline: number }
export type Reading = { id: string; ntu: number; ts: number; sumber: "simulation" | "manual" | "sensor"; alat: string }

export function classifyNtu(ntu: number) {
  // Pertahankan batas kelas yang sama dengan APK.
}
```

Tambahkan unit test untuk batas klasifikasi NTU dan normalisasi riwayat sebelum memigrasikan layar. Dengan cara ini, Monitor, Field Mode, dan Analitik website akan memakai aturan yang sama dengan APK.

## 3. Migrasikan Fitur dalam Urutan Ini

| Tahap | Fitur | Sumber saat ini | Target Next.js | Kriteria selesai |
|---|---|---|---|---|
| 1 | Token warna, tipografi, layout responsif | `theme.config.js`, `index.web.tsx` | Tailwind theme dan `globals.css` | Desktop dan mobile mempunyai hierarki visual yang sama. |
| 2 | Monitor, daftar stasiun, kartu NTU, peta SVG | `app/(tabs)/index.web.tsx` | `app/page.tsx` dan komponen `monitoring/` | Memilih titik mengubah ringkasan tanpa error. |
| 3 | Simulasi empat-detik dan Data Trust | `index.web.tsx`, `jernih-data.ts` | Client Component dan `lib/jernih/simulation.ts` | Nilai, waktu, status sumber, metrik, dan peta berubah serempak. |
| 4 | Field Mode dan input manual | `index.web.tsx`, `index.tsx` | `app/field/page.tsx` | Input manual tervalidasi dan memperbarui stasiun aktif. |
| 5 | Analitik dan Pengaturan | `index.web.tsx`, `index.tsx` | `app/analytics`, `app/settings` | Simulasi dapat dijeda/reset dan analitik mengikuti data aktif. |
| 6 | Backend dan sensor | Rencana berikutnya | API client terpisah | UI lokal tetap berfungsi saat API atau sensor tidak tersedia. |

Komponen yang memakai `useState`, `useEffect`, `localStorage`, atau simulator harus diawali dengan directive berikut karena API browser tidak tersedia saat pre-render server:

```tsx
"use client";
```

Letakkan pemakaian `localStorage` di dalam `useEffect` atau pemeriksaan `typeof window !== "undefined"`. Pada static export, API browser hanya boleh digunakan saat kode berjalan di browser. [2]

## 4. Contoh Kerangka Monitor Page

File `src/app/page.tsx` dapat dimulai seperti ini:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { initialStationStates, type StationState } from "@/lib/jernih/data";
import { MonitorDashboard } from "@/components/monitoring/monitor-dashboard";

export default function MonitorPage() {
  const [stations, setStations] = useState<StationState[]>(initialStationStates());
  const [activeId, setActiveId] = useState("malang");
  const [simulation, setSimulation] = useState(true);

  useEffect(() => {
    if (!simulation) return;
    const timer = window.setInterval(() => {
      setStations((current) => current.map((station) => {
        const variation = (Math.random() - 0.5) * 3;
        const nextNtu = Math.max(1, Math.round((station.ntu + variation) * 10) / 10);
        return { ...station, ntu: nextNtu };
      }));
    }, 4000);

    return () => window.clearInterval(timer);
  }, [simulation]);

  const activeStation = useMemo(
    () => stations.find((station) => station.id === activeId) ?? stations[0],
    [stations, activeId],
  );

  return (
    <MonitorDashboard
      stations={stations}
      activeStation={activeStation}
      simulation={simulation}
      onSelectStation={setActiveId}
      onToggleSimulation={() => setSimulation((value) => !value)}
    />
  );
}
```

Gunakan komponen HTML standar (`button`, `input`, `select`, `section`, `nav`) di Next.js—jangan memindahkan `View`, `Text`, atau `Pressable` dari React Native secara langsung. Desain dan logika dapat dipakai ulang, tetapi UI harus ditulis ulang ke DOM dan CSS/Tailwind.

## 5. Pilih Strategi Hosting Sejak Awal

### Fase A — Website statis di GitHub Pages

Saat Jernih masih memakai simulasi dan penyimpanan browser, static export cocok. Tambahkan konfigurasi berikut di `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === "production" ? "/jernih-brantas-mobile" : "",
};

export default nextConfig;
```

Lalu buat hasil statis dengan:

```powershell
pnpm build
```

Next.js membuat aset statis dalam folder `out` ketika `output: "export"` dipakai. Folder tersebut dapat diunggah ke hosting yang menyajikan HTML, CSS, dan JavaScript statis, termasuk GitHub Pages. [2]

### Fase B — Website dengan backend sensor

Saat sensor ESP32, autentikasi, database, notifikasi, atau API pembacaan real-time ditambahkan, jangan membatasi deployment ke static export. Static export tidak mendukung fitur server yang memerlukan request dinamis, cookies, server actions, atau API Route Handler dinamis. [2]

Pada tahap tersebut, pilih salah satu pola berikut:

```text
ESP32 → API backend → Next.js browser client
```

atau deploy Next.js ke hosting yang mendukung Node.js/serverless dan letakkan route API yang sesuai di `app/api/`.

## 6. Validasi pada Setiap Tahap

Tambahkan scripts berikut ke `package.json` jika belum tersedia:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

Gunakan urutan pemeriksaan berikut sebelum push:

```powershell
pnpm lint
pnpm build
```

Uji manual pada lebar sekitar 390 px, 768 px, dan 1280 px. Pastikan empat hal ini tetap benar: navigasi tidak overflow, simulasi memperbarui seluruh ringkasan, Field Mode tidak menerima NTU di luar rentang, dan Data Trust selalu membedakan data simulasi/manual/sensor.

## 7. Target Migrasi Pertama yang Realistis

Jangan memigrasikan backend dan sensor bersamaan. Target pertama yang paling aman adalah **versi Next.js statis dengan Monitor, Field Mode, Analitik, Pengaturan, simulasi, dan localStorage**, lalu deploy ke GitHub Pages. Setelah UI stabil, buat API backend sebagai pekerjaan terpisah.

## Referensi

[1] [Next.js — Installation](https://nextjs.org/docs/app/getting-started/installation)

[2] [Next.js — Static Exports](https://nextjs.org/docs/app/guides/static-exports)

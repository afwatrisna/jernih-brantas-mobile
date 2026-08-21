# Bahasa Pemrograman dan File di Jernih Brantas

Versi web yang tersedia pada Vercel dibangun sebagai aplikasi **Next.js**. Next.js dan React bukan bahasa pemrograman; keduanya adalah *framework* dan pustaka yang menggunakan TypeScript/JavaScript untuk membangun antarmuka web. Source utamanya ada di folder `next-web/`.

> Secara sederhana, **TypeScript mengatur perilaku aplikasi**, **TSX menyusun tampilan interaktif**, dan **CSS mengatur tampilan visual serta responsivitasnya**.

| Teknologi atau tipe file | Lokasi pada proyek | Peran praktis di Jernih Brantas |
|---|---|---|
| **TypeScript (`.ts`)** | `src/lib/jernih-data.ts` | Menyimpan aturan dan model data yang dapat dipakai ulang, seperti lima stasiun, klasifikasi NTU, tipe pembacaan, serta fungsi pemformatan. |
| **TSX (`.tsx`)** | `src/app/page.tsx`, `src/app/layout.tsx` | Menggabungkan TypeScript dengan struktur komponen React yang diterjemahkan menjadi elemen HTML di browser. Ini adalah sumber utama seluruh halaman interaktif. |
| **CSS (`.css`)** | `src/app/globals.css` | Mengatur warna, tata letak, ukuran, animasi, peta, kartu data, serta penyesuaian layar desktop dan ponsel. |
| **JavaScript Module (`.mjs`)** | `postcss.config.mjs`, `scripts/create-vercel-payload.mjs` | Mengonfigurasi proses pembangunan CSS dan menyediakan skrip bantu untuk menyiapkan source yang dikirim ke Vercel. |
| **JSON (`.json`)** | `package.json`, `tsconfig.json`, `pnpm-lock.yaml` | Menyimpan konfigurasi proyek, daftar pustaka, skrip perintah, aturan pemeriksaan TypeScript, dan versi dependensi yang terkunci. |
| **SVG** | Dibuat di dalam `page.tsx` | Menggambar jalur sungai dan grafik tren NTU secara vektor tanpa gambar peta eksternal. |
| **Markdown (`.md`)** | `README.md`, `VALIDATION.md`, dokumen ini | Dokumentasi: cara menjalankan proyek, catatan pengujian, dan panduan teknis. Markdown bukan kode yang menjalankan aplikasi. |

## 1. TypeScript: aturan data dan logika aplikasi

TypeScript adalah JavaScript dengan tambahan pemeriksaan tipe. Pada `src/lib/jernih-data.ts`, tipe `Station`, `Reading`, dan `WaterClass` menjelaskan bentuk data yang diizinkan. Contohnya, setiap pembacaan harus memiliki nilai `ntu`, waktu `timestamp`, asal data, dan nama alat. Jika kode mencoba menyimpan data yang tidak sesuai bentuk tersebut, pemeriksaan TypeScript dapat menandainya sebelum aplikasi dipublikasikan.[1]

File ini juga mendefinisikan lima titik pantau: Malang Hulu, Kediri, Jombang, Mojokerto, dan Surabaya Hilir. Fungsi `classifyNtu()` menerapkan aturan kelas air yang digunakan konsisten di dashboard, Field Mode, dan Analitik: sangat jernih untuk nilai sampai 5 NTU, jernih sampai 25 NTU, keruh sampai 50 NTU, lalu sangat keruh di atasnya.

## 2. TSX dan React: membangun halaman yang dapat berinteraksi

Ekstensi `.tsx` berarti file tersebut dapat memuat TypeScript sekaligus JSX, yaitu bentuk penulisan yang menyerupai HTML. File `src/app/page.tsx` adalah pusat antarmuka aplikasi. Di dalamnya, React menampilkan empat bagian utama: **Monitor**, **Field Mode**, **Analitik**, dan **Pengaturan**.

React menangani perubahan tampilan tanpa memuat ulang halaman. Contohnya, `useState` menyimpan stasiun aktif, nilai NTU, riwayat pembacaan, dan status simulasi. `useEffect` menjalankan simulasi setiap empat detik dan menyimpan data ke `localStorage`. Ketika pengguna memasukkan 17,2 NTU pada Field Mode, fungsi `saveMeasurement()` memvalidasi angka, memperbarui data stasiun, menambahkan riwayat, lalu memperbarui tampilan secara otomatis.[2]

Perintah `"use client"` di awal file memberi tahu Next.js bahwa halaman ini berjalan di browser. Hal tersebut diperlukan karena aplikasi menggunakan tombol, formulir, interval simulasi, dan `localStorage` browser.

## 3. CSS: desain, tampilan responsif, dan aksesibilitas

File `src/app/globals.css` mengontrol cara elemen TSX terlihat di layar. Variabel CSS di bagian awal file menetapkan warna utama Jernih Brantas, misalnya hijau sungai, warna pasir latar, warna peringatan, dan garis kartu. Kelas seperti `.hero-card`, `.trust-strip`, `.field-form`, dan `.trend-chart` mengubah struktur TSX menjadi dashboard yang terlihat di Vercel.

CSS juga membuat halaman responsif. Aturan `@media (max-width: 900px)` menghapus sidebar desktop dan memunculkan navigasi mobile. Aturan `@media (max-width: 600px)` mengecilkan tipografi, mengubah formulir dua kolom menjadi satu kolom, dan menata metrik analitik agar nyaman dipakai pada telepon. Fokus input dan tombol juga dibuat terlihat dengan `:focus-visible`, sehingga navigasi keyboard lebih jelas.[3]

## 4. JavaScript `.mjs`: konfigurasi dan otomasi build

Meskipun aplikasi utamanya memakai TypeScript, terdapat JavaScript module berekstensi `.mjs` untuk kebutuhan alat pembangunan. `postcss.config.mjs` menghubungkan proses CSS dengan Tailwind CSS. Tailwind tersedia sebagai alat bantu, tetapi tampilan proyek ini terutama didefinisikan melalui CSS kustom di `globals.css`.

Skrip `scripts/create-vercel-payload.mjs` adalah utilitas pengemasan. Skrip ini memilih file source yang diperlukan dan membuat payload deployment tanpa membawa folder besar seperti `node_modules` dan hasil build lokal. Skrip ini membantu proses deployment, tetapi tidak dikirim ke browser ketika pengunjung membuka dashboard.

## 5. JSON: pengaturan, bukan logika antarmuka

`package.json` menjelaskan identitas proyek, daftar pustaka, dan perintah yang dapat dijalankan. Dalam proyek ini, perintah `dev` menjalankan server pengembangan, `build` membangun versi produksi, `start` menjalankan hasil produksi, dan `lint` memeriksa kualitas kode. File ini juga mencatat penggunaan Next.js, React, Tailwind CSS, ESLint, dan TypeScript.

`tsconfig.json` mengatur cara TypeScript memeriksa kode. Nilai `strict: true` meningkatkan ketelitian pemeriksaan tipe. Nilai `jsx: "react-jsx"` memberi tahu compiler bahwa file TSX menggunakan sintaks React. File `pnpm-lock.yaml` menyimpan versi pasti dari pustaka agar hasil build di komputer lokal dan Vercel konsisten.[4]

## 6. HTML dan SVG: hasil yang diterima browser

Anda tidak melihat file `.html` utama di dalam `next-web/src/app/` karena Next.js membuat HTML secara otomatis dari komponen TSX ketika aplikasi dibangun. Browser akhirnya menerima HTML, CSS, dan JavaScript hasil kompilasi. Jadi HTML tetap digunakan sebagai struktur halaman akhir, tetapi ditulis secara tidak langsung melalui TSX.

SVG digunakan langsung dalam `page.tsx` untuk dua visual. Pertama, elemen `<svg>` dan `<path>` menggambar aliran Sungai Brantas pada peta ilustratif. Kedua, elemen SVG lain menggambar garis dan titik tren NTU. Karena SVG berbasis vektor, visual tersebut tetap tajam pada berbagai ukuran layar.[5]

## Urutan belajar yang disarankan

Untuk memahami dan mengembangkan proyek ini, mulailah dari **HTML/TSX dasar**, lanjutkan ke **CSS responsif**, kemudian **JavaScript dan TypeScript**, lalu pelajari **React state** seperti `useState` dan `useEffect`. Setelah itu, pelajari struktur **Next.js App Router** dan cara menggunakan API/database ketika sensor ESP32 akan diintegrasikan.

## Referensi

[1] [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)  
[2] [React — Adding Interactivity](https://react.dev/learn/adding-interactivity)  
[3] [MDN — CSS Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)  
[4] [Next.js — Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)  
[5] [MDN — SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)

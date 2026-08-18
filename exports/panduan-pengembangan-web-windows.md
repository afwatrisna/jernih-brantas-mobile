# Panduan Mengembangkan Website Jernih Brantas di Windows

## Status Akses Publik Saat Ini

Saya telah memeriksa domain yang dibagikan sebelumnya. Domain tersebut saat ini membalas **`Cannot GET /`**, sehingga halaman web memang belum tersedia melalui URL publik itu. Ini adalah masalah rute penyajian (hosting), bukan masalah pada perangkat Windows atau browser Anda.

Untuk pengembangan mandiri, gunakan proyek lokal terlebih dahulu. Setelah website berhasil dibangun menjadi file statis, folder hasil build dapat diunggah ke layanan hosting statis pilihan Anda.

## Pilih Jalur Pengembangan

| Jalur | Kapan digunakan | File utama | Kelebihan | Batasan |
|---|---|---|---|---|
| **Proyek web terintegrasi** | Untuk mengembangkan produk utama yang selaras dengan APK | `app/(tabs)/index.web.tsx` | Mendukung Monitor, Field Mode, Analitik, simulasi, Pengaturan, dan desain responsif terkini | Membutuhkan Node.js dan pnpm |
| **HTML mandiri** | Untuk demo offline sederhana atau pengiriman satu file | `exports/jernih-brantas-responsive.html` | Dapat dibuka langsung di Chrome/Edge | Tidak otomatis berbagi pembaruan fitur dari versi web terintegrasi |

> Untuk pengembangan berkelanjutan, gunakan **proyek web terintegrasi**. File `index.web.tsx` adalah tampilan khusus browser, sementara `app/(tabs)/index.tsx` mempertahankan tampilan APK.

## Persiapan di Windows

Pasang aplikasi berikut terlebih dahulu:

1. **Node.js LTS**.
2. **Visual Studio Code**.
3. **Git for Windows** jika Anda ingin memakai kontrol versi.

Selanjutnya, unduh proyek sebagai ZIP dari menu proyek, ekstrak ke folder kerja, misalnya `C:\Projects\jernih-brantas-mobile`, lalu buka folder tersebut dengan Visual Studio Code.

## Menjalankan Website Secara Lokal

Buka terminal PowerShell di folder proyek, kemudian jalankan perintah berikut:

```powershell
corepack enable
pnpm install
pnpm dev
```

Setelah proses selesai, terminal akan menampilkan alamat lokal. Umumnya website dapat dibuka di:

```text
http://localhost:8081
```

Apabila port tersebut sedang dipakai aplikasi lain, gunakan alamat yang dicetak oleh terminal. Perubahan pada file akan dimuat ulang secara otomatis di browser.

## Lokasi File Penting

| Kebutuhan | File | Catatan |
|---|---|---|
| Tampilan khusus website | `app/(tabs)/index.web.tsx` | Edit di sini untuk desktop dan browser mobile. |
| Tampilan APK Android/iOS | `app/(tabs)/index.tsx` | Tidak perlu diubah jika hanya memperbarui website. |
| Nilai NTU, klasifikasi, dan model data | `lib/jernih-data.ts` | Gunakan agar logika website dan APK tetap konsisten. |
| Warna dan token tema | `theme.config.js` | Ubah di sini bila ingin mengubah palet global. |
| Versi HTML offline | `exports/jernih-brantas-responsive.html` | Gunakan hanya untuk demo satu file. |

## Alur Pengembangan yang Disarankan

Mulailah dengan perubahan kecil pada `app/(tabs)/index.web.tsx`. Contohnya, Anda dapat mengubah teks, menambah kartu dashboard, atau menghubungkan simulasi ke API. Setelah melakukan perubahan, cek hasilnya di browser lokal pada lebar desktop dan mobile.

Sebelum membuat build, jalankan validasi berikut:

```powershell
pnpm check
pnpm test
pnpm lint
```

Jika seluruh pemeriksaan berhasil, buat hasil website statis dengan:

```powershell
npx expo export --platform web
```

Perintah tersebut menghasilkan folder `dist`. Unggah **isi folder `dist`** ke layanan hosting statis pilihan Anda. Untuk menguji hasil build sebelum diunggah, gunakan server statis lokal, misalnya:

```powershell
npx serve dist
```

Lalu buka alamat yang dicetak terminal.

## Saat Mengembangkan Fitur Sensor dan Backend

Jangan masukkan URL sensor, token, atau kata sandi langsung ke `index.web.tsx`. Website sebaiknya hanya memanggil API backend. Alur yang aman adalah:

```text
Sensor / ESP32 → API backend → website Jernih
```

Sebelum sensor tersedia, pertahankan label **SIMULASI** dan **INPUT MANUAL** seperti sekarang agar pengguna tidak menganggap nilai demo sebagai data lingkungan resmi.

## Checklist Sebelum Hosting

- [ ] Website terbuka di browser lokal desktop dan mobile.
- [ ] Monitor, Field Mode, Analitik, dan Pengaturan dapat dipilih.
- [ ] Simulasi dapat dijeda dan dijalankan kembali.
- [ ] Input manual memperbarui nilai stasiun dan Data Trust.
- [ ] `pnpm check`, `pnpm test`, dan `pnpm lint` berhasil.
- [ ] Folder `dist` dibuat menggunakan `npx expo export --platform web`.
- [ ] Hasil `dist` diuji dengan server statis lokal sebelum diunggah.

# Panduan Deploy Jernih Next.js ke Vercel

Panduan ini menggunakan repository Anda, **`afwatrisna/jernih-brantas-mobile`**, dan aplikasi Next.js yang berada di folder **`next-web/`**.

> **Penting:** Vercel harus diarahkan ke folder `next-web`, bukan ke root repository. Root repository saat ini berisi proyek Expo/React Native, sedangkan aplikasi Next.js memiliki `package.json` sendiri di dalam `next-web/`.

## Tahap 1 — Pastikan Kode Next.js Ada di GitHub

Folder `next-web/` perlu tersedia di repository GitHub sebelum Vercel dapat mengimpor dan membangunnya. Cara yang paling aman adalah memakai Windows, Git, dan PowerShell.

1. Unduh proyek Jernih terbaru dari menu proyek, lalu ekstrak misalnya ke `C:\Projects\jernih-brantas-mobile`.
2. Buka folder tersebut di **Visual Studio Code**.
3. Buka terminal PowerShell pada folder root repository, lalu jalankan:

```powershell
git status
git add next-web
git commit -m "Add Jernih Next.js web application"
git push origin main
```

4. Buka `https://github.com/afwatrisna/jernih-brantas-mobile` dan pastikan folder `next-web` terlihat. Di dalam folder itu harus ada `package.json`, `src/`, `next.config.ts`, dan `pnpm-lock.yaml`.

Jika `git push` meminta identitas Git, lakukan satu kali konfigurasi berikut, menggunakan nama dan email Anda sendiri:

```powershell
git config --global user.name "Nama Anda"
git config --global user.email "email-anda@example.com"
```

Jika Anda tidak ingin memakai Git di komputer sendiri, beri tahu saya agar saya dapat mengunggah folder `next-web` ke repository Anda terlebih dahulu.

## Tahap 2 — Import Repository di Vercel

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard) menggunakan akun yang memiliki izin deploy Production pada workspace **Okayy**.
2. Tekan **Add New…** lalu pilih **Project**.
3. Pada bagian **Import Git Repository**, pilih GitHub dan cari repository **`afwatrisna/jernih-brantas-mobile`**.
4. Tekan **Import**.

## Tahap 3 — Isi Konfigurasi Project

Gunakan nilai berikut pada layar **Configure Project**.

| Pengaturan | Nilai yang dipakai |
|---|---|
| Project Name | `jernih-brantas-next` atau nama baru seperti `jernih-brantas-next-web` |
| Framework Preset | `Next.js` |
| Root Directory | Klik **Edit**, lalu pilih/ketik `next-web` |
| Build Command | Biarkan default (`pnpm build`) |
| Output Directory | Biarkan kosong/default |
| Install Command | Biarkan default (`pnpm install`) |
| Environment Variables | Tidak ada yang diperlukan untuk versi demo saat ini |

Kemudian tekan **Deploy**. Proyek ini telah diuji secara lokal menggunakan `pnpm lint` dan `pnpm build`.

## Tahap 4 — Cek Hasil Build

Tunggu sampai status deployment berubah menjadi **Ready** (hijau). Vercel akan memberikan URL semacam:

```text
https://jernih-brantas-next.vercel.app
```

Apabila muncul error, buka **Deployments** → pilih deployment dengan status merah → buka bagian **Building**. Salin teks error terakhir beserta sekitar 15 baris sebelumnya, lalu kirimkan kepada saya. Dokumentasi Vercel menjelaskan bahwa detail kegagalan build tersedia pada bagian log deployment tersebut. [1]

## Tahap 5 — Jadikan Deployment Dapat Diakses Publik

Setelah build berstatus **Ready**:

1. Buka project → **Settings** → **Deployment Protection**.
2. Untuk Production, nonaktifkan **Vercel Authentication** atau pilih akses publik bila opsi itu tersedia.
3. Simpan perubahan.
4. Buka URL Production di browser **tanpa login Vercel** untuk memastikan website benar-benar publik.

## Tahap 6 — Update Website Berikutnya

Setelah GitHub dan Vercel terhubung, perubahan baru cukup dilakukan melalui Git:

```powershell
git add next-web
git commit -m "Describe your website update"
git push origin main
```

Vercel for GitHub secara otomatis membuat deployment ketika ada push. Push ke branch produksi, yang umumnya `main`, memperbarui deployment production setelah build berhasil. [2]

## Jika Project Vercel Lama Tetap Error

Project lama `jernih-brantas-next` dapat dibiarkan sebagai riwayat percobaan. Untuk menghindari konfigurasi lama, buat project Vercel baru dengan nama **`jernih-brantas-next-web`**, lalu lakukan proses import di atas. Bagian terpenting tetap sama: pastikan **Root Directory = `next-web`**.

## Checklist Sebelum Menekan Deploy

- [ ] Folder `next-web` sudah terlihat di branch `main` GitHub.
- [ ] `next-web/package.json` dan `next-web/pnpm-lock.yaml` ikut terunggah.
- [ ] Framework preset adalah **Next.js**.
- [ ] Root Directory adalah **`next-web`**.
- [ ] Tidak ada `node_modules` atau `.next` yang di-commit.
- [ ] Deployment production memiliki izin publik setelah build selesai.

## Referensi

[1] [Vercel — Troubleshooting Build Errors](https://vercel.com/docs/deployments/troubleshoot-a-build)

[2] [Vercel — Deploying GitHub Projects](https://vercel.com/docs/git/vercel-for-github)

# Panduan konfigurasi produksi: Supabase dan Vercel

Panduan ini mengaktifkan jalur produksi **Jernih Brantas** tanpa pernah memasukkan rahasia ke GitHub atau kode sumber. Lakukan langkahnya berurutan. Halaman publik yang dituju adalah `https://jernih-brantas-mobile.vercel.app/` dan root directory proyek Vercel harus tetap **`next-web`**.

> **Batas keamanan:** `NEXT_PUBLIC_` memang tersedia pada browser. Jangan pernah menggunakan awalan tersebut untuk `SUPABASE_SERVICE_ROLE_KEY` atau `JERNIH_INGEST_API_KEY`. Kedua nilai terakhir hanya untuk server Vercel.

## 1. Konfigurasikan Supabase Auth

Buka [Supabase Dashboard](https://supabase.com/dashboard) → proyek **Jernih** → **Authentication** → **URL Configuration**. Atur nilai berikut.

| Kolom | Nilai yang diisi |
|---|---|
| **Site URL** | `https://jernih-brantas-mobile.vercel.app/` |
| **Redirect URLs** | `https://jernih-brantas-mobile.vercel.app/**` |
|  | `http://localhost:3000/**` |
| Opsional untuk preview Vercel | `https://*-okayy3.vercel.app/**` |

Gunakan URL produksi yang tepat untuk **Site URL**; wildcard sebaiknya dipakai hanya untuk localhost atau preview. Supabase hanya menerima tujuan `redirectTo` yang ada pada daftar tersebut.[1] [2]

Lalu buka **Authentication** → **Providers** → **Email** dan pastikan penyedia Email aktif. Magic Link aktif secara bawaan pada proyek Supabase yang di-host, tetapi halaman ini tetap perlu diperiksa sebelum staf pertama mencoba masuk.[1]

## 2. Tambahkan environment variable di Vercel

Buka **Vercel Dashboard** → proyek **jernih-brantas-next** → **Settings** → **Environment Variables**. Tambahkan empat nilai berikut. Pilih setidaknya lingkungan **Production**; pilih juga **Preview** bila Anda ingin menguji cabang/preview.

| Nama variable | Ambil nilai dari | Sifat | Lingkungan |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Settings** → **API** → Project URL | Publik untuk browser | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → **Settings** → **API** → publishable/anon key | Publik untuk browser | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Settings** → **API** → service_role key | **Rahasia server** | Production, Preview |
| `JERNIH_INGEST_API_KEY` | Nilai rahasia ingest yang sudah dipakai proyek Jernih | **Rahasia server** | Production, Preview |

Untuk dua nilai rahasia, gunakan opsi **Sensitive** bila tersedia dan jangan memotret, menempelkan ke chat, atau menyimpan nilainya dalam repository. Vercel menyimpan environment variable terpisah dari kode, tetapi perubahan hanya berlaku pada deployment baru.[3]

Setelah menyimpan, buka **Settings** → **Build and Deployment** dan pastikan **Root Directory** bernilai `next-web`. Kemudian buka **Deployments** dan pilih **Redeploy** untuk deployment terbaru dari branch produksi (`main`).

## 3. Aktifkan akun petugas pertama

Setelah deployment baru selesai, buka halaman publik → **Field Mode**. Masukkan email kerja petugas lalu pilih **Kirim tautan masuk**. Tautan Magic Link bersifat sekali pakai; secara bawaan Supabase dapat membuat pengguna baru ketika email tersebut belum terdaftar.[1]

Setelah petugas membuka tautan dan kembali ke aplikasi, Supabase membuat profil awal dengan peran `viewer`. Promosikan pengguna itu melalui **Supabase Dashboard** → **SQL Editor**. Ganti `EMAIL_PETUGAS` dan `NAMA_PETUGAS` sebelum menjalankan query berikut.

```sql
-- Periksa bahwa pengguna dan profil awal sudah tersedia.
select u.id, u.email, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('EMAIL_PETUGAS');

-- Pilihan A: administrator dapat menyimpan catatan manual untuk semua stasiun.
update public.profiles p
set role = 'admin', display_name = 'NAMA_PETUGAS'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('EMAIL_PETUGAS');
```

Untuk membatasi petugas hanya pada titik tertentu, gunakan `field_operator`, lalu tambahkan penugasan stasiun. ID stasiun yang tersedia adalah `malang`, `kediri`, `jombang`, `mojokerto`, dan `surabaya`.

```sql
-- Pilihan B: petugas lapangan terbatas pada stasiun yang ditugaskan.
update public.profiles p
set role = 'field_operator', display_name = 'NAMA_PETUGAS'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('EMAIL_PETUGAS');

insert into public.station_memberships (user_id, station_id)
select p.id, 'malang'
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('EMAIL_PETUGAS')
on conflict (user_id, station_id) do nothing;
```

Ulangi perintah `insert` terakhir untuk setiap stasiun tambahan. Jangan membuat role atau membership melalui browser biasa: kebijakan RLS proyek memang mencegah pengguna memberi dirinya sendiri hak akses.[4]

## 4. Pemeriksaan akhir

| Pemeriksaan | Hasil yang benar |
|---|---|
| Buka Field Mode tanpa login | Muncul panel **Akses Petugas** dan tombol simpan nonaktif. |
| Buka Field Mode setelah login `viewer` | Tombol tetap nonaktif karena belum ada hak Field Mode. |
| Masuk sebagai `field_operator` dengan penugasan stasiun yang dipilih | Tombol simpan aktif hanya untuk stasiun tersebut. |
| Masuk sebagai `admin` | Tombol simpan aktif untuk lima stasiun. |
| Monitor dan Data Trust | Input manual muncul sebagai sumber manual; nilai simulasi tidak boleh diperlakukan sebagai data resmi. |

Jangan memasukkan nilai percobaan ke produksi bila bukan hasil alat lapangan yang sah. Bila Anda perlu uji penerimaan, gunakan lingkungan preview/database uji atau hapus catatan uji sesuai prosedur internal setelah diverifikasi.

## 5. Troubleshooting cepat

| Gejala | Penyebab paling mungkin | Tindakan |
|---|---|---|
| “Konfigurasi Supabase browser belum tersedia” | Satu atau dua variable `NEXT_PUBLIC_` belum ada di Vercel, atau belum redeploy | Periksa dua variable publik dan redeploy. |
| Magic Link kembali ke URL yang salah | Site URL/Redirect URL belum cocok dengan domain aplikasi | Perbaiki URL Configuration di Supabase, lalu minta tautan baru. |
| Tombol simpan tetap nonaktif setelah login | Profil masih `viewer`, atau `field_operator` tidak memiliki membership | Jalankan query peran dan membership di atas. |
| Gagal menyimpan dengan pesan izin | RLS menolak stasiun atau sumber data | Pastikan peran, membership, dan stasiun yang dipilih sesuai. |
| `/api/readings` memberi 401 | Header ingest tidak valid atau server variable belum terpasang | Periksa hanya `JERNIH_INGEST_API_KEY` di Vercel; jangan taruh di browser. |

## References

[1]: https://supabase.com/docs/guides/auth/auth-email-passwordless "Supabase Docs — Passwordless email logins"
[2]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Docs — Redirect URLs"
[3]: https://vercel.com/docs/environment-variables "Vercel Docs — Environment variables"
[4]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Docs — Row Level Security"

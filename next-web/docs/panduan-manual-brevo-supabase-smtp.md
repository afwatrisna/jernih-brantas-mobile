# Panduan Manual Brevo SMTP untuk Magic Link Jernih

Panduan ini menghubungkan **Brevo free tier** ke Supabase Auth agar email Magic Link Jernih tidak lagi bergantung pada SMTP bawaan Supabase. Tidak ada bagian dari panduan ini yang meminta Anda menaruh password, SMTP key, atau service-role key di source code, GitHub, Vercel, ataupun chat.

> Status penting: konfigurasi ini dilakukan di dashboard Brevo dan Supabase. Perubahan berlaku pada layanan Auth Supabase dan **tidak memerlukan deploy ulang Vercel**.

## Sebelum mulai

Pastikan Anda memiliki akses Owner/Admin ke project Supabase **Jernih** dan dapat masuk ke akun Brevo. Siapkan satu alamat email pengirim yang benar-benar Anda akses, misalnya alamat Gmail pribadi untuk pilot atau alamat `noreply@domain-anda` untuk produksi.

| Item | Kondisi yang diperlukan |
|---|---|
| Akun Brevo | Sudah dibuat dan dapat diakses. |
| Sender email | Sudah dibuat lalu berstatus `Verified`. |
| SMTP key | Dibuat khusus untuk Jernih; simpan di password manager. |
| Supabase project | Project `Jernih` dengan ref `xqkjwvlkgicmqgejikxr`. |
| Batas awal yang disarankan | 10 email per jam untuk pilot kecil. |

## Langkah 1 — Verifikasi sender email di Brevo

1. Masuk ke dashboard Brevo.
2. Dari menu utama, buka **Transactional** lalu cari **Senders, Domains & Dedicated IPs** atau **Senders & IP**.
3. Pada tab **Senders**, klik **Add a sender**.
4. Masukkan nama pengirim, misalnya `Jernih Brantas`, beserta alamat email yang dapat Anda buka.
5. Brevo akan mengirim tautan verifikasi ke alamat itu. Buka inbox—termasuk Spam/Junk—kemudian klik tautan verifikasi.
6. Kembali ke Brevo dan pastikan status sender menjadi **Verified**.

Untuk pilot, satu alamat Gmail aktif dapat dipakai sebagai sender. Untuk produksi, verifikasikan domain sendiri melalui DNS supaya pengiriman email lebih dipercaya oleh penerima.

## Langkah 2 — Buat SMTP key khusus Jernih

1. Di Brevo, buka **Transactional → SMTP & API**.
2. Pilih tab **SMTP**.
3. Klik **Generate a new SMTP key** atau **Create SMTP key**.
4. Beri nama yang mudah diaudit, misalnya `Jernih Supabase Auth`.
5. Salin key yang muncul dan simpan di password manager. Biasanya Brevo hanya menampilkan key lengkap satu kali.

Gunakan nilai berikut saat mengisi Supabase. Jangan memasukkan key ini ke `.env.local`, source code, GitHub, atau Vercel—Supabase saja yang memerlukannya untuk mengirim email Auth.

| Field di Supabase | Nilai |
|---|---|
| SMTP host | `smtp-relay.brevo.com` |
| SMTP port | `587` |
| SMTP username | Salin **SMTP login email address** yang tampil pada tab Brevo **SMTP & API → SMTP**; jangan gunakan `apikey`. |
| SMTP password | SMTP key Brevo yang baru dibuat |
| Sender email | Alamat Brevo yang statusnya `Verified` |
| Sender name | `Jernih Brantas` |

## Langkah 3 — Aktifkan custom SMTP di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project **Jernih**.
2. Masuk ke **Authentication → Emails → SMTP Settings**.
3. Aktifkan **Enable custom SMTP**.
4. Isi semua field dengan nilai pada tabel di atas.
5. Gunakan sender email yang persis sama dengan sender `Verified` di Brevo. Pada field username, gunakan SMTP login email address dari Brevo, bukan alamat email akun yang mungkin berbeda.
6. Klik **Save**.

Apabila tombol atau nama menu sedikit berbeda, cari halaman Authentication yang menyebut `SMTP`, `Emails`, atau `Custom SMTP`. Jangan mengubah template Magic Link pada tahap ini.

## Langkah 4 — Atur limit email Supabase

Setelah custom SMTP aktif, buka **Authentication → Rate Limits** di project Supabase. Pada pengaturan limit email terkirim, masukkan **10 email per jam** sebagai batas awal. Nilai ini cukup untuk pilot kecil, jauh lebih aman dari pengiriman tanpa batas, dan tetap berada jauh di bawah kuota harian Brevo free tier yang diumumkan saat panduan ini disusun.

Pertahankan jeda kirim ulang Magic Link sekurang-kurangnya **60 detik per email**. Jeda ini mencegah pengguna menekan tombol berulang dan memboroskan kuota. Jangan menaikkan limit hanya untuk menguji; satu pengujian cukup.

> Batas email Supabase berbeda dari kuota harian Brevo. Keduanya harus dipatuhi: Supabase membatasi permintaan Auth project, sedangkan Brevo membatasi jumlah pengiriman dari akunnya.

## Langkah 5 — Uji dengan aman

1. Tunggu cooldown dari error sebelumnya berakhir.
2. Buka website Jernih di browser normal/incognito.
3. Masukkan satu email pengujian yang Anda kuasai.
4. Tekan kirim Magic Link **satu kali**.
5. Pastikan email datang dari nama/alamat sender yang benar.
6. Buka link terbaru dan pastikan login berhasil.
7. Periksa **Authentication → Logs** pada Supabase bila email tidak tiba atau login gagal.

Jika email gagal dikirim, cek berurutan: sender masih `Verified`, SMTP host/port benar, username sama persis dengan SMTP login email address dari tab Brevo SMTP, SMTP key tidak salah/terpotong, dan Brevo account tidak menolak pengiriman. Jika ada error limit, jangan mengulang kirim berkali-kali; periksa nilai pada Rate Limits terlebih dahulu.

## Batasan dan keamanan

Brevo menyatakan free tier SMTP-nya mendukung hingga **300 email per hari**, tetapi kuota dan syarat dapat berubah. Pantau pemakaian dari dashboard Brevo dan Supabase. Untuk penggunaan yang lebih besar, gunakan domain terverifikasi, record SPF/DKIM yang direkomendasikan Brevo, serta tinjau kebutuhan plan berbayar sebelum meningkatkan limit.

SMTP key hanya boleh disimpan di dashboard Brevo/password manager dan di form SMTP Supabase. Jika key pernah terpapar, segera revoke di Brevo, buat key baru, dan perbarui Supabase. Service-role key Supabase dan Gemini key tidak terkait dengan SMTP ini dan tidak boleh dimasukkan ke konfigurasi Brevo.

## Referensi

1. [Brevo — Free SMTP Server](https://www.brevo.com/free-smtp-server/)
2. [Supabase — Rate Limits](https://supabase.com/docs/guides/auth/rate-limits)
3. [Supabase — Production Checklist: Custom SMTP](https://supabase.com/docs/guides/deployment/going-into-prod)

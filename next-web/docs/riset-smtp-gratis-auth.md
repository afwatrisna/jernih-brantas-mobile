# Riset SMTP Gratis untuk Supabase Auth

Tanggal pemeriksaan: 27 Agustus 2026.

| Provider | Kuota free tier yang diumumkan | Kecocokan untuk Magic Link | Catatan |
|---|---:|---|---|
| Resend | 100 email transaksi/hari dan 3.000/bulan | Baik untuk pilot kecil | Mendukung hingga tiga domain terverifikasi pada akun gratis. |
| Brevo | Hingga 300 email/hari | Baik untuk pilot kecil dengan kebutuhan volume lebih tinggi | Menyediakan SMTP relay untuk pesan transaksi. |

Brevo dipilih sebagai opsi awal karena kuota harian gratis yang lebih tinggi. Pengiriman email Auth tetap memerlukan akun provider dan verifikasi pengirim/domain. SMTP bawaan Supabase tidak dapat menaikkan batas email terkirim; setelah custom SMTP aktif, batas email pada Auth dapat diatur di `Authentication → Rate Limits`.

## Referensi

1. [Resend — Account quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits)
2. [Brevo — Free SMTP server](https://www.brevo.com/free-smtp-server/)
3. [Supabase — Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)

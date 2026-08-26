# Rancangan Wireframe & Struktur Tata Letak Jernih Brantas

**Status:** Rancangan desain saja. Dokumen ini tidak mengubah fitur atau implementasi website.

## 1. Tujuan rancangan

Jernih Brantas adalah dashboard pemantauan kekeruhan Sungai Brantas. Struktur ideal harus membuat pengguna dapat memahami tiga hal dalam beberapa detik: **kondisi stasiun yang dipilih**, **apakah ada hal yang perlu ditindaklanjuti**, dan **seberapa dapat dipercaya sumber data tersebut**. Sesudah itu, pengguna dapat berpindah ke tindakan lapangan, analitik, atau pengaturan.

Prinsip utamanya adalah **monitor dulu, tindakan kedua, detail ketiga**. Tampilan tidak perlu melakukan redesign visual besar; sistem warna hijau-sungai, kartu terang, dan gaya editorial Jernih yang sudah ada tetap dipertahankan.

| Prioritas | Informasi atau tindakan | Letak ideal |
|---|---|---|
| 1 | NTU, klasifikasi, status, stasiun aktif | Hero Monitor |
| 2 | Sumber data, waktu pembaruan, tingkat verifikasi | Data Trust langsung di bawah hero |
| 3 | Alert dan anomali yang perlu ditinjau | Area tindakan prioritas |
| 4 | Tren, peta, perbandingan dan riwayat | Detail analitik atau bagian sekunder Monitor |
| 5 | Input lapangan, AI, pengaturan | Jalur kerja pendukung yang jelas |

## 2. Arsitektur informasi

Empat area utama tetap dipertahankan agar pengguna tidak perlu mempelajari navigasi baru.

| Area | Tujuan utama | Isi inti |
|---|---|---|
| **Monitor** | Menilai kondisi saat ini dan tindakan prioritas | Hero stasiun, Data Trust, alert, anomali, ringkasan, peta, akses AI |
| **Field Mode** | Mencatat pembacaan manual terotorisasi | Status akses, pilih stasiun/alat, nilai NTU, review, simpan |
| **Analitik** | Membaca pola dan membandingkan data | Rentang waktu, chart, metrik, perbandingan, riwayat, ekspor CSV |
| **Pengaturan** | Mengendalikan perilaku demo dan aturan tampilan | Simulasi, mode demo, status Supabase, ambang, reset demo |

> **Aturan navigasi:** Monitor adalah halaman awal. Field Mode adalah alur kerja operasional. Analitik adalah halaman investigasi. Pengaturan tidak mengganggu aktivitas monitoring sehari-hari.

## 3. Wireframe desktop

### 3.1 Kerangka global desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo Jernih]                         Monitor  Field Mode  Analitik  Atur  ● │
├───────────────────┬──────────────────────────────────────────────────────────┤
│ RUANG KERJA       │  Konteks halaman / judul / keterangan singkat             │
│ ▣ Monitor         │                                                          │
│ ▤ Field Mode      │  Area konten aktif                                        │
│ ◌ Analitik        │                                                          │
│ ⚙ Pengaturan      │                                                          │
│                   │                                                          │
│ TITIK PANTAU      │                                                          │
│ ● Malang Hulu     │                                                          │
│ ● Kediri          │                                                          │
│ ● Jombang         │                                                          │
│ ● Mojokerto       │                                                          │
│ ● Surabaya Hilir  │                                                          │
│                   │                                                          │
│ Catatan sumber    │                                                          │
└───────────────────┴──────────────────────────────────────────────────────────┘
```

**Ukuran konseptual:** sidebar tetap sekitar 240–260 px; area konten memakai lebar maksimum dashboard saat ini. Header global cukup satu baris. Badge mode demo/simulasi tetap berada di kanan atas, tetapi tidak menjadi fokus visual utama saat data operasional tersedia.

### 3.2 Halaman Monitor desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ MONITOR · STASIUN AKTIF                               [Buka Asisten Jernih] │
│ Kondisi sungai, lebih mudah dipahami.                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ HERO STASIUN                                                                 │
│ Malang Hulu · Bendungan Sengguruh         [SIMULASI / SENSOR / MANUAL]      │
│ 21.0 NTU             Jernih · Kelas II       gauge / status / alert ringkas │
├──────────────────────────────────────────────────────────────────────────────┤
│ DATA TRUST: sumber · pembaruan · alat · validasi · penyimpanan               │
├──────────────┬──────────────┬──────────────┬─────────────────────────────────┤
│ Rata-rata    │ Sesuai kelas │ Alert aktif  │ Catatan tersedia                 │
├──────────────────────────────────┬───────────────────────────────────────────┤
│ PERLU DITINDAKLANJUTI             │ ASISTEN JERNIH                            │
│ Alert aktif / status tenang       │ Ringkasan context stasiun + buka chat     │
│ Anomali terbaru                   │                                           │
├──────────────────────────────────┴───────────────────────────────────────────┤
│ PETA ALIRAN & TITIK PANTAU                 │ RINGKASAN TREN / AKSES ANALITIK │
├────────────────────────────────────────────┴─────────────────────────────────┤
│ CTA SEKUNDER: Field Mode bila pengguna ingin mencatat pengukuran             │
└──────────────────────────────────────────────────────────────────────────────┘
```

Pada desktop, **alert dan anomali** perlu berada sebelum peta karena keduanya menentukan urgensi. Asisten Jernih ditempatkan sejajar sebagai alat interpretasi, bukan sebagai pengganti status dashboard. Peta dan CTA Field Mode tetap tersedia namun berada setelah informasi keputusan utama.

### 3.3 Halaman Field Mode desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ FIELD MODE · Catat hasil lapangan                                             │
├───────────────────────┬──────────────────────────────────────────────────────┤
│ Akses petugas         │  [Pilih stasiun]  [Pilih alat]                        │
│ Nama · role · scope   │                                                        │
│                       │  KEKERUHAN TERBACA                                    │
│ Langkah 1 Pilih titik │  [                 18.4 ] NTU                         │
│ Langkah 2 Nilai NTU   │                                                        │
│ Langkah 3 Review      │  REVIEW: Kelas · status · peringatan                  │
│                       │                                                        │
│ Data Trust            │  [ Simpan pengukuran lapangan → ]                     │
└───────────────────────┴──────────────────────────────────────────────────────┘
```

Status akses harus terlihat sebelum input. Form utama tetap satu kolom agar pembacaan dan review tidak terpecah. Tombol simpan menjadi tindakan dominan dan hanya aktif setelah syarat otorisasi serta validasi terpenuhi.

### 3.4 Halaman Analitik desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ANALITIK · Stasiun aktif [Malang Hulu ▾] [Status]                             │
│ [24H] [7D] [30D] [90D]                                      [Export CSV]    │
├────────────┬────────────┬────────────┬────────────┬──────────────────────────┤
│ Terkini    │ Rata-rata  │ Minimum    │ Maksimum   │ Deviasi vs baseline      │
├──────────────────────────────────────────────────────────────────────────────┤
│ CHART TREN KEKERUHAN: garis aktual · baseline · ambang · penanda anomali     │
├──────────────────────────────────────────────────────────────────────────────┤
│ PERBANDINGAN STASIUN: pilihan hingga tiga stasiun + kartu hasil               │
├──────────────────────────────────────────────────────────────────────────────┤
│ RIWAYAT PENGUKURAN: waktu · sumber · alat · NTU · status                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Rentang waktu, stasiun aktif, dan ekspor CSV harus disatukan dalam satu control bar karena ketiganya mengubah cara pengguna membaca data. Chart ditempatkan sebelum perbandingan dan riwayat karena menjadi alat investigasi utama.

### 3.5 Halaman Pengaturan desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ PENGATURAN · Kendalikan cara demo bekerja                                     │
├─────────────────────────────────┬────────────────────────────────────────────┤
│ SUMBER & MODE DATA               │ ATURAN STATUS                              │
│ [Mode Simulasi]         (toggle)│ ● Normal · dalam pola                      │
│ [Data demo presentasi]  (toggle)│ ● Warning · ambang                         │
│ Status Supabase                  │ ● High · ambang                            │
│                                 │ ● Critical · ambang                        │
├─────────────────────────────────┴────────────────────────────────────────────┤
│ ZONA DEMO: [ Reset data demo ] — tindakan sekunder dengan penjelasan          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 4. Wireframe mobile (portrait 9:16)

### 4.1 Kerangka global mobile

```text
┌──────────────────────────────────────┐
│ [Logo] Jernih Brantas     ● status    │  Header tetap/sticky
├──────────────────────────────────────┤
│ Konten halaman                        │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Monitor | Field | Analitik | Atur     │  Navigasi bawah/sticky
└──────────────────────────────────────┘
```

Untuk pemakaian satu tangan, navigasi utama idealnya berada di bawah layar dan hanya berisi empat area yang sudah ada. Header atas cukup untuk identitas aplikasi, status sumber ringkas, dan akses menu tambahan bila diperlukan. Jika navigasi atas dipertahankan, tingginya harus tetap ringkas dan tidak mendorong hero jauh ke bawah.

### 4.2 Urutan Monitor mobile

```text
┌──────────────────────────────────────┐
│ MONITOR                     [AI]     │
│ Kondisi sungai hari ini               │
├──────────────────────────────────────┤
│ [Malang] [Kediri] [Jombang]  →        │  Pilihan stasiun horizontal
├──────────────────────────────────────┤
│ MALANG HULU            [SENSOR]      │
│ 21.0 NTU                              │
│ Jernih · Kelas II       [Normal]      │
│ ▓▓▓▓▓░  gauge/status ringkas          │
├──────────────────────────────────────┤
│ DATA TRUST ▾                          │  Ringkas; dapat diperluas
│ Pembaruan · sumber · validasi          │
├──────────────────────────────────────┤
│ [Rata-rata] [Alert aktif]             │  Dua kartu per baris
│ [Sesuai kelas] [Catatan]              │
├──────────────────────────────────────┤
│ PERLU DITINDAKLANJUTI                 │
│ Alert / anomali / kondisi tenang       │
├──────────────────────────────────────┤
│ [Buka Field Mode] [Lihat Analitik]    │  Tindakan kontekstual
├──────────────────────────────────────┤
│ Peta titik pantau ▾                   │  Bagian detail lebih bawah
└──────────────────────────────────────┘
```

Hero mobile harus mengutamakan **angka NTU dan klasifikasi**, bukan meniru komposisi desktop secara utuh. Data Trust menjadi ringkasan yang dapat diperluas agar halaman tidak terlalu panjang. Alert/anomali harus muncul sebelum peta; pengguna mobile lebih mungkin memerlukan jawaban cepat daripada eksplorasi spasial awal.

### 4.3 Field Mode mobile

```text
┌──────────────────────────────────────┐
│ FIELD MODE                            │
│ [1 Titik]—[2 Nilai]—[3 Review]        │
├──────────────────────────────────────┤
│ AKSES PETUGAS                         │
│ Nama / role / masuk                   │
├──────────────────────────────────────┤
│ Stasiun [Malang Hulu            ▾]    │
│ Alat    [Turbidimeter          ▾]     │
│ Nilai NTU                              │
│ [                18.4 ] NTU           │
├──────────────────────────────────────┤
│ REVIEW KLASIFIKASI                     │
│ Kelas · status · catatan verifikasi    │
├──────────────────────────────────────┤
│ [ Simpan pengukuran lapangan → ]      │  Tombol sticky di bawah form
└──────────────────────────────────────┘
```

Field Mode tetap satu kolom. Tombol simpan sebaiknya mudah dijangkau saat pengguna selesai memasukkan NTU, dengan area aman agar tidak tertutup navigasi bawah atau keyboard.

### 4.4 Analitik mobile

```text
┌──────────────────────────────────────┐
│ ANALITIK                              │
│ [Malang Hulu ▾] [Status]              │
│ [24H] [7D] [30D] [90D]                │
├──────────────────────────────────────┤
│ Terkini     Rata-rata                 │
│ Minimum     Maksimum                   │
│ Deviasi vs baseline                    │
├──────────────────────────────────────┤
│ Chart tren (lebar penuh, dapat scroll │
│ horizontal bila label waktu padat)     │
├──────────────────────────────────────┤
│ [Export CSV]                          │
├──────────────────────────────────────┤
│ Perbandingan stasiun ▾                │
│ Riwayat pengukuran ▾                  │
└──────────────────────────────────────┘
```

Pada mobile, chart tetap lebar penuh. Perbandingan dan riwayat ditempatkan setelah chart sebagai accordion atau section yang dapat dibuka agar pengguna tidak harus melewati daftar panjang sebelum menyelesaikan investigasi utama.

## 5. Posisi Asisten Jernih

Asisten Jernih tidak perlu menjadi tab utama kelima. Posisi idealnya adalah **akses sekunder yang selalu dekat dengan konteks stasiun**, yaitu tombol `AI` di header Monitor dan panel/sheet yang membawa label stasiun, sumber data, serta batasan keamanan.

| Desktop | Mobile |
|---|---|
| Kartu Asisten di sisi area alert/anomali, dapat diperluas menjadi panel percakapan. | Tombol `AI` membuka bottom sheet atau halaman percakapan fokus penuh. |
| Context stasiun dan label sumber selalu terlihat di atas percakapan. | Header sheet menampilkan stasiun aktif dan badge `SENSOR`/`MANUAL`/`SIMULASI`. |
| Tidak menggeser peta/chart saat panel masih tertutup. | Riwayat percakapan dapat di-scroll mandiri; input tetap di bawah. |

## 6. Keputusan tata letak yang direkomendasikan

| Keputusan | Alasan |
|---|---|
| Letakkan alert dan anomali di atas peta pada Monitor. | Membuat tindakan prioritas lebih cepat ditemukan. |
| Ringkas Data Trust pada mobile, tetapi jangan menyembunyikan label sumber. | Menjaga halaman ringkas tanpa mengorbankan transparansi data. |
| Gunakan satu station context yang konsisten pada Monitor, Field Mode, Analitik, dan AI. | Mengurangi kebingungan ketika pengguna berpindah area. |
| Pisahkan tindakan operasional dari informasi. | `Field Mode` untuk memasukkan data; Monitor untuk membaca kondisi; Analitik untuk investigasi. |
| Pertahankan CTA Field Mode sebagai tindakan sekunder dan kontekstual. | Input manual penting, tetapi tidak boleh mengalahkan pembacaan status sungai. |
| Gunakan disclosure/accordion untuk detail berat pada mobile. | Mengurangi scrolling tanpa menghapus fitur peta, riwayat, atau perbandingan. |

## 7. Tahapan implementasi jika rancangan disetujui

1. **Tahap struktur:** rapikan urutan section Monitor, control bar Analitik, dan hierarchy Field Mode tanpa mengganti gaya visual utama.
2. **Tahap mobile:** tetapkan navigasi sticky, ringkas hero, Data Trust, dan gunakan disclosure untuk detail panjang.
3. **Tahap penyempurnaan:** rapikan Asisten Jernih, empty state, loading/error, dan akses tindakan kontekstual.

Tidak ada fitur yang perlu dihapus dalam rancangan ini. Fokusnya adalah memindahkan fitur yang sudah ada ke urutan yang lebih mudah dipindai dan dipakai oleh petugas lapangan maupun pengguna dashboard desktop.

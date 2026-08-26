# Validasi Layout Monitor

## Desktop

Pada preview produksi lokal, halaman Monitor berhasil menampilkan urutan baru: konteks kondisi saat ini, hero stasiun, Data Trust, metrik, area prioritas berisi alert/anomali, tindakan Field Mode dan Analitik, lalu Asisten Jernih serta area eksplorasi peta. Semua kontrol utama tetap tersedia.

## Mobile

Screenshot produksi lokal pada lebar 390 px menunjukkan pemilih lima stasiun, hero kondisi aktif, serta bottom navigation sticky dengan empat item yang dapat dijangkau. Ruang bawah halaman telah dikompensasi untuk navigation bar. Label sumber sungai pada hero dipotong secara aman agar tidak bertabrakan dengan badge status simulasi.

## River map

Pada validasi responsive, ringkasan stasiun terpilih dipindahkan dari atas aliran ke kartu di bawah peta. Peta kini terbuka penuh untuk marker dan jalur sungai, sementara label arah `HULU` dan `HILIR` diperkecil serta diposisikan aman di dalam batas ilustrasi.

## Field Mode

Pada preview desktop, akses petugas kini tampil sebelum form input. Konteks stasiun, langkah kerja, dan Data Trust berada pada kolom pendukung; form utama kemudian mengelompokkan pemilihan alat, nilai NTU, review klasifikasi, dan tindakan simpan.

## Analitik

Pada preview desktop, pemilih stasiun, pilihan rentang waktu, dan ekspor CSV telah digabung menjadi satu control bar yang ringkas. Metrik, chart, perbandingan, dan riwayat tetap berada pada urutan analitik yang sama.

## Narrow mobile priority cards

Pada validasi lebar 248 px, kartu Peringatan Dini dan Deteksi Anomali kini tersusun satu kolom. Seluruh heading, isi, dan batas kartu tampil di dalam frame tanpa horizontal overflow.

## Analitik export action

Pada preview desktop, tombol `Export CSV` tetap berada di dalam control bar Analitik bersama pemilih stasiun dan rentang waktu. Toolbar akan menata context di atas kontrol saat lebar desktop terbatas agar tidak ada aksi yang keluar frame.

# Kebijakan Privasi Aethereal Shield

<!-- Draft for aethereal.top/shield/privacy. Must match SPEC §6. Fill in [KONTAK] and have it reviewed before CWS submission. -->

Berlaku sejak: [TANGGAL RILIS]

Aethereal Shield adalah ekstensi browser dari Aethereal (aethereal.top) yang memperingatkan kamu tentang situs phishing dan permintaan transaksi wallet yang berbahaya. Kebijakan ini menjelaskan data apa yang diproses dan ke mana data itu pergi.

## Ringkasnya

- Pemeriksaan situs dilakukan **di perangkat kamu**. Daftar situs yang kamu kunjungi tidak pernah dikirim ke mana pun.
- Data hanya keluar dari perangkat saat ada **peringatan**, dan hanya ringkasan temuannya, untuk membuat penjelasan dalam Bahasa Indonesia.
- Kami **tidak pernah** mengambil alamat wallet, saldo, seed phrase, atau private key kamu.

## Data yang diproses

| Data | Keluar dari perangkat? | Keterangan |
|---|---|---|
| Alamat situs yang kamu kunjungi | **Tidak** | Dicek di perangkat terhadap daftar dan model yang ada di dalam ekstensi. |
| Nama domain situs yang diperingatkan | Ya, hanya saat ada peringatan | Dikirim bersama temuan untuk membuat penjelasan. Bukan URL lengkap. |
| Ringkasan permintaan transaksi yang diperingatkan (jenis permintaan, alamat kontrak penerima izin, token, jumlah) | Ya, hanya saat ada peringatan | Tanpa alamat wallet kamu dan tanpa data transaksi lengkap. |
| Alamat wallet, saldo, seed phrase, private key | **Tidak pernah** | |
| Isi halaman, formulir, kata sandi | **Tidak pernah** | |

Hasil pemeriksaan per tab disimpan sementara di browser kamu (`chrome.storage.session`) agar bisa ditampilkan di popup, dan terhapus saat browser ditutup.

## Ke mana data peringatan dikirim

1. **Server Aethereal** (Cloudflare Workers) menerima ringkasan temuan, lalu meneruskannya ke Claude.
   - Kami tidak menyimpan isi permintaan di log.
   - Penjelasan yang dihasilkan disimpan hingga 7 hari dengan kunci berupa hash dari temuan, supaya temuan yang sama tidak diproses ulang.
   - Alamat IP kamu dipakai sesaat untuk membatasi jumlah permintaan (anti-penyalahgunaan) dan tidak kami simpan.
2. **Anthropic** (penyedia model Claude) memproses ringkasan temuan untuk menulis penjelasan, sesuai kebijakan data API Anthropic.

Kalau server tidak bisa dihubungi, peringatan tetap muncul dengan teks bawaan ekstensi.

## Yang tidak kami lakukan

- Tidak menjual atau membagikan data kepada pengiklan.
- Tidak membuat profil pengguna atau akun.
- Tidak memuat kode dari luar ekstensi.

## Batasan

Aethereal Shield **bukan jaminan keamanan**. Situs atau penipuan baru bisa saja belum terdeteksi. Selalu cek ulang alamat situs dan isi transaksi di wallet kamu.

## Kontak

Pertanyaan, atau situs resmi kamu salah ditandai? Hubungi kami di [KONTAK].

Perubahan kebijakan ini akan diumumkan di halaman ini beserta tanggal berlakunya.

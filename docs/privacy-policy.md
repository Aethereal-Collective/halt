# Kebijakan Privasi Halt

<!-- Served at https://halt.aethereal.top/privacy. Must match SPEC §6. English version: privacy-policy.en.md. -->

Berlaku sejak: 16 Oktober 2026

Halt adalah ekstensi browser dari Aethereal (aethereal.top) yang memperingatkan kamu tentang situs phishing dan permintaan transaksi wallet yang berbahaya. Kebijakan ini menjelaskan data apa yang diproses dan ke mana data itu pergi.

## Ringkasnya

- Pemeriksaan situs dilakukan **di perangkat kamu**. Daftar situs yang kamu kunjungi tidak pernah dikirim ke mana pun.
- Peringatan dan penjelasannya juga dibuat **di perangkat kamu**. Ekstensi ini tidak mengirim data apa pun ke server kami atau pihak lain.
- Kami **tidak pernah** mengambil alamat wallet, saldo, seed phrase, atau private key kamu.

## Data yang diproses

| Data | Keluar dari perangkat? | Keterangan |
|---|---|---|
| Alamat situs yang kamu kunjungi | **Tidak** | Dicek di perangkat terhadap daftar dan model yang ada di dalam ekstensi. |
| Nama domain situs yang diperingatkan | **Tidak** | Peringatan ditampilkan langsung oleh ekstensi. |
| Permintaan transaksi yang diperingatkan | **Tidak** | Dibaca dan ditampilkan di perangkat kamu. |
| Alamat wallet, saldo, seed phrase, private key | **Tidak pernah** | |
| Isi halaman, formulir, kata sandi | **Tidak pernah** | |

Hasil pemeriksaan per tab disimpan sementara di browser kamu (`chrome.storage.session`) agar bisa ditampilkan di popup, dan terhapus saat browser ditutup.

## Ke mana data dikirim

Tidak ke mana pun. Ekstensi tidak punya server dan tidak membuat permintaan jaringan. Daftar situs phishing dan model pendeteksi ikut terpasang di dalam ekstensi dan diperbarui lewat pembaruan ekstensi di Chrome Web Store.

Tautan "Laporkan" hanya membuka halaman komunitas kami di tab baru; apa yang kamu tulis di sana tunduk pada kebijakan platform tersebut.

## Yang tidak kami lakukan

- Tidak menjual atau membagikan data kepada pengiklan.
- Tidak membuat profil pengguna atau akun.
- Tidak memuat kode dari luar ekstensi.

## Batasan

Halt **bukan jaminan keamanan**. Situs atau penipuan baru bisa saja belum terdeteksi. Selalu cek ulang alamat situs dan isi transaksi di wallet kamu.

## Kontak

Pertanyaan, atau situs resmi kamu salah ditandai? Hubungi kami di [aethereal.hq@gmail.com](mailto:aethereal.hq@gmail.com).

Perubahan kebijakan ini akan diumumkan di halaman ini beserta tanggal berlakunya.

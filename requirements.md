# Requirements: Inven Sekolah (Sistem Inventaris Sekolah)

Dokumen ini merangkum kebutuhan sistem berdasarkan kondisi projek per 13 Oktober 2026.

**Legenda status**
- ✅ Selesai: sudah tersambung ke database dan berfungsi
- 🟡 Sebagian: API sudah ada, tampilan belum tersambung (atau sebaliknya)
- 🎨 Dummy: tampilan jadi, tetapi masih memakai data tiruan
- ❌ Belum ada

---

## 1. Gambaran Umum

**Tujuan.** Aplikasi web untuk mengelola inventaris barang sekolah: pendataan barang dan kategorinya, pengelolaan akun pengguna, serta peminjaman barang oleh pengguna.

**Pengguna sistem**

| Peran | Hak akses |
|---|---|
| Admin | Mengelola barang, jenis barang, pengguna, dan transaksi. Mengakses area `/admin`. |
| User | Melihat daftar barang, mengajukan peminjaman, dan melihat riwayat peminjaman sendiri. |
| Petugas | Ada di skema (`Admin`, `Petugas`, `User`), tetapi hak aksesnya belum didefinisikan. |

**Teknologi**

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React, TypeScript |
| Database | MySQL |
| ORM | Prisma 7 (generator `prisma-client`, adapter `@prisma/adapter-mariadb`) |
| UI | HeroUI, Tailwind CSS, lucide-react (dark theme) |
| Keamanan | bcryptjs untuk hash password, sesi database buatan sendiri (cookie httpOnly) |

---

## 2. Kebutuhan Fungsional

### 2.1 Autentikasi dan Sesi

| ID | Kebutuhan | Status |
|---|---|---|
| AUTH-01 | Pengguna dapat mendaftar (nama, email, password minimal 6 karakter, pilihan role Admin atau User). | ✅ |
| AUTH-02 | Password disimpan dalam bentuk hash (bcrypt), tidak pernah plain text. | ✅ |
| AUTH-03 | Pengguna dapat login dengan email dan password. Akun berstatus non-Active ditolak. | ✅ |
| AUTH-04 | Setelah login, Admin diarahkan ke `/admin` dan User ke halaman User (route User perlu diseragamkan, lihat bagian 5). | ✅ |
| AUTH-05 | Sesi disimpan di tabel `Sesi` (token acak, masa berlaku 7 hari) dan dikirim lewat cookie httpOnly. | ✅ |
| AUTH-06 | Pengguna dapat logout; sesi dihapus dari database dan cookie dibersihkan. Sidebar menampilkan dialog konfirmasi. | ✅ |
| AUTH-07 | Halaman `/admin` hanya bisa diakses role Admin. Pengguna yang belum login diarahkan ke `/login`. | ✅ |
| AUTH-08 | Halaman area User hanya bisa diakses role User yang sudah login. | ✅ |
| AUTH-09 | Halaman `/unauthorized` untuk akses yang ditolak. | ✅ |

### 2.2 Kelola Barang (Admin)

| ID | Kebutuhan | Status |
|---|---|---|
| BRG-01 | Menampilkan daftar barang dengan statistik (total barang, total kategori, ketersediaan unit, stok habis). | ✅ |
| BRG-02 | Mencari barang berdasarkan nama, SKU, atau kategori. | ✅ |
| BRG-03 | Memfilter barang berdasarkan kategori (dinamis mengikuti data Jenis Barang). | ✅ |
| BRG-04 | Menambah katalog barang beserta serial number unit fisik (input manual atau bulk generator rentang nomor). | ✅ |
| BRG-05 | ID barang dibuat otomatis berurutan (`0001`, `0002`, dst). | ✅ |
| BRG-06 | SKU harus unik; SKU yang sudah dipakai ditolak dengan pesan jelas. | ✅ |
| BRG-07 | Kategori wajib dipilih dan harus ada di tabel Jenis Barang. | ✅ |
| BRG-08 | Mengedit barang dan mengelola unit fisik (tambah SN, ubah kondisi unit, hapus unit) di `/admin/barang/[id]`. | ✅ |
| BRG-09 | Menghapus barang dengan dialog konfirmasi (hanya bila tidak ada unit yang sedang dipinjam). | ✅ |
| BRG-10 | Mengunggah gambar barang. | ❌ (kotak "Media Barang" hanya tampilan) |
| BRG-11 | Pelacakan unit fisik per Serial Number (SN) unik dengan kondisi (`BAIK`, `RUSAK_RINGAN`, `RUSAK_BERAT`) dan status unit (`TERSEDIA`, `DIPINJAM`, `RUSAK`, `HILANG`). | ✅ |

Status ketersediaan katalog barang: `TERSEDIA` (jika ada unit siap dipinjam) atau `HABIS` (jika seluruh unit sedang dipinjam/rusak).

### 2.3 Kelola Jenis Barang (Admin)

| ID | Kebutuhan | Status |
|---|---|---|
| JNS-01 | Menampilkan daftar jenis barang beserta jumlah barang di tiap jenis. | ✅ |
| JNS-02 | Mencari jenis barang berdasarkan nama. | ✅ |
| JNS-03 | Menambah dan mengedit jenis barang (nama, deskripsi) lewat satu halaman form. | ✅ |
| JNS-04 | Nama jenis harus unik; ID dibuat berurutan. | ✅ |
| JNS-05 | Menghapus jenis barang. Ditolak bila masih dipakai oleh barang. | ✅ |
| JNS-06 | Dialog konfirmasi hapus memakai komponen `ConfirmDialog`. | ✅ |

### 2.4 Kelola Pengguna (Admin)

| ID | Kebutuhan | Status |
|---|---|---|
| USR-01 | API daftar pengguna (tanpa field password). | ✅ |
| USR-02 | API tambah pengguna oleh Admin (password di-hash, email unik). | ✅ |
| USR-03 | API detail, edit (nama, email, role, status, password opsional), dan hapus. | ✅ |
| USR-04 | Admin terakhir tidak boleh dihapus atau dinonaktifkan. | ✅ |
| USR-05 | Halaman daftar pengguna tersambung ke API (pencarian, filter role/status, edit, hapus). | ✅ |
| USR-06 | Halaman form Tambah/Edit Pengguna (`hal_pengguna`). | ✅ |

### 2.5 Transaksi Peminjaman

| ID | Kebutuhan | Status |
|---|---|---|
| TRX-01 | Admin melihat seluruh transaksi lengkap dengan Serial Number (SN) unit barang, tanggal pinjam, tenggat, keperluan, dan status. | ✅ |
| TRX-02 | Admin mencatat peminjaman manual dengan memilih unit fisik spesifik berdasarkan Serial Number (`/admin/transaksi/hal_catatbarang`). | ✅ |
| TRX-03 | Status transaksi: Menunggu, Dipinjam, Terlambat, Dikembalikan, Ditolak/Dibatalkan. | ✅ |
| TRX-04 | Tabel dan API transaksi tersambung relasi langsung ke `UnitBarang` dan `Barang`. | ✅ |
| TRX-05 | Ketersediaan unit fisik dan status unit otomatis berganti (`DIPINJAM` saat disetujui/dicatat, `TERSEDIA` saat dikembalikan). | ✅ |
| TRX-06 | Persetujuan atau penolakan pengajuan peminjaman oleh Admin, dengan alokasi unit otomatis atau spesifik. | ✅ |

### 2.6 Sisi User

| ID | Kebutuhan | Status |
|---|---|---|
| UI-01 | Daftar barang dengan statistik, pencarian, filter kategori dinamis, dan tombol **Pinjam** (hanya untuk barang tersedia). | ✅ |
| UI-02 | Form ajukan peminjaman (barang, tanggal pinjam, tanggal kembali, keperluan). | ✅ |
| UI-03 | Riwayat transaksi milik sendiri, dengan tombol Batalkan untuk yang masih berstatus Dipinjam atau Menunggu. | ✅ |
| UI-04 | Sidebar khusus User (menu Barang, Riwayat Transaksi, Keluar, kartu profil). | ✅ |

### 2.7 Dashboard Admin

| ID | Kebutuhan | Status |
|---|---|---|
| DSH-01 | Kartu statistik (total barang, kategori, user, peminjaman aktif) dan inventaris terbaru. | ✅ |
| DSH-02 | Dropdown profil dengan menu Keluar yang berfungsi. | ✅ |
| DSH-03 | Dropdown notifikasi dan pencarian global. | 🎨 |

### 2.8 Pengaturan Akun

| ID | Kebutuhan | Status |
|---|---|---|
| SET-01 | Edit profil (nama, email). | ✅ |
| SET-02 | Ganti password. | ✅ |
| SET-03 | Pengaturan notifikasi (aktif/nonaktif). | ❌ |

### 2.9 Komponen Bersama

| ID | Kebutuhan | Status |
|---|---|---|
| CMP-01 | Toast notifikasi (sukses, gagal, peringatan, info) di pojok kanan atas. | ✅ |
| CMP-02 | `ConfirmDialog` reusable berbasis HeroUI AlertDialog. | ✅ |
| CMP-03 | Style form bersama (`form_style`). | ✅ |
| CMP-04 | Komponen form tambah barang dipecah per kartu; tabel barang menjadi komponen sendiri. | ✅ |

---

## 3. Model Data

**Pengguna**
`id` (cuid), `nama`, `email` (unik), `password` (hash), `role` (default `User`), `status` (default `Active`), `tanggalBergabung`, `updatedAt`.

**Sesi**
`id`, `token` (unik), `penggunaId` (relasi ke Pengguna, hapus berantai), `expiresAt`, `createdAt`.

**JenisBarang**
`id` (berurutan), `nama` (unik), `deskripsi`, `createdAt`, `updatedAt`. Relasi satu ke banyak ke Barang.

**Barang**
`id` (berurutan), `nama`, `kategoriId` (relasi ke JenisBarang), `merek`, `sku` (unik), `kondisi`, `stok` (jumlah unit tersedia), `status` (`TERSEDIA` / `HABIS`), `lokasiRak`, `deskripsi`, `createdAt`, `updatedAt`. Relasi satu ke banyak ke `UnitBarang`.

**UnitBarang (Unit Fisik Ber-Serial Number)**
`id` (cuid), `kodeUnit` (e.g. `UNT-0001`), `serialNumber` (unik, e.g. `PROJ-001`), `barangId` (relasi ke Barang, onDelete: Cascade), `kondisi` (`BAIK`, `RUSAK_RINGAN`, `RUSAK_BERAT`), `status` (`TERSEDIA`, `DIPINJAM`, `RUSAK`, `HILANG`), `lokasiRak`, `catatan`, `createdAt`, `updatedAt`.

**Peminjaman / Transaksi**
`id` (cuid), `kodeTransaksi` (unik, e.g. `TRX-0001`), `penggunaId` (relasi ke Pengguna, onDelete: Cascade), `barangId` (relasi ke Barang, onDelete: Cascade), `unitId` (relasi ke UnitBarang, opsional/terikat ke unit spesifik), `jumlah` (1 unit per peminjaman fisik), `tanggalPinjam`, `tenggatWaktu`, `tanggalKembali`, `keperluan`, `status` (`MENUNGGU`, `DIPINJAM`, `TERLAMBAT`, `DIKEMBALIKAN`, `DITOLAK`, `DIBATALKAN`), `catatan`, `createdAt`, `updatedAt`.

---

## 4. Daftar Endpoint API

| Endpoint | Method | Fungsi | Status |
|---|---|---|---|
| `/api/auth/register` | POST | Daftar akun (default role User) | ✅ |
| `/api/auth/login` | POST | Login, buat sesi | ✅ |
| `/api/auth/logout` | POST | Logout, hapus sesi | ✅ |
| `/api/auth/profile` | GET, PATCH | Ambil data profil & ubah nama/email/password | ✅ |
| `/api/barang` | GET, POST | Daftar (termasuk hitungan unit) dan tambah barang beserta SN unit awal | ✅ |
| `/api/barang/[id]` | GET, PATCH, DELETE | Detail (termasuk seluruh unit & peminjam aktif), edit, hapus barang | ✅ |
| `/api/barang/[id]/units` | GET, POST | Ambil unit & tambah unit (manual atau bulk generator SN) | ✅ |
| `/api/barang/units/[unitId]` | PATCH, DELETE | Edit kondisi/status/rak unit spesifik atau hapus unit | ✅ |
| `/api/jenisbarang` | GET, POST | Daftar (dengan jumlah barang) dan tambah | ✅ |
| `/api/jenisbarang/[id]` | GET, PATCH, DELETE | Detail, edit, hapus jenis | ✅ |
| `/api/pengguna` | GET, POST | Daftar dan tambah pengguna (proteksi role Admin) | ✅ |
| `/api/pengguna/[id]` | GET, PATCH, DELETE | Detail, edit, hapus pengguna (proteksi admin terakhir) | ✅ |
| `/api/transaksi` | GET, POST | Daftar transaksi (termasuk info SN unit) dan catat/ajukan peminjaman unit | ✅ |
| `/api/transaksi/[id]` | GET, PATCH, DELETE | Detail, update status (persetujuan/kembali kelola status unit), dan hapus | ✅ |

---

## 5. Peta Halaman

**Publik**

| Route | Fungsi |
|---|---|
| `/login` | Halaman login |
| `/register` | Halaman daftar akun (User) |
| `/unauthorized` | Halaman 403 akses ditolak |

**Admin (khusus role Admin)**

| Route | Fungsi |
|---|---|
| `/admin` | Dashboard (statistik dinamis, persetujuan peminjaman, inventaris terbaru) |
| `/admin/barang` | Kelola barang (filter kategori dinamis, pencarian) |
| `/admin/barang/hal_barang` | Tambah barang |
| `/admin/barang/[id]` | Edit barang |
| `/admin/jenis_barang` | Kelola jenis barang |
| `/admin/jenis_barang/hal_jbarang` | Tambah/edit jenis (mode edit lewat `?id=`) |
| `/admin/pengguna` | Kelola pengguna (pencarian, filter role/status, hapus) |
| `/admin/pengguna/hal_pengguna` | Tambah/edit pengguna (mode edit lewat `?id=`) |
| `/admin/transaksi` | Kelola transaksi (persetujuan, pengembalian, status badge) |
| `/admin/transaksi/hal_catatbarang` | Catat peminjaman manual & edit peminjaman |
| `/admin/pengaturan` | Pengaturan akun Admin (ubah nama, email, password) |

**User (khusus role User)**

| Route | Fungsi |
|---|---|
| `/user` | Dashboard Pengguna (statistik mandiri, status peminjaman aktif) |
| `/user/barang` | Daftar katalog barang, pencarian, filter, dan dialog ajukan pinjam |
| `/user/transaksi` | Riwayat peminjaman mandiri & pembatalan peminjaman |
| `/user/pengaturan` | Pengaturan akun User (ubah nama, email, password) |

---

## 6. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan | Status |
|---|---|---|
| Keamanan | Password di-hash, field password tidak pernah dikirim ke frontend, cookie sesi httpOnly. | ✅ |
| Keamanan | Seluruh API dilindungi pengecekan sesi dan role. | ✅ |
| Keamanan | Pendaftaran Admin lewat `/register` dibatasi atau dinonaktifkan (default role User). | ✅ |
| Integritas data | Relasi Barang ke JenisBarang dijaga oleh foreign key dan validasi API. | ✅ |
| Tampilan | Dark theme konsisten, responsif untuk layar kecil. | ✅ (sebagian besar) |
| Pengalaman pengguna | Umpan balik lewat toast, loading state, dan pesan error yang jelas. | ✅ |
| Performa | Paginasi tabel. | ❌ (tombol halaman masih tampilan) |

---

## 7. Daftar Tindak Lanjut

Urutan yang disarankan:

1. Sambungkan halaman Kelola Pengguna ke API, lalu buat form Tambah/Edit Pengguna.
2. Buat tabel dan API Peminjaman, lalu sambungkan sisi User dan Kelola Transaksi Admin. Sertakan logika stok dan persetujuan.
3. Lindungi semua API dengan sesi dan role.
4. Batasi atau hapus pilihan role Admin di `/register`.
5. Buat halaman Pengaturan (profil, ganti password, notifikasi).
6. Samakan filter kategori Kelola Barang dengan data Jenis Barang.
7. Ganti `confirm()` di Jenis Barang dengan `ConfirmDialog`.
8. Seragamkan route User (`/user/...` atau `/dashboard/...`) dan pastikan `/unauthorized` ada.
9. Implementasi upload gambar barang dan paginasi nyata.
10. Hapus file sisa (`scripts/seed-admin.ts`, `UserNav.tsx`, `EditBarangModal.tsx`).

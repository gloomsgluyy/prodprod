# CoalTrade OS v2 — Master QA Testing Guide & User Flow Manual

Dokumen ini berisi panduan pengujian menyeluruh (**End-to-End QA Test Plan & User Flow**) untuk seluruh modul di aplikasi **CoalTrade OS v2**. Panduan ini dirancang untuk memudahkan QA Tester dalam menguji fungsionalitas CRUD, alur kerja (workflow), serta menemukan potensi kebingungan UX (*user friction*).

---

## 🧭 PANDUAN RINGKAS E2E WORKFLOW UTAMA

Secara garis besar, alur bisnis utama sistem berjalan dari **Forecast Sales → Approval → Deal → Shipment → Document Checklist → Closing**:

```
[1. Market Price] ───> [2. Forecast Sales Draft] ───> [3. Submit & Candidate]
                                                               │
[6. SI & Shipping] <── [5. Deal & Shipment] <─── [4. Approval (CEO/DIRUT)]
         │
         ├───> [7. Document Upload & ZIP]
         └───> [8. Summary Report & Document Drive] ───> [9. Closing Shipment]
```

---

## 📑 RINCIAN PENGUJIAN PER MODUL

---

### 1. 🔐 Modul Autentikasi & Management User (`/login`, `/users`, `/directory`)

#### **Tujuan Fitur**
Memastikan akses pengguna aman berbasis peran (Role-Based Access Control / RBAC), serta manajemen data pengguna sistem.

#### **User Flow & Langkah Uji**
1. Buka URL `/login`.
2. Masukkan kombinasi email & password terdaftar (contoh user demo: `ceo@demo.com`, `admin@demo.com`, `trader@demo.com`).
3. Verifikasi pengguna berhasil masuk ke Dashboard utama.
4. Sebagai Admin/CEO, buka modul **Users** (`/users`).
5. Klik **"Create User"**, isi Form (Nama, Email, Role, Password), lalu simpan.
6. Coba ubah Role pengguna yang ada melalui tombol **"Change Role"**.
7. Buka modul **Directory** (`/directory`) untuk melihat struktur organisasi dan daftar tim.

#### **Pengujian CRUD & Aksi**
- **Create**: Tambah User Baru dengan pilihan Role (CEO, DIRUT, TRADERS_1, TRAFFIC_HEAD, QC_MANAGER, FINANCE, dll).
- **Read**: List User di `/users` dan `/directory` dengan pencarian nama/role.
- **Update**: Ubah Role User & reset password.
- **Delete/Status**: Nonaktifkan user.

#### **Ekspektasi QA**
- User non-authenticated yang mencoba membuka URL internal langsung di-redirect ke `/login`.
- User tidak dapat memuat Role yang tidak sah.

---

### 2. 📈 Modul Market Price Management (`/market-price`)

#### **Tujuan Fitur**
Mengelola referensi harga pasar batubara harian/mingguan (ICI 1-5, Newcastle, HBA, USD/IDR, mgoUsd) sebagai patokan kalkulasi margin dan peringatan harga di Forecast Sales.

#### **User Flow & Langkah Uji**
1. Buka modul **Market Price** (`/market-price`).
2. Perhatikan Chart Tren Harga dan Card Resume Indeks Harga di bagian atas.
3. Scroll ke area **Form Input Harga** (berada di dekat tabel history).
4. Masukkan tanggal update, sumber data (contoh: `Argus / Coalindo`), catatan, serta nilai indeks (ICI 1-5, HBA, Newcastle).
5. Klik **"Save Market Price"**.
6. Amati Card Resume & Chart di atas langsung memperbarui nilai terbaru secara instan.
7. Periksa tabel **Update History** di bawah form untuk memverifikasi entri baru mencatat: *Waktu Update*, *Actor/Pengubah*, *Source*, *Action*, dan *Notes*.

#### **Pengujian CRUD & Aksi**
- **Create/Append**: Tambah data harga baru via form.
- **Read**: Melihat tren chart, card harga terkini, dan tabel riwayat pembaruan.
- **Cache Invalidation**: Pastikan setelah simpan, data chart tidak `stale` (langsung update).
- **RBAC**: Login sebagai Staff non-marketing → Form input disembunyikan & API mengembalikan HTTP 403.

#### **Ekspektasi QA**
- Field input harga yang dibiarkan kosong **TIDAK** dikonversi menjadi angka `0`.
- Riwayat pembaruan mencatat pengguna yang melakukan perubahan secara transparan.

---

### 3. 🎯 Modul Forecast Sales & Feasibility (`/forecast-sales`)

#### **Tujuan Fitur**
Tempat Trader/Sales membuat pengajuan proyek penjualan baru, menghitung perkiraan P&L, mengelola kandidat supplier batubara, serta mengajukan persetujuan ke Direksi.

#### **User Flow & Langkah Uji**
1. Buka modul **Forecast Sales** (`/forecast-sales`).
2. Klik tombol **"+ New Forecast Project"**.
3. Isi 15 Field Wajib: *Project Name*, *Buyer*, *Forecast Month*, *Quantity*, *POL*, *POD*, *Laycan*, *Sales Price Est*, *Buying Price Est*, *Freight Est*, *Commodity*, *Price Basis*, *Payment Term*, *Surveyor*, *Traders*.
4. Masukkan **Kualitas Batubara (Spec)**: GAR, NAR, TM, IM, TS, Ash, VM, HGI, Size.
5. (Role Executive) Periksa kalkulasi **Rough P&L** (Revenue, Total Cost, Estimated Margin %).
6. Klik **"Save Draft"**.
7. Buka Detail Drawer Forecast proyek tersebut:
   - Tambahkan **Kandidat Supplier** di tab Supplier Candidates (Nama supplier, origin, stok MT, harga USD, spec).
   - Pilih 1 kandidat utama (*Selected Candidate*).
8. Klik tombol **"Submit for Approval"**.

#### **Pengujian CRUD & Aksi**
- **Create**: Tambah Forecast Project draft baru.
- **Read**: List Forecast dengan filter status (Draft, Waiting Approval, Approved, Deal, Failed).
- **Update**: Edit data forecast pada status Draft / Revision Required.
- **Validation Check**: Klik Submit saat field mandatory belum lengkap → Sistem menolak submit dan menyorot field yang kurang.
- **Executive Restriksi**: Login sebagai non-executive → P&L disembunyikan.

#### **Ekspektasi QA**
- Submit gagal jika 15 field wajib belum lengkap.
- Non-executive tidak dapat melihat estimasi Margin/P&L.

---

### 4. 👔 Modul Approval Center (`/approval-center`)

#### **Tujuan Fitur**
Pusat persetujuan eksekutif untuk meninjau pengajuan Forecast Sales dan Perubahan Sumber Batubara (Source Change).

#### **User Flow & Langkah Uji**
1. Login sebagai **CEO**, **DIRUT**, atau **ASS_DIRUT**.
2. Buka modul **Approval Center** (`/approval-center`).
3. Pada tab **Forecast Approvals**, lihat daftar proyek berkategori *Waiting Approval*.
4. Klik **"Review"** pada salah satu proyek.
5. Pilih aksi:
   - **Approve**: Masukkan catatan (opsional) → Klik Approve. Status proyek berubah menjadi `Approved`.
   - **Reject**: Masukkan alasan penolakan → Status proyek berubah menjadi `Rejected`.
   - **Request Revision**: Masukkan instruksi revisi → Status proyek berubah menjadi `Revision`.
6. Coba login sebagai Trader/Staff biasa → Pastikan tidak ada tombol Review dan API approval menolak dengan 403 Forbidden.

#### **Pengujian CRUD & Aksi**
- **Read**: List pengajuan pending approval.
- **Update Status**: Approve / Reject / Request Revision dengan audit trail.
- **Strict Role Gate**: Hanya CEO/DIRUT/ASS_DIRUT yang dapat mengeksekusi.

#### **Ekspektasi QA**
- Pengajuan yang di-approve siap untuk di-generate FCO dan di-convert menjadi Shipment.

---

### 5. 📑 Modul FCO & Summary Report Generation

#### **Tujuan Fitur**
Menghasilkan dokumen resmi *Full Corporate Offer (FCO)* dan *Summary Report* proyek berbasis server-side PDF.

#### **User Flow & Langkah Uji**
1. Buka proyek Forecast Sales yang telah berstatus `Approved` atau `Deal`.
2. Klik tombol **"Generate FCO"**:
   - Sistem memproses pembuatan PDF resmi FCO di server.
   - Nomor FCO otomatis terbuat (contoh: `FCO-2026-XXXXX`).
   - Link PDF FCO aktif dan dokumen tercatat otomatis di **Document Drive**.
3. Klik tombol **"Summary Report"**:
   - Sistem membuat PDF ringkasan proyek lengkap (profil proyek, kandidat supplier, riwayat approval).
   - PDF otomatis terbuka di tab browser baru dan tercatat di Document Drive.

#### **Pengujian CRUD & Aksi**
- **Generate**: Membuat FCO & Summary Report PDF.
- **Revision**: Opsi *Revise FCO* menaikkan versi FCO (`v1`, `v2`, dst).
- **Download**: Membuka link PDF yang tersimpan di storage lokal (`/api/files/...`).

#### **Ekspektasi QA**
- Dokumen PDF hasil generate tersimpan permanen di server dan dapat dicari di Document Drive.

---

### 6. 🚢 Modul Shipment Monitor (`/shipment-monitor`)

#### **Tujuan Fitur**
Pusat operasional memantau pergerakan pengapalan batubara dari Deal hingga Selesai (Closing), mengelola jadwal POL/POD, serta kelengkapan dokumen pengapalan.

#### **User Flow & Langkah Uji**
1. **Convert Deal to Shipment**:
   - Di Forecast Sales (Status Approved), klik **"→ Create Shipment"**.
   - Masukkan Nomor Shipment (contoh: `SHP-2026-001`), pilih Vessel/Barge, lalu simpan.
   - Proyek berubah status menjadi `Deal` dan Shipment baru berstatus `Upcoming` terbuat.
2. Buka modul **Shipment Monitor** (`/shipment-monitor`).
3. Klik Shipment yang baru terbuat untuk membuka **Shipment Detail Drawer**.
4. **Tab Info**: Perbarui data realisasi kuantitas (*Qty Loaded*, *Qty Final*), Laycan, dan status shipment (*Loading*, *In Transit*, *Completed*).
5. **Tab Commercial Ref**: Periksa rincian data pembeli, harga jual, dan spesifikasi batubara yang diturunkan otomatis dari Forecast Sales.

#### **Pengujian CRUD & Aksi**
- **Create**: Convert Forecast Deal ke Shipment baru.
- **Read**: Tabel Shipment Monitor dengan filter status, search buyer/vessel, dan skor kelengkapan (*Completeness Score %*).
- **Update**: Edit data operasional shipment (Vessel, Barge, Laycan, Status).

#### **Ekspektasi QA**
- Saat Shipment terbuat, **11 Dokumen Checklist Requirement (Kode A s/d K)** langsung terbuat secara otomatis di backend.

---

### 7. 📁 Modul Shipment Document Management & Upload (`/shipment-monitor` -> Tab Documents)

#### **Tujuan Fitur**
Tempat mengunggah, mengelola, dan mengunduh berkas fisik pengapalan (LHV, Draught Survey, SKAB, B/L, COA, COW, dll).

#### **User Flow & Langkah Uji**
1. Di Detail Shipment, buka **Tab "Documents"**.
2. Perhatikan 11 baris requirement dokumen (Kode A s/d K).
3. Klik baris dokumen yang ingin diisi (contoh: *Code A - Copy Laporan Hasil Verifikasi*):
4. **Unggah Berkas Binary**:
   - Pilih tab **"Upload File"**.
   - Tarik & lepas (*Drag & Drop*) file PDF/DOCX/JPG (< 20MB) ke area kotak dropzone, ATAU klik area tersebut untuk memilih file dari komputer.
   - Pilih Visibility (`internal`, `public`, atau `critical`).
   - File ter-upload → Status dokumen otomatis menjadi **`completed`**, `Received Date` terisi hari ini, dan indikator resume di atas naik menjadi **`1/11 completed`**.
5. **Multi-File**: Coba upload berkas kedua pada requirement yang sama → Berkas kedua tercatat sebagai `v2`.
6. **Download All ZIP**: Klik tombol **"Download All ZIP"** di kanan atas tab → Sistem mengunduh file `.zip` berisi seluruh dokumen shipment.

#### **Pengujian CRUD & Aksi**
- **Upload (Create File)**: Upload binary file via Drag & Drop / File Picker.
- **Read File**: Klik tombol ikon mata/external link pada file yang ter-upload untuk membuka/mempratinjau file.
- **Delete File**: Klik ikon tempat sampah untuk menghapus attachment file.
- **Update Status**: Mengubah status dokumen manual (Pending, Received, Submitted, Completed, Not Required).

#### **Ekspektasi QA**
- Mengunggah file otomatis membuat dokumen berstatus `completed` dan menaikkan persentase kelengkapan.
- Dokumen berlabel `critical` hanya bisa diunggah/diakses oleh Executive.

---

### 8. 📜 Modul Shipping Instruction / SI (`/shipment-monitor` -> Tab SI)

#### **Tujuan Fitur**
Menerbitkan dokumen *Shipping Instruction (SI)* resmi untuk kapal/tongkang berdasarkan data shipment.

#### **User Flow & Langkah Uji**
1. Pada Detail Shipment, buka **Tab "SI"**.
2. Klik tombol **"Issue Shipping Instruction"**.
3. Verifikasi data terisi otomatis: Nomor SI, Buyer, Supplier, Source, POL, POD, Laycan, Kuantitas, Spec Batubara, dan instruksi dokumen.
4. Jika penerbitan dilakukan kurang dari H-10 Laycan, sistem meminta alasan penerbitan awal (*Early SI Reason*).
5. Klik **"Submit SI"**:
   - Dokumen SI resmi ter-generate dalam bentuk PDF server-side.
   - Status SI tercatat, versi `v1` tersimpan, dan PDF terdaftar di Document Drive.

#### **Pengujian CRUD & Aksi**
- **Issue/Create**: Penerbitan SI baru.
- **Revise**: Penerbitan revisi SI (`v2`, `v3`).
- **Read/Download**: Pratinjau PDF SI.

---

### 9. 🌐 Modul Document Drive (`/document-drive`)

#### **Tujuan Fitur**
Pusat pencarian dan penyimpanan seluruh berkas internal perusahaan, dokumen shipment, serta berkas hasil generate (SI, FCO, Summary Report).

#### **User Flow & Langkah Uji**
1. **Pengujian Internal (Login User)**:
   - Buka `/document-drive`.
   - Gunakan fitur Pencarian (*Search*) berdasarkan nomor SI, nomor FCO, nama buyer, atau nama shipment.
   - Filter berdasarkan Kategori Dokumen (SI, FCO, Shipment Document, Summary Report).
   - Klik berkas untuk mendownload/mempratinjau.
2. **Pengujian Publik (Tanpa Login / Incognito)**:
   - Buka `/document-drive` tanpa login.
   - Verifikasi antarmuka menggunakan **Public Shell** (tanpa menu navigasi rahasia internal).
   - Verifikasi berkas berlabel `critical` **TIDAK MUNCUL** di daftar pencarian publik.

#### **Pengujian CRUD & Aksi**
- **Read/Search**: Mencari dan mengunduh berkas.
- **Security Check**: Verifikasi enkapsulasi berkas kritikal dari publik.

---

### 10. 🔄 Modul Transshipment & SPAL (`/transshipment`)

#### **Tujuan Fitur**
Mengelola proses pemindahan muatan (transshipment), perjanjian SPAL (Surat Perjanjian Layar), jadwal Laytime, dan kalkulasi Demurrage/Despatch.

#### **User Flow & Langkah Uji**
1. Buka modul **Transshipment** (`/transshipment`).
2. Buat entri Transshipment baru atau pilih yang ada.
3. **Tab SPAL**: Masukkan data SPAL (Nomor SPAL, Pemilik Kapal/Shipowner, Freight Rate, Laycan SPAL, Demos/Despatch Rate).
4. **Tab Milestones**: Perbarui status milestone (Arrive POL, NOR Tendered, Commenced Loading, Completed Loading, Commenced Discharge, Completed Discharge).
5. **Tab Laytime**: Masukkan log WWD (*Weather Working Days*) untuk menghitung otomatis total jam Laytime dan kalkulasi Demurrage (+ USD) atau Despatch (- USD).

#### **Pengujian CRUD & Aksi**
- **Create & Update SPAL**: Input dan edit parameter SPAL.
- **Update Milestones**: Catat timestamps operasional kapal.
- **Calculate Laytime**: Perhitungan otomatis klaim demurrage.

---

### 11. ⚖️ Modul Blending Simulator (`/blending`)

#### **Tujuan Fitur**
Simulator pencampuran batubara (*coal blending*) dari berbagai sumber asal tambang untuk mencapai spesifikasi GAR, Moisture, Ash, dan Sulfur yang ditargetkan buyer dengan biaya terhemat.

#### **User Flow & Langkah Uji**
1. Buka modul **Blending Simulator** (`/blending`).
2. Masukkan **Target Spec** yang diinginkan (contoh: Target GAR 4200, Max TS 0.8%, Max Ash 6.0%).
3. Pilih 2 atau lebih Sumber Tambang/Tambang Asal (*Source 1*, *Source 2*).
4. Masukkan rasio persentase pencampuran (contoh: Source A 60%, Source B 40%).
5. Klik **"Calculate Blending"**.
6. Periksa hasil kalkulasi:
   - Spesifikasi akhir hasil pencampuran.
   - Status indikator (Apakah memenuhi target / *Pass* atau melanggar *Max Limit* / *Warning*).
   - Perhitungan rata-rata HPP / harga beli per MT.

#### **Pengujian CRUD & Aksi**
- **Simulate**: Menjalankan kalkulasi simulasi blending.
- **Save Scenario**: Menyimpan skenario blending untuk dihubungkan ke Forecast Sales.

---

### 12. ⛏️ Modul Sources & Sourcing Monitoring (`/sources`)

#### **Tujuan Fitur**
Mengawasi data legalitas IUP-OP tambang asal, ketersediaan stok batubara di pit/jetty, serta pencatatan isu/kendala tambang.

#### **User Flow & Langkah Uji**
1. Buka modul **Sources** (`/sources`).
2. Klik **"+ Add Source"** → Isi Nama Tambang, Lokasi/Region, Legalitas IUP-OP, Kategori Kalori, Perkiraan Stok.
3. Klik detail salah satu Source:
   - Perbarui kapasitas stok terkini.
   - Tambahkan **Source Issue** jika terdapat kendala (contoh: jalan hauler terputus karena hujan, kendala perizinan).
4. Di Shipment Monitor, coba lakukan pengajuan **Source Change** (Perubahan Tambang Asal) jika stok tambang utama tidak mencukupi → Verifikasi alur persetujuan CEO di Approval Center.

---

### 13. 📋 Modul My Tasks & Action Points (`/my-tasks`)

#### **Tujuan Fitur**
Pusat manajemen tugas tim operasional & perdagangan berbasis tampilan Kanban dan List.

#### **User Flow & Langkah Uji**
1. Buka modul **My Tasks** (`/my-tasks`).
2. Klik **"+ New Task"**:
   - Isi Judul Tugas, Deskripsi, Priority (Low, Medium, High, Urgent), Due Date.
   - Pada input **Assignee**, pilih nama pengguna dari **Dropdown User Selection** (UI menampilkan `Nama (Role)`, contoh: `Guntur (CEO)`).
3. Klik **"Create Task"**.
4. **Tampilan Kanban**:
   - Tarik (*Drag and drop*) card task dari kolom `To Do` ke `In Progress`, `Review`, atau `Done`.
   - Pastikan perpindahan status berjalan mulus tanpa error.

---

### 14. 📊 Modul P&L Analytics & Financial Monitor (`/profit-loss`, `/outstanding-payment`)

#### **Tujuan Fitur**
Menyediakan analytics margin keuntungan per shipment/proyek dan pemantauan pembayaran piutang/pembayaran tertunda.

#### **User Flow & Langkah Uji**
1. Login sebagai **Executive** (`CEO`, `DIRUT`, `ASS_DIRUT`, `COO`).
2. Buka modul **Profit & Loss** (`/profit-loss`):
   - Periksa ringkasan Total Revenue, Total Cost, Gross Profit, dan Net Margin.
   - Filter analytics berdasarkan rentang tanggal atau tipe pengapalan (Export vs Domestic).
   - Ekspor laporan P&L via tombol **Export CSV/Report**.
3. Buka modul **Outstanding Payments** (`/outstanding-payment`):
   - Pantau jadwal jatuh tempo pembayaran invoice buyer & pembayaran ke supplier tambang.
   - Perbarui status pembayaran (Pending, Partial, Paid).

---

### 15. 🛡️ Modul Audit Logs (`/audit-logs`)

#### **Tujuan Fitur**
Catatan jejak audit (*audit trail*) yang mencatat setiap aktivitas krusial pengguna di seluruh sistem demi transparansi dan keamanan.

#### **User Flow & Langkah Uji**
1. Login sebagai **CEO** atau **DIRUT**.
2. Buka modul **Audit Logs** (`/audit-logs`).
3. Lakukan pencarian aktivitas berdasarkan:
   - Nama User / Role.
   - Modul Entity (Forecast, Shipment, Market Price, Document, User).
   - Tipe Aksi (Create, Update, Submit, Approve, Delete, Upload).
4. Pastikan setiap aksi kritis yang baru dilakukan (seperti submit forecast, approve, update harga, upload dokumen) tercatat dengan detail timestamp dan IP/user.

---

## 📊 CHECKSHEET SUMMARY QA TESTER

| Modul | Total Test Case | Target Result | Catatan Bug / Confusion |
|---|---|---|---|
| 1. Autentikasi & Users | 4 Case | Pass | |
| 2. Market Price | 7 Case | Pass | |
| 3. Forecast Sales | 5 Case | Pass | |
| 4. Approval Center | 3 Case | Pass | |
| 5. FCO & Summary Report | 3 Case | Pass | |
| 6. Shipment Monitor | 3 Case | Pass | |
| 7. Shipment Documents & Upload | 4 Case | Pass | |
| 8. Shipping Instruction (SI) | 3 Case | Pass | |
| 9. Document Drive | 2 Case | Pass | |
| 10. Transshipment & SPAL | 3 Case | Pass | |
| 11. Blending Simulator | 2 Case | Pass | |
| 12. Sources & Sourcing | 3 Case | Pass | |
| 13. My Tasks & Action Points | 3 Case | Pass | |
| 14. P&L & Payments | 3 Case | Pass | |
| 15. Audit Logs | 2 Case | Pass | |
| **TOTAL** | **50 Test Cases** | **100% Pass** | |

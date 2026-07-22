# Modul: Document Drive

**Route:** `/document-drive`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/document-drive/page.tsx) (329 baris, 14KB)  
**Akses:** Public read-only (jika belum login) atau Full access jika punya permission `document_drive`.

---

## Deskripsi Umum

Document Drive adalah pusat akses (repository) untuk **seluruh dokumen operasional** perusahaan. Dokumen yang di-upload dari modul lain (Forecast Sales, Shipment Monitor, Domestic Handover, Shipping Instruction) akan teragregasi dan dapat dicari melalui halaman ini. Modul ini bertindak layaknya "Google Drive" internal untuk proyek.

---

## Layout

### 1. Header & Access Status
- Title: "Document Drive — All operational documents"
- Subtitle: "Pusat akses dokumen public dari Forecast Sales, Shipment Monitor, Shipping Instruction, dan Domestic Handover."
- **Access Banner:** 
  - Jika belum login: Menampilkan badge "Public read-only mode"
  - Jika tidak ada permission: Menampilkan error banner merah "Akun ini belum memiliki permission Document Drive"
- **Tombol "Refresh"**: Memuat ulang data dari server.

### 2. Summary Cards (Grid 6 kolom)
Kartu ringkasan jumlah dokumen per kategori:

| Card | Warna Tone | Data |
|------|------------|------|
| Total Files | Emerald | Total seluruh dokumen |
| Forecast | Cyan | Dokumen dari proyek Forecast Sales |
| Shipment | Biru | Dokumen dari Shipment Monitor |
| Domestic | Amber | Dokumen dari Domestic Handover |
| SI | Emerald | Dokumen Shipping Instruction |
| Required | Violet | Dokumen wajib/mandatory |

### 3. Filter & Search Bar
Baris filter real-time (dengan debounce 250ms):

| Elemen | Jenis | Detail |
|--------|-------|--------|
| Search | Text Input | Pencarian berdasarkan SI number, shipment, project, buyer, nama file |
| Source | Dropdown | `All Source`, `Forecast Sales`, `Shipment`, `Shipping Instruction`, `Domestic Handover` |
| Group | Dropdown | `All Group`, `Forecast`, `Shipping Instruction`, `Required`, `Additional`, `Critical`, `Domestic` |
| Counter | Text Badge | Menampilkan total dokumen yang sesuai filter |

### 4. Document Table
Tabel daftar dokumen yang responsif (grid cards di mobile, table-row di desktop).

| Kolom | Deskripsi |
|-------|-----------|
| Document | Nama/title dokumen, nama file, ukuran file (format auto KB/MB), icon Critical (jika ada) |
| Owner | Nama PIC yang bertanggung jawab & nama Buyer |
| Source | Badge biru sumber dokumen (Shipment / Forecast / dll) |
| Group | Badge abu-abu kategori grup dokumen |
| Uploaded | Nama uploader & Tanggal upload (format lokal) |
| Action | Tombol **Open** (tab baru) & **Download** |

---

## Daftar Tombol dan Aksi

| Tombol | Lokasi | Aksi |
|--------|--------|------|
| "Refresh" | Header | Fetch ulang data dari `/api/document-drive` |
| "Open" | Row (Action) | Buka URL file dokumen di tab browser baru |
| "Download" | Row (Action) | Download file dokumen langsung |
| Filter dropdowns | Filter Bar | Otomatis me-refresh list tabel |

---

## User Flow

```
User buka /document-drive
  │
  ├── [Sistem mengecek sesi/permission]
  │     ├── Belum login → Read-only mode
  │     └── Login tanpa permission → Blocked
  │
  ├── Menampilkan summary cards (jumlah file)
  │
  ├── User mengetik di Search Bar atau mengubah Dropdown Filter
  │     └── [Debounce 250ms] → GET /api/document-drive?q=...&source=...
  │     └── Tabel dan Summary diperbarui secara real-time
  │
  └── Pada tabel, klik "Open" untuk melihat preview atau "Download" untuk unduh.
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Shipment Monitor | Dokumen checklist (11 jenis) dan invoice yang diupload otomatis masuk ke sini |
| Forecast Sales | Template checklist dokumen dari proyek masuk ke sini |
| Outstanding Payment | Bukti transfer / invoice masuk ke sini |
| API `/api/document-drive` | Endpoint tunggal untuk menarik semua data agregasi dokumen |

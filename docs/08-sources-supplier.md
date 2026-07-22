# Modul: Source dan Supplier

**Route:** `/sources`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/sources/page.tsx) (578 baris, 49KB)  
**Store:** `commercial-store`  
**Akses:** Semua role

---

## Deskripsi Umum

Modul manajemen **supplier/pemasok batubara**. Setiap source menyimpan data lengkap mulai dari spesifikasi kualitas batubara, stok tersedia, lokasi stok, harga FOB, pelabuhan, status KYC/PSI, hingga informasi kontak. Modul ini juga menyediakan alert untuk stok rendah.

---

## Layout

### 1. Tab Bar (3 tab)

| Tab | Fungsi |
|-----|--------|
| Sources | Daftar semua supplier |
| Alerts | Supplier dengan stok di bawah threshold (low stock) |
| Performance | (Placeholder) Performa supplier |

### 2. View Mode Toggle
- Table view (default)
- Card view

### 3. Search dan Filter

| Elemen | Fungsi |
|--------|--------|
| Search | Cari nama supplier, region, calorie range |
| Region | Dropdown filter region (auto-detected dari data) |

### 4. Source Table (Table View)

| Kolom | Deskripsi |
|-------|-----------|
| Name | Nama supplier |
| Region | Wilayah (Kalimantan Timur, dll.) |
| Calorie Range | Rentang kalori (e.g., "4200 GAR") |
| Stock (MT) | Stok tersedia |
| FOB Barge USD | Harga FOB barge (USD) |
| FOB Barge IDR | Harga FOB barge (IDR) |
| Jetty/Port | Pelabuhan/jetty |
| KYC Status | not_started / in_progress / completed |
| PSI Status | not_started / in_progress / completed |

### 5. Source Cards (Card View)
Tampilan card per supplier dengan ringkasan visual:
- Nama, region, calorie range
- Stock bar indicator
- Coal spec ringkas
- Status badges (KYC, PSI)

### 6. Low Stock Alerts (Tab Alerts)
Menampilkan source yang `stock_available <= min_stock_alert`:
- Nama supplier
- Stock available vs threshold
- Alert level

### 7. Add/Edit Form (Modal)

| Field | Jenis | Detail |
|-------|-------|--------|
| Name | Text | Nama supplier |
| Region | Text | Wilayah operasi |
| Calorie Range | Text | Rentang kalori |
| **Coal Spec** | | |
| - GAR | Number | Gross As Received |
| - TS (%) | Number | Total Sulphur |
| - ASH (%) | Number | Ash content |
| - TM (%) | Number | Total Moisture |
| - IM (%) | Number | Inherent Moisture |
| - FC (%) | Number | Fixed Carbon |
| - ADB | Number | Air Dried Basis |
| - NAR | Number | Net As Received |
| Stock Available | Number | Stok saat ini (MT) |
| Min Stock Alert | Number | Threshold alert |
| **Stock Locations** | Multi-entry | |
| - Location Name | Text | Nama lokasi penyimpanan |
| - Quantity | Number | Stok di lokasi ini |
| - Condition | Text | Kondisi stok |
| FOB Barge Only | Toggle | Hanya FOB barge |
| Requires Transshipment | Toggle | Perlu transshipment |
| Price Linked Index | Text | Index harga terkait |
| FOB Barge Price USD | Number | Harga USD |
| FOB Barge Price IDR | Number | Harga IDR |
| Jetty/Port | Text | Pelabuhan |
| Anchorage | Text | Tempat berlabuh |
| KYC Status | Dropdown | not_started / in_progress / completed |
| PSI Status | Dropdown | not_started / in_progress / completed |
| Contact Person | Text | Nama kontak |
| Phone | Text | Telepon |
| Email | Text | Email |
| IUP Number | Text | Nomor IUP (Izin Usaha Pertambangan) |
| Contract Type | Text | Jenis kontrak |
| Notes | Textarea | Catatan |

**Stock Locations** adalah input multi-entry (dynamic rows):
- Tombol "Add Location" menambah baris
- Setiap baris: nama, kuantitas, kondisi
- Total otomatis dihitung

### 8. Report Modal
Export data supplier ke laporan.

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "Add Source" | Buka form tambah supplier |
| Edit (per row/card) | Buka form edit |
| Delete (per row/card) | Hapus supplier (konfirmasi) |
| "Download Report" | Export laporan |
| Tab buttons | Switch tab (Sources/Alerts/Performance) |
| View toggle | Switch table/card view |
| Search + Region filter | Filter data |
| "Add Location" (form) | Tambah baris stock location |

---

## User Flow

```
User buka /sources
  │
  ├── Tab "Sources" (default)
  │     ├── Lihat daftar supplier (table/card)
  │     ├── Search / filter region
  │     ├── "Add Source" → form → save
  │     ├── Edit source → form → save
  │     └── Delete source
  │
  ├── Tab "Alerts"
  │     └── Lihat supplier dengan stok rendah
  │
  └── Download Report
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Blending | "Load from Source" mengambil spec dari source |
| Shipment Monitor | Source assignment per shipment |
| Dashboard | Stock Inventory widget, Blocker: Source category |
| Forecast Sales | Supplier candidates per project |
| Market Price | FOB Barge Price vs market index comparison |
| Quality | Source estimate spec |

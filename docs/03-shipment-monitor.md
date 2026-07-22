# Modul: Shipment Monitor

**Route:** `/shipment-monitor`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/shipment-monitor/page.tsx) (4700 baris, 400KB)  
**Store:** `commercial-store`, `daily-delivery-store`  
**Akses:** Semua role (write berdasarkan RBAC via `canWriteModuleForRole`)  
**Dependencies:** Recharts, jsPDF, AI Agent, Pagination

---

## Deskripsi Umum

**Modul terbesar di seluruh aplikasi (400KB, 4700 baris).** Shipment Monitor adalah pusat pengelolaan pengiriman batubara yang mencakup seluruh siklus hidup shipment — dari perencanaan hingga penyelesaian. Modul ini menggabungkan tracking operasional, manajemen dokumen, financial analysis, dan quality monitoring dalam satu interface.

---

## Layout

### 1. Header
- Title: "Shipment Monitor"
- Badge real-time status (jumlah shipment aktif)
- Tombol action di kanan

### 2. Tab Bar Utama (7 tab)

| Tab | Filter | Deskripsi |
|-----|--------|-----------|
| All | Semua status | Seluruh shipment |
| Upcoming | status = upcoming | Shipment yang belum dimulai |
| Loading | status = loading | Sedang proses pemuatan |
| In Transit | status = in_transit | Dalam perjalanan |
| Completed | status = completed | Sudah selesai |
| Cancelled | status = cancelled | Dibatalkan |
| Daily Delivery | Tab terpisah | Log pengiriman harian (store berbeda) |

### 3. Search dan Filter Bar

| Elemen | Jenis | Fungsi |
|--------|-------|--------|
| Search | Text Input | Cari berdasarkan buyer, vessel, barge, project |
| Region Filter | Dropdown | Filter berdasarkan wilayah |
| Year Filter | Dropdown | Filter berdasarkan tahun |

### 4. Summary Cards (Grid)
Metrik per status yang menampilkan:
- Total count per status
- Total volume per status
- Total value per status

### 5. Shipment Data Table (Tabel Utama)

| Kolom | Deskripsi |
|-------|-----------|
| No | Nomor urut |
| Shipment No / Project Name | ID atau nama proyek |
| Status | Badge berwarna (Upcoming/Loading/In Transit/Completed/Cancelled) |
| Buyer | Nama pembeli |
| Vessel/Barge | Nama kapal dan tongkang |
| Loading Port | Pelabuhan muat |
| Qty Plan | Kuantitas yang direncanakan (MT) |
| Qty Loaded | Kuantitas yang dimuat (MT) |
| BL Date | Tanggal Bill of Lading |
| Laycan | Periode laycan |
| Source | Sumber batubara |
| Sell Price | Harga jual per MT (USD) |
| Buy Price | Harga beli per MT (USD) |
| Margin | Selisih sell - buy per MT |
| Actions | Edit, Delete, View Detail |

- **Pagination Controls**: Page, Page Size (10/25/50/100), Navigasi
- **Setiap baris bisa diklik** → membuka Detail Panel

### 6. Shipment Detail Panel
Saat baris diklik, panel detail terbuka dengan sub-tab:

#### 6a. Info Tab
Detail lengkap shipment:
- Buyer info (nama, negara)
- Vessel name, barge name
- Port of loading, port of discharge
- Laycan dates, ETA, ETD
- BL Date, quantity plan/loaded
- Pricing: sell price, buy price, freight, margin
- Coal spec: GAR, TS, ASH, TM
- Status tracking

#### 6b. Documents Tab
Checklist 11 jenis dokumen wajib:

| Kode | Dokumen |
|------|---------|
| a | Copy Laporan Hasil Verifikasi |
| b | 1 Original Draught Survey Report |
| c | 1 Original Surat Keterangan Asal Barang |
| d | 1 Original Surat Kebenaran Dokumen |
| e | 1 Original Surat Kirim Barang |
| f | 1 Original Bukti Bayar Royalti |
| g | 3/3 Original Bill of Lading |
| h | 3/3 Copies Non Negotiable Bill of Lading |
| i | Certificate of Sampling and Analysis |
| j | Certificate of Weight |
| k | Certificate of Draught Survey Report |

Per dokumen:
- Status: `Pending | Received | Submitted | Completed | Not Required`
- Tombol **Upload** (accept: image, PDF, DOCX)
- Tombol **View/Download** jika sudah di-upload
- PIC/Owner assignment
- Notes field

#### 6c. Source dan Barge Management
- Source assignment dan perubahan (change log)
- Barge assignment dan change request
- History log perubahan

#### 6d. Issues Log
- Daftar masalah/issue per shipment
- Add issue, resolve issue
- Severity: Critical, Warning, Info

#### 6e. Domestic Handover Tracking
Tracking handover dokumen untuk shipment domestik. 5 jalur tracking:

| Track | Alur |
|-------|------|
| SKAB | Supplier → Operation → Traffic → Finance |
| DSR | Supplier → Operation → Traffic |
| BL/CM | Operation → Traffic → Finance |
| COA POL | Surveyor → Traffic → Finance |
| COA POD | Quality → Finance → Vendor → Approval DT → Paid |

Setiap track menampilkan:
- Status setiap stage (tanggal received/sent)
- **Stuck indicator** — Di mana proses terhenti
- **Aging days** — Berapa lama stuck

#### 6f. Financial Tab
Detail keuangan per shipment:
- Sell Price (USD/MT)
- Buy Price (USD/MT)
- Freight rate
- Royalty cost
- Tax/export cost
- Survey cost
- Finance cost
- Total cost per MT
- Margin per MT
- Total margin

#### 6g. Shipping Instruction
- Generate Shipping Instruction
- Template-based
- Save/export

### 7. Daily Delivery Sub-Tab

| Kolom | Deskripsi |
|-------|-----------|
| BL Date | Tanggal BL |
| Buyer | Pembeli |
| Supplier | Pemasok |
| Shipping Term | FOB/CIF/CFR |
| Area | Wilayah |
| Flow | Domestic/Export |
| BL Qty | Kuantitas BL |
| Invoice Amount | Nilai invoice |
| Product | Jenis produk |
| Project | Nama proyek |

- Tombol: Add, Edit, Delete
- Pagination terpisah
- Data dari `daily-delivery-store`

---

## Daftar Tombol dan Aksi

| Tombol | Lokasi | Aksi |
|--------|--------|------|
| "Add Shipment" | Header | Buka form tambah shipment |
| "Edit" | Row action / Detail | Edit shipment |
| "Delete" | Row action | Hapus shipment (konfirmasi) |
| "Download Report" | Header | Buka ReportModal export |
| "AI Analysis" | Detail panel | Risk assessment AI |
| "Upload" | Document tab | Upload dokumen per checklist item |
| "View/Download" | Document tab | Lihat/unduh dokumen |
| "Save" | Detail panel | Simpan perubahan |
| Tab buttons | Tab bar | Filter status |
| Search/Filter | Filter bar | Filter data |
| Pagination | Bottom | Navigate halaman |

---

## Grafik / Chart (Recharts)

| Jenis | Komponen | Data |
|-------|----------|------|
| AreaChart | Volume trend | Volume per bulan (area fill) |
| BarChart | Status breakdown | Volume per status (bar) |
| PieChart | Distribusi | Distribusi status shipment (pie) |
| LineChart | Margin trend | Margin per MT trend line |

---

## Helper Functions (Kalkulasi)

| Function | Fungsi |
|----------|--------|
| `shipmentQty(s)` | Ambil qty: `quantity_loaded ?? qty_plan ?? qty_cob` |
| `shipmentSellPrice(s)` | Ambil sell: `sales_price ?? sp ?? harga_actual_fob_mv` |
| `shipmentBuyPrice(s)` | Ambil buy: `buying_price ?? harga_actual_fob ?? hpb` |
| `shipmentCostPerMt(s)` | Total cost: buy + freight + royalty + tax + survey + finance |
| `shipmentMargin(s)` | Margin: sell - buy (or manual margin_mt) |
| `getDomesticHandoverSummary(d)` | Hitung status handover 5 track |

---

## User Flow

```
User buka /shipment-monitor
  │
  ├── Melihat summary cards (count/volume/value per status)
  ├── Filter via tab / search / region / year
  │
  ├── Klik baris shipment → Detail Panel
  │     ├── Info tab: lihat detail lengkap
  │     ├── Documents tab: upload/manage 11 jenis dokumen
  │     ├── Source/Barge: kelola assignment
  │     ├── Issues: log masalah
  │     ├── Domestic Handover: track 5 jalur dokumen
  │     ├── Financial: review margin dan biaya
  │     └── SI: generate shipping instruction
  │
  ├── Tab "Daily Delivery" → CRUD log pengiriman harian
  │
  └── Download Report → ReportModal
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Dashboard | Shipment tables, document aging alerts, blocker control tower |
| Market Price | Referensi harga untuk pricing |
| Sales Monitor | Deal → Shipment linking |
| Outstanding Payment | Payment linked to shipment, upload invoice/proof |
| Quality | Quality result linked to cargo/shipment |
| Sources | Source assignment per shipment |
| Forecast Sales | Project → Shipment linking |
| Document Drive | Dokumen tersimpan di drive |
| Compliance | Dokumen regulasi |
| Blending | Blending scenario untuk spec optimization |

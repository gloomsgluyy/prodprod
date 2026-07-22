# Modul: Sales Monitor

**Route:** `/sales-monitor`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/sales-monitor/page.tsx) (789 baris, 48KB)  
**Store:** `commercial-store`  
**Akses:** Semua role  
**Dependencies:** Recharts (opsional), ReportModal

---

## Deskripsi Umum

Sales Monitor mengelola **deal/transaksi penjualan** secara project-based. Setiap deal melacak buyer, komoditas, kuantitas, harga, dan status melalui pipeline penjualan. Modul ini menyediakan view per-project yang menggabungkan data deal dengan data shipment terkait.

---

## Layout

### 1. Header
- Title: "Sales Monitor"
- Tombol "New Deal" di kanan

### 2. Status Tabs (Pipeline View)

| Tab | Status | Warna |
|-----|--------|-------|
| All | Semua | Default |
| Waiting Approval | waiting_approval | #f59e0b (Amber) |
| Waiting Buyer | waiting_buyer | #6b7280 (Gray) |
| Offer Submitted | offer_submitted | #3b82f6 (Biru) |
| Confirmed | confirmed | #10b981 (Emerald) |
| In Transit | in_transit | #6366f1 (Indigo) |
| Completed | completed | #059669 (Green) |
| Cancelled | cancelled | #ef4444 (Red) |
| Rejected | rejected | #f43f5e (Rose) |

### 3. Search Bar
Pencarian berdasarkan project name, buyer, deal number.

### 4. Summary Cards
- Total deals
- Total value (USD)
- Average price per MT

### 5. Deals Table

| Kolom | Deskripsi |
|-------|-----------|
| Project Name | Nama proyek/deal |
| Buyer | Nama pembeli |
| Country | Negara tujuan |
| Quantity | Kuantitas (MT) |
| Price/MT | Harga per MT (USD) |
| Total Value | Qty × Price |
| Status | Badge berwarna |
| Actions | View, Edit, Delete |

### 6. Deal Detail Modal
Menampilkan detail lengkap deal saat diklik:
- Info buyer, commodity, country, segment
- Pricing: price/MT, total value
- Coal spec: GAR, TS, ASH, TM
- Timeline status
- Linked shipments

### 7. Add/Edit Form (Modal)

| Field | Jenis | Detail |
|-------|-------|--------|
| Project Name | Text | Nama proyek |
| Buyer | Text | Nama pembeli |
| Segment | Dropdown | Local/Export |
| Country | Dropdown | Daftar negara (COUNTRIES constant) |
| Commodity | Text | Jenis komoditas |
| Quantity | Number | Kuantitas MT |
| Price per MT | Number | Harga USD/MT |
| Deal Number | Text | Nomor deal |
| Type | Text | Tipe deal |
| Status | Dropdown | Pipeline status |
| Coal Spec | Multi-input | GAR, TS, ASH, TM (COAL_SPEC_FIELDS) |
| Notes | Textarea | Catatan tambahan |

### 8. Report Modal
Export laporan deal/sales ke format yang dipilih.

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "New Deal" | Buka form tambah deal baru |
| "Edit" (per row) | Buka form edit deal |
| "Delete" (per row) | Hapus deal (konfirmasi) |
| "View" (per row) | Buka detail modal |
| "Download Report" | Export laporan |
| Tab buttons | Filter status pipeline |
| Search | Filter berdasarkan teks |

---

## Helper Functions

| Function | Fungsi |
|----------|--------|
| `parseLooseNumber(value)` | Parse angka dari berbagai format (Rp, $, koma/titik) |
| `extractProjectName(raw)` | Extract nama proyek dari teks bebas |
| `cleanText(v)` | Bersihkan whitespace |
| `normalizeKey(v)` | Uppercase + clean untuk matching |

---

## User Flow

```
User buka /sales-monitor
  │
  ├── Lihat ringkasan deal per status (tabs)
  ├── Search deal/project
  │
  ├── Klik "New Deal" → isi form → save
  │
  ├── Klik deal di tabel → Detail Modal
  │     ├── Lihat info lengkap
  │     ├── Lihat linked shipments
  │     └── Edit / Delete
  │
  └── Download Report → ReportModal
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Dashboard | Volume per month chart link |
| Shipment Monitor | Deal → Shipment linkage |
| Market Price | Harga referensi |
| Forecast Sales | Project-based deal tracking |
| Approval Inbox | Deals waiting approval |

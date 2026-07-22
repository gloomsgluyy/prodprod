# Modul: Forecast Sales / Projects

**Route:** `/projects` dan `/forecast-sales` (re-export)  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/projects/page.tsx) (3275 baris, 183KB)  
**Store:** `commercial-store`  
**Akses:** Semua role (approval hanya CEO/DIRUT/ASS_DIRUT)  
**Dependencies:** jsPDF, useSearchParams

---

## Deskripsi Umum

Modul manajemen proyek penjualan **end-to-end** dengan workflow approval berjenjang. Modul terbesar kedua setelah Shipment Monitor. Mencakup pembuatan forecast, approval process, FCO generation, document checklist, dan tracking revisi.

**Note:** `/forecast-sales` adalah alias — `export { default } from "../projects/page"`

---

## Layout

### 1. Header
- Title: "Forecast Sales" dengan icon FolderKanban
- Tombol "New Project"

### 2. Filter dan Search
- Search bar
- Status filter
- Year filter

### 3. Project Cards/List
Daftar proyek dalam format card, masing-masing menampilkan:

| Field | Detail |
|-------|--------|
| Project Name | Nama proyek |
| Buyer | Nama pembeli |
| Segment | Local / Export |
| Status | Badge berwarna (8 status) |
| Year | Tahun proyek |
| Laycan | Periode laycan |
| Shipping Term | FOB/CIF/CFR |
| Shipment Count | Jumlah shipment terkait |
| Volume | Total MT |
| Revenue | Total revenue USD |
| Gross Profit | Total profit |
| Source Kind | `master` (dari projects store) / `derived` (dari shipment grouping) |

**Status yang tersedia:**

| Status | Label | Warna |
|--------|-------|-------|
| draft | Draft | abu-abu |
| waiting_approval | Waiting Approval | amber |
| revision_requested | Revision Requested | orange |
| approved | Approved | emerald |
| rejected | Rejected | merah |
| upcoming | Upcoming | biru |
| ongoing | Ongoing | indigo |
| completed | Completed | hijau tua |
| cancelled | Cancelled | merah |

### 4. Project Detail Panel
Panel detail saat project dipilih:

#### 4a. Info Umum
- Semua field project: buyer, segment, commodity, quantity, laycan, port, spec, dll.

#### 4b. Supplier Candidates
- Daftar calon supplier untuk project ini
- Nama, region, harga, stok

#### 4c. Shipment List
- Daftar shipment yang terkait project
- Link ke Shipment Monitor

#### 4d. Document Checklist (Template)
Template checklist per project:

| Field per Item | Detail |
|----------------|--------|
| Code | Kode dokumen (opsional) |
| Label | Nama dokumen |
| Owner | PIC yang bertanggung jawab |
| Done | Status (checkbox) |
| Required | Wajib / opsional |
| File | Upload file |
| Uploaded At | Timestamp upload |
| Uploaded By | Nama uploader |

Tombol **Upload** per checklist item, tombol **View/Download** untuk file yang sudah ada.

#### 4e. Approval History
Timeline approval:

| Field | Detail |
|-------|--------|
| Status | approved / rejected / revision_requested |
| Comment | Catatan approver |
| User Name | Nama approver |
| Created At | Timestamp |

#### 4f. Revision History
Riwayat perubahan field:

| Field | Detail |
|-------|--------|
| Changes | Array: field name, label, old value, new value |
| Reason | Alasan revisi |
| Status at Change | Status saat perubahan |
| User Name | Nama editor |
| Created At | Timestamp |

#### 4g. FCO (Formal Confirmation Order)

| Field | Detail |
|-------|--------|
| Version | Nomor versi FCO |
| Action | generate / regenerate |
| FCO Number | Nomor FCO otomatis |
| Generated At | Timestamp |

Tombol **"Generate FCO"** → buat PDF via jsPDF.

### 5. Form Create/Edit Project

| Field | Jenis | Keterangan |
|-------|-------|------------|
| Name | Text | Nama proyek |
| Segment | Dropdown | Local / Export |
| Buyer | Text | Nama pembeli |
| Buyer Country | Dropdown | Negara pembeli |
| Commodity | Text | Jenis komoditas |
| Quantity | Number | Kuantitas (MT) |
| Laycan Start | Date | Tanggal mulai laycan |
| Laycan End | Date | Tanggal akhir laycan |
| Port of Loading | Text | Pelabuhan muat |
| Sales Term | Dropdown | FOB / CIF / CFR |
| Target Selling Price | Number | Harga target (USD/MT) |
| Price Basis | Text | Basis harga (e.g., ICI 4 - $2.50) |
| Payment Terms | Text | Ketentuan pembayaran |
| Surveyor | Text | Nama surveyor |
| GAR | Number | Target GAR |
| TM | Number | Target TM (%) |
| TS | Number | Target TS (%) |
| ASH | Number | Target ASH (%) |
| VM | Number | Volatile Matter (%) |
| Size | Text | Ukuran batubara |
| Supplier Candidates | Textarea | Daftar calon supplier |
| Below Spec Reason | Textarea | Alasan jika di bawah spec |
| Blending Scenario | Textarea | Skenario blending |
| Template Type | Dropdown | Jenis template checklist |
| Template Checklist | Textarea | Custom checklist items |

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "New Project" | Buka form buat proyek baru |
| "Edit" | Edit proyek |
| "Delete" | Hapus proyek |
| "Approve" | Approve proyek (status → approved) |
| "Reject" | Reject proyek (status → rejected) |
| "Request Revision" | Minta revisi (status → revision_requested) |
| "Generate FCO" | Generate PDF Formal Confirmation Order via jsPDF |
| "Upload Document" | Upload file per checklist item |
| "Download PDF" | Download FCO atau report |
| Status tab buttons | Filter berdasarkan status |
| Search | Filter teks |

---

## User Flow

```
User buka /forecast-sales (atau /projects)
  │
  ├── Lihat daftar proyek (cards/list)
  ├── Filter status / search
  │
  ├── "New Project" → isi form lengkap → Save
  │     └── Status awal = "draft"
  │
  ├── Submit untuk approval → status = "waiting_approval"
  │
  ├── [Approver] Klik proyek → Review detail
  │     ├── "Approve" → status = "approved"
  │     ├── "Reject" → status = "rejected"
  │     └── "Request Revision" → status = "revision_requested"
  │           └── User revisi → re-submit
  │
  ├── Setelah approved:
  │     ├── Link ke shipment (create shipment dari project)
  │     ├── "Generate FCO" → PDF document
  │     └── Manage document checklist
  │
  └── Track via:
        ├── Approval History (timeline)
        ├── Revision History (changes log)
        └── FCO History (version tracking)
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Dashboard | Waiting Approval widget, AI Urgency Panel |
| Shipment Monitor | Project → Shipment linkage |
| Sales Monitor | Deal tracking per project |
| Sources | Supplier candidates reference |
| Blending | Blending scenario per project |
| Approval Inbox | Approval queue |
| Market Price | Target price reference |

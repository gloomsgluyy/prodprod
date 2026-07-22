# Modul: Outstanding Payment

**Route:** `/outstanding-payment`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/outstanding-payment/page.tsx) (428 baris, 34KB)  
**Store:** `outstanding-payment-store`, `commercial-store`  
**Akses:** Semua role

---

## Deskripsi Umum

Modul untuk mengelola dan melacak **pembayaran uang muka (DP/Down Payment)** yang masih outstanding. Setiap record payment bisa di-link ke shipment, dan mendukung upload bukti invoice dan payment proof yang tersimpan di document system shipment.

---

## Layout

### 1. Header Card
- Icon CreditCard (hijau emerald)
- Border kiri hijau (emerald-500)
- Title: "Outstanding Payment"
- Subtitle: "Manage and track outstanding advance payments & DP"
- Tombol **"New Payment Record"** di kanan

### 2. Summary Cards (Grid 3-4 kolom)

| Card | Icon | Warna | Data |
|------|------|-------|------|
| Total Records | CreditCard | Emerald | `outstandingPayments.length` |
| Total Qty (MT) | FileText | Blue | `totalQty / 1000` → format K |
| Total DP (IDR) | Calculator | Amber | `totalDp / 1000000000` → format B (Miliar) |

### 3. Tab Filter

| Tab | Filter |
|-----|--------|
| All | Semua status |
| Pending | status = "pending" |
| Partial | status = "partial" |
| Paid | status = "paid" |

### 4. Search Bar
Pencarian berdasarkan perusahaan atau kode batu.

### 5. Data Table

| Kolom | Deskripsi |
|-------|-----------|
| Tahun | Badge tahun (e.g., 2026) |
| Shipment | Nama shipment terkait (atau ID) |
| Perusahaan | Nama perusahaan (bold) |
| Invoice | Nomor invoice (mono font) |
| Kode Batu | Kode batu (mono font) |
| Price Incl PPh | Harga termasuk PPh (Rp, mono) |
| Qty (MT) | Kuantitas (biru, bold) |
| Total DP (IDR) | Total DP (hijau, bold) |
| Start Date (Calc) | Calculation date |
| DP To Shipment | Tanggal DP ke shipment |
| Timeframe (Days) | Durasi/catatan timeframe |
| Evidence | Link Invoice + Payment Proof (ExternalLink) |
| Status | Badge: PAID (hijau), PARTIAL (kuning), PENDING (merah) |
| Actions | Edit (icon) + Delete (icon merah) |

### 6. Evidence Column (Detail)
- Jika ada `shipment_id` + `invoice_document_id`: link "Invoice" → `/api/shipments/{id}/documents/{docId}`
- Jika ada `payment_proof_document_id`: link "Proof" → same pattern
- Jika tidak ada: teks "Invoice -" / "Proof -"

### 7. Pagination Controls
- Page, Page Size selector, Navigation

### 8. Form Modal (Add/Edit)

| Field | Jenis | Validasi |
|-------|-------|----------|
| Linked Shipment | Dropdown (max 300 shipments) | Opsional |
| Invoice Number | Text | - |
| Perusahaan | Text | **Required** |
| Kode Batu | Text | Opsional |
| Price Incl PPh (Rp) | Number | - |
| Quantity (MT) | Number | - |
| Total DP (Rp) | Number | - |
| Tahun | Number | Default 2026 |
| Calculation Date | Date | - |
| DP to Shipment Date | Date | - |
| Due Date | Date | - |
| Dispute Status | Text | Placeholder: "none / disputed / under review" |
| Timeframe (Days/Notes) | Text | - |
| Status | Dropdown | pending / partial / paid |
| Notes | Text | - |
| Invoice Document | File Upload | PDF, DOCX, image |
| Payment Proof | File Upload | PDF, DOCX, image |

**Upload Logic:**
- File di-upload via `POST /api/shipments/{shipmentId}/documents`
- `documentGroup`: "additional"
- `requirementCode`: "PAYMENT_INVOICE" atau "PAYMENT_PROOF"
- Tombol upload hanya aktif jika shipment sudah di-link

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "New Payment Record" | Buka form modal (mode add) |
| Edit (icon per row) | Buka form modal (mode edit, pre-fill) |
| Delete (icon per row) | Hapus record (confirm dialog) |
| "Save Record" | POST/PUT ke store → sync ke backend |
| "Cancel" | Tutup modal tanpa simpan |
| Tab buttons | Filter status |
| Search input | Filter perusahaan/kode batu |
| Invoice file input | Upload invoice document |
| Proof file input | Upload payment proof |
| Invoice link | Buka dokumen invoice di tab baru |
| Proof link | Buka dokumen proof di tab baru |

---

## User Flow

```
User buka /outstanding-payment
  │
  ├── Lihat summary (total records, qty, DP)
  ├── Filter tab (All/Pending/Partial/Paid) + search
  │
  ├── "New Payment Record"
  │     ├── Isi form (perusahaan wajib)
  │     ├── Link ke shipment (opsional)
  │     ├── Upload invoice document (opsional, perlu linked shipment)
  │     ├── Upload payment proof (opsional, perlu linked shipment)
  │     └── "Save Record"
  │
  ├── Edit record → form pre-filled → save
  │
  ├── Delete record → confirm → hapus
  │
  └── Update status: Pending → Partial → Paid
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Shipment Monitor | Linked shipment, dokumen tersimpan di shipment documents |
| Dashboard | Blocker: Payment category alerts |
| Document Drive | Dokumen invoice/proof tersimpan |

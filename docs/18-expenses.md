# Modul: Expenses (Purchase Requests)

**Route:** `/purchase-requests`  
**File:** `src/app/purchase-requests/page.tsx`  
**Store:** `purchase-store`

---

## Deskripsi Umum

Sistem pengajuan dan persetujuan (approval workflow) untuk semua pembelian operasional, peralatan, dan kebutuhan kantor lainnya. Semua request yang disetujui akan dihitung sebagai pengeluaran (Expense).

---

## Layout

### 1. Header & Controls
- Title: "Expenses & Purchase Requests"
- Subtitle: "Intelligent tracking of expenses with automatic anomaly detection."
- Tombol **New Request**

### 2. Search & Filter Bar
- **Filter Status Dropdown**: All, Draft, Submitted, Approved, Rejected.
- **Filter Kategori**: Peralatan, ATK, Vendor Fee, dll.
- **Search Input**: Cari berdasarkan deskripsi atau nama supplier.

### 3. Data Table
Tabel daftar pengajuan pembelian:

| Kolom | Deskripsi |
|-------|-----------|
| Item / Description | Deskripsi barang/jasa |
| Category | Badge kategori pengeluaran |
| Amount | Nominal harga (Rp) |
| Priority | Badge prioritas |
| Status | Badge status approval (Draft, Submitted, Approved) |
| Requested By | Nama pemohon (Staff) |
| Image/Invoice | Thumbnail gambar nota (jika ada) |
| Action | Tombol Submit, Approve, Reject (tergantung Role) |

### 4. Interactive Dialog: Add New Expense
| Field | Jenis |
|-------|-------|
| Description | Text Area |
| Amount | Number |
| Category | Dropdown |
| Supplier | Text |
| Image Upload | File input (untuk mengupload foto nota pembayaran/invoice) |

### 5. Interactive Dialog: Expense Detail & Approval
Saat klik pada tabel, dialog detail muncul:
- Menampilkan seluruh detail form di atas (read-only).
- **Image Preview**: Menampilkan foto invoice dalam ukuran besar (bisa di-zoom).
- **Approval Actions (Bagi Manager)**: Terdapat tombol besar `Approve` dan `Reject`.

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **New Request** | Buka form pembuatan Expense baru |
| **Submit** | Merubah status dari Draft menjadi Submitted (naik ke atasan) |
| **Approve** (Manager) | Menyetujui request. Dana otomatis tercatat di P&L sebagai Expense. |
| **Reject** (Manager) | Menolak request pembelian. |
| **Upload Image** | Dialog popup untuk mengunggah foto nota fisik. |

---

## User Flow

```
User buka /purchase-requests
  │
  ├── Staff klik "New Request", mengisi form beli ATK (Rp 500,000) dan upload foto nota.
  │     └── Disimpan sebagai status "Draft".
  │
  ├── Staff klik "Submit" pada baris tabel tersebut.
  │     └── Status berubah menjadi "Submitted".
  │
  ├── Manager (Executive) membuka halaman yang sama.
  │     └── Mengklik baris pengajuan tadi, Dialog Detail terbuka.
  │     └── Manager melihat foto nota di dialog.
  │
  └── Manager klik "Approve". 
        └── Status menjadi "Approved" dan data Rp 500,000 masuk ke grafik Modul P&L.
```

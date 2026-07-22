# Modul: Partners & Directory

**Route:** `/directory`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/directory/page.tsx) dan [`client.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/directory/client.tsx) (451 baris)  
**Store:** `directory-store`

---

## Deskripsi Umum

Modul **Partners & Directory** adalah pusat basis data (CRM) untuk seluruh mitra bisnis perusahaan. Ini mencakup Buyer, Supplier, Vendor, Surveyor, Agen, dan Entitas lainnya. 

---

## Layout

### 1. Header & Controls
- Title: "Unified Directory"
- Subtitle: "Manage global buyers, mining vendors, and fleet owners."
- Tombol **Add Partner** (Icon Plus)

### 2. Search & Filter Bar
- **Tab Filter**: `All`, `Buyer`, `Vendor`, `Fleet` (berbentuk pill/toggle buttons).
- **Search Input**: Cari berdasarkan nama perusahaan (entity) atau nama PIC.

### 3. Directory Cards Grid (Tampilan Utama)
Data mitra ditampilkan dalam bentuk Card Grid. Masing-masing card menampilkan:
- **Header**: Icon (Users/Building/Truck), Nama Perusahaan, Badge Tipe (buyer/vendor/fleet), Indicator Status (Active/Inactive dot hijau/kuning).
- **Detail Info**: Region, Nama PIC, Email, Phone, dan Fleet Size (jika tipe fleet).
- **Legalitas Box**: Dokumen legal (nama dokumen, tanggal kedaluwarsa). Menampilkan badge status legalitas dengan warna (merah jika expired, kuning jika mendekati, hijau jika valid).
- **AI Due Diligence Box**: Hasil analisa AI terkait risiko finansial atau operasional dari perusahaan tersebut (Risk Level: Low, Medium, High).
- **Actions Bar**: Tombol Edit (pensil) dan Delete (tempat sampah).

### 4. Form Dialog (Add / Edit Partner)
Saat tombol **Add Partner** atau **Edit** diklik, modal muncul dengan form berikut:

| Field | Jenis | Detail |
|-------|-------|--------|
| Tipe Mitra | Radio/Select | Buyer / Vendor / Fleet |
| Status | Radio/Select | Active / Inactive |
| Nama Perusahaan | Text | Wajib diisi |
| Region/Lokasi | Text | |
| Nama PIC | Text | Wajib diisi |
| Email & Phone | Text | |
| NPWP & No. Rekening | Text | Informasi finansial perusahaan |

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Add Partner** | Membuka Form Dialog untuk entri baru |
| **Edit** (Icon Pensil) | Membuka Form Dialog dengan data terisi untuk diedit |
| **Delete** (Icon Trash) | Konfirmasi penghapusan data dari directory |
| **Run Due Diligence** | Menjalankan proses AI (Groq) untuk menganalisis risiko dari perusahaan terkait (skor & rekomendasi) |

---

## User Flow

```
User buka /directory
  │
  ├── Lihat daftar semua partner dalam bentuk Cards
  │
  ├── Klik filter "Buyer" atau cari "PT Bintang"
  │
  ├── User klik tombol "Add Partner"
  │     └── Dialog Add Partner terbuka
  │     └── User mengisi data legal dan kontak → Klik Save
  │
  └── Pada card sebuah perusahaan, klik "Run Due Diligence"
        └── AI memproses data, memberikan skor risiko, dan menyimpannya.
```

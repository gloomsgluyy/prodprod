# Modul: Audit Logs

**Route:** `/audit-logs`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/audit-logs/page.tsx) (208 baris)  
**Akses:** Terbatas (Permission `audit_logs`)

---

## Deskripsi Umum

Sistem pencatatan (*logging*) rekam jejak aktivitas pengguna secara real-time. Setiap penambahan, pengubahan, atau penghapusan data penting pada aplikasi ini dicatat demi akuntabilitas dan keamanan (append-only log).

---

## Layout

### 1. Access Control
- Tampilan "Access Restricted" jika user bukan admin/executive.

### 2. Header & Controls
- Title: "Audit Logs - Real system activity"
- Search Input: Mencari log berdasarkan entitas, aksi, atau user (misal: "Shipment", "DELETE").
- Tombol **Refresh**: Memanggil ulang data dari API.

### 3. Data Table (Tabel Logs)
Tabel besar yang menampilkan history perubahan:

| Kolom | Deskripsi |
|-------|-----------|
| User | Nama user beserta inisial (Avatar) |
| Role | Badge warna yang menunjukkan Role user (misal CEO, Staff) |
| Action | Aksi yang dilakukan (CREATE, UPDATE, DELETE, LOGIN) dengan badge warna |
| Entity | Modul/Tabel yang diubah (misal: "SHIPMENT", "USER", "PROJECT") |
| Details | Ringkasan perubahan (*old value* -> *new value*) |
| Date | Tanggal dan jam aktivitas (format dd MMM yyyy, HH:mm) |

### 4. Interactive Dialog: Log Details
Meskipun baris menampilkan ringkasan, jika detail perubahannya panjang (berisi payload JSON besar), user dapat melihatnya:
- Terdapat fungsi *parseDetails* yang mengekstrak metadata dari log JSON (seperti field mana saja yang berubah dari angka A ke angka B).

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Refresh** | Fetch data `GET /api/audit-logs?take=250` dari database |
| **Search Input** | Mem-filter tabel secara lokal (client-side) berdasarkan nama user, role, atau action |

---

## User Flow

```
User buka /audit-logs
  │
  ├── Akses dicek. Jika lulus, tabel kosong menampilkan state "Loading...".
  │
  ├── Tabel menampilkan 250 log terakhir (diurutkan dari yang terbaru).
  │
  ├── User mengetik "Update harga" pada Search Bar.
  │     └── Tabel otomatis menyaring (filter) baris yang memiliki detail tersebut.
  │
  └── User dapat melihat history perubahan yang terjadi dan mendeteksi aktivitas anomali.
```

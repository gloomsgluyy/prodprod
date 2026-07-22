# Modul: Blending Simulator

**Route:** `/blending`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/blending/page.tsx) (229 baris, 15KB)  
**Store:** `commercial-store`  
**Akses:** Semua role

---

## Deskripsi Umum

Simulator blending batubara untuk menghitung **spesifikasi campuran dari dua atau lebih cargo batubara**. Menyediakan kalkulasi real-time (live preview) dan simulasi resmi yang disimpan ke history. User bisa langsung load data spec dari database supplier (Sources).

---

## Layout

### 1. Header
- Title: "Blending Simulator" dengan icon Beaker
- Subtitle deskriptif

### 2. Input Table (Dynamic Rows)
Tabel input cargo yang bisa ditambah/kurang:

| Kolom | Jenis | Default |
|-------|-------|---------|
| Cargo Name | Text | "Cargo A", "Cargo B", dst. |
| Quantity (MT) | Number | 30000, 20000 |
| GAR | Number | 4200 |
| TS (%) | Number | 0.8 |
| ASH (%) | Number | 5.0 |
| TM (%) | Number | 30 |

Per baris:
- Dropdown **"Load from Source"** → pilih supplier → otomatis isi spec
- Tombol **Delete** (Trash2 icon) → hapus baris

### 3. Tombol Add Cargo
- "Add Cargo" → tambah baris baru dengan nama otomatis (Cargo C, D, dst.)

### 4. Live Preview (Real-time)
Kalkulasi otomatis setiap kali input berubah. Menggunakan **weighted average**:

```javascript
totalQty = sum(cargo.quantity)
blendedGAR = round(sum(cargo.gar * cargo.quantity) / totalQty)
blendedTS = round(sum(cargo.ts * cargo.quantity) / totalQty, 2)
blendedASH = round(sum(cargo.ash * cargo.quantity) / totalQty, 2)
blendedTM = round(sum(cargo.tm * cargo.quantity) / totalQty, 2)
```

Display:
- Total Quantity (MT)
- Blended GAR
- Blended TS (%)
- Blended ASH (%)
- Blended TM (%)

### 5. Tombol Simulate Blend
- "Simulate Blend" → jalankan `simulateBlend()` dari commercial-store
- Loading state saat proses
- Hanya aktif jika user terautentikasi

### 6. Result Card (Setelah Simulasi)
Menampilkan hasil resmi simulasi:
- Final blended spec (GAR, TS, ASH, TM)
- Pass/fail indicator per parameter
- Comparison dengan target spec (jika ada)

### 7. Blending History
Riwayat simulasi sebelumnya:
- Tanggal simulasi
- Input cargoes
- Hasil blended spec
- User yang menjalankan

### 8. Report Modal
Export hasil blending.

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "Add Cargo" | Tambah baris input cargo |
| Delete (per row) | Hapus baris cargo |
| "Load from Source" (dropdown) | Load spec dari supplier database |
| "Simulate Blend" | Jalankan simulasi resmi |
| "Download Report" | Export hasil |
| "History" | Lihat riwayat simulasi |

---

## User Flow

```
User buka /blending
  │
  ├── Default: 2 cargo (A dan B) sudah terisi
  │
  ├── Edit spec manual ATAU "Load from Source"
  │     └── Pilih supplier → spec auto-fill
  │
  ├── Live Preview menampilkan blended spec real-time
  │
  ├── "Add Cargo" → tambah baris
  │
  ├── "Simulate Blend" → kalkulasi resmi
  │     └── Hasil ditampilkan di Result Card
  │
  └── Hasil tersimpan di Blending History
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Sources | "Load from Source" mengambil spec dari supplier database |
| Forecast Sales | Blending scenario per project |
| Quality | Spec target comparison |
| Shipment Monitor | Blending untuk optimasi spec per shipment |

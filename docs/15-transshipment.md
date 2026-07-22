# Modul: Transshipment & Freight Info

**Route:** `/transshipment`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/transshipment/page.tsx) (502 baris)  
**Store:** `commercial-store`

---

## Deskripsi Umum

Modul ini mengelola operasi pemindahan muatan (transshipment) dari tongkang (barge) ke Mother Vessel, serta menyediakan informasi logistik kargo dan jadwal perjalanan freight.

---

## Layout

### 1. Header & Summary Metrics
- Title: "Transshipment / Freight info"
- Tombol: **Download Report**, **Allocate Vessel**
- **5 Metrik Utama (Cards):**
  - Total Shipments
  - Total Revenue (USD)
  - Gross Profit (USD)
  - Avg Freight Cost (USD/MT)
  - Total Volume (MT)

### 2. Tab Navigation & Search
- Tabs: `Active Voyages` dan `Completed`.
- View Toggle: `Card View` vs `List View` (Grid/List icon).
- Search Input: Cari berdasarkan MV Name, Shipment Number, atau Port.

### 3. Vessel Cards (Active Voyages)
Jika `Card View` aktif, setiap pengiriman ditampilkan sebagai card besar yang berisi:
- **Header**: Status Badge, MV/Project Name, Shipment Number.
- **Route Tracking**: Progress bar visual yang menghubungkan Port of Loading dan Port of Discharge. Menampilkan persentase perjalanan (%).
- **Details Grid**: 
  - Qty Loaded (MT)
  - Freight Rate (USD)
  - Total Freight (Kalkulasi)
  - ETA (Estimated Time of Arrival)
  - Cuaca (Weather)
- **Tombol Actions**: Edit, Milestones, Delete.

### 4. Interactive Dialog: Milestone Updates
Saat mengklik tombol **Milestones** pada sebuah vessel card, dialog terbuka:
- Menampilkan daftar timeline perjalanan (misal: "Vessel Chartered", "NOR Tendered", "Arrived at Discharging Port").
- Form untuk menambah milestone baru (Judul, Subtitle, Status: pending/current/completed).

### 5. Interactive Dialog: AI Risk Insight
Terdapat fitur "Generate AI Risk Insight". Saat diklik, dialog modal terbuka:
- Menampilkan rekomendasi AI mengenai mitigasi risiko (contoh: "Cuaca buruk diprediksi di rute, disarankan reroute atau mempercepat loading").

### 6. Interactive Dialog: Allocate Vessel (Add Form)
| Field | Jenis |
|-------|-------|
| MV Project Name | Text |
| Shipment Number | Text |
| Vessel Name & Barge | Text |
| Loading Port & Discharge Port | Text |
| Freight Rate (USD) | Number |

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Allocate Vessel** | Buka form penambahan jadwal vessel baru |
| **Download Report** | Export data ke PDF/Excel |
| **Edit** | Edit data freight/kapal |
| **Milestones** | Membuka dialog timeline perjalanan dan form tambah milestone |
| **Generate Risk Insight** | Trigger AI untuk memberikan evaluasi rute dan cuaca |

---

## User Flow

```
User buka /transshipment
  │
  ├── Lihat summary keseluruhan biaya freight dan volume
  │
  ├── Klik "Allocate Vessel" untuk mendaftarkan jadwal sandar kapal baru
  │
  ├── Pada daftar Active Voyages, pilih satu kapal
  │     ├── Klik "Milestones" → update status ("Kapal bersandar", "Loading selesai")
  │     └── Klik "AI Risk Insight" → minta saran rute/cuaca ke AI
  │
  └── Jika perjalanan selesai, ubah status menjadi "Completed"
```

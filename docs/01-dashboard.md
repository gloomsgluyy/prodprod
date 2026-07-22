# Modul: Dashboard (Command Center)

**Route:** `/`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/page.tsx) (2286 baris, 118KB)  
**Store:** `commercial-store`, `task-store`, `auth-store`  
**Akses:** Semua role (beberapa widget eksklusif CEO/DIRUT/ASS_DIRUT/COO)

---

## Deskripsi Umum

Dashboard adalah **halaman utama (Command Center)** yang menampilkan ringkasan seluruh operasi bisnis dalam satu halaman. Ini adalah halaman yang paling padat konten di seluruh aplikasi, berfungsi sebagai pusat kontrol bagi manajemen untuk memonitor shipment, sales, market price, tasks, meetings, stok, dan alert/blocker.

---

## Layout (Top to Bottom)

### 1. Filter Bar Global
Baris filter di bagian paling atas halaman. Semua filter ini mempengaruhi data yang ditampilkan di widget-widget di bawahnya.

| Elemen | Jenis | Detail |
|--------|-------|--------|
| Search | Text Input | Pencarian teks bebas (buyer, vessel, project name) |
| Status | Dropdown | `All Status`, `Pre-sale`, `Confirmed`, `In Transit`, `Completed` |
| Market Type | Dropdown | `All Types`, `Local`, `Export` |
| Country | Dropdown | Indonesia, South Korea, India, Cambodia, Philippines, China, Japan, Thailand, Vietnam |
| Region | Dropdown | Kalimantan Timur, Kalimantan Selatan, Sumatera Selatan, dll. |
| Time Range | Chip Group | `Last 30 Days`, `Last 90 Days`, `Year to Date`, `All Time`, `Custom Range` |
| Custom Date Range | Date Input x2 | Muncul jika "Custom Range" dipilih — tanggal mulai & akhir |

### 2. Metric Cards (Grid 5 kolom)
Kartu ringkasan metrik utama. Setiap card menampilkan:
- Icon berwarna (Ship, Activity, Package, DollarSign, TrendingUp)
- Label teks kecil
- Angka besar (bold)
- Sub-text kecil

| Card | Icon | Warna | Data | Akses |
|------|------|-------|------|-------|
| Total Shipments | Ship | Biru | Jumlah total shipment (filtered) | Semua |
| Active Shipments | Activity | Emerald | Shipment berstatus aktif (loading/in transit) | Semua |
| Total Volume | Package | Violet | Total kuantitas dalam MT | Semua |
| Revenue | DollarSign | Amber | Total revenue dalam USD | CEO/DIRUT/COO only |
| Avg Margin | TrendingUp | Rose | Rata-rata margin per MT | CEO/DIRUT/COO only |

### 3. Market Price Mini Widget
Widget ringkas 10 kolom yang menampilkan harga terbaru dari pasar batubara global.

| Index | Warna |
|-------|-------|
| ICI 1 (6500) | Merah |
| ICI 2 (5800) | Amber |
| ICI 3 (5000) | Biru |
| ICI 4 (4200) | Violet |
| ICI 5 (3400) | Indigo |
| Newcastle | Pink |
| HBA | Emerald |
| HBA I (5300) | Teal |
| HBA II (4100) | Cyan |
| HBA III (3400) | Sky |

Setiap card menampilkan:
- Nama index
- Harga USD (bold, berwarna)
- Delta perubahan dari hari sebelumnya (↑ hijau / ↓ merah)
- Link "Detail →" menuju `/market-price`

### 4. Total Volume Card
Kartu besar yang menampilkan volume total.
- Grand total dalam **K MT**
- **Tombol "Show Detail" / "Hide Detail"** — expand/collapse detail
- **Year Selector** — pilih tahun (dropdown)
- **Segment Selector** — 3 tombol: `Total | Local | Export`
- **Status Breakdown** — Progress bar per status:
  - Upcoming (abu-abu), Loading (biru), In Transit (indigo), Completed (hijau), Cancelled (merah)

### 5. Quantity per Month Chart
Grafik batang bertumpuk menggunakan **Recharts BarChart**.
- **Stacked Bar**: 
  - Biru = Local (Domestic)
  - Hijau = Export
- **Kontrol**:
  - Dropdown View Mode: `By Year | Last 2 Years | All Years`
  - Year Picker
- Link "Detail →" menuju `/sales-monitor`

### 6. Priority Tasks Widget
Menampilkan 6 task teratas berdasarkan prioritas.
- Dot warna: 🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low
- Nama task, assignee name, badge status
- Link "View All →" menuju `/all-tasks`

### 7. Upcoming Meetings Widget
Menampilkan 3 meeting terdekat.
- Card per meeting: icon kalender, judul, tanggal, jam, jumlah peserta
- **Tombol "Add to Calendar"** — buka Google Calendar URL
- Link "View All →" menuju `/meetings`

### 8. Stock Inventory Widget
- Total stok batubara dalam **K MT**
- Daftar 4 source teratas: nama dan stok tersedia

### 9. Shipment Tables
Tabel shipment aktif dengan informasi ringkas.

| Kolom | Detail |
|-------|--------|
| No | Nomor urut |
| Shipment No | ID/nama shipment |
| Buyer | Nama pembeli |
| Vessel/Barge | Nama kapal |
| Port Muat | Pelabuhan muat |
| Qty (MT) | Kuantitas dalam Metric Ton |
| BL Date | Tanggal Bill of Lading |
| Status | Badge berwarna |

- Setiap baris memiliki link **"Open Detail →"** yang mengarah ke `/shipment-monitor?tab=...&open=...`
- Alert badge untuk pending items

### 10. Waiting Approval for Forecast Sales
Daftar proyek yang menunggu persetujuan dari manajemen.
- Link **"Open Forecast Sales →"** ke `/forecast-sales`

### 11. Document Aging Alerts
Alert untuk dokumen shipment yang sudah melewati batas waktu.
- Badge ringkasan: `X critical`, `Y warning`
- Grid card per alert: shipment name, requirement code, owner, PIC, hardcopy status, aging days
- Klik card menuju `/shipment-monitor?open=...&detail=documents`

### 12. Blocker Control Tower
Sistem alert lintas modul untuk mendeteksi bottleneck operasional.

| Kategori | Icon | Contoh Alert |
|----------|------|--------------|
| Payment | CreditCard | Outstanding payment overdue |
| Quality | FlaskConical | Quality spec out of range |
| Source | MapPin | Low stock alert |
| Barge | Ship | Barge not assigned |
| Closing | FileText | Missing documents |
| Domestic | Truck | Handover stuck |

Setiap alert card menampilkan: severity, icon kategori, judul, pesan, owner, due date.

### 13. AI Forecast Sales Urgency Panel (CEO/DIRUT/ASS_DIRUT only)
- **Tombol "Analyze"** — jalankan AI urgency analysis
- Card per project: nama, summary AI, severity level (CRITICAL/HIGH/MEDIUM/LOW), skor

### 14. User Activity Log (CEO/DIRUT only)
- Summary cards: Active Users, Total Logs, Attendance Logs, Non-Attendance
- Tabel: User, Activity count, Absensi count, Last Activity
- Timeline: card per log entry dengan waktu dan deskripsi

---

## Daftar Tombol dan Aksi

| Tombol | Lokasi | Aksi |
|--------|--------|------|
| Filter dropdowns & chips | Filter Bar | Filter data seluruh dashboard |
| "Show Detail" / "Hide Detail" | Volume Card | Expand/collapse detail volume |
| Year/Segment selectors | Volume Card | Ubah tampilan data |
| "Detail →" | Market Mini | Navigasi ke `/market-price` |
| "Detail →" | Volume Chart | Navigasi ke `/sales-monitor` |
| "View All →" | Tasks Widget | Navigasi ke `/all-tasks` |
| "View All →" | Meetings Widget | Navigasi ke `/meetings` |
| "Add to Calendar" | Meeting Card | Buka Google Calendar URL |
| "Open Detail →" | Shipment Table | Navigasi ke `/shipment-monitor` dengan context |
| "Open Forecast Sales →" | Approval Widget | Navigasi ke `/forecast-sales` |
| "Analyze" | AI Urgency Panel | Run AI analysis |

---

## Grafik / Chart

| Jenis | Library | Data |
|-------|---------|------|
| Stacked BarChart | Recharts | Volume per bulan (Local vs Export) |

---

## User Flow

```
User Login → Dashboard
  ├── Lihat ringkasan metrik (cards)
  ├── Lihat harga pasar terbaru (market mini)
  ├── Lihat volume per bulan (chart)
  ├── Monitor tasks prioritas → klik → All Tasks
  ├── Monitor meetings → klik → Meetings
  ├── Monitor shipment aktif (tabel) → klik → Shipment Monitor
  ├── Monitor approval yang pending → klik → Forecast Sales
  ├── Monitor document aging alerts → klik → Shipment Monitor (documents)
  ├── Monitor blockers (payment/quality/source/barge/closing/domestic)
  ├── [CEO] Run AI Urgency Analysis
  └── [CEO] Lihat User Activity Log
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Market Price | Data harga ditampilkan di market mini widget |
| Sales Monitor | Link dari volume chart |
| Shipment Monitor | Shipment table + document aging + blocker alerts |
| All Tasks | Priority tasks widget |
| Meetings | Upcoming meetings widget |
| Forecast Sales | Waiting approval widget + AI urgency |
| Sources | Stock inventory widget |
| Audit Logs | User activity log |
| Outstanding Payment | Blocker: payment category |
| Quality | Blocker: quality category |

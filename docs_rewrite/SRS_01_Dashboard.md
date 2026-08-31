# SRS Modul 01: Dashboard (Command Center)

**Modul:** Dashboard
**Route:** `/`
**Versi:** 2.1
**Terakhir Diperbarui:** 30 Agustus 2026
**Implementation Status:** Partial — dashboard widget revision implemented; COO pending source mapping and AI urgency parameters pending.

---

## 1. Overview

### 1.1 Deskripsi

Dashboard adalah **halaman utama (Command Center)** CoalTrade OS yang menampilkan ringkasan seluruh operasi bisnis dalam satu halaman. Ini adalah halaman paling padat konten yang berfungsi sebagai pusat kontrol bagi manajemen untuk memonitor shipment, sales, market price, tasks, meetings, stok, alert, dan blocker.

### 1.2 Tujuan

- Memberikan **overview real-time** seluruh operasi trading batubara
- Menampilkan **alert dan blocker** — bukan hanya angka summary
- Menyediakan **navigasi cepat** ke modul terkait dari setiap widget
- Menampilkan **restricted metrics** (revenue, margin, P&L) hanya untuk eksekutif

### 1.3 Route & Dependencies

| Atribut | Nilai |
|---------|-------|
| Route | `/` |
| Store | `commercial-store`, `task-store`, `auth-store` |
| Dependencies | Recharts (BarChart), Semua API modul |
| Akses | Semua role (beberapa widget restricted) |

---

## 2. Functional Requirements

### FR-DASH-001: Global Filter Bar (Status: Done)

**Priority:** High

Sistem harus menyediakan filter bar global di bagian atas dashboard yang mempengaruhi data seluruh widget.

**Filter elements:**

| Filter | Jenis | Opsi |
|--------|-------|------|
| Search | Text Input | Pencarian teks bebas (buyer, vessel, project name) |
| Status | Dropdown | `All Status`, `Pre-sale`, `Confirmed`, `In Transit`, `Completed` |
| Market Type | Dropdown | `All Types`, `Local`, `Export` |
| Country | Dropdown | Indonesia, South Korea, India, Cambodia, Philippines, China, Japan, Thailand, Vietnam |
| Region | Dropdown | Kalimantan Timur, Kalimantan Selatan, Sumatera Selatan, dll. |
| Time Range | Chip Group | `Last 30 Days`, `Last 90 Days`, `Year to Date`, `All Time`, `Custom Range` |
| Custom Date Range | Date Input x2 | Muncul jika "Custom Range" dipilih |

**Acceptance Criteria:**
- `AC-DASH-001`: Filter yang dipilih mempengaruhi data di semua widget dashboard
- `AC-DASH-002`: Custom Date Range hanya muncul jika chip "Custom Range" dipilih
- `AC-DASH-003`: Filter state dipertahankan selama sesi (tidak reset saat re-render)
- `AC-DASH-004`: Time Range default adalah "Last 30 Days"

---

### FR-DASH-002: Metric Cards (Status: Done)

**Priority:** High

Sistem harus menampilkan 5 kartu metrik utama dalam grid layout.

| Card | Icon | Warna | Data | Akses |
|------|------|-------|------|-------|
| Total Shipments | Ship | Biru | Jumlah total shipment (filtered) | Semua |
| Active Shipments | Activity | Emerald | Shipment berstatus aktif (loading/in transit) | Semua |
| Total Volume | Package | Violet | Total kuantitas dalam MT | Semua |
| Revenue | DollarSign | Amber | Total revenue dalam USD | **CEO/DIRUT/ASS_DIRUT/COO only** |
| Avg Margin | TrendingUp | Rose | Rata-rata margin per MT | **CEO/DIRUT/ASS_DIRUT/COO only** |

**Acceptance Criteria:**
- `AC-DASH-005`: Revenue dan Avg Margin card **tidak ditampilkan** untuk non-executive role
- `AC-DASH-006`: Setiap card menampilkan icon berwarna, label, angka besar (bold), sub-text
- `AC-DASH-007`: Data card ter-filter berdasarkan Global Filter Bar
- `AC-DASH-008`: Revenue dihitung dari shipment yang sudah confirmed (year to date)

---

### FR-DASH-003: Market Price Index Widget (Status: Done)

**Priority:** High

Widget paling atas menampilkan harga terbaru dari 10 index batubara global dengan referensi rata-rata historis.

**Per card menampilkan:**
- Nama index dan harga USD monokrom
- Date Price
- Average 2 minggu, 4 minggu, dan 30 hari; masing-masing dengan rentang tanggal
- Delta nominal dan persen antara harga terbaru dengan average 2 minggu; naik hijau, turun merah
- Link menuju `/market-price`

**Acceptance Criteria:**
- `AC-DASH-009`: Data diambil dari latest entry di market price store
- `AC-DASH-010`: Delta dihitung dari harga terbaru vs average 2 minggu sebelumnya
- `AC-DASH-011`: Klik "Detail →" navigasi ke `/market-price`

---

### FR-DASH-004: Total Volume Card (Status: Done)

**Priority:** High

Kartu volume total dengan detail breakdown.

**Komponen:**
- Grand total volume dalam **K MT** (ribu metric ton)
- Tombol **"Show Detail" / "Hide Detail"** — expand/collapse
- **Year Selector** — dropdown pilih tahun
- **Segment Selector** — 3 tombol: `Total | Local | Export`
- **Status Breakdown** — Progress bar per status:
  - Upcoming (abu-abu), Loading (biru), In Transit (indigo), Completed (hijau), Cancelled (merah)

**Acceptance Criteria:**
- `AC-DASH-012`: Default state collapsed (detail hidden)
- `AC-DASH-013`: Volume terhitung berdasarkan filter global + year + segment
- `AC-DASH-014`: Progress bar menunjukkan proporsi per status dari total volume

---

### FR-DASH-005: Quantity per Month Chart (Status: Done)

**Priority:** High

Grafik batang bertumpuk menampilkan volume per bulan.

**Spesifikasi Chart:**
- **Library:** Recharts BarChart (stacked)
- **Stack 1:** Biru = Local (Domestic)
- **Stack 2:** Hijau = Export
- **Kontrol:**
  - Dropdown View Mode: `By Year | Last 2 Years | All Years`
  - Year Picker
- Link "Detail →" menuju `/sales-monitor`

**Acceptance Criteria:**
- `AC-DASH-015`: Chart menampilkan data per bulan (Jan-Dec)
- `AC-DASH-016`: Stacked bar menunjukkan split Local vs Export
- `AC-DASH-017`: Tooltip pada hover menampilkan nilai aktual

---

### FR-DASH-006: Priority Tasks Widget (Status: Done)

**Priority:** Medium

Widget menampilkan 6 task teratas berdasarkan prioritas.

**Per task menampilkan:**
- Dot warna: 🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low
- Nama task, assignee name, badge status
- Link "View All →" menuju `/all-tasks`

**Acceptance Criteria:**
- `AC-DASH-018`: Menampilkan maksimal 6 task
- `AC-DASH-019`: Urutan berdasarkan priority (Urgent first) lalu due date (earliest first)
- `AC-DASH-020`: Klik "View All →" navigasi ke `/all-tasks`

---

### FR-DASH-007: Upcoming Meetings Widget (Status: Done)

**Priority:** Medium

Widget menampilkan 3 meeting terdekat.

**Per meeting menampilkan:**
- Icon kalender, judul meeting, tanggal, jam, jumlah peserta
- Tombol **"Add to Calendar"** → buka Google Calendar URL

**Acceptance Criteria:**
- `AC-DASH-021`: Menampilkan 3 meeting terdekat dari tanggal hari ini
- `AC-DASH-022`: "Add to Calendar" membuka Google Calendar URL di tab baru
- `AC-DASH-023`: "View All →" navigasi ke `/meetings`

---

### FR-DASH-008: Stock Inventory Widget (Status: Done)

**Priority:** Medium

Widget inventaris stok batubara.

**Menampilkan:**
- Total stok batubara dalam **K MT**
- Daftar 4 source teratas: nama supplier dan stok tersedia

**Acceptance Criteria:**
- `AC-DASH-024`: Data diambil dari Sources/Supplier module
- `AC-DASH-025`: Urutan berdasarkan stok terbesar

---

### FR-DASH-009: Shipment Tables (Status: Done)

**Priority:** High

Tabel shipment aktif dengan informasi ringkas.

| Kolom | Deskripsi |
|-------|-----------|
| No | Nomor urut |
| Shipment No | ID/nama shipment |
| Buyer | Nama pembeli |
| Vessel/Barge | Nama kapal |
| Port Muat | Pelabuhan muat |
| Qty (MT) | Kuantitas dalam Metric Ton |
| BL Date | Tanggal Bill of Lading |
| Status | Badge berwarna |

**Interaksi:**
- Setiap baris memiliki link **"Open Detail →"** ke `/shipment-monitor?tab=...&open=...`
- Alert badge untuk pending items

**Acceptance Criteria:**
- `AC-DASH-026`: Menampilkan shipment dengan status aktif (upcoming, loading, in transit)
- `AC-DASH-027`: Klik "Open Detail →" navigasi ke Shipment Monitor dengan context (shipment ID, tab)
- `AC-DASH-028`: Alert badge menunjukkan jumlah pending items per shipment

---

### FR-DASH-010: Waiting Approval for Forecast Sales (Status: Done)

**Priority:** High

Daftar proyek Forecast Sales yang menunggu persetujuan dari CEO/management.

- Link **"Open Forecast Sales →"** ke `/forecast-sales`

**Acceptance Criteria:**
- `AC-DASH-029`: Menampilkan project dengan status `waiting_approval`
- `AC-DASH-030`: Hanya visible jika ada data pending

---

### FR-DASH-011: Pending Alerts (Status: Partial)

**Priority:** High

Alert operasional yang menunggu tindak lanjut.

**Komponen:**
- SI belum dibuat ketika laycan sudah masuk H-10
- Draft BL pending lebih dari 3 hari
- Invoice overdue
- Surveyor report/quality result pending
- Klik card navigasi ke modul atau shipment terkait
- `COO pending` ditahan hingga pemilik data/field disepakati

**Business Rule:**
- `BR-DASH-001`: SI tanpa record dalam H-10 = **Critical**
- `BR-DASH-002`: Draft BL >3 hari atau surveyor report pending = **Warning**

**Acceptance Criteria:**
- `AC-DASH-031`: Aging dihitung otomatis dari tanggal dokumen seharusnya diterima
- `AC-DASH-032`: Klik card navigasi ke Shipment Monitor tab documents

---

### FR-DASH-012: Blocker Control Tower (Status: Removed)

**Priority:** Very High

Digantikan oleh Pending Alerts sesuai revisi dashboard 2026-08-30.

| Kategori | Icon | Sumber Data | Contoh Alert |
|----------|------|-------------|--------------|
| Payment | CreditCard | Outstanding Payment | Payment overdue > X hari |
| Quality | FlaskConical | Quality Module | Quality spec out of range, warning belum reviewed |
| Source | MapPin | Source Module | Low stock alert, source pending |
| Barge | Ship | Shipment Monitor | Barge not assigned, barge change pending |
| Closing | FileText | Shipment Monitor | Missing mandatory documents |
| Domestic | Truck | Shipment Monitor | Handover stuck di pihak tertentu |

**Per alert card menampilkan:**
- Severity (Critical/Warning/Info)
- Icon kategori
- Judul alert
- Pesan detail
- Owner/PIC
- Due date (jika ada)

**Business Rules:**
- `BR-DASH-003`: Semua alert card harus **clickable** ke modul/entity terkait
- `BR-DASH-004`: Alert aging dihitung otomatis dari tanggal status/dokumen
- `BR-DASH-005`: Blocker harus muncul walaupun filter global aktif (tidak ter-filter out)

**Acceptance Criteria:**
- `AC-DASH-033`: Setiap kategori blocker menampilkan count dan detail
- `AC-DASH-034`: Klik alert navigasi ke modul terkait
- `AC-DASH-035`: Blocker data di-refresh setiap kali dashboard dimuat

---

### FR-DASH-013: AI Forecast Sales Urgency Panel (Status: Pending — Groq integration stub only)

**Priority:** Medium
**Access:** CEO/DIRUT/ASS_DIRUT only

**Komponen:**
- Tombol **"Analyze"** — trigger AI urgency analysis
- Card per project: nama, AI summary, severity level (CRITICAL/HIGH/MEDIUM/LOW), skor

**Acceptance Criteria:**
- `AC-DASH-036`: Panel tidak ditampilkan untuk non-executive role
- `AC-DASH-037`: "Analyze" mengirim request ke AI endpoint dan menampilkan hasil
- `AC-DASH-038`: Loading state selama proses analisis

---

### FR-DASH-014: User Activity Log (Status: Done)

**Priority:** Low
**Access:** CEO/DIRUT only

**Komponen:**
- Summary cards: Active Users, Total Logs, Attendance Logs, Non-Attendance
- Tabel: User, Activity count, Absensi count, Last Activity
- Timeline: card per log entry dengan waktu dan deskripsi

**Acceptance Criteria:**
- `AC-DASH-039`: Panel tidak ditampilkan untuk non-CEO role
- `AC-DASH-040`: Data dari audit logs API

---

## 3. Data Model (Status: Done)

### 3.1 Data Sources (Aggregated)

Dashboard tidak memiliki entity tersendiri — mengambil data dari modul lain:

| Widget | Source Module | Data |
|--------|-------------|------|
| Metric Cards | Shipment Monitor | count, volume, revenue, margin |
| Market Price Mini | Market Price | latest prices, delta |
| Total Volume | Shipment Monitor | aggregated volume by status/year/segment |
| Quantity Chart | Shipment Monitor | monthly volume |
| Priority Tasks | Tasks | top 6 by priority |
| Upcoming Meetings | Meetings | next 3 by date |
| Stock Inventory | Sources | total stock, top sources |
| Shipment Tables | Shipment Monitor | active shipments |
| Waiting Approval | Forecast Sales | projects with status waiting_approval |
| Document Aging | Shipment Monitor Documents | docs with aging > threshold |
| Blocker Tower | Multiple | payment, quality, source, barge, docs |
| AI Urgency | Forecast Sales + AI | AI analysis results |
| User Activity | Audit Logs | user logs, attendance |

### 3.2 Cached Data Strategy

| Data | Cache Duration | Invalidation |
|------|---------------|-------------|
| Market Price | 5 menit | Manual refresh, new price entry |
| Shipment metrics | 2 menit | Shipment CRUD operation |
| Tasks/Meetings | 2 menit | Task/Meeting CRUD |
| Blocker alerts | 2 menit | Any related data change |

---

## 4. UI Layout (Status: Done)

> **Revision override, 2026-08-30:** Market Price Index is first. Compact Overview filters and four summary cards share the next row. Quantity per Month is left; Stock Inventory and recent Active Shipments share the right. Blocker Control Tower is removed. Pending Alerts replaces Document Aging. This override supersedes the legacy layout below.

### 4.1 Page Structure (Top to Bottom)

```
┌─────────────────────────────────────────────────────────┐
│ [1] GLOBAL FILTER BAR                                   │
│ Search | Status | Type | Country | Region | Time Range  │
├─────────────────────────────────────────────────────────┤
│ [2] METRIC CARDS (Grid 5 kolom)                         │
│ [Total] [Active] [Volume] [Revenue*] [Margin*]          │
├─────────────────────────────────────────────────────────┤
│ [3] MARKET PRICE MINI (Grid 10 kolom)                   │
│ ICI1 | ICI2 | ICI3 | ICI4 | ICI5 | NEWC | HBA | ...   │
├──────────────────────┬──────────────────────────────────┤
│ [4] TOTAL VOLUME     │ [5] QUANTITY/MONTH CHART         │
│ Card (expandable)    │ Stacked BarChart                 │
├──────────────────────┼──────────────────────────────────┤
│ [6] PRIORITY TASKS   │ [7] UPCOMING MEETINGS            │
│ 6 task cards         │ 3 meeting cards                  │
├──────────────────────┴──────────────────────────────────┤
│ [8] STOCK INVENTORY                                     │
├─────────────────────────────────────────────────────────┤
│ [9] SHIPMENT TABLES (Active shipments)                  │
├─────────────────────────────────────────────────────────┤
│ [10] WAITING APPROVAL FOR FORECAST SALES                │
├─────────────────────────────────────────────────────────┤
│ [11] DOCUMENT AGING ALERTS                              │
├─────────────────────────────────────────────────────────┤
│ [12] BLOCKER CONTROL TOWER                              │
│ Payment | Quality | Source | Barge | Closing | Domestic  │
├─────────────────────────────────────────────────────────┤
│ [13] AI FORECAST URGENCY (CEO only)                     │
├─────────────────────────────────────────────────────────┤
│ [14] USER ACTIVITY LOG (CEO only)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Business Rules (Status: Done)

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-DASH-001 | Document aging > 30 hari = Critical | Visual alert merah |
| BR-DASH-002 | Document aging 15-30 hari = Warning | Visual alert kuning |
| BR-DASH-003 | Semua alert card harus clickable ke modul terkait | Navigation link |
| BR-DASH-004 | Alert aging dihitung otomatis | Server-side calculation |
| BR-DASH-005 | Blocker tidak ter-filter out oleh global filter | Separate data fetch |
| BR-DASH-006 | Revenue & margin hanya untuk executive role | RBAC check client & server |
| BR-DASH-007 | AI panel hanya untuk CEO/DIRUT/ASS_DIRUT | RBAC check |
| BR-DASH-008 | User Activity hanya untuk CEO/DIRUT | RBAC check |

---

## 6. User Flow (Status: Done)

```mermaid
flowchart TD
    A[User Login] --> B[Dashboard /]
    B --> C{User Role?}
    C -->|CEO/DIRUT| D[Full Dashboard + Revenue + AI + Activity]
    C -->|C-Level| E[Full Dashboard + Revenue]
    C -->|Trader/Traffic| F[Standard Dashboard]
    C -->|Source/Quality/Admin| G[Limited Dashboard]

    D --> H[View Alerts & Blockers]
    E --> H
    F --> H
    G --> H

    H --> I{Action}
    I -->|Klik Blocker| J[Navigate to Module]
    I -->|Klik Shipment| K[/shipment-monitor]
    I -->|Klik Task| L[/all-tasks]
    I -->|Klik Meeting| M[/meetings]
    I -->|Klik Market| N[/market-price]
    I -->|Klik Approval| O[/forecast-sales]
    I -->|Run AI Analysis| P[AI Urgency Panel]
```

---

## 7. API Endpoints (Status: Done)

| Method | Endpoint | Deskripsi | Response |
|--------|----------|-----------|----------|
| GET | `/api/dashboard/metrics` | Aggregated metrics (filtered) | `{ totalShipments, activeShipments, totalVolume, revenue, avgMargin }` |
| GET | `/api/dashboard/market-mini` | Latest 10 market prices | `MarketPrice[]` |
| GET | `/api/dashboard/volume` | Volume breakdown by status/year/segment | `VolumeData` |
| GET | `/api/dashboard/chart-monthly` | Monthly volume data | `MonthlyData[]` |
| GET | `/api/dashboard/tasks-priority` | Top 6 priority tasks | `Task[]` |
| GET | `/api/dashboard/meetings-upcoming` | Next 3 meetings | `Meeting[]` |
| GET | `/api/dashboard/stock` | Stock inventory summary | `StockSummary` |
| GET | `/api/dashboard/shipments-active` | Active shipments table | `Shipment[]` |
| GET | `/api/dashboard/approval-pending` | Pending approval projects | `Project[]` |
| GET | `/api/dashboard/document-aging` | Aged documents alerts | `DocumentAlert[]` |
| GET | `/api/dashboard/blockers` | Blocker control tower data | `Blocker[]` |
| POST | `/api/dashboard/ai-urgency` | AI urgency analysis | `AIAnalysis[]` |
| GET | `/api/dashboard/user-activity` | User activity log | `ActivityLog[]` |

---

## 8. Role & Permission (RBAC) (Status: Done)

| Widget | CEO/DIRUT | ASS_DIRUT | COO | CMO/CPPO | Trader | Traffic | Source | Quality | Admin |
|--------|-----------|-----------|-----|----------|--------|---------|--------|---------|-------|
| Filter Bar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Metric Cards (base) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Revenue Card | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Margin Card | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Market Price Mini | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Volume/Chart | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tasks/Meetings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stock Inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shipment Tables | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approval Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Document Aging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Blocker Tower | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Urgency | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Activity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 9. Status Flow (Status: Done — N/A for Dashboard)

Dashboard tidak memiliki status flow sendiri — menampilkan status dari modul lain.

---

## 10. Validation Rules (Status: Done)

| Rule | Detail |
|------|--------|
| VR-DASH-001 | Filter date range: start date harus ≤ end date |
| VR-DASH-002 | Year selector hanya menampilkan tahun yang memiliki data |
| VR-DASH-003 | RBAC check dilakukan di server-side sebelum mengembalikan restricted data |

---

## 11. Integration Points (Status: Done)

| Modul Terkait | Jenis Hubungan | Data yang Diambil |
|---------------|----------------|-------------------|
| Market Price | Data read | Latest prices untuk market mini widget |
| Shipment Monitor | Data read | Shipment metrics, active shipments, document aging |
| Sales Monitor | Data read + Link | Volume chart → link ke sales monitor |
| Forecast Sales | Data read + Link | Waiting approval widget, AI urgency |
| All Tasks | Data read + Link | Priority tasks widget |
| Meetings | Data read + Link | Upcoming meetings widget |
| Sources | Data read | Stock inventory widget |
| Outstanding Payment | Data read | Blocker: payment category |
| Quality | Data read | Blocker: quality category |
| Audit Logs | Data read | User activity log |

---

## 12. Acceptance Criteria Summary (Status: Done)

| ID | Criteria | Priority |
|----|----------|----------|
| AC-DASH-001 | Filter mempengaruhi semua widget | High |
| AC-DASH-005 | Revenue/Margin hidden untuk non-executive | Very High |
| AC-DASH-033 | Setiap blocker category menampilkan count dan detail | Very High |
| AC-DASH-034 | Semua alert card clickable ke modul terkait | Very High |
| AC-DASH-035 | Blocker data ter-refresh setiap dashboard load | High |
| AC-DASH-036 | AI panel hidden untuk non-executive | High |
| AC-DASH-039 | Activity log hidden untuk non-CEO | High |

---

## 13. Edge Cases & Error Handling (Status: Done)

| Skenario | Handling |
|----------|---------|
| Tidak ada data shipment | Tampilkan empty state "No shipments found" |
| Market price belum diinput hari ini | Tampilkan harga terakhir yang tersedia dengan label tanggal |
| Filter mengembalikan 0 result | Tampilkan "No data matches your filter" di setiap widget |
| API gagal load | Tampilkan error card per widget dengan tombol "Retry" |
| User tanpa session | Redirect ke `/login` |
| Banyak blocker (>50) | Pagination atau "Show More" untuk blocker list |
| AI analysis timeout | Tampilkan timeout message, tombol retry |

---

## 14. Grafik / Chart Specifications (Status: Done)

| Jenis | Library | Komponen | Data |
|-------|---------|----------|------|
| Stacked BarChart | Recharts | Quantity per Month | Volume per bulan (Local vs Export) |

**Chart Configuration:**
```
BarChart:
  - width: responsive (100%)
  - height: 300px
  - Bar 1: dataKey="local", fill="#3b82f6" (blue), stackId="volume"
  - Bar 2: dataKey="export", fill="#10b981" (green), stackId="volume"
  - XAxis: bulan (Jan-Dec)
  - YAxis: volume (MT)
  - Tooltip: custom format dengan ribuan separator
  - Legend: "Local (Domestic)", "Export"
```

---

*End of SRS_01_Dashboard*

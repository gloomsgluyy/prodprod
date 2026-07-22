# SRS Modul 05: Sales Monitor

**Modul:** Sales Monitor
**Route:** `/sales-monitor`
**Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-SAL fully implemented

---

## 1. Overview

Sales Monitor adalah modul monitoring layer untuk seluruh pipeline penjualan. Modul ini menampilkan data dari Forecast Sales, memberikan visibility terhadap funnel deal, dan menyediakan tracking buyer feedback.

> **Clarifikasi penting:**
> - **FCO generator, CEO approval flow, rough P&L, dan convert-to-shipment ada di Forecast Sales (SRS_06)**
> - Sales Monitor adalah view/monitoring layer — bukan tempat create FCO atau approve deal
> - Deal `confirmed` di Sales Monitor berarti deal sudah linked ke Forecast Sales yang approved

| Atribut | Nilai |
|---------|-------|
| Route | `/sales-monitor` |
| Store | `commercial-store` |
| Dependencies | Recharts (opsional), ReportModal |
| Akses | Semua role |

---

## 2. Functional Requirements

### FR-SAL-001: Pipeline Status Tabs (Status: Done)
**Priority:** High

| Tab | Status | Warna |
|-----|--------|-------|
| All | Semua | Default |
| Waiting Approval | waiting_approval | `#f59e0b` (Amber) |
| Waiting Buyer | waiting_buyer | `#6b7280` (Gray) |
| Offer Submitted | offer_submitted | `#3b82f6` (Blue) |
| Confirmed | confirmed | `#10b981` (Emerald) |
| In Transit | in_transit | `#6366f1` (Indigo) |
| Completed | completed | `#059669` (Green) |
| Cancelled | cancelled | `#ef4444` (Red) |
| Rejected | rejected | `#f43f5e` (Rose) |

**Acceptance Criteria:**
- `AC-SAL-001`: Klik tab memfilter deal berdasarkan status
- `AC-SAL-002`: Badge count per tab menunjukkan jumlah deal

---

### FR-SAL-002: Deals Table (Status: Done)
**Priority:** High

| Kolom | Deskripsi |
|-------|-----------|
| Project Name | Nama proyek/deal |
| Buyer | Nama pembeli |
| Country | Negara tujuan |
| Quantity | Kuantitas (MT) |
| Price/MT | Harga per MT (USD) |
| Total Value | Qty × Price |
| Shipping Term | FOB/CIF/CFR |
| Spec (GAR/TS/ASH) | Spesifikasi coal |
| Laycan POL | Periode laycan |
| Vessel Name | Nama kapal (jika sudah assigned) |
| Status | Badge berwarna |
| Feedback | Badge jika ada buyer feedback |
| Actions | View, Edit, Delete |

**Acceptance Criteria:**
- `AC-SAL-003`: Klik baris membuka Deal Detail Modal
- `AC-SAL-004`: Deal dengan `waiting_approval` menampilkan link ke Approval Center
- `AC-SAL-005`: Kolom harga (Price/MT, Total Value) restricted untuk non-executive

---

### FR-SAL-003: Deal Detail Modal (Status: Done)
**Priority:** High

**Tab dalam Detail Modal:**

**Tab 1 — Info:**
Info buyer, commodity, country, segment. Pricing: price/MT, total value. Coal spec: GAR, TS, ASH, TM. Timeline status. Linked shipments.

**Tab 2 — Buyer Feedback:** *(FR-SAL-007)*

**Tab 3 — Documents:**
FCO, MoM, PO, buyer contract — linked dari Forecast Sales (no re-upload).

**Acceptance Criteria:**
- `AC-SAL-006`: Pricing info restricted untuk non-executive
- `AC-SAL-007`: Linked shipments tampil sebagai clickable link ke Shipment Monitor

---

### FR-SAL-004: Add/Edit Form (Status: Done)
**Priority:** High

| Field | Type | Required |
|-------|------|----------|
| Project Name | Text | Yes |
| Buyer | Dropdown (dari Directory) | Yes |
| Segment | Dropdown (Local/Export) | Yes |
| Country | Dropdown (COUNTRIES) | Yes |
| Commodity | Text | No |
| Quantity | Number (MT) | Yes |
| Price per MT | Number (USD) | No |
| Deal Number | Text | No |
| Type | Text | No |
| Status | Dropdown (pipeline) | Yes |
| Coal Spec | Multi-input (GAR, TS, ASH, TM) | No |
| Laycan Start / End | Date | No |
| Shipping Term | Dropdown (FOB/CIF/CFR/FAS) | No |
| Notes | Textarea | No |

**Business Rules:**
- `BR-SAL-001`: Sales Monitor menampilkan data dari Forecast Sales
- `BR-SAL-002`: Sales Monitor bukan sumber upload FCO/SI utama
- `BR-SAL-003`: Deal confirmed → shipment link melalui Forecast Sales
- `BR-SAL-004`: Deal `waiting_approval` menampilkan link ke Approval Center agar CEO bisa action langsung
- `BR-SAL-005`: Buyer dipilih dari Directory — bukan free-text (untuk menghindari duplikasi)

---

### FR-SAL-005: Summary Cards (Status: Done)
**Priority:** Medium

| Card | Data |
|------|------|
| Total Deals | `deals.length` |
| Total Value (USD) | Sum semua `totalValue` |
| Avg Price/MT | Rata-rata `pricePerMt` |
| Pending Buyer Response | Count `waiting_buyer` |

---

### FR-SAL-006: Report Export (Status: Done)
**Priority:** Medium

Export laporan deal/sales via ReportModal.

---

### FR-SAL-007: Buyer Feedback Tracking (Status: Done — /api/deals/:id/feedback GET/POST/PUT)
**Priority:** Medium

Rekam feedback buyer per deal — respons buyer terhadap offer/FCO yang dikirim.

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| dealId | FK (Deal) | Yes |
| feedbackDate | Date | Yes |
| feedbackType | Enum | Yes |
| feedbackChannel | Enum | No |
| summary | Text | Yes |
| buyerResponse | Text | No |
| followUpAction | Text | No |
| followUpDueDate | Date | No |
| followUpPIC | FK (User) | No |
| recordedBy | FK (User) | Yes |
| status | Enum | Yes |

**Feedback Types:** positive, negative, neutral, counter_offer, request_revision, accepted, rejected

**Feedback Channels:** email, whatsapp, phone, meeting, formal_letter

**Status:** open, follow_up_pending, closed

**Business Rules:**
- `BR-SAL-006`: Feedback dengan `followUpAction` terisi otomatis membuat Task di Tasks module
- `BR-SAL-007`: Deal dengan feedback `rejected` direkomendasikan update status ke `rejected`
- `BR-SAL-008`: Deal dengan feedback `counter_offer` direkomendasikan buat revisi Forecast Sales

**Acceptance Criteria:**
- `AC-SAL-008`: User bisa add feedback dari Deal Detail Modal (tab Buyer Feedback)
- `AC-SAL-009`: Daftar feedback tampil chronological (terbaru di atas)
- `AC-SAL-010`: Feedback dengan follow-up pending ditandai dengan badge di tabel deals

---

### FR-SAL-008: Market Price Comparison Warning (Status: Done — /api/market-price/warnings provides spread data; banner wired in deal detail)
**Priority:** Medium

Saat user membuka detail deal dengan status `offer_submitted` atau `waiting_buyer`, sistem menampilkan perbandingan harga deal vs harga market saat ini.

| Komponen | Deskripsi |
|----------|-----------|
| Deal Price | Harga yang di-offer (USD/MT) |
| Market Index | ICI/HBA terdekat berdasarkan GAR spec |
| Spread | Deal Price - Market Index |
| Status | Above Market / At Market / Below Market |

**Business Rules:**
- `BR-SAL-009`: Jika harga deal > 5% di bawah market index saat ini, tampilkan **warning banner** di detail deal
- `BR-SAL-010`: Data market diambil dari Market Price module (latest entry)

**Acceptance Criteria:**
- `AC-SAL-011`: Warning banner tampil otomatis jika kondisi BR-SAL-009 terpenuhi
- `AC-SAL-012`: User bisa dismiss warning (warning tidak menghambat action)

---

## 3. Data Model

### Entity: Deal

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| projectName | String | Yes |
| buyer | String | Yes |
| buyerDirectoryId | FK (Directory) | Optional |
| buyerCountry | String | Optional |
| segment | Enum (local/export) | Yes |
| commodity | String | Optional |
| quantity | Number | Yes |
| pricePerMt | Number | Optional |
| totalValue | Number | Computed |
| dealNumber | String | Optional |
| type | String | Optional |
| status | Enum | Yes |
| specGar | Number | Optional |
| specTs | Number | Optional |
| specAsh | Number | Optional |
| specTm | Number | Optional |
| shippingTerm | String | Optional |
| laycanStart | Date | Optional |
| laycanEnd | Date | Optional |
| vesselName | String | Optional |
| notes | Text | Optional |
| linkedShipmentId | FK | Optional |
| linkedProjectId | FK | Optional |
| createdAt | DateTime | Yes |
| updatedAt | DateTime | Yes |

### Entity: BuyerFeedback

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| dealId | FK (Deal) | Yes |
| feedbackDate | Date | Yes |
| feedbackType | Enum | Yes |
| feedbackChannel | Enum | Optional |
| summary | Text | Yes |
| buyerResponse | Text | Optional |
| followUpAction | Text | Optional |
| followUpDueDate | Date | Optional |
| followUpPicId | FK (User) | Optional |
| recordedById | FK (User) | Yes |
| status | Enum | Yes |
| createdAt | DateTime | Yes |

---

## 4. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------:|
| GET | `/api/deals` | List deals (filtered, paginated) |
| GET | `/api/deals/:id` | Get deal detail |
| POST | `/api/deals` | Create deal |
| PUT | `/api/deals/:id` | Update deal |
| DELETE | `/api/deals/:id` | Delete deal |
| GET | `/api/deals/:id/feedback` | List buyer feedback |
| POST | `/api/deals/:id/feedback` | Add buyer feedback |
| PUT | `/api/deals/:id/feedback/:fid` | Update feedback |

---

## 5. User Flow

```
User buka /sales-monitor
  ├── Lihat ringkasan deal per status (tabs + summary cards)
  ├── Search deal/project
  ├── Klik "New Deal" → isi form → save
  ├── Klik deal di tabel → Detail Modal
  │     ├── Tab Info: lihat detail + linked shipments + market comparison warning
  │     ├── Tab Buyer Feedback: add/view feedback, set follow-up
  │     ├── Tab Documents: lihat FCO/MoM/PO dari Forecast Sales
  │     └── Edit / Delete
  ├── Deal waiting_approval → klik link → Approval Center
  └── Download Report
```

---

## 6. Integration Points

| Modul | Hubungan |
|-------|----------|
| Dashboard | Volume per month chart link |
| Shipment Monitor | Deal → Shipment linkage (via confirmed status) |
| Market Price | Harga referensi + price warning |
| Forecast Sales | Project-based deal tracking, FCO/approval ada di FS |
| Directory | Buyer dropdown master data |
| Approval Center | Deal waiting_approval link ke Approval Center |
| Tasks | Feedback dengan follow-up otomatis create task |

---

*End of SRS_05_Sales_Monitor — v2.1*

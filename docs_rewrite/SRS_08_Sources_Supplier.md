# SRS Modul 08: Sources & Supplier

**Modul:** Source dan Supplier | **Route:** `/sources` | **Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-SRC fully implemented

---

## 1. Overview

Modul manajemen supplier/pemasok batubara. Menyimpan data legalitas, spesifikasi kualitas, stok, lokasi, COB (cargo on barge), info hauling, harga FOB, pelabuhan, status KYC/PSI, dan kontak. Juga menyediakan alert stok rendah dan issue log per source.

> **Scope penting (dari Excel requirement):** Source Team hanya bertanggung jawab sampai tahap sourcing dan konfirmasi cargo readiness. Final TB/BG nomination dan barge change **dipegang Sales/Traffic Team**, bukan Source Team.

| Atribut | Nilai |
|---------|-------|
| Store | `commercial-store` |
| Akses | Semua role (write: Source Team, Sales/Traffic) |

---

## 2. Functional Requirements

### FR-SRC-001: Source List (Dual View) (Status: Done)
**Priority:** High

3 Tab: **Sources** (default), **Alerts** (low stock), **Performance** (placeholder).
View Toggle: Table view / Card view.
Search: nama supplier, region, calorie range.
Region Filter: dropdown auto-detected dari data.

**Acceptance Criteria:**
- `AC-SRC-001`: Klik tab memfilter data sesuai konteks
- `AC-SRC-002`: Toggle view tidak kehilangan filter state

---

### FR-SRC-002: Source Table Columns (Status: Done)
**Priority:** High

| Kolom | Deskripsi |
|-------|-----------|
| Name | Nama supplier |
| Region | Wilayah |
| Calorie Range | Rentang kalori |
| Stock (MT) | Stok tersedia |
| COB (MT) | Cargo on Barge saat ini |
| FOB Barge USD | Harga FOB (USD) |
| FOB Barge IDR | Harga FOB (IDR) |
| Jetty/Port | Pelabuhan |
| Kuota Sisa | Sisa kuota ekspor (MT) |
| KYC Status | not_started / in_progress / completed |
| PSI Status | not_started / in_progress / completed |
| Issue | Badge open issue |

---

### FR-SRC-003: Low Stock Alerts (Status: Done)
**Priority:** High

Source dengan `stock_available <= min_stock_alert`: nama, stock vs threshold, alert level.

---

### FR-SRC-004: Add/Edit Form (30+ fields) (Status: Done — all RKAB/COB/Hauling fields added to Prisma schema and v2 API routes)
**Priority:** High

#### Section A: Identitas & Legalitas

| Field | Type | Required |
|-------|------|----------|
| Name | Text | Yes |
| Region | Text | Yes |
| Calorie Range | Text | No |
| IUP Number | Text | Yes |
| IUP OP Status | Enum (active/expired/pending) | Yes |
| IUP Expiry Date | Date | Yes |
| RKAB Year | Number | No |
| RKAB Volume (MT) | Number | No — kuota yang disetujui RKAB |
| RKAB Used (MT) | Number | No — sudah terpakai dari kuota RKAB |
| RKAB Remaining (MT) | Computed | RKAB Volume - RKAB Used |
| Kuota Export Total (MT) | Number | No — kuota ekspor dari Kemendag/ESDM |
| Kuota Export Used (MT) | Number | No |
| Kuota Export Remaining (MT) | Computed | Kuota Total - Used |
| Contract Type | Text | No |
| Notes | Textarea | No |

#### Section B: Spesifikasi Batubara

| Field | Type | Required |
|-------|------|----------|
| GAR | Number | No |
| TS (%) | Number | No |
| ASH (%) | Number | No |
| TM (%) | Number | No |
| IM (%) | Number | No |
| FC (%) | Number | No |
| ADB | Number | No |
| NAR | Number | No |

#### Section C: Stok & Cargo

| Field | Type | Required |
|-------|------|----------|
| Stock Available (MT) | Number | No |
| Min Stock Alert | Number | No |
| Stock Locations | Multi-entry (location name, qty, condition) | No |
| COB — Cargo on Barge | Number | No — qty batubara yang sudah ada di tongkang |
| COB Updated At | DateTime | No — waktu update terakhir COB |
| COB Notes | Text | No |
| Cargo Readiness Status | Enum (ready/partial_ready/not_ready/legal_pending) | No |
| Cargo Readiness Notes | Text | No |

#### Section D: Hauling

| Field | Type | Required |
|-------|------|----------|
| Hauling Required | Boolean | Default false |
| Hauling Vendor | Text | No — nama vendor hauling |
| Hauling Distance (km) | Number | No |
| Hauling Cost (IDR/MT) | Number | No |
| Hauling Lead Time (days) | Number | No — estimasi waktu hauling |
| Hauling Notes | Text | No |

#### Section E: Harga & Logistik

| Field | Type | Required |
|-------|------|----------|
| FOB Barge Only | Toggle | No |
| Requires Transshipment | Toggle | No |
| Price Linked Index | Text | No |
| FOB Barge Price USD | Decimal | No |
| FOB Barge Price IDR | Decimal | No |
| Jetty/Port | Text | No |
| Anchorage | Text | No |

#### Section F: KYC, PSI & Kontak

| Field | Type | Required |
|-------|------|----------|
| KYC Status | Dropdown (not_started/in_progress/completed) | No |
| PSI Status | Dropdown (not_started/in_progress/completed) | No |
| Contact Person | Text | No |
| Phone | Text | No |
| Email | Text | No |

**Acceptance Criteria:**
- `AC-SRC-003`: RKAB Remaining dan Kuota Remaining dihitung otomatis
- `AC-SRC-004`: COB field tersedia dan editable oleh Source Team
- `AC-SRC-005`: Cargo Readiness Status wajib diisi sebelum source bisa diassign ke shipment

---

### FR-SRC-005: Source Confirmation Workflow (Status: Done)
**Priority:** High

Source request dari Shipment Monitor → Source Team menerima notifikasi → Source Team mengisi data konfirmasi dan submit result.

**Output status cargo readiness:**
- `ready` — cargo siap, RKAB aman, kuota aman
- `partial_ready` — sebagian siap, sebagian masih proses
- `not_ready` — belum siap, ada kendala
- `legal_pending` — menunggu dokumen legal (IUP/RKAB/kuota)

**Business Rules:**
- `BR-SRC-001`: Status `not_ready` atau `legal_pending` **wajib** mengisi reason dan estimated readiness date
- `BR-SRC-002`: Source Team hanya sampai konfirmasi sourcing. Final TB/BG nomination dan barge change **dipegang Sales/Traffic Team**
- `BR-SRC-003`: Source change pada shipment aktif → wajib melalui Source Change Traceability di Shipment Monitor (bukan edit langsung)
- `BR-SRC-004`: Source tidak bisa diassign ke shipment baru jika `iupOpStatus = expired`
- `BR-SRC-005`: Jika RKAB Remaining < qty yang diminta, sistem wajib menampilkan warning (bukan block)
- `BR-SRC-006`: Jika Kuota Export Remaining < qty yang diminta, sistem wajib menampilkan warning (bukan block)

**Acceptance Criteria:**
- `AC-SRC-006`: Source dengan IUP expired tidak bisa dipilih di shipment (disabled di dropdown dengan keterangan)
- `AC-SRC-007`: Warning RKAB dan kuota tampil saat source dipilih di Shipment Monitor
- `AC-SRC-008`: Cargo Readiness update bisa dilakukan langsung dari halaman Source tanpa buka Shipment Monitor

---

### FR-SRC-006: Source Issue Log (Status: Done — /api/sources/:id/issues GET/POST/PATCH, SourceIssue model in schema)
**Priority:** High

Log masalah yang terjadi di level source/supplier (bukan di level shipment). Issue ini bersifat supplier-wide, bukan per shipment.

| Field | Type | Required |
|-------|------|----------|
| Issue ID | UUID (auto) | Yes |
| Source ID | FK | Yes |
| Issue Category | Enum | Yes |
| Title | String | Yes |
| Description | Text | Yes |
| Impact | Text | Yes |
| Severity | Enum (critical/warning/info) | Yes |
| PIC | FK (User) | Yes |
| Reported By | FK (User) | Yes |
| Reported Date | DateTime | Yes |
| Status | Enum (open/in_progress/resolved/closed) | Yes |
| Resolution Notes | Text | Conditional |
| Resolved Date | Date | Conditional |
| Evidence | File Upload | Optional |
| Linked Shipments | FK[] | Optional — shipment yang terdampak |

**Issue Categories:** Legal issue (IUP/RKAB), Stock shortage, Quality issue, Hauling issue, Cargo readiness, Price dispute, Force majeure, Other

**Business Rules:**
- `BR-SRC-007`: Issue dengan severity `critical` akan tampil di Dashboard Blocker (kategori Source)
- `BR-SRC-008`: Source dengan open critical issue akan ditandai di list view dengan badge merah
- `BR-SRC-009`: Issue log tidak bisa dihapus (closed, bukan deleted)
- `BR-SRC-010`: Linked shipments otomatis mendapat notifikasi jika issue baru dibuat dengan severity critical

**Acceptance Criteria:**
- `AC-SRC-009`: User dapat add issue dari detail view source
- `AC-SRC-010`: Critical issue muncul di Dashboard Blocker
- `AC-SRC-011`: Source dengan critical issue ditandai jelas di list

---

### FR-SRC-007: Report Export (Status: Done)
**Priority:** Low

Export data supplier ke laporan (ReportModal).

---

## 3. Data Model

### Entity: Source

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| id | UUID | Yes | Primary key |
| name | String | Yes | Nama supplier |
| region | String | Optional | Wilayah operasi |
| calorieRange | String | Optional | Rentang kalori |
| iupNumber | String | Optional | Nomor IUP OP |
| iupOpStatus | Enum | Optional | active/expired/pending |
| iupExpiryDate | Date | Optional | Tanggal kadaluarsa IUP |
| rkabYear | Number | Optional | Tahun RKAB |
| rkabVolume | Number | Optional | Volume kuota RKAB (MT) |
| rkabUsed | Number | Optional | RKAB terpakai (MT) |
| kuotaExportTotal | Number | Optional | Kuota ekspor total (MT) |
| kuotaExportUsed | Number | Optional | Kuota ekspor terpakai (MT) |
| contractType | String | Optional | Jenis kontrak |
| specGar | Number | Optional | GAR |
| specTs | Number | Optional | Total Sulphur (%) |
| specAsh | Number | Optional | Ash (%) |
| specTm | Number | Optional | Total Moisture (%) |
| specIm | Number | Optional | Inherent Moisture (%) |
| specFc | Number | Optional | Fixed Carbon (%) |
| specAdb | Number | Optional | Air Dried Basis |
| specNar | Number | Optional | Net As Received |
| stockAvailable | Number | Optional | Stok tersedia (MT) |
| minStockAlert | Number | Optional | Threshold alert stok |
| stockLocations | JSON | Optional | Array: {name, qty, condition} |
| cobMt | Number | Optional | Cargo on Barge (MT) |
| cobUpdatedAt | DateTime | Optional | Waktu update COB |
| cobNotes | Text | Optional | Catatan COB |
| cargoReadinessStatus | Enum | Optional | ready/partial_ready/not_ready/legal_pending |
| cargoReadinessNotes | Text | Optional | Catatan cargo readiness |
| haulingRequired | Boolean | Default false | Perlu hauling |
| haulingVendor | String | Optional | Nama vendor hauling |
| haulingDistanceKm | Number | Optional | Jarak hauling (km) |
| haulingCostIdrPerMt | Number | Optional | Biaya hauling (IDR/MT) |
| haulingLeadTimeDays | Number | Optional | Lead time hauling (hari) |
| haulingNotes | Text | Optional | Catatan hauling |
| fobBargeOnly | Boolean | Default false | Hanya FOB barge |
| requiresTransshipment | Boolean | Default false | Perlu transshipment |
| priceLinkedIndex | String | Optional | Index harga terkait |
| fobBargePriceUsd | Decimal | Optional | Harga FOB USD |
| fobBargePriceIdr | Decimal | Optional | Harga FOB IDR |
| jettyPort | String | Optional | Pelabuhan/jetty |
| anchorage | String | Optional | Tempat berlabuh |
| kycStatus | Enum | Default not_started | KYC status |
| psiStatus | Enum | Default not_started | PSI status |
| contactPerson | String | Optional | Kontak |
| phone | String | Optional | Telepon |
| email | String | Optional | Email |
| notes | Text | Optional | Catatan umum |
| createdAt | DateTime | Yes | Auto |
| updatedAt | DateTime | Yes | Auto |

**Computed fields:**
- `rkabRemaining` = `rkabVolume - rkabUsed`
- `kuotaExportRemaining` = `kuotaExportTotal - kuotaExportUsed`

### Entity: SourceIssue

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| sourceId | FK (Source) | Yes |
| category | Enum | Yes |
| title | String | Yes |
| description | Text | Yes |
| impact | Text | Yes |
| severity | Enum (critical/warning/info) | Yes |
| picId | FK (User) | Yes |
| reportedById | FK (User) | Yes |
| reportedDate | DateTime | Yes |
| status | Enum (open/in_progress/resolved/closed) | Yes |
| resolutionNotes | Text | Optional |
| resolvedDate | Date | Optional |
| evidenceFileUrl | String | Optional |
| linkedShipmentIds | UUID[] | Optional |

---

## 4. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/sources` | List sources (filtered, paginated) |
| GET | `/api/sources/:id` | Get source detail |
| POST | `/api/sources` | Create source |
| PUT | `/api/sources/:id` | Update source |
| DELETE | `/api/sources/:id` | Delete source |
| GET | `/api/sources/alerts` | Low stock alerts |
| PATCH | `/api/sources/:id/cob` | Update COB data |
| PATCH | `/api/sources/:id/readiness` | Update cargo readiness |
| GET | `/api/sources/:id/issues` | List issues for source |
| POST | `/api/sources/:id/issues` | Create issue |
| PUT | `/api/sources/:id/issues/:issueId` | Update issue |

---

## 5. Integration Points

| Modul | Hubungan |
|-------|----------|
| Blending | Load spec dari source |
| Shipment Monitor | Source assignment, warning RKAB/kuota, Source Change Traceability |
| Dashboard | Stock inventory widget, Blocker: Source (open critical issue, low stock) |
| Forecast Sales | Supplier candidates per project |
| Market Price | FOB Barge Price vs market index comparison |
| Quality | Source estimate spec |
| Directory | Source perusahaan bisa link ke Partners & Directory |
| Audit Logs | IUP/RKAB change, cargo readiness change dicatat |

---

*End of SRS_08_Sources_Supplier — v2.1*

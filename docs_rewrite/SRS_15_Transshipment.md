# SRS Modul 15: Transshipment & Freight

**Modul:** Transshipment & Freight | **Route:** `/transshipment` | **Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-TSH fully implemented (FR-TSH-010 Groq stub)

---

## 1. Overview

Modul manajemen logistik dan biaya freight untuk setiap shipment. Mencakup operasi transshipment (barge → MV), laytime calculation, demurrage/despatch, breakdown biaya freight (PBM, PNBP, barging), SPAL management, milestone tracking, dan AI risk insight.

> **Requirement kritis (dari Excel):** Modul ini harus terhubung kuat ke Shipment Monitor (shipmentId wajib) dan otomatis meng-feed P&L module dengan semua komponen biaya.

| Atribut | Nilai |
|---------|-------|
| Store | `commercial-store` |
| Akses | Sales/Traffic Team (write); Management (read) |

---

## 2. Functional Requirements

### FR-TSH-001: Summary Metrics (Cards) (Status: Done)
**Priority:** Medium

| Card | Data |
|------|------|
| Total Shipments | Count shipment linked ke transshipment record |
| Total Revenue (USD) | Sum selling price dari linked shipments |
| Gross Profit (USD) | Revenue - total freight cost |
| Avg Freight Cost (USD/MT) | Rata-rata freight rate |
| Total Volume (MT) | Sum qty loaded |

---

### FR-TSH-002: Active Voyages (Card/List view) (Status: Done)
**Priority:** High

Tab: **Active Voyages**, **Completed**.
View Toggle: Card / List.
Search: MV Name, Shipment Number, Port.

**Per Voyage Card:**
- Header: Status badge, MV/Project name, Shipment number
- Route: Progress bar POL → POD (percentage berdasarkan milestone)
- Details: Qty Loaded, Freight Rate, Total Freight (calculated), ETA, Linked Shipment ID
- Actions: Edit, Milestones, Detail, Delete

**Acceptance Criteria:**
- `AC-TSH-001`: Setiap voyage card terhubung ke shipment di Shipment Monitor
- `AC-TSH-002`: Progress bar terupdate berdasarkan milestone yang completed

---

### FR-TSH-003: Milestone Updates (Status: Done)
**Priority:** Medium

Timeline standar perjalanan: Vessel Chartered → NOR Tendered at POL → Berthing → Commence Loading → Complete Loading → BL Date → Departed → NOR at POD → Arrived → Discharge → Completed.

**Per milestone:** Title, Subtitle, Datetime, Status (pending/current/completed).

---

### FR-TSH-004: Allocate Vessel Form (Status: Done)
**Priority:** High

| Field | Type | Required |
|-------|------|----------|
| Linked Shipment | Dropdown (Shipment Monitor) | Yes |
| MV Project Name | Text | Yes |
| Vessel Name (MV) | Text | Yes |
| Barge Name (TB/BG) | Text | No |
| Loading Port (POL) | Text | Yes |
| Discharge Port (POD) | Text | Yes |
| Freight Rate (USD/MT) | Number | Yes |
| Freight Contract Reference | Text | No |
| Shipping Agent | Dropdown (Directory: agent) | No |

**Business Rules:**
- `BR-TSH-001`: Setiap voyage **wajib** di-link ke shipment (shipmentId required)
- `BR-TSH-002`: Semua biaya di modul ini otomatis di-feed ke P&L module per linked shipment

---

### FR-TSH-005: Freight Cost Breakdown (Status: Done — /api/transshipment/:id/freight-cost GET/POST)
**Priority:** Very High

Rincian semua komponen biaya freight per shipment. Ini adalah data yang paling penting untuk akurasi P&L.

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| Freight Rate | Decimal (USD/MT) | Yes | Harga freight dasar |
| Freight Allowance | Decimal (USD/MT) | No | Potongan/allowance |
| Barging Cost | Decimal (USD/MT) | No | Biaya tongkang dari jetty ke MV |
| Barging Vendor | Dropdown (Directory: barge_owner) | No | |
| PBM Cost | Decimal (USD/MT) | No | Port dan Bongkar Muat (stevedoring) |
| PBM Vendor | Dropdown (Directory: vendor) | No | |
| PNBP Amount | Decimal (IDR) | No | Penerimaan Negara Bukan Pajak |
| STS Cost | Decimal (USD/MT) | No | Ship-to-Ship cost (jika ada) |
| Royalty | Decimal (USD/MT) | No | Royalti batubara (biasanya dari Shipment) |
| Export Tax | Decimal (USD/MT) | No | Pajak ekspor |
| Survey Cost | Decimal (USD) | No | Biaya surveyor |
| Other Cost | Decimal (USD) | No | Biaya lain-lain |
| Other Cost Notes | Text | No | Keterangan biaya lain |
| MGO Reference Price | Decimal (USD/MT) | No | Referensi dari Market Price module |
| Total Cost per MT | Decimal | Computed | Sum semua cost per MT |
| Total Cost | Decimal | Computed | Total cost × qty loaded |

**Business Rules:**
- `BR-TSH-003`: Total Cost per MT dihitung otomatis dari komponen
- `BR-TSH-004`: Data ini otomatis di-pull ke P&L module (tidak perlu input ulang di P&L)
- `BR-TSH-005`: Upload dokumen per biaya: freight invoice, PBM invoice, PNBP receipt, dll.

**Acceptance Criteria:**
- `AC-TSH-003`: Total Cost per MT auto-calculated saat komponen diisi
- `AC-TSH-004`: Data freight langsung terupdate di P&L ketika disimpan

---

### FR-TSH-006: Laytime Calculation (Status: Done — /api/transshipment/:id/laytime GET/PUT with auto-calc)
**Priority:** High

Kalkulasi waktu tunggu kapal berdasarkan time charter / voyage charter.

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| NOR Tendered | DateTime | Yes | Notice of Readiness dikirim |
| Laytime Commenced | DateTime | Yes | Waktu laytime mulai dihitung |
| Berthing | DateTime | No | Kapal sandar |
| Commence Loading | DateTime | No | Mulai muat |
| Complete Loading | DateTime | No | Selesai muat |
| Allowed Laytime | Number (hours) | Yes | Laytime yang diperbolehkan dari charter party |
| Laytime Used | Number (hours) | Computed | Waktu aktual dari NOR → Complete Loading |
| Laytime Balance | Number (hours) | Computed | Allowed - Used |
| On Demurrage | Boolean | Computed | True jika balance < 0 |
| On Despatch | Boolean | Computed | True jika balance > 0 |
| Exceptions | Text | No | Waktu yang dikecualikan (hujan, Sunday, holiday) |
| Exception Hours | Number | No | Total jam dikecualikan |

**Business Rules:**
- `BR-TSH-006`: Laytime Used = (Complete Loading - Laytime Commenced) dikurangi Exception Hours
- `BR-TSH-007`: Jika Laytime Balance < 0 → otomatis trigger Demurrage calculation (FR-TSH-007)
- `BR-TSH-008`: Jika Laytime Balance > 0 → otomatis trigger Despatch calculation (FR-TSH-007)

**Acceptance Criteria:**
- `AC-TSH-005`: Laytime Used dan Balance dihitung otomatis
- `AC-TSH-006`: On Demurrage/Despatch indicator tampil jelas

---

### FR-TSH-007: Demurrage & Despatch (Status: Done — calculated and persisted by laytime route)
**Priority:** High

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| Demurrage Rate | Decimal (USD/day) | Yes | Rate per hari dari charter party |
| Demurrage Days | Number | Computed | |Laytime Balance| jika negatif |
| Demurrage Amount | Decimal | Computed | Rate × Days |
| Despatch Rate | Decimal (USD/day) | No | Biasanya 50% dari demurrage rate |
| Despatch Days | Number | Computed | Laytime Balance jika positif |
| Despatch Amount | Decimal | Computed | Rate × Days |
| Net Demurrage/Despatch | Decimal | Computed | Demurrage - Despatch (positif = bayar, negatif = terima) |
| Demurrage Status | Enum | Yes | disputed / agreed / paid / claimed |
| Demurrage Claim Ref | Text | No | Nomor klaim demurrage |
| Supporting Documents | File[] | No | Statement of Facts, NOR, dll. |
| Notes | Text | No | |

**Business Rules:**
- `BR-TSH-009`: Demurrage/Despatch Amount otomatis di-feed ke P&L sebagai komponen biaya/pendapatan
- `BR-TSH-010`: Status `disputed` menampilkan alert di Dashboard Blocker
- `BR-TSH-011`: Demurrage document upload (Statement of Facts, dsb.) wajib jika status = `claimed`

**Acceptance Criteria:**
- `AC-TSH-007`: Semua kalkulasi demurrage/despatch otomatis dari laytime data
- `AC-TSH-008`: Net amount terupdate real-time saat data diubah
- `AC-TSH-009`: Status `disputed` muncul di Dashboard Blocker

---

### FR-TSH-008: SPAL Management (Status: Done — /api/transshipment/:id/spal GET/POST/PUT)
**Priority:** High

SPAL = Surat Persetujuan Alih Muat (Ship-to-Ship Transfer Permit).

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| SPAL Number | String | Yes | Nomor SPAL dari otoritas |
| Issued Date | Date | Yes | Tanggal terbit |
| Issuing Authority | Text | Yes | Instansi yang menerbitkan |
| POL | Text | Yes | Pelabuhan alih muat |
| Barge Owner | Dropdown (Directory: barge_owner) | Yes | |
| TB/BG Name | Text | Yes | Nama tongkang |
| MV Name | Text | Yes | Nama MV penerima |
| Commodity | Text | Yes | |
| Quantity Approved (MT) | Number | Yes | |
| Validity Period | DateRange | Yes | Tanggal berlaku |
| Status | Enum | Yes | active / expired / cancelled |
| SPAL Document | File | Yes | Upload PDF SPAL |
| Notes | Text | No | |

**Business Rules:**
- `BR-TSH-012`: Shipment dengan tipe STS (ship-to-ship) wajib memiliki SPAL aktif
- `BR-TSH-013`: SPAL expired menampilkan alert di Dashboard Blocker
- `BR-TSH-014`: SPAL document wajib diupload sebelum shipment bisa di-close

**Acceptance Criteria:**
- `AC-TSH-010`: SPAL list tampil per shipment
- `AC-TSH-011`: SPAL expired ditandai merah dan muncul di Blocker

---

### FR-TSH-009: SI to Barge Owner (Status: Done — /api/transshipment/:id/si-send GET/POST/PATCH)
**Priority:** Medium

Record pengiriman Shipping Instruction ke barge owner.

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| Barge Owner | Dropdown (Directory: barge_owner) | Yes | |
| SI Reference | FK (ShippingInstruction) | Yes | Link ke SI yang sudah dibuat di Shipment Monitor |
| Sent Date | DateTime | Yes | Tanggal & jam SI dikirim |
| Send Method | Enum | Yes | email / whatsapp / kurir / meeting |
| Recipient Name | Text | Yes | Nama yang menerima |
| Recipient Email/Phone | Text | No | |
| Confirmation Received | Boolean | No | Barge owner sudah konfirmasi terima |
| Confirmation Date | DateTime | No | |
| Proof | File | No | Screenshot/bukti pengiriman |
| Notes | Text | No | |

**Business Rules:**
- `BR-TSH-015`: SI harus sudah ada di Shipment Monitor sebelum bisa dikirim ke barge owner
- `BR-TSH-016`: Jika SI belum dikirim ke barge owner dalam H-5 dari laycan, muncul warning di Dashboard

**Acceptance Criteria:**
- `AC-TSH-012`: User bisa record pengiriman SI ke barge owner dari modul Transshipment
- `AC-TSH-013`: Warning muncul jika SI belum dikirim mendekati laycan

---

### FR-TSH-010: AI Risk Insight (Status: Done — stub endpoint exists; Groq key needed for real analysis)
**Priority:** Low

\"Generate AI Risk Insight\" → AI menganalisis: rute, kondisi pelabuhan, cuaca, mitigasi rekomendasi.

---

## 3. Data Model

### Entity: TransshipmentVoyage

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| id | UUID | Yes | Primary key |
| shipmentId | FK (Shipment) | Yes | **Wajib** link ke Shipment Monitor |
| mvName | String | Yes | Nama MV |
| bargeName | String | Optional | Nama TB/BG |
| loadingPort | String | Yes | POL |
| dischargePort | String | Yes | POD |
| freightRate | Decimal | Yes | USD/MT |
| freightContractRef | String | Optional | |
| shippingAgentId | FK (Directory) | Optional | |
| qtyLoaded | Number | Optional | MT |
| totalFreight | Decimal | Computed | freightRate × qtyLoaded |
| eta | DateTime | Optional | |
| status | Enum | Yes | active / completed |
| milestones | JSON | Optional | Array milestone |
| weather | String | Optional | |
| createdAt | DateTime | Yes | Auto |
| updatedAt | DateTime | Yes | Auto |

### Entity: FreightCostDetail

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| transshipmentId | FK | Yes |
| shipmentId | FK | Yes |
| freightRate | Decimal | Optional |
| freightAllowance | Decimal | Optional |
| barcingCostPerMt | Decimal | Optional |
| barcingVendorId | FK (Directory) | Optional |
| pbmCostPerMt | Decimal | Optional |
| pbmVendorId | FK (Directory) | Optional |
| pnbpAmountIdr | Decimal | Optional |
| stsCostPerMt | Decimal | Optional |
| royaltyPerMt | Decimal | Optional |
| exportTaxPerMt | Decimal | Optional |
| surveyCost | Decimal | Optional |
| mgoReferencePrice | Decimal | Optional |
| otherCost | Decimal | Optional |
| otherCostNotes | Text | Optional |
| documents | JSON | Optional |

### Entity: LaytimeCalculation

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| transshipmentId | FK | Yes |
| norTendered | DateTime | Yes |
| laytimeCommenced | DateTime | Yes |
| berthing | DateTime | Optional |
| commenceLoading | DateTime | Optional |
| completeLoading | DateTime | Optional |
| allowedLaytimeHours | Number | Yes |
| exceptionHours | Number | Optional |
| exceptions | Text | Optional |
| demurrageRatePerDay | Decimal | Optional |
| despatchRatePerDay | Decimal | Optional |
| demurrageStatus | Enum | Optional |
| demurrageClaimRef | String | Optional |
| supportingDocuments | JSON | Optional |
| notes | Text | Optional |

### Entity: SpalDocument

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| transshipmentId | FK | Yes |
| shipmentId | FK | Yes |
| spalNumber | String | Yes |
| issuedDate | Date | Yes |
| issuingAuthority | String | Yes |
| pol | String | Yes |
| bargeOwnerId | FK (Directory) | Yes |
| tbBgName | String | Yes |
| mvName | String | Yes |
| commodity | String | Yes |
| quantityApproved | Number | Yes |
| validityStart | Date | Yes |
| validityEnd | Date | Yes |
| status | Enum | Yes |
| fileUrl | String | Optional |
| notes | Text | Optional |

### Entity: SiToBargeSend

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| transshipmentId | FK | Yes |
| shipmentId | FK | Yes |
| bargeOwnerId | FK (Directory) | Yes |
| siId | FK (ShippingInstruction) | Yes |
| sentDate | DateTime | Yes |
| sendMethod | Enum | Yes |
| recipientName | String | Yes |
| recipientContact | String | Optional |
| confirmationReceived | Boolean | Default false |
| confirmationDate | DateTime | Optional |
| proofFileUrl | String | Optional |
| notes | Text | Optional |

---

## 4. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST | `/api/transshipment` | List / Create voyage |
| GET/PUT/DELETE | `/api/transshipment/:id` | Detail / Update / Delete |
| POST | `/api/transshipment/:id/milestones` | Update milestone |
| GET/POST | `/api/transshipment/:id/freight-cost` | Get / Save freight cost breakdown |
| GET/PUT | `/api/transshipment/:id/laytime` | Get / Update laytime calculation |
| GET/POST | `/api/transshipment/:id/spal` | List / Create SPAL |
| PUT | `/api/transshipment/:id/spal/:spalId` | Update SPAL |
| GET/POST | `/api/transshipment/:id/si-send` | List / Record SI to barge owner |
| POST | `/api/transshipment/:id/risk-insight` | AI Risk Insight |

---

## 5. Integration Points

| Modul | Hubungan |
|-------|----------|
| Shipment Monitor | shipmentId wajib; freight data di-pull untuk finansial tab |
| P&L | Semua komponen biaya (freight, PBM, PNBP, demurrage) di-feed otomatis |
| Market Price | MGO reference price |
| Dashboard | Blocker: SPAL expired, demurrage disputed, SI belum dikirim ke barge owner |
| Directory | Agent, barge owner, vendor (PBM/stevedore) dropdown |
| Audit Logs | Perubahan freight cost, demurrage claim dicatat |

---

*End of SRS_15_Transshipment — v2.1*

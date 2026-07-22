# SRS Modul 22: Approval Center

**Modul:** Approval Center | **Route:** `/approval-center` | **Versi:** 1.0
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-APC fully implemented

---

## 1. Overview

### 1.1 Deskripsi

Approval Center adalah **halaman terpusat untuk CEO/management** melihat dan memproses semua pending approval dari seluruh modul. CEO tidak perlu membuka modul terpisah (Forecast Sales, Shipment Monitor, dll.) untuk approve setiap item — semua aggregated di satu tempat.

> **Requirement dari Excel:** "Biar CEO tidak lewat WA saja" — semua approval (FCO, SI early, SI revision, source change) harus bisa diproses dari satu halaman.

### 1.2 Route & Access

| Atribut | Nilai |
|---------|-------|
| Route | `/approval-center` |
| Akses | CEO, DIRUT, ASS_DIRUT (**restricted**) |
| Store | Aggregated dari semua modul |
| Sidebar | Tampil dengan badge count pending approval |

---

## 2. Functional Requirements

### FR-APC-001: Approval Queue (Main View) (Status: Done)
**Priority:** Very High

Daftar semua pending approval, diurutkan berdasarkan urgency (due date / laycan terdekat).

**Tab Filter:**

| Tab | Isi |
|-----|-----|
| All Pending | Semua pending approval |
| FCO / Offer | Pending dari Forecast Sales |
| SI Early | SI sebelum H-10 (perlu CEO acknowledgment) |
| SI Revision | Revisi SI yang sudah diterbitkan |
| Source Change | Perubahan source pada shipment aktif |
| High Risk Issue | Issue level Critical dari Shipment Monitor |

**Summary Cards:**

| Card | Data |
|------|------|
| Total Pending | Count semua approval belum diproses |
| FCO/Offer | Count pending FCO |
| SI (Early/Revision) | Count pending SI action |
| Source Change | Count pending source change |
| Urgent (≤3 hari) | Count yang laycan/deadline ≤3 hari dari sekarang |

**Acceptance Criteria:**
- `AC-APC-001`: Approval queue diurutkan: urgency (deadline paling dekat) dulu, lalu created_at
- `AC-APC-002`: Badge count di sidebar terupdate real-time
- `AC-APC-003`: Tab filter memfilter approval berdasarkan type
- `AC-APC-004`: Urgent item (≤3 hari) ditandai dengan badge merah

---

### FR-APC-002: Approval Item Card (Status: Done)
**Priority:** Very High

Setiap item approval ditampilkan sebagai card dengan informasi kontekstual.

**Komponen per Card:**

| Elemen | Deskripsi |
|--------|-----------|
| Type Badge | FCO / SI Early / SI Revision / Source Change / Issue |
| Urgency Badge | Urgent / Normal (berdasarkan deadline) |
| Title | Nama project / Shipment number / SI number |
| Requester | Nama user yang request + role |
| Request Date | Tanggal dan jam request |
| Deadline / Laycan | Tanggal yang relevan (laycan start untuk SI, dll.) |
| Summary | Ringkasan singkat (max 2 baris) |
| Reason | Alasan request (mandatory saat submit) |
| Evidence | Link download dokumen pendukung (jika ada) |
| Context Link | \"Open in [Modul]\" — link ke halaman sumber |
| Action Buttons | **Approve** (hijau) / **Reject** (merah) / **Request Clarification** (abu-abu) |

**Acceptance Criteria:**
- `AC-APC-005`: Setiap card menampilkan semua informasi relevan tanpa harus buka modul lain
- `AC-APC-006`: \"Open in [Modul]\" membuka modul asal di tab baru dengan context (pre-selected record)
- `AC-APC-007`: Action buttons hanya tersedia untuk authorized role

---

### FR-APC-003: Approval Types & Context (Status: Done)

Setiap tipe approval memiliki context yang ditampilkan di card:

#### 3a. FCO / Offer Approval (dari Forecast Sales)

| Field | Deskripsi |
|-------|-----------|
| Project Name | Nama Forecast Sales project |
| Buyer | Nama buyer + negara |
| Quantity | MT |
| Target Price | USD/MT |
| Laycan | Range laycan |
| Rough Margin | Estimasi margin (restricted view) |
| Documents | FCO PDF (jika sudah generated), MoM (jika ada) |

**Approve action:** Set `forecastSales.status = approved` → system notify requester.

#### 3b. SI Early Approval (dari Shipment Monitor)

| Field | Deskripsi |
|-------|-----------|
| Shipment Number | Nomor shipment |
| Buyer | Buyer |
| Laycan | Range laycan |
| SI Date | Tanggal SI dibuat |
| H-Count | Berapa hari sebelum laycan start (misal: H-15) |
| Reason | Alasan early SI |
| SI Preview | Link preview / download SI PDF |

**Approve action:** Set `SI.approvalStatus = approved` + catat `approvedBy`, `approvedAt`, `approvalComment`.

> **Note:** Ini adalah "acknowledgment" — CEO mengakui dan menyetujui SI dikirim lebih awal dari aturan normal (H-10).

#### 3c. SI Revision Approval (dari Shipment Monitor)

| Field | Deskripsi |
|-------|-----------|
| Shipment Number | Nomor shipment |
| SI Number | Nomor SI |
| SI Version | Dari versi → ke versi |
| Changes Summary | Field apa yang berubah (diff) |
| Reason for Revision | Alasan revisi |
| Evidence | Dokumen pendukung (jika ada) |
| Old SI | Link SI versi lama |
| New SI Draft | Link SI versi baru |

**Approve action:** Set `SI.approvalStatus = approved` untuk version baru. Old version tetap tersimpan.

#### 3d. Source Change Approval (dari Shipment Monitor)

| Field | Deskripsi |
|-------|-----------|
| Shipment Number | Nomor shipment |
| Current Source | Source yang sedang aktif |
| Current Supplier | Supplier yang sedang aktif |
| Requested Source | Source baru yang diminta |
| Requested Supplier | Supplier baru |
| Reason Category | Kategori alasan |
| Reason Detail | Penjelasan detail |
| Impact | Dampak ke jadwal/kualitas/harga |
| New Contract Status | Status kontrak source baru |
| Evidence | Dokumen pendukung |

**Approve action:** Set `SourceChangeLog.ceoApprovalStatus = approved` + aktifkan versi source baru di shipment.

#### 3e. High Risk Issue Acknowledgment (dari Shipment Monitor)

| Field | Deskripsi |
|-------|-----------|
| Shipment Number | Nomor shipment |
| Issue Category | Kategori issue |
| Severity | Critical |
| Description | Penjelasan issue |
| Impact | Dampak operasional/finansial |
| Action Plan | Rencana mitigasi dari tim |
| PIC | PIC yang handle |

**Acknowledge action:** Set `Issue.ceoAcknowledged = true` + catat timestamp. Bukan approve/reject — hanya acknowledging awareness.

---

### FR-APC-004: Inline Approval Action (Status: Done)
**Priority:** Very High

CEO bisa approve/reject langsung dari Approval Center **tanpa buka modul asal**.

**Saat Approve:**
1. Modal konfirmasi muncul: "Konfirmasi Approve [Type] untuk [Title]?"
2. Optional: CEO bisa tambahkan comment/catatan
3. Submit → sistem update status di modul asal + create audit log entry
4. Requester mendapat notifikasi in-app

**Saat Reject:**
1. Modal muncul dengan field **Reason for Rejection** (wajib isi)
2. Submit → status di modul asal diupdate + create audit log + notify requester

**Saat Request Clarification:**
1. CEO bisa ketik pertanyaan/request info tambahan
2. Requester mendapat notifikasi + Approval item status berubah ke "Pending Clarification"

**Business Rules:**
- `BR-APC-001`: Approval action **wajib** dicatat di Audit Log (changedBy, timestamp, comment)
- `BR-APC-002`: Requester mendapat notifikasi in-app setelah CEO action
- `BR-APC-003`: Reject **wajib** ada reason — tidak bisa reject tanpa alasan
- `BR-APC-004`: Item yang sudah approved/rejected dipindah ke Approval History (tidak hilang)
- `BR-APC-005`: CEO bisa undo approval dalam 5 menit jika belum ada action downstream (grace period)

**Acceptance Criteria:**
- `AC-APC-008`: Approve/reject bisa dilakukan tanpa meninggalkan halaman Approval Center
- `AC-APC-009`: Status modul asal terupdate real-time setelah action
- `AC-APC-010`: Requester mendapat notifikasi
- `AC-APC-011`: Reject tanpa reason = disabled (button greyed out sampai reason diisi)

---

### FR-APC-005: Approval History (Status: Done — /api/approval-center/history GET + History toggle in approval-center page)
**Priority:** High

Riwayat semua approval yang sudah diproses (Approved / Rejected / Acknowledged).

| Kolom | Deskripsi |
|-------|-----------|
| Date | Tanggal action |
| Type | FCO / SI Early / SI Revision / Source Change / Issue |
| Title | Nama project/shipment |
| Requester | Yang request |
| Decision | Approved / Rejected / Acknowledged |
| Decided By | CEO/DIRUT yang action |
| Comment | Catatan dari CEO |
| Time to Decision | Berapa jam/hari dari request ke decision |

**Filter:** Type, Decision, Date Range, Requester.

**Acceptance Criteria:**
- `AC-APC-012`: History tampil di tab terpisah dari queue
- `AC-APC-013`: Klik item membuka detail lengkap (read-only)
- `AC-APC-014`: Export history ke CSV tersedia (CEO/DIRUT only)

---

### FR-APC-006: Approval Notification & Reminder (Status: Done — sidebar badge count via /api/approval-center/count)
**Priority:** Medium

Sistem reminder untuk approval yang pending terlalu lama.

| Kondisi | Action |
|---------|--------|
| Approval pending > 24 jam | In-app notification ke CEO |
| Approval pending > 48 jam | Dashboard Blocker alert: "X approval menunggu > 48 jam" |
| Approval dengan laycan ≤3 hari | Urgent badge + prioritas di atas queue |

**Business Rules:**
- `BR-APC-006`: Reminder tidak blokir operasional — hanya notifikasi
- `BR-APC-007`: Count pending approval tampil di sidebar nav badge

**Acceptance Criteria:**
- `AC-APC-015`: Badge di sidebar menampilkan count pending real-time
- `AC-APC-016`: Dashboard Blocker menampilkan approval yang stale (>48 jam)

---

## 3. Data Model

> Approval Center adalah **aggregated view** — tidak membuat tabel baru. Semua data berasal dari entity yang sudah ada.

### Aggregated Sources

| Approval Type | Source Table | Condition |
|--------------|-------------|-----------|
| FCO / Offer | `ForecastSales` | `status = waiting_approval` |
| SI Early | `ShippingInstruction` | `approvalStatus = pending AND isEarly = true` |
| SI Revision | `ShippingInstruction` | `approvalStatus = pending AND version > 1` |
| Source Change | `SourceChangeLog` | `ceoApprovalStatus = pending` |
| High Risk Issue | `ShipmentIssue` | `severity = critical AND ceoAcknowledged = false` |

### View: ApprovalQueueItem (Virtual/API Response)

| Field | Type | Keterangan |
|-------|------|------------|
| id | UUID | ID dari entity asal |
| type | Enum | fco / si_early / si_revision / source_change / issue |
| title | String | Nama display (project/shipment/SI number) |
| requesterId | FK (User) | |
| requesterName | String | |
| requestedAt | DateTime | |
| deadline | DateTime | Laycan start / due date |
| urgencyLevel | Enum | urgent / normal |
| summary | String | Ringkasan singkat |
| reason | Text | Alasan dari requester |
| evidenceUrl | String | |
| sourceModule | String | forecast_sales / shipment_monitor |
| sourceEntityId | UUID | ID entity di modul asal |
| status | Enum | pending / pending_clarification / approved / rejected / acknowledged |

---

## 4. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/approval-center` | Approval queue (pending, sorted by urgency) |
| GET | `/api/approval-center/history` | Approval history (processed) |
| GET | `/api/approval-center/count` | Count per type (untuk sidebar badge) |
| POST | `/api/approval-center/:id/approve` | Approve item |
| POST | `/api/approval-center/:id/reject` | Reject item (wajib reason) |
| POST | `/api/approval-center/:id/acknowledge` | Acknowledge (untuk Issue type) |
| POST | `/api/approval-center/:id/clarify` | Request clarification |
| GET | `/api/approval-center/history/export` | CSV export (CEO only) |

---

## 5. UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: "Approval Center" [Badge: X pending]            │
├─────────────────────────────────────────────────────────┤
│ SUMMARY CARDS: [Total] [FCO] [SI] [Source] [Urgent]    │
├─────────────────────────────────────────────────────────┤
│ TABS: [All Pending ✦] [FCO] [SI Early] [SI Revision]   │
│        [Source Change] [High Risk Issue] | [History]    │
├─────────────────────────────────────────────────────────┤
│ APPROVAL QUEUE (sorted by urgency)                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🔴 URGENT  [Source Change]  SH-2026-042         │   │
│ │ PT Sumber Alam → PT Maju Jaya                   │   │
│ │ Laycan: 14 Jul (3 hari lagi)                    │   │
│ │ Reason: Stock shortage di lokasi lama           │   │
│ │ [Evidence ↓] [Open in Shipment Monitor ↗]      │   │
│ │                           [Clarify] [Reject] [✓ Approve] │
│ └──────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🟡 NORMAL  [SI Early]  SI-2026-038 v1           │   │
│ │ SH-2026-039 | PT Buyer ABC | Laycan: 18 Jul     │   │
│ │ H-12 dari laycan — early request                │   │
│ │ [Preview SI ↓]  [Open in Shipment Monitor ↗]   │   │
│ │                     [Clarify] [Reject] [✓ Acknowledge] │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. User Flow (CEO)

```
CEO buka /approval-center
  ├── Lihat summary cards (total pending, per type)
  ├── Lihat tab "All Pending" (sorted urgency)
  │     ├── Klik item → expand detail / lihat context
  │     ├── "Open in [Modul]" → buka modul asal jika perlu info lebih
  │     ├── Approve → modal konfirmasi + optional comment → submit
  │     ├── Reject → modal dengan reason wajib → submit
  │     └── Request Clarification → ketik pertanyaan → submit
  ├── Tab "History" → lihat semua decision yang sudah diambil
  └── Export History → CSV (audit compliance)
```

---

## 7. Integration Points

| Modul | Hubungan |
|-------|----------|
| Forecast Sales | FCO/Offer yang waiting_approval → Approval Center queue |
| Shipment Monitor | SI Early, SI Revision, Source Change yang pending → queue |
| Shipment Monitor | High Risk Issue (critical severity) → queue |
| Dashboard | Badge count pending approval + Blocker jika stale >48 jam |
| Audit Logs | Semua approval action dicatat (changedBy, timestamp, reason, comment) |
| Tasks | (Future) Approval task bisa diassign ke ASS_DIRUT untuk review awal |

---

*End of SRS_22_Approval_Center — v1.0*

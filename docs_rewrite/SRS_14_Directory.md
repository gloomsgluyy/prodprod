# SRS Modul 14: Partners & Directory

**Modul:** Partners & Directory | **Route:** `/directory` | **Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-DIR fully implemented

---

## 1. Overview

Pusat basis data (master data / CRM) untuk seluruh mitra bisnis dan pihak yang terlibat dalam operasi CoalTrade. Mencakup Buyer, Supplier, Surveyor, Lab, Agent, Barge Owner, Bank, Vendor, dan Internal PIC. Termasuk AI Due Diligence dan legal document tracking.

> **Tujuan utama (dari Excel requirement):** Menghindari input duplikasi — setiap modul yang membutuhkan data pihak luar **wajib** menggunakan dropdown/search dari Directory, bukan free-text manual.

| Atribut | Nilai |
|---------|-------|
| Store | `directory-store` |
| Akses | Semua role (write: Admin / Sales-Traffic) |

---

## 2. Functional Requirements

### FR-DIR-001: Directory Cards Grid (Status: Done)
**Priority:** High

Cards per partner menampilkan:
- **Header:** icon, nama perusahaan, badge tipe, status dot (active/inactive)
- **Detail:** region/lokasi, PIC, email, phone, fleet size (jika Fleet/Barge Owner)
- **Legalitas Box:** dokumen legal, tanggal kadaluarsa, status badge
- **AI Due Diligence Box:** risk level, skor

---

### FR-DIR-002: Tab Filter & Search (Status: Done — all 9 type values now accepted in API)
**Priority:** High

| Tab | Entity Types yang Tampil |
|-----|--------------------------|
| All | Semua |
| Buyer | buyer |
| Supplier | supplier, source |
| Surveyor & Lab | surveyor, lab |
| Agent | agent |
| Barge Owner | barge_owner |
| Bank | bank |
| Vendor | vendor |
| Internal PIC | internal_pic |

Search: by company name, PIC name, atau region.

**Acceptance Criteria:**
- `AC-DIR-001`: Tab filter memfilter data berdasarkan entity type
- `AC-DIR-002`: Search berfungsi real-time (debounce 250ms)
- `AC-DIR-003`: Inactive partner ditampilkan dengan opacity/badge berbeda (tidak disembunyikan)

---

### FR-DIR-003: Add/Edit Partner Form (Status: Done — partner type enum expanded to 9 types)
**Priority:** High

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| Tipe Mitra | Dropdown | Yes | Lihat daftar type di bawah |
| Status | Radio (Active/Inactive) | Yes | Default: Active |
| Nama Perusahaan | Text | Yes | |
| Nama Individu / PIC | Text | Conditional | Wajib jika bukan perusahaan |
| Entity Type | Radio (Perusahaan/Individu) | Yes | |
| Region / Lokasi | Text | No | |
| Nama PIC (contact) | Text | Yes | Nama kontak person |
| Email | Text | No | |
| Phone | Text | No | |
| NPWP | Text | No | Untuk vendor, supplier, bank |
| No. Rekening | Text | No | |
| Nama Bank | Text | No | Untuk entity bank atau rekening partner |
| SWIFT Code | Text | No | Untuk bank entity / international transfer |
| Fleet Size | Number | No | Untuk Barge Owner / Fleet |
| Registration Number | Text | No | Nomor registrasi perusahaan/kapal |
| Notes | Textarea | No | |

**Partner Types (Enum):**

| Type | Deskripsi | Dipakai di Modul |
|------|-----------|-----------------|
| `buyer` | Pembeli batubara | Sales Monitor, Forecast Sales, Shipment Monitor |
| `supplier` | Supplier / Source batubara | Sources, Shipment Monitor |
| `surveyor` | Surveyor (muatan, kualitas) | Quality, Shipment Monitor |
| `lab` | Laboratorium analisis | Quality (COA issuer) |
| `agent` | Agen pelabuhan / shipping agent | Transshipment, Shipment Monitor |
| `barge_owner` | Pemilik tongkang (TB/BG) | Shipment Monitor, Barge Change Log |
| `bank` | Bank (untuk payment, LC) | Outstanding Payment |
| `vendor` | Vendor jasa (PBM, PNBP, dll.) | Expenses, Transshipment |
| `internal_pic` | PIC internal perusahaan | Semua modul (assignee/PIC) |

**Business Rules:**
- `BR-DIR-001`: Data master Directory dipakai sebagai dropdown/search di semua modul lain — no free-text duplikasi
- `BR-DIR-002`: Duplicate detection berdasarkan `companyName + type` — tampilkan warning jika mirip
- `BR-DIR-003`: Partner bisa di-set Active/Inactive (tidak dihapus permanen)
- `BR-DIR-004`: Barge Owner entity dipakai sebagai referensi di Barge Change Log
- `BR-DIR-005`: Bank entity dipakai di Outstanding Payment untuk info rekening pembayaran
- `BR-DIR-006`: Surveyor entity dipakai sebagai pilihan di Quality (COA issuer) dan Shipment Monitor (surveyor assignment)

**Acceptance Criteria:**
- `AC-DIR-004`: Duplicate warning muncul saat input nama yang mirip dengan record yang ada
- `AC-DIR-005`: Barge Owner bisa dipilih di Barge Change Log
- `AC-DIR-006`: Surveyor/Lab bisa dipilih di Quality module

---

### FR-DIR-004: AI Due Diligence (Status: Done — endpoint exists; Groq stub, key needed)
**Priority:** Medium

\"Run Due Diligence\" → Groq AI → Risk Level (Low/Medium/High), skor numerik, rekomendasi tindak lanjut.

**Acceptance Criteria:**
- `AC-DIR-007`: Due diligence result tersimpan di record partner
- `AC-DIR-008`: High risk partner tampil dengan badge merah di list

---

### FR-DIR-005: Legal Document Tracking (Status: Done — /api/directory/:id/legal-documents GET/POST + /api/directory/:id/legal-documents/:docId PUT/DELETE)
**Priority:** High

Per partner: document name, type, issued date, expiry date.

**Status badge:**
- `expired` — merah (tanggal kadaluarsa sudah lewat)
- `expiring_soon` — kuning (dalam 30 hari)
- `valid` — hijau
- `pending` — abu-abu (belum ada/belum upload)

**Business Rules:**
- `BR-DIR-007`: Partner dengan dokumen expired ditandai di list view
- `BR-DIR-008`: Barge Owner dengan registrasi kapal expired tampil di Dashboard Blocker

**Acceptance Criteria:**
- `AC-DIR-009`: Legal document table per partner bisa di-add/edit
- `AC-DIR-010`: Expired document alert tampil di partner detail

---

### FR-DIR-006: Directory as Dropdown Source (Status: Done — all 9 types now supported in type filter)
**Priority:** Very High

Directory menyediakan API endpoint yang digunakan oleh modul lain sebagai sumber dropdown.

| Endpoint | Dipakai di |
|----------|-----------|
| `GET /api/directory?type=buyer` | Sales Monitor, Forecast Sales, Shipment Monitor |
| `GET /api/directory?type=supplier` | Sources, Shipment Monitor |
| `GET /api/directory?type=barge_owner` | Barge Change Log, Transshipment |
| `GET /api/directory?type=surveyor` | Quality, Shipment Monitor |
| `GET /api/directory?type=bank` | Outstanding Payment |
| `GET /api/directory?type=agent` | Transshipment |
| `GET /api/directory?type=vendor` | Expenses, Transshipment |
| `GET /api/directory?type=internal_pic` | Tasks, Issues, semua PIC assignment |

**Acceptance Criteria:**
- `AC-DIR-011`: Semua dropdown partner di modul lain menggunakan endpoint ini
- `AC-DIR-012`: Inactive partner tidak muncul di dropdown (hanya di list Directory)
- `AC-DIR-013`: Response termasuk: id, companyName, type, region, contactPic

---

## 3. Data Model

### Entity: Partner

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| id | UUID | Yes | Primary key |
| type | Enum | Yes | buyer/supplier/surveyor/lab/agent/barge_owner/bank/vendor/internal_pic |
| status | Enum | Yes | active / inactive |
| entityType | Enum | Yes | company / individual |
| companyName | String | Yes | Nama perusahaan/individu |
| picName | String | Yes | Nama kontak person |
| region | String | Optional | Lokasi |
| email | String | Optional | Email |
| phone | String | Optional | Telepon |
| npwp | String | Optional | NPWP |
| bankAccount | String | Optional | No. rekening |
| bankName | String | Optional | Nama bank |
| swiftCode | String | Optional | SWIFT/BIC code (untuk international) |
| registrationNumber | String | Optional | Nomor registrasi |
| fleetSize | Number | Optional | Untuk barge_owner / fleet |
| notes | Text | Optional | Catatan |
| legalDocuments | JSON | Optional | Array: {name, type, issuedDate, expiryDate, fileUrl} |
| aiDueDiligence | JSON | Optional | {riskLevel, score, recommendation, runAt} |
| createdAt | DateTime | Yes | Auto |
| updatedAt | DateTime | Yes | Auto |

---

## 4. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/directory` | List partners (filtered by type, status, search) |
| GET | `/api/directory/:id` | Get partner detail |
| POST | `/api/directory` | Create partner |
| PUT | `/api/directory/:id` | Update partner |
| DELETE | `/api/directory/:id` | Soft delete (set inactive) |
| POST | `/api/directory/:id/due-diligence` | Run AI due diligence |
| POST | `/api/directory/:id/legal-documents` | Add legal document |
| PUT | `/api/directory/:id/legal-documents/:docId` | Update legal document |

---

## 5. Integration Points

| Modul | Hubungan |
|-------|----------|
| Sales Monitor | Buyer dropdown |
| Forecast Sales | Buyer dropdown, surveyor |
| Shipment Monitor | Buyer, barge owner, surveyor, agent |
| Sources | Supplier entity link |
| Quality | Surveyor, lab (COA issuer) |
| Transshipment | Agent, barge owner, vendor (PBM/stevedore) |
| Outstanding Payment | Bank entity untuk info rekening |
| Expenses | Vendor dropdown |
| Tasks | Internal PIC dropdown |
| Barge Change Log | Barge Owner entity reference |
| Dashboard | Partner dengan dokumen expired → Blocker alert |

---

*End of SRS_14_Directory — v2.1*

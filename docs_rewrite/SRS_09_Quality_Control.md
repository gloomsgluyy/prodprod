# SRS Modul 09: Quality Control

**Modul:** Quality Control | **Route:** `/quality` | **Versi:** 2.0
**Implementation Status:** Done — All FR-QC fully implemented

---

## 1. Overview
Modul QC mengelola hasil uji kualitas batubara melalui beberapa tahap inspeksi. Setiap record menyimpan spec dari 7 sumber (lab, kontrak, supplier, QC, PSI, COA POL, COA POD) dan membandingkannya.

| Store | `commercial-store` | Akses | Semua role |

---

## 2. Functional Requirements

### FR-QC-001: Quality Results Table (Status: Done)
**Priority:** High

Kolom: Cargo, Surveyor, Sampling Date, Status, GAR, TS (%), ASH (%), TM (%).

### FR-QC-002: Summary Cards per Status (7 status) (Status: Done)
| Status | Label | Warna | Icon |
|--------|-------|-------|------|
| pending | Pending | `#f59e0b` | Clock |
| passed | Passed | `#10b981` | CheckCircle |
| warning | Warning | `#f97316` | AlertTriangle |
| need_review | Need Review | `#8b5cf6` | AlertTriangle |
| claim_potential | Claim Potential | `#dc2626` | TriangleAlert |
| rejected | Rejected | `#ef4444` | XCircle |
| on_hold | On Hold | `#6b7280` | AlertTriangle |

### FR-QC-003: Multi-Stage Spec Comparison (Status: Done)
**Priority:** Very High

7 set spesifikasi:

| Stage | Deskripsi | Upload |
|-------|-----------|--------|
| Spec Result | Hasil lab utama | - |
| Contract Spec | Spesifikasi kontrak | - |
| Source Estimate | Estimasi supplier | - |
| QC Result | QC internal | Ya (qc_document_id) |
| PSI Result | Pre-Shipment Inspection | Ya (psi_document_id) |
| COA POL | Certificate at Port of Loading | Ya (coa_pol_document_id) |
| COA POD | Certificate at Port of Discharge | Ya (coa_pod_document_id) |

Per stage mengukur: GAR (step 1), TS % (0.01), ASH % (0.01), TM % (0.01), IM %, FC %, HGI, ADB, NAR.

### FR-QC-004: Quality Comparison Output (Status: Done)
**Priority:** Very High

Bandingkan contract spec vs source estimate vs QC vs PSI vs COA POL vs COA POD.
Output: **Passed, Warning, Need Review, Claim Potential, Rejected**.

**BR-QC-001**: Selisih terhadap contract spec dihitung otomatis
**BR-QC-002**: Warning jika melewati tolerance
**BR-QC-003**: Warning memblokir shipment closing sampai reviewed
**BR-QC-004**: Quality data wajib link ke shipment/Forecast Sales
**BR-QC-005**: Missing mandatory quality tampil di Dashboard alert

### FR-QC-005: Add/Edit Quality Form (Status: Done)
| Field | Type |
|-------|------|
| Cargo ID | Text (link ke shipment) |
| Cargo Name | Text |
| Surveyor | Text |
| Sampling Date | Date |
| Spec Result | 9 number fields |
| Contract Spec | 9 number fields |
| Source Estimate | 9 number fields |
| QC Result | 9 fields + upload |
| PSI Result | 9 fields + upload |
| COA POL | 9 fields + upload |
| COA POD | 9 fields + upload |
| Comparison Status | Text |
| Warning Notes | Textarea |
| Status | Dropdown (7 status) |

---

## 3. Data Model

### Entity: QualityResult

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| cargoId | String | Yes |
| cargoName | String | Yes |
| shipmentId | FK | Optional |
| surveyor | String | Optional |
| samplingDate | Date | Optional |
| status | Enum | Yes |
| specResult | JSON (9 params) | Optional |
| contractSpec | JSON | Optional |
| sourceEstimate | JSON | Optional |
| qcResult | JSON | Optional |
| qcDocumentId | UUID | Optional |
| psiResult | JSON | Optional |
| psiDocumentId | UUID | Optional |
| coaPolResult | JSON | Optional |
| coaPolDocumentId | UUID | Optional |
| coaPodResult | JSON | Optional |
| coaPodDocumentId | UUID | Optional |
| comparisonStatus | String | Optional |
| warningNotes | Text | Optional |

---

## 4. API Endpoints

| Method | Endpoint |
|--------|----------|
| GET | `/api/quality` |
| GET | `/api/quality/:id` |
| POST | `/api/quality` |
| PUT | `/api/quality/:id` |
| DELETE | `/api/quality/:id` |
| POST | `/api/quality/:id/documents` |

---

## 5. Integration Points

| Modul | Hubungan |
|-------|----------|
| Shipment Monitor | Quality linked to shipment/cargo |
| Sources | Source estimate dari supplier database |
| Dashboard | Blocker: quality category |
| Blending | Spec target comparison |

---

*End of SRS_09_Quality_Control*

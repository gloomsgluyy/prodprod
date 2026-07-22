# Modul: Quality Control

**Route:** `/quality`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/quality/page.tsx) (601 baris, 34KB)  
**Store:** `commercial-store`  
**Akses:** Semua role

---

## Deskripsi Umum

Modul Quality Control mengelola **hasil uji kualitas batubara** melalui beberapa tahap inspeksi. Setiap record menyimpan data spec dari multiple sumber (lab, kontrak, supplier, QC, PSI, COA POL, COA POD) dan membandingkannya untuk mengidentifikasi potensi klaim atau warning.

---

## Layout

### 1. Header
- Title: "Quality Results"
- Tombol "Add Quality Result"

### 2. Search Bar
Pencarian berdasarkan cargo/shipment name.

### 3. Summary Cards per Status

| Status | Label | Warna | Icon |
|--------|-------|-------|------|
| pending | Pending | #f59e0b | Clock |
| passed | Passed | #10b981 | CheckCircle |
| warning | Warning | #f97316 | AlertTriangle |
| need_review | Need Review | #8b5cf6 | AlertTriangle |
| claim_potential | Claim Potential | #dc2626 | TriangleAlert |
| rejected | Rejected | #ef4444 | XCircle |
| on_hold | On Hold | #6b7280 | AlertTriangle |

### 4. Quality Results Table

| Kolom | Deskripsi |
|-------|-----------|
| Cargo | Nama cargo/shipment |
| Surveyor | Nama surveyor |
| Sampling Date | Tanggal sampling |
| Status | Badge berwarna |
| GAR | Gross As Received |
| TS (%) | Total Sulphur |
| ASH (%) | Ash content |
| TM (%) | Total Moisture |

### 5. Multi-Stage Spec Comparison (Detail/Form)
7 set spesifikasi yang bisa dibandingkan:

| Stage | Deskripsi | Upload |
|-------|-----------|--------|
| Spec Result | Hasil lab utama | - |
| Contract Spec | Spesifikasi kontrak yang disepakati | - |
| Source Estimate | Estimasi dari supplier | - |
| QC Result | Quality Control internal | Ya (qc_document_id) |
| PSI Result | Pre-Shipment Inspection | Ya (psi_document_id) |
| COA POL | Certificate of Analysis at Port of Loading | Ya (coa_pol_document_id) |
| COA POD | Certificate of Analysis at Port of Discharge | Ya (coa_pod_document_id) |

Setiap stage mengukur parameter yang sama:

| Parameter | Step | Contoh |
|-----------|------|--------|
| GAR | 1 | 4200 |
| TS (%) | 0.01 | 0.8 |
| ASH (%) | 0.01 | 5.0 |
| TM (%) | 0.01 | 30 |
| IM (%) | 0.01 | Opsional |
| FC (%) | 0.01 | Opsional |
| HGI | 0.01 | Opsional |
| ADB | 0.01 | Opsional |
| NAR | 1 | Opsional |

### 6. Add/Edit Form

| Field | Jenis |
|-------|-------|
| Cargo ID | Text (link ke shipment) |
| Cargo Name | Text |
| Surveyor | Text |
| Sampling Date | Date |
| Spec Result | 9 field number |
| Contract Spec | 9 field number |
| Source Estimate | 9 field number |
| QC Result | 9 field number + upload |
| PSI Result | 9 field number + upload |
| COA POL Result | 9 field number + upload |
| COA POD Result | 9 field number + upload |
| Comparison Status | Text |
| Warning Notes | Textarea |
| Status | Dropdown (7 status) |

### 7. Report Modal
Export data quality.

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "Add Quality Result" | Form baru |
| Edit | Edit record |
| Delete | Hapus record |
| Upload (per stage) | Upload dokumen lab |
| View (per dokumen) | Lihat dokumen |
| "Download Report" | Export |

---

## User Flow

```
User buka /quality
  │
  ├── Lihat summary per status
  ├── Search cargo
  │
  ├── "Add Quality Result"
  │     ├── Isi cargo info
  │     ├── Isi spec result (lab utama)
  │     ├── Isi contract spec (referensi kontrak)
  │     ├── Isi source estimate (estimasi supplier)
  │     ├── Upload + isi QC result
  │     ├── Upload + isi PSI result
  │     ├── Upload + isi COA POL result
  │     ├── Upload + isi COA POD result
  │     ├── Set status dan warning notes
  │     └── Save
  │
  └── Bandingkan spec antar stage → identifikasi deviasi
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Shipment Monitor | Quality linked to shipment/cargo |
| Sources | Source estimate dari supplier database |
| Dashboard | Blocker: Quality category alerts |
| Compliance | Quality documents for regulatory |

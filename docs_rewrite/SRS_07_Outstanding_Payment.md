# SRS Modul 07: Outstanding Payment

**Modul:** Outstanding Payment | **Route:** `/outstanding-payment` | **Versi:** 2.0
**Implementation Status:** Done — All FR-PAY fully implemented

---

## 1. Overview
Modul tracking pembayaran DP/Outstanding dari buyer dan vendor. Setiap record bisa di-link ke shipment, mendukung upload bukti invoice dan payment proof.

| Atribut | Nilai |
|---------|-------|
| Store | `outstanding-payment-store`, `commercial-store` |
| Akses | Semua role |

---

## 2. Functional Requirements

### FR-PAY-001: Summary Cards (Status: Done)
**Priority:** Medium

| Card | Icon | Warna | Data |
|------|------|-------|------|
| Total Records | CreditCard | Emerald | `outstandingPayments.length` |
| Total Qty (MT) | FileText | Blue | `totalQty / 1000` → K |
| Total DP (IDR) | Calculator | Amber | `totalDp / 1e9` → B (Miliar) |

### FR-PAY-002: Tab Filter (Status: Done)
| Tab | Filter |
|-----|--------|
| All | Semua |
| Pending | status = "pending" |
| Partial | status = "partial" |
| Paid | status = "paid" |

### FR-PAY-003: Payment Data Table (Status: Done)
**Priority:** High

| Kolom | Deskripsi |
|-------|-----------|
| Tahun | Badge tahun |
| Shipment | Linked shipment |
| Perusahaan | Nama (bold) |
| Invoice | Nomor invoice (mono) |
| Kode Batu | Kode (mono) |
| Price Incl PPh | Harga (Rp, mono) |
| Qty (MT) | Kuantitas (biru, bold) |
| Total DP (IDR) | Total DP (hijau, bold) |
| Start Date (Calc) | Calculation date |
| DP To Shipment | Tanggal DP ke shipment |
| Timeframe (Days) | Durasi/catatan |
| Evidence | Invoice link + Payment Proof link |
| Status | PAID (hijau) / PARTIAL (kuning) / PENDING (merah) |
| Actions | Edit + Delete |

### FR-PAY-004: Add/Edit Form Modal (Status: Done)
**Priority:** High

| Field | Type | Required |
|-------|------|----------|
| Linked Shipment | Dropdown (max 300) | Optional |
| Invoice Number | Text | No |
| Perusahaan | Text | **Yes** |
| Kode Batu | Text | No |
| Price Incl PPh (Rp) | Number | No |
| Quantity (MT) | Number | No |
| Total DP (Rp) | Number | No |
| Tahun | Number | Default current year |
| Calculation Date | Date | No |
| DP to Shipment Date | Date | No |
| Due Date | Date | No |
| Dispute Status | Text | No |
| Timeframe | Text | No |
| Status | Dropdown | Yes |
| Notes | Text | No |
| Invoice Document | File Upload | No |
| Payment Proof | File Upload | No |

**BR-PAY-001**: File upload hanya aktif jika shipment sudah di-link
**BR-PAY-002**: File di-upload via `POST /api/shipments/{shipmentId}/documents` dengan group "additional"
**BR-PAY-003**: Payment overdue tampil di Dashboard Blocker
**BR-PAY-004**: Payment status mempengaruhi shipment closing

### FR-PAY-005: Vendor Payment Tracking (Status: Done)
**Priority:** High

| Field | Deskripsi |
|-------|-----------|
| Vendor Invoice Receive | Tanggal terima invoice vendor |
| Submit System | Tanggal masuk sistem |
| Approval DT/RH | Status approval |
| Submit Finance | Tanggal submit ke finance |
| Paid Date | Tanggal dibayar |
| Paid to Vendor | Status pembayaran |
| Aging | Hari sejak invoice |

---

## 3. Data Model

### Entity: OutstandingPayment

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Yes |
| shipmentId | FK | Optional |
| invoiceNumber | String | Optional |
| perusahaan | String | Yes |
| kodeBatu | String | Optional |
| priceInclPph | Decimal | Optional |
| quantity | Number | Optional |
| totalDp | Decimal | Optional |
| tahun | Number | Yes |
| calculationDate | Date | Optional |
| dpToShipmentDate | Date | Optional |
| dueDate | Date | Optional |
| disputeStatus | String | Optional |
| timeframe | String | Optional |
| status | Enum (pending/partial/paid) | Yes |
| notes | Text | Optional |
| invoiceDocumentId | UUID | Optional |
| paymentProofDocumentId | UUID | Optional |

---

## 4. API Endpoints

| Method | Endpoint |
|--------|----------|
| GET | `/api/outstanding-payments` |
| POST | `/api/outstanding-payments` |
| PUT | `/api/outstanding-payments/:id` |
| DELETE | `/api/outstanding-payments/:id` |

---

## 5. Integration Points

| Modul | Hubungan |
|-------|----------|
| Shipment Monitor | Linked shipment, docs tersimpan di shipment |
| Dashboard | Blocker: Payment category alerts |
| Document Drive | Invoice/proof tersimpan |
| P&L | Invoice amount/payment feeds |

---

*End of SRS_07_Outstanding_Payment*

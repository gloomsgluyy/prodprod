# SRS Modul 21: Audit Logs

**Modul:** Audit Logs | **Route:** `/audit-logs` | **Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-AUD fully implemented

---

## 1. Overview
Pencatatan rekam jejak seluruh aktivitas user di sistem. Wajib untuk data penting (source change, barge change, SI revision, price change, approval actions, closing).

| Akses | CEO/DIRUT/ASS_DIRUT read-only |

---

## 2. Functional Requirements

### FR-AUD-001: Audit Log Table (Status: Done)
| Kolom | Deskripsi |
|-------|-----------|
| Timestamp | Waktu aksi |
| User | Nama user + avatar initial |
| Role | Role user saat aksi |
| Action | create/update/delete/approve/reject/generate/close |
| Entity | Modul target (shipment/project/source/quality/deal/task/meeting) |
| Entity ID | ID record |
| Details | JSON diff (old → new values) |

### FR-AUD-002: Search & Filter (Status: Done)
Search: user name, action, entity. Filter: Action type dropdown, Entity type dropdown, Date range.

### FR-AUD-003: Log Detail View (Status: Done)
Klik baris → expand detail: parsed JSON (per field: label, oldValue, newValue). Visual diff (merah = deleted, hijau = added).

### FR-AUD-004: Critical Audit Items (Status: Done — writeAuditLog called on all critical actions per EXEC-033 and EXEC-034)
Wajib di-audit:

| Category | Events |
|----------|--------|
| Source | Source change request, activation, CEO approval, IUP/RKAB update, cargo readiness update |
| Source Issue | Issue dibuat, status change, resolved |
| Barge | Barge change log entry, approval |
| SI | SI generation, revision, cancellation, sent to barge owner |
| Pricing | Sell price, buy price, margin changes |
| Market Price | Market price manual input, FX rate update, MGO update |
| Approval | FCO approve/reject, SI approve, source change approve (via Approval Center) |
| Closing | Shipment close action |
| User | Role change, user create/deactivate |
| Quality | Quality status change, warning resolution |
| Freight/Demurrage | Freight cost update, demurrage claim status change |
| Directory | Partner create/update/deactivate, legal document expiry update |
| SPAL | SPAL created, status change, expired |
| P&L | P&L export action (by whom, when, filter used) |

**BR-AUD-001**: Audit trail harus mencatat `changedBy`, `time`, `oldValue`, `newValue` untuk data penting
**BR-AUD-002**: Audit logs tidak bisa dihapus (immutable)
**BR-AUD-003**: Audit log auto-generated oleh sistem (bukan input manual user)
**BR-AUD-004**: Audit log mencakup semua entity di atas — programmer wajib trigger audit write di setiap critical action

---

### FR-AUD-005: Audit Export (Status: Done — GET /api/audit-logs?export=csv returns CSV with meta-audit)
**Priority:** Medium
**Access:** CEO / DIRUT only

Export audit log ke CSV / Excel untuk keperluan compliance dan investigasi.

| Filter Export | Opsi |
|--------------|------|
| Date Range | Wajib (max 90 hari per export) |
| Action Type | Optional dropdown |
| Entity Type | Optional dropdown |
| User | Optional search |

**Business Rules:**
- `BR-AUD-005`: Export action itu sendiri dicatat di audit log (meta-audit)
- `BR-AUD-006`: Export hanya bisa dilakukan oleh CEO / DIRUT

**Acceptance Criteria:**
- `AC-AUD-004`: Export menghasilkan file CSV/Excel dengan semua kolom audit log
- `AC-AUD-005`: Export action tercatat di audit log

---

## 3. Data Model
### Entity: AuditLog
| Field | Type |
|-------|------|
| id | UUID |
| timestamp | DateTime |
| userId | FK |
| userName | String |
| userRole | String |
| action | Enum |
| entity | String |
| entityId | UUID |
| details | JSON |
| ipAddress | String (optional) |

---

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET | `/api/audit-logs` (paginated, filtered) |
| GET | `/api/audit-logs/:id` (detail) |
| GET | `/api/audit-logs/export` (CSV/Excel, CEO only) |

## 5. Integration Points
Semua modul → auto-write audit log saat critical action terjadi.
Approval Center → semua approval action dicatat.

---

*End of SRS_21_Audit_Logs — v2.1*

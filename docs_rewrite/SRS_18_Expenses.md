# SRS Modul 18: Expenses / Purchase Requests

**Modul:** Expenses | **Route:** `/purchase-requests` | **Versi:** 2.0
**Implementation Status:** Done — All FR-EXP fully implemented

---

## 1. Overview
Modul pengajuan dan tracking biaya operasional (purchase requests). Mendukung approval workflow per request dan upload bukti (foto nota/invoice).

| Store | `commercial-store` | Akses | Semua role |

---

## 2. Functional Requirements

### FR-EXP-001: Expense Data Table (Status: Done)
| Kolom | Deskripsi |
|-------|-----------|
| Item/Description | Nama item |
| Category | Kategori (sewa, supplies, fuel, transport, dll.) |
| Amount (Rp) | Jumlah dalam rupiah |
| Supplier | Vendor/supplier |
| Priority | Badge (low/medium/high/urgent) |
| Status | pending, approved, rejected |
| Image | Preview thumbnail |
| Actions | Edit, Delete |

### FR-EXP-002: Add/Edit Form (Status: Done)
Fields: Description (required), Amount (required), Category (dropdown), Supplier (text), Priority (dropdown), Image Upload (file accept: image/*), Related Shipment (optional FK).

### FR-EXP-003: Approval Workflow (Status: Done)
Submit → Manager/Head review → Approve/Reject.
**BR-EXP-001**: Approved expenses feed ke P&L module

### FR-EXP-004: Image Upload & Preview (Status: Done)
Upload foto nota/invoice. Preview modal (lightbox).

### FR-EXP-005: Related Shipment Flag (Status: Done)
Expense bisa di-flag terkait shipment tertentu. Filter: "Shipment-related only".

---

## 3. Data Model
### Entity: Expense
| Field | Type |
|-------|------|
| id | UUID |
| description | String (required) |
| amount | Decimal (required) |
| category | String |
| supplier | String |
| priority | Enum |
| status | Enum (pending/approved/rejected) |
| imageUrl | String |
| relatedShipmentId | FK |
| approvedBy | FK (User) |
| approvedAt | DateTime |
| createdAt | DateTime |
| updatedAt | DateTime |

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/expenses` |
| GET/PUT/DELETE | `/api/expenses/:id` |
| PUT | `/api/expenses/:id/approve` |

---

*End of SRS_18_Expenses*

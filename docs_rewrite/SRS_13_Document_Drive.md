# SRS Modul 13: Document Drive

**Modul:** Document Drive | **Route:** `/document-drive` | **Versi:** 2.0
**Implementation Status:** Partial — public read-only listing and critical filtering fixed in EXEC-052; storage/ZIP/generated-doc persistence still pending

**Correction (EXEC-052):** Prior `Done` status was overstated. `/document-drive` is now public read-only, uses a public-only shell when unauthenticated, filters critical shipment attachments for public/non-executive users, and routes shipment file opens through `/api/document-drive/files/[fileId]`. Remaining production gaps: object storage streaming, selected/all ZIP, stricter mutation RBAC, and reliable SI/FCO/Summary PDF persistence.

---

## 1. Overview
Repository pusat untuk seluruh dokumen operasional. Dokumen dari Forecast Sales, Shipment Monitor, Domestic Handover, Shipping Instruction teragregasi dan dapat dicari. Layaknya "Google Drive" internal.

| Akses | Public read-only (tanpa login) atau full access dengan permission `document_drive` |

---

## 2. Functional Requirements

### FR-DOC-001: Access Control (Status: Done)
- Belum login: Read-only mode badge
- Login tanpa permission: Error banner merah

### FR-DOC-002: Summary Cards (6 kolom) (Status: Done)
| Card | Warna | Data |
|------|-------|------|
| Total Files | Emerald | Total |
| Forecast | Cyan | Dari Forecast Sales |
| Shipment | Biru | Dari Shipment Monitor |
| Domestic | Amber | Dari Domestic Handover |
| SI | Emerald | Shipping Instruction |
| Required | Violet | Dokumen mandatory |

### FR-DOC-003: Filter & Search (debounce 250ms) (Status: Done)
| Filter | Options |
|--------|---------|
| Search | SI number, shipment, project, buyer, filename |
| Source | All, Forecast Sales, Shipment, SI, Domestic Handover |
| Group | All, Forecast, SI, Required, Additional, Critical, Domestic |

### FR-DOC-004: Document Table (Status: Done)
| Kolom | Deskripsi |
|-------|-----------|
| Document | Nama, filename, size (KB/MB), Critical icon |
| Owner | PIC + Buyer name |
| Source | Badge sumber |
| Group | Badge kategori |
| Uploaded | Uploader name + date |
| Action | Open (new tab) + Download |

---

## 3. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET | `/api/document-drive` (with query params) |

## 4. Integration Points
| Modul | Hubungan |
|-------|----------|
| Shipment Monitor | Checklist docs + invoice |
| Forecast Sales | Template checklist docs |
| Outstanding Payment | Invoice/proof |

---

*End of SRS_13_Document_Drive*

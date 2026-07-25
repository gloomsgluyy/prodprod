# Module Requirement Deep Dive - Rewrite Finalization

**Date:** 2026-07-24  
**Target:** `C:\CoalTrade-Production`  
**Purpose:** detail kebutuhan modul agar rewrite tidak hanya parity secara menu, tetapi parity secara workflow.

## 1. Dashboard

### Purpose

Dashboard adalah control tower, bukan sekadar summary angka. Dashboard harus menunjukkan blocker dan memberi drill-down ke data yang membuat angka itu muncul.

### Required Widgets

| Widget | Data source | Required behavior |
|---|---|---|
| Forecast Sales Funnel | Forecast Sales | Total forecast, draft, waiting approval, approved, FCO sent, waiting buyer, deal, failed |
| Forecast Drilldown | Forecast Sales | Tiap card punya dropdown/expand sendiri, tidak membuat semua cards ikut memanjang |
| Shipment Status | Shipment | Upcoming, loading, in transit, completed, cancelled |
| Shipment Completeness | Shipment completeness endpoint | List shipment dengan completeness rendah dan missing fields |
| Approval Queue | Approval Center | Pending FCO, SI, source change, critical issue |
| Document Aging | Document requirements/files | Required docs pending/overdue |
| Market Warning | Market Price + Forecast/Sales | Price stale, offer below market, FX stale |
| Source Pending | Source/Shipment | Cargo not ready, legal pending, source confirmation pending |
| Quality Warning | Quality | Warning, need review, claim potential |
| Payment | Outstanding Payment | Overdue, due soon, dispute |
| P&L Executive | Shipment/P&L | Revenue, margin, deviation, executive-only |

### Acceptance

- Empty state only after data loaded.
- Each summary card can navigate/filter to exact records.
- Executive-only values hidden from regular trader.

## 2. Authentication and RBAC

### Required Behavior

Every route must choose one:

- Public read-only route.
- Authenticated read route.
- Authenticated + role-gated mutation route.
- Executive-only route.

### Strict Executive Actions

Only `CEO`, `DIRUT`, `ASS_DIRUT` can:

- approve/reject Forecast Sales/FCO,
- approve early SI,
- approve SI revision/cancellation,
- approve source change,
- acknowledge critical issue,
- view critical documents,
- view restricted rough P&L unless business extends to COO.

### Acceptance

- Unauthorized UI actions hidden.
- Unauthorized API calls return 403.
- Audit log records denied critical attempts if feasible.

## 3. Forecast Sales

### Required Sections

1. Dashboard summary with independent drilldowns.
2. Forecast/Offer profile.
3. Market reference and historical selling price.
4. Coal specification.
5. Supplier candidates.
6. Embedded blending.
7. Rough P&L restricted.
8. Approval history.
9. FCO generation and history.
10. Buyer feedback.
11. Deal conversion.
12. Revision log.
13. Summary report.

### Mandatory Submit Fields

Draft can save incomplete. Submit must validate:

- forecast month,
- offer name,
- trader,
- buyer,
- buyer country,
- commodity,
- quantity,
- laycan start/end,
- POL,
- sales term,
- target selling price,
- price basis,
- payment term,
- GAR or main requested quality,
- market snapshot.

### Full Quality Fields

The rewrite schema should support:

- GAR/GCV,
- NAR,
- TM,
- IM,
- TS,
- Ash,
- VM,
- HGI,
- size,
- analysis basis or method,
- tolerance/lowest limit if needed for FCO.

### Supplier Candidate Requirements

Each candidate stores:

- source id,
- supplier/source name,
- origin/location,
- stock/COB,
- supplier price,
- readiness,
- legal status,
- GAR/NAR/TM/IM/TS/Ash/VM/HGI/size,
- fit score,
- below-spec flags,
- selected flag,
- notes.

### Buyer Feedback Status

Allowed statuses:

- FCO generated,
- FCO sent,
- waiting buyer feedback,
- negotiation,
- pending,
- deal,
- failed.

Failed requires reason category and detail.

### Acceptance

- FCO cannot be generated before approval, including direct API.
- Deal conversion creates linked shipment with commercial and spec data.
- Summary Report and FCO are visible in Document Drive after generation.

## 4. Market Price

### Required Sections

1. Latest cards.
2. Trend chart.
3. Input Price below chart.
4. Daily/latest table.
5. Expandable intraday history.
6. Scraping/source log.
7. Calculators and reference warnings.

### Current User Gap

History exists, but input price is not available/working. This must be treated as a priority gap even if old SRS says `Done`.

### Acceptance

- Manual input appends history.
- Updated by and exact time visible.
- Auto scrape actor displays `Auto Scrape`.
- MGO and FX are proper Prisma fields and migrate cleanly.

## 5. Shipment Monitor

### Required Tabs

| Tab | Purpose |
|---|---|
| Info | shipment header, buyer, product, qty, status |
| Commercial Reference | link Forecast Sales, FCO, PO/MoM, sales/buying price, payment |
| Source/Barge | source result, source change, barge change |
| Quality | quality data links and comparison |
| SI | generate/revise/cancel SI |
| Documents | required/additional/critical upload |
| Domestic Handover | SKAB/DSR/BL/COA flows |
| Timeline | POL/POD milestones |
| Payment | invoice/payment linkage |
| Issues | issue log and evidence |
| Closing | closing validation blockers |

### Completeness Score

Score must ignore:

- empty string,
- null,
- zero where zero is invalid,
- `-`,
- `N/A`,
- dummy/default placeholders.

### Acceptance

- Shipment can be edited after Upcoming if role allowed.
- EXP/DMO or type changes must persist and not be overwritten by refetch/loop.
- CRUD gives pending/success feedback.

## 6. Shipping Instruction

### Generated From Shipment Data

SI output must pull:

- SI number,
- shipment number,
- Forecast Sales/Project name,
- buyer,
- supplier,
- source,
- POL/POD,
- laycan,
- product,
- coal spec,
- quantity,
- vessel/barge,
- contract reference,
- document required,
- remarks.

### Document Required Output

For each required doc:

- If uploaded: show `Filled, N Document Uploaded`.
- If not uploaded: show pending/blank as business prefers.

### Acceptance

- Header/kop area blank but reserved.
- SI number system-generated.
- Version history persists.
- SI appears in Document Drive.

## 7. Document Management

### Required Groups

- Required shipment documents.
- Additional documents.
- Critical documents.
- Generated SI.
- Generated FCO.
- Summary Report.
- Quality documents.
- Payment documents.
- Domestic handover evidence.
- Freight/transshipment documents.

### Required Upload UX

- Drag and drop.
- Choose file.
- Multiple files per document type.
- File validation.
- Edit metadata.
- Delete/soft delete.
- Save status.
- Download single.
- Download selected.
- Download all.

### Critical Document Rule

Critical documents:

- only visible to executive/strict roles,
- never visible in public Document Drive,
- replacement creates new version,
- deletion should soft-delete if audited.

### Acceptance

- Uploading 2 files under same requirement is cleanly readable.
- File display name includes context, not only generic label.
- ZIP download has clear loading state.

## 8. Public Document Drive

### Public Mode

No login required for `/document-drive`.

Public mode:

- can search,
- can open/download non-critical documents,
- sees limited navbar/shell,
- cannot access other modules,
- cannot upload/edit/delete.

### Naming Rules

Display title should include:

- module/source,
- shipment number or Forecast Sales name,
- MV/TB/BG if available,
- buyer,
- document type,
- SI/FCO number and version if generated,
- upload/generate date if useful.

Example:

- `SI - 018 SI-SUPPLIER/V/2026 - MV ABC - TB ABHIPRAMA 107 - Buyer XYZ - v1`
- `Required Doc - BL - SHP-2026-001 - Buyer XYZ - 2 files`
- `FCO - FCO.C2604 - Forecast Sales ABC - Buyer XYZ - v1`

### Acceptance

- SI downloadable from Document Drive.
- Critical docs hidden from public.
- Listing does not load file bytes.

## 9. Source / Supplier

### Required Data

- source/supplier identity,
- stock locations,
- total stock auto sum,
- quality spec,
- legal status,
- IUP OP,
- RKAB,
- export quota,
- COB,
- hauling,
- cargo readiness,
- KYC/PSI,
- issues.

### Stock Location Rule

New sources can have multiple custom stock locations. Total MT auto-calculates from child rows. Existing blank legacy records can remain blank.

### Acceptance

- Candidate supplier in Forecast can pull from Source.
- Source readiness can block/alert Shipment.

## 10. Quality Control

### Required Stages

- contract spec,
- source estimate,
- QC result,
- PSI result,
- COA POL,
- COA POD,
- comparison output.

### Acceptance

- Warning/need review can block closing.
- Quality documents link to Document Drive where non-critical.

## 11. Transshipment / Freight

### Required

- freight rate,
- allowance,
- demurrage/despatch,
- laytime,
- PBM,
- PNBP/STS,
- SPAL,
- SI send to barge owner,
- MGO reference,
- cost feed to P&L.

### Acceptance

- Freight costs are included in P&L.
- SPAL docs can be searched from Document Drive if uploaded.

## 12. P&L

### Required Sources

- sales price from Forecast/Shipment,
- buying price/source price,
- final quantity,
- freight,
- royalty,
- export tax,
- survey,
- finance cost,
- expenses,
- payment/invoice data,
- market at BL date,
- FX at BL date.

### Acceptance

- Restricted values hidden from unauthorized roles.
- Estimated vs actual margin shown.
- Market deviation warning works.

## 13. Meetings, Tasks, Directory, AI

These are supporting modules. They must not block core Forecast-to-Shipment workflow unless a critical requirement depends on them.

Acceptance:

- Stubs must be labelled as stubs.
- AI features require real API key and truthful UI state.


# Shipment Monitor Client Workspace

## Audit, UI Specification, Data Contract, and Implementation Plan

**Product:** CoalTrade OS Rewrite  
**Module:** Shipment Monitor  
**Scope:** Mother Vessel Workspace, Buyer Side, Supplier Side, Quality, Documents, Payment, Commercial  
**Revision source:** Client reference screenshots and `revisi_shipment monitor`  
**Date:** 2026-09-01  
**Status:** Implementation in progress — MV workspace, Buyer/Supplier contextual shells, Barge Line route, child operational fields, and shared data aggregation implemented; domain-specific child transactions and browser parity remain pending

### Buyer Side submenu model — latest clarification

Buyer Side is a contextual fulfillment view inside the MV workspace. It is not a second source-of-truth module and must not duplicate Documents, Payment, Quality, or Storage.

```text
Buyer Side
├── Overview
├── Vessel & Nomination
├── Docs & Bank
├── POD Result
├── Quality
└── Communication
```

#### Overview

Aggregated buyer fulfillment view. It reads Forecast, parent Shipment, Timeline, Payment, Quality, Documents, and Issues/Communication.

- Buyer Qty Plan.
- BL Qty.
- Discharged Qty.
- Payment Status.
- Document Alert.
- Overall Status.
- Buyer/Contract Info.
- Quantity reconciliation.
- POL/POD timeline summary.
- Quality summary.
- Open issue/remark summary.
- Attachment summary.

It must not show supplier allocation detail, buying cost, supplier cost, internal margin, or internal commercial calculation.

#### Vessel & Nomination

Parent vessel and buyer-facing nomination context:

- MV name, IMO, vessel type, DWT.
- Vessel nomination date.
- Latest shipment date as per LC.
- Stowage plan.
- Agent at POD, notify party, POD country.
- ETD/ETA and vessel status.
- Nested TB/BG nomination list with nomination number, planned/loaded quantity, laycan, status, and current stage.

TB/BG remains nested under MV and cannot become a top-level Shipment Monitor record. Supplier allocation, source cost, and supplier operations remain Supplier Side concerns.

#### Docs & Bank

This is a filtered contextual view, not a new upload system.

Buyer-facing documents read from existing `ShipmentDocument`/`DocumentFile` records:

- Draft/final BL.
- Non-negotiable BL.
- COA.
- Certificate of Weight.
- COO/Certificate of Origin.
- PEB/LHV.
- Stowage Plan.
- Buyer-facing SI.
- Buyer contract documents.

Document fields:

- Type, file name, status, version.
- Uploaded/submitted dates.
- Uploaded by.
- Visibility.
- View/download.
- Pending alert.

Upload from this submenu must write to the existing document registry. No duplicate `DocumentFile`, storage, or route. Internal/critical access remains server-side enforced.

Bank/payment-instrument metadata reads from Payment/Finance:

- LC issuing bank.
- Beneficiary bank.
- Advising bank.
- Payment instrument/reference.
- Received by buyer/bank.
- Due date.
- Received date.
- Days to due/late.
- Payment status.
- Finance linkage.

#### POD Result

Destination fulfillment view:

- NOR POD, arrival, in-position.
- Commence/complete discharge.
- Factory received.
- Weighbridge received.
- BL, discharged, factory, and weighbridge quantities.
- Loss/gain and variance versus plan/BL.
- Tolerance and result status.
- POD delay and reason.
- Supporting documents and timeline link.

Formulas:

```text
lossGain = factoryQty - blQty
varianceVsPlan = factoryQty - planQty
varianceVsBL = factoryQty - blQty
```

#### Quality

Shared read view of contract versus actual quality:

- Contract value/limit.
- Actual POD value.
- Test method.
- GAR, NAR, TS, ASH, TM, IM, VM where available.
- COA date.
- Surveyor POL/POD/LS.
- Lab.
- PASS/WARNING/FAIL.
- Warning/claim indicator.
- Quality document link.

No quality dummy values. Empty state: `Quality result not available`.

#### Communication

Contextual shipment communication and update history:

- Operational remarks.
- ETA revisions.
- Loading/discharge updates.
- Payment follow-up.
- Quality notes.
- Document follow-up.
- Issue updates.
- Actor and timestamp.
- Attachment type, file name, upload date/user, version, view/download.

Attachments read from `DocumentFile`; no second attachment store.

#### Buyer Side ownership rules

```text
Forecast              → buyer, entity, market, qty plan, laycan, offer/FCO
Shipment/MV           → vessel, route, status, BL, parent identity
ChildNomination       → nested TB/BG and nomination context
Timeline              → POL/POD milestones
Payment               → bank, invoice, due date, payment status
Quality               → contract versus actual result
DocumentFile          → shared file registry, version, access
Communication/Issues  → remarks, updates, issues, attachments
```

Buyer Side is a read/composition surface plus approved contextual actions. Source modules remain authoritative.

#### Legacy tab consolidation

```text
TabInfo          → Buyer Side > Overview
TabTimeline      → Overview / Vessel & Nomination / POD Result
TabDocuments     → Docs & Bank
TabSI            → Docs & Bank / Overview
TabCommercialRef → Overview; restricted fields remain Commercial
TabFinancial     → Payment; supplier cost/margin remain restricted
TabIssues        → Communication + Overview alerts
TabDomestic      → only buyer-relevant content in Vessel/Docs/POD
TabSourceBarge   → Supplier Side, never Buyer Side
Daily Delivery   → main operational module, not Buyer Side submenu
```

This consolidation prevents duplicate source-of-truth routes and reduces the primary MV workspace to the client menu.

### Buyer Side reference override — 2026-09-01

The latest Buyer Side screenshot defines the Buyer Side layout. It does not replace the MV/child hierarchy or Supplier Side specification.

```text
MV Workspace
  → Buyer Side
    → Buyer/contract fulfillment dashboard
```

Required Buyer Side top summary cards:

1. Buyer Qty (Plan).
2. BL Qty.
3. Discharged Qty.
4. Payment Status.
5. Document Alert.
6. Overall Status.

Required Buyer Side sub-tabs:

```text
Overview | Vessel & Nomination | Docs & Bank | POD Result | Quality | Communication
```

Buyer Side Overview panels:

1. **Buyer / Contract Info**
   - Buyer.
   - Buyer country.
   - Product/coal specification.
   - Offer/FCO number.
   - Shipping term.
   - Qty plan.
   - POL/POD.
   - Laycan.
   - Contract number.
   - Contract type.
   - Market section.
   - Source links back to Sales Forecast where applicable.
2. **Mother Vessel & Nomination**
   - Vessel name.
   - IMO number.
   - Vessel nomination date.
   - Latest shipment date as per LC.
   - Stowage plan.
   - Agent at POD.
   - Notify party.
   - Port of POD.
   - Country of POD.
   - Vessel type.
   - Vessel DWT.
3. **POL/POD Timeline**
   - NOR POL.
   - Commence loading.
   - Complete loading.
   - PEB clear.
   - BL date.
   - NOR POD.
   - Commence discharge.
   - Complete discharge.
   - Factory received.
   - Each item shows timestamp, status, and pending/completed state.
4. **Destination & Quantity Result**
   - Qty plan.
   - BL quantity.
   - POD quantity/discharged.
   - Factory/weighbridge quantity.
   - Cargo loss/gain.
   - Variance versus plan.
   - Variance versus BL.
   - Allowance/tolerance.
   - Result status.
   - Basis: factory/weighbridge.
5. **Bank & Payment Tracking**
   - LC issuing bank.
   - Beneficiary bank.
   - Advising bank.
   - Invoice amount.
   - Received by buyer/bank.
   - Payment due date.
   - Date of received payment.
   - Days late/days to due.
   - Payment status.
   - Finance linkage.
6. **Quality Snapshot (Contract vs Actual)**
   - Parameter.
   - Contract limit.
   - Actual POD value.
   - Test method.
   - GAR, NAR, TS, ASH, TM, IM, VM where available.
   - Surveyor POL/POD/LS.
   - Result.
7. **Issues / Remarks / Attachments**
   - Remarks/update.
   - Actor.
   - Timestamp.
   - Attachment type/name/uploaded by/date.
   - View all attachments.

Buyer Side rules:

- Buyer Side is buyer-delivery and contract fulfillment, not supplier allocation.
- Supplier costs are not displayed in Buyer Side.
- Financial values visible there are buyer/payment-facing only; supplier cost/margin remains restricted.
- Sales Forecast-linked fields show a visible `Linked from Sales Forecast` source marker.
- Payment status comes from Payment/Finance data, not a manually duplicated label.
- Timeline uses integrated POL/POD operational milestones.
- Document and issue alerts link to the relevant Documents/Issues workflow.
- Empty data must show `Not available`/`Pending`, never fabricated values.

> **Latest reference override — 2026-09-01:** The two supplied Supplier Side screenshots are the latest visual authority. They refine, but do not remove, the MV parent/child rules below.

---

## 1. Purpose

This document standardizes the redesign of Shipment Monitor before further implementation. It defines:

- Current code behavior.
- Client target UI.
- Mother Vessel and child nomination rules.
- Supplier Side data and workflow.
- Component and route structure.
- Prisma relations.
- API contracts.
- State transitions.
- RBAC, audit, cache, loading, error, and empty states.
- Migration and legacy-data strategy.
- Acceptance and verification criteria.

This document is authoritative for the client workspace redesign. Existing SRS claims of `Done` do not override gaps identified here.

## 0. Mandatory Audit and Implementation Coverage

Every Shipment Monitor area is incomplete unless all layers below are specified, implemented, and verified:

| Layer | Required evidence |
|---|---|
| UI structure | Page, workspace, tab, section, card, table, drawer/modal compatibility |
| Layout | Desktop grid, tablet wrapping, mobile stacking/scroll, no overlap/cut-off |
| Interaction | Row click, navigation, filters, search, add/edit/delete, previous/next, export |
| Data | Prisma model/relation, field ownership, aggregation, source-of-truth |
| API | Endpoint, request/response contract, validation, error codes |
| Workflow | Status/current-stage transitions, blocking rules, idempotency |
| RBAC | Server-side read/write/financial/document permission |
| Audit | Actor, role, parent/child ID, timestamp, changed fields, before/after where required |
| Cache | Query keys, stale time, invalidation after mutations |
| UX states | Loading, error, empty, disabled, pending mutation, retry/remediation |
| Responsive QA | 1440px desktop, 1024px tablet, 390px mobile screenshot/interaction test |
| Release proof | Typecheck, build, migration, API/RBAC, E2E, production smoke test |

This matrix applies to **Overview, Buyer Side, Supplier Side, Quality, Documents, Payment, Commercial, child Barge Detail, header actions, and legacy compatibility paths**. A documented field or route alone is not completion evidence.

---

## 2. Business Rules

### 2.1 Shipment hierarchy

```text
Mother Vessel / MV
├── Child Nomination 01: TB/BG
├── Child Nomination 02: TB/BG
├── Child Nomination 03: TB/BG
└── Child Nomination N: TB/BG
```

Rules:

1. The top-level Shipment Monitor lists Mother Vessel records only.
2. A TB/BG nomination is not an independent top-level shipment.
3. A child nomination must have exactly one Mother Vessel parent.
4. A Mother Vessel may have zero or many child nominations.
5. Child quantity contributes to the parent allocation summary.
6. Child status/stage is operationally independent but remains inside the parent context.
7. Parent shipment documents, SI, and commercial contract remain parent-owned initially.
8. Nomination-specific documents are not introduced until ownership requirements are approved.
9. Existing legacy `Shipment.bargeName` data must not be auto-converted when parent identity is ambiguous.

### 2.2 Terminology

| Term | Definition |
|---|---|
| MV / Mother Vessel | Top-level shipment/workspace parent |
| Child Nomination | Operational TB/BG nomination belonging to one MV |
| Barge | Physical TB/BG used by a child nomination |
| Source | Coal source/location |
| Supplier / IUP OP | Supplier or mining permit owner |
| COB / Jetty Qty | Actual quantity reported from COB/jetty |
| Current Stage | Operational stage, separate from business status |
| Status | State of the record, e.g. planned/loading/completed |
| Allocation | Planned child quantity assigned against MV quantity |

### 2.3 Status versus current stage

These are separate values:

- `status`: lifecycle state of the child record.
- `currentStage`: current operational checkpoint.

Example:

```text
status: active
currentStage: loading
```

Suggested child status values:

```text
planned | active | completed | cancelled
```

Suggested child stage values:

```text
allocation
contract
nomination
standby_loading_port
loading
sailing_to_loading_port
documents
invoice
settlement
```

The final enum values require business sign-off before locking the database enum. Until then, a validated string field is acceptable.

---

## 3. Current Code Audit

### 3.0 UI and layout audit standard

The audit must record both behavior and visual composition for every current and target surface:

| Surface | UI/layout audit questions |
|---|---|
| MV list | Are only MV rows shown? Are columns readable? Does mobile scroll safely? |
| MV header | Are breadcrumb, identity, status, metadata, and actions grouped without wrapping collisions? |
| Top-level navigation | Are the seven client tabs primary? Is horizontal overflow intentional and accessible? |
| Overview | Are summary cards, progress, issues, and child summary aligned with no hardcoded/duplicated data? |
| Buyer Side | Are six submenu views contextual and non-duplicative? Are buyer-facing values separated from supplier cost? |
| Supplier Side | Are six summary cards and allocation table readable? Are TB rows nested and actionable? |
| Child detail | Are progress, quantity, operation, documents, invoice, quality, and issue panels scannable? |
| Quality | Is contract-versus-actual comparison legible on desktop/mobile? |
| Documents | Are upload, status, version, visibility, and protected download controls clear? |
| Payment | Are invoice/bank/status summaries readable and RBAC-safe? |
| Commercial | Is lock state visible while server redaction remains enforced? |
| Compatibility | Do old `?open=` links resolve without forcing the primary workflow into a popup? |

Each surface requires screenshot/manual QA at the three viewport sizes listed in section 0. CSS overflow hiding is not an acceptable fix for layout defects.

### 3.1 Current route

```text
/shipment-monitor
```

Current path:

```text
src/app/(dashboard)/shipment-monitor/page.tsx
  → ShipmentClient
    → SummaryCards
    → status tabs
    → search/region/year filter
    → ShipmentTable
    → ShipmentDetailDrawer
      → TabInfo
      → TabDocuments
      → TabSourceBarge
      → TabTimeline
      → TabIssues
      → TabDomestic
      → TabFinancial
      → TabSI
      → TabCommercialRef
      → DailyDeliveryTab
```

### 3.2 Current files

| Area | Current files |
|---|---|
| Page | `src/app/(dashboard)/shipment-monitor/page.tsx` |
| Main client | `src/modules/shipment-monitor/components/shipment-client.tsx` |
| Main list | `src/modules/shipment-monitor/components/shipment-table.tsx` |
| Existing detail | `src/modules/shipment-monitor/components/shipment-detail-drawer.tsx` |
| Existing tabs | `src/modules/shipment-monitor/components/tabs/*` |
| Hooks | `src/modules/shipment-monitor/hooks/use-shipments.ts` |
| UI store | `src/modules/shipment-monitor/store/shipment-ui-store.ts` |
| Shipment API | `src/app/api/shipments/route.ts`, `src/app/api/shipments/[id]/route.ts` |
| Child API | `src/app/api/shipments/[id]/child-nominations/*` |
| Workspace API | `src/app/api/shipments/[id]/workspace/route.ts` |
| Schema | `prisma/schema.prisma:model Shipment`, `model ChildNomination` |
| Migration | `prisma/migrations/20260901100000_add_child_nominations/migration.sql` |
| Workspace page | `src/app/(dashboard)/shipment-monitor/[id]/page.tsx` |
| Workspace component | `src/modules/shipment-monitor/components/mv-workspace.tsx` |

### 3.3 Current model

Current `Shipment` contains:

```prisma
shipmentNumber String @unique
vesselName     String?
bargeName      String?
qtyPlan        Decimal?
qtyLoaded      Decimal?
qtyFinal       Decimal?
status         ShipmentStatus
```

Current `ChildNomination` foundation contains:

```prisma
motherShipmentId String
nominationNumber String @unique
bargeName        String
plannedQty       Decimal?
loadedQty        Decimal?
finalQty         Decimal?
source           String?
supplier         String?
status           String
currentStage     String?
eta              DateTime?
notes            String?
```

### 3.4 Current gaps

1. Existing `/api/shipments` parent-only filter depends on `shipmentClass` defaulting to `mother_vessel`; no legacy data classification has been performed.
2. `Shipment.bargeName` remains a scalar legacy field.
3. Supplier Side is not a primary workspace tab.
4. Workspace currently has a basic child table, not the client allocation table.
5. Workspace progress is only partially derived from real records.
6. Workspace Current Issue summary is not a complete severity/issue composition.
7. Child form only covers a subset of supplier allocation fields.
8. Child update UI is limited to loaded quantity and status.
9. Child update does not expose source, supplier, jetty, laycan, LHV, BL, invoice, quality, or contract data.
10. Existing tabs are still available through the legacy drawer.
11. Reference seven-tab navigation is not yet implemented.
12. Header commercial metadata is incomplete.
13. `Entity` is not a Shipment field or relation in the current workspace response.
14. No child-specific contract relation exists.
15. No child-specific invoice relation exists.
16. No child-specific freight/laytime relation exists.
17. No child-specific quality relation exists.
18. No child-specific PEB/legal document relation exists.
19. No server-side current-stage state machine exists.
20. No full MV allocation reconciliation endpoint exists.

---

## 4. Client Target UI

### 4.0 Latest Supplier Side reference flow

The latest reference defines two sequential screens:

```text
Mother Vessel Workspace / Supplier Side
  → Supplier Allocation / Barge List
    → View
      → Barge Line / Supplier Detail workspace
```

This is not a standalone TB shipment. The second screen remains scoped to the selected MV and identifies the child as a barge line.

### 4.0.1 MV Supplier Side screen

Header:

```text
Shipment Monitor > HD34926 - MV Ever Success
HD34926 - MV EVER SUCCESS [LOADING]
```

Header metadata:

- Buyer.
- Entity.
- Market.
- Mother Vessel.
- Laycan.
- POL.
- POD.
- Shipping Term.
- Offer/FCO.

Header actions:

- `Edit Header`.
- `Shipment Documents`.
- `More`.

Top-level navigation remains:

```text
Overview | Buyer Side | Supplier Side | Quality | Documents | Payment | Commercial 🔒
```

Supplier Side summary cards, in this order:

1. Buyer Qty (Plan).
2. Allocated Qty (Plan).
3. Actual / COB Qty.
4. Barge Progress.
5. Document Alert.
6. Overall Status.

Required card detail:

| Card | Main value | Supporting value |
|---|---|---|
| Buyer Qty | MV planned quantity | `From Sales Forecast` |
| Allocated Qty | Sum child plan | `Fully Allocated` or remaining quantity |
| Actual / COB Qty | Sum child COB/jetty quantity | Variance MT and percentage |
| Barge Progress | Completed child / total child | Percentage and status |
| Document Alert | Pending document count | `Pending Documents` |
| Overall Status | Derived MV status | `In Progress`, `On Track`, `At Risk`, or `Delayed` |

Allocation section:

```text
SUPPLIER ALLOCATION / BARGE LIST
[Search source, supplier, barge...] [Add Source / Barge Allocation]
```

Reference table columns:

| Column | Required content |
|---|---|
| No. | Stable row number |
| Source | Source/location |
| Supplier / IUP Holder | Supplier and IUP owner |
| Jetty / Loading Port | Jetty and location |
| Barge (TB / BG) | TB/BG name or pair |
| Barge Laycan | Child laycan date range |
| Qty Plan (MT) | Planned child quantity |
| COB / Jetty Qty (MT) | Actual child quantity |
| Status | Operational color status |
| BL Date | Child BL date when available |
| Action | `View` child detail |

Footer:

- Total Qty Plan.
- Total COB/Jetty Qty.
- Allocation reconciliation.

Status color legend required:

```text
UPCOMING
STANDBY LP
LOADING
SAILING TO LP
DISCHARGING
COMPLETE
CANCELLED
```

Status values must be derived from operational state where data exists. Manual override requires role, reason, and audit.

### 4.0.2 Barge Line / Supplier Detail screen

Clicking `View` opens a dedicated child-detail workspace, not a new top-level Shipment Monitor record and not a generic unrelated popup.

Header:

```text
Shipment Monitor > HD34926 - MV Ever Success > Barge Line #03
BARGE LINE #03 [STANDBY LOADING PORT]
```

Header metadata:

- Source.
- Supplier / IUP Holder.
- Jetty / Loading Port.
- Barge TB/BG.
- Barge Laycan.
- Qty Plan.
- COB / Jetty Qty.
- BL Date.
- Mother Vessel.

Header actions:

- Previous.
- Next.
- Edit.
- More.
- Close child detail.

Child progress bar:

```text
1 Allocation
2 Contract
3 Nomination
4 Loading
5 Documents
6 Invoice
7 Result
```

Progress states:

- Done.
- In Progress.
- Pending.
- Blocked, if an issue prevents progress.

Child detail submenu, latest reference:

```text
Overview | Operation | Contract | Royalty | Invoice | Documents (PEB) |
Legal Documents | Freight & Laytime | Quality Result | Communication
```

Differences from earlier plan:

- `Quantity` is represented in the Overview `Quantity Summary`, not necessarily a separate tab.
- `Remarks & Issue` is represented in the Overview `Issue/Remarks` or communication area.
- `Commercial` is locked/restricted and may be displayed as `Communication` in the latest visual reference.
- `Royalty` is an explicit child-detail submenu in the latest reference.
- `Result` replaces the earlier generic `Settlement` label in the progress bar, while invoice/royalty remain separate operational areas.

### 4.0.3 Barge Line Overview layout

The first child-detail view must show these panels in one operational dashboard:

#### Source & Allocation

- Source.
- Supplier / IUP Holder.
- IUP OP.
- Shipment flow.
- Jetty / Loading Port.
- PIC.
- Barge laycan.
- Child plan quantity.

#### Barge & Status

- Tug boat.
- Barge.
- Barge type/size or DWT.
- Nomination date.
- Shipment status.
- Operational remarks.

#### Quantity Summary

- Plan Qty (MT).
- COB / Jetty Qty (MT).
- Loss/Gain (MT).
- Variance (%).
- Tolerance.
- Within tolerance/out-of-tolerance status.

Formula:

```text
lossGainMt = cobQty - planQty
variancePercent = planQty == 0 ? null : lossGainMt / planQty * 100
withinTolerance = abs(variancePercent) <= tolerancePercent
```

#### Operation Progress

- Arrival at jetty.
- Berthing.
- Commence loading.
- Complete loading.
- LHV issued.
- BL date.
- Timestamp per milestone.
- `View Full Operation Timeline`.

#### Document & Invoice Alert

- PEB document completed/required count and percentage.
- Legal document status.
- Invoice count.
- Invoice status.
- Royalty status.
- `View All Documents & Invoice`.

#### Access boundary

```text
Data harga & cost hanya dapat dilihat oleh role yang berwenang.
```

At minimum, child price, cost, freight, royalty, margin, and restricted commercial fields must be removed server-side for non-authorized roles.

### 4.1 Navigation model

The client wants one dedicated MV workspace page, not a popup as the primary workflow.

Target route:

```text
/shipment-monitor/[id]
```

Top-level tabs:

```text
Overview | Buyer Side | Supplier Side | Quality | Documents | Payment | Commercial 🔒
```

Legacy tab consolidation:

| Current tab | Target destination |
|---|---|
| Overview | Overview |
| Documents | Documents |
| Blending Details | Supplier Side |
| Timeline | Overview / Supplier Side Operation |
| Risk Analysis | Overview Current Issues + Quality where applicable |
| Commercial Ref | Commercial |
| Domestic | Supplier Side Operation or Documents |
| Financial | Payment / Commercial |
| SI | Documents / Commercial |
| Daily Delivery | Main module or Overview operational link |

The legacy drawer may remain as a compatibility path during migration, but the primary row action must open the page workspace.

### 4.2 Workspace header

```text
Shipment Monitor > HD34926 - MV Ever Success [LOADING]
```

Required metadata:

- Buyer.
- Entity.
- Market section.
- Mother Vessel.
- Laycan.
- POL.
- POD.
- Qty Plan.
- Offer/FCO reference.
- Shipping term.

Actions:

- Back to Monitor.
- Export.
- Share, if approved.
- More.
- Edit Shipment, subject to RBAC.

### 4.3 Overview layout

```text
Header / metadata
Top-level tabs
Summary cards
Shipment Progress       Critical Issues
Child nomination summary / link to Supplier Side
```

Summary cards:

1. Buyer Qty (Plan).
2. Supplier Allocation.
3. Actual Loaded.
4. Current Issue.

Shipment Progress stages:

```text
Sales Forecast
Buyer Confirmation
Supplier Allocation
Barge Loading
Mother Vessel Loading
Documents
Payment
```

Progress must derive from actual data. No index-based hardcoded completion.

Critical Issues panel:

- Critical count.
- High count.
- Category.
- Description.
- Current status.
- Link to issue detail.
- `View All Issues`.

### 4.4 Supplier Side layout

```text
Supplier Side - Allocation & Fulfillment Summary
Summary cards (6)
Action/search/filter bar
Allocation / Barge List table
View child Barge Line Detail workspace
```

Summary strip:

| Metric | Source |
|---|---|
| Buyer Qty (Mother Vessel) | `Shipment.qtyPlan` |
| Allocated Qty (Plan) | Sum `ChildNomination.plannedQty` |
| Actual Loaded / COB | Sum `ChildNomination.loadedQty` or agreed COB field |
| Remaining / Unallocated | MV plan - allocated plan |
| Barge Progress | Completed child count / total child count |
| Document Alert | Pending PEB/legal/document count |
| Overall Status | Derived from child stages, issues, documents, and allocation |

Allocation actions:

- Add Source / Barge Allocation.
- Search source, supplier, barge.
- Filter.
- Column visibility.
- Pagination or View All.

Allocation table:

| Column | Required behavior |
|---|---|
| # | Stable row number |
| Source | Source/location |
| Supplier / IUP OP | Supplier plus permit owner |
| Jetty / Loading Port | Loading location |
| Barge / Nomination | TB/BG plus nomination number |
| Barge Laycan | Date range |
| Qty Plan (MT) | Planned child quantity |
| COB / Jetty Qty (MT) | Actual child quantity |
| Status | Derived/validated status with legend color |
| BL Date | Child BL date if applicable |
| Action | View child detail |

Footer:

```text
TOTAL Qty Plan
TOTAL COB / Jetty Qty
Variance / Remaining
```

### 4.5 Supplier/Barge detail

The child detail remains nested under the MV context. It must not become an independent Shipment Monitor record.

Header:

- Parent MV.
- Shipment number.
- Source.
- Supplier.
- Barge.
- Plan quantity.
- Previous/Next child.
- Edit.
- History.
- Close detail.

Child progress:

```text
1. Allocation
2. Contract
3. Nomination
4. Loading
5. Documents
6. Invoice
7. Settlement
```

Child detail submenus:

```text
Overview
Operation
Quantity
Contract
Documents
Invoice
Freight & Laytime
Quality Result
Commercial 🔒
Remarks & Issue
```

### 4.6 Supplier/Barge Overview cards

#### Source & Allocation

- Source.
- IUP OP.
- Shipment flow.
- Jetty/loading port.
- Barge.
- PIC.
- Barge laycan.

#### Barge information

- Tug boat.
- Barge.
- DWT.
- Nomination date.
- Nominated by.

#### Quantity summary

- Plan Qty.
- COB/Jetty Qty.
- Variance MT.
- Variance %.
- Status.
- Tolerance.

Formula:

```text
varianceMt = actualQty - planQty
variancePercent = varianceMt / planQty * 100
withinTolerance = abs(variancePercent) <= tolerancePercent
```

#### Contract status

- Source contract number.
- Softcopy status.
- Hardcopy status.
- Contract status.
- Operations approval.
- QA approval.
- Legal approval.

#### PEB/legal documents

- Completed count.
- Required count.
- Completion percentage.
- View detail.

#### Invoice tracker

- Total invoice.
- Total amount.
- Last invoice.
- Invoice status.
- Submit Finance.
- View invoice.

#### Quality result

- COA date.
- Surveyor.
- GAR.
- TM.
- TS.
- ASH.
- Result: PASS/WARNING/FAIL.
- View Quality Detail.

#### Remarks and issue

- Remarks.
- Active issues.
- Attachments.
- Follow-up state.

---

## 5. Data Architecture

### 5.1 Minimum phase-one model

The existing `ChildNomination` model is the minimum foundation. Required additions for Supplier Side phase one:

```prisma
model ChildNomination {
  id                String   @id @default(uuid())
  motherShipmentId  String
  motherShipment    Shipment @relation(fields: [motherShipmentId], references: [id], onDelete: Cascade)
  nominationNumber  String   @unique
  bargeName         String
  tugBoatName       String?
  dwt               Decimal? @db.Decimal(12, 2)
  nominationDate    DateTime? @db.Date
  nominatedBy       String?
  source            String?
  supplier          String?
  iupOp             String?
  loadingPort       String?
  plannedQty        Decimal? @db.Decimal(12, 2)
  loadedQty         Decimal? @db.Decimal(12, 2)
  finalQty          Decimal? @db.Decimal(12, 2)
  tolerancePercent  Decimal? @db.Decimal(5, 2)
  laycanStart       DateTime? @db.Date
  laycanEnd         DateTime? @db.Date
  lhvIssued         Boolean  @default(false)
  lhvIssuedDate     DateTime? @db.Date
  blDate            DateTime? @db.Date
  status            String   @default("planned")
  currentStage      String?
  notes             String?
  createdById       String
  createdBy         User     @relation("ChildNominationCreatedBy", fields: [createdById], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

The above is a target contract, not permission to immediately add all fields. Add fields only when the corresponding UI/API behavior is implemented and verified.

### 5.2 Secondary child relations

These should be separate models when the data is real and operationally used:

```text
ChildNomination
├── ChildContractStatus
├── ChildDocument / PEBDocument
├── ChildInvoice
├── ChildFreightLaytime
├── ChildQualityResult
├── ChildIssue
└── ChildAuditHistory
```

Do not store invoice, quality, contract, and freight data as an unstructured JSON blob. Use relations when those areas become transactional.

### 5.3 Parent Shipment additions

Possible parent fields:

```text
entity
marketSection
fcoNumber / forecast relation
overallStage
```

Prefer existing Forecast relation for commercial data. Do not duplicate Forecast fields in Shipment unless a snapshot is required for historical integrity.

---

## 6. API Specification

### 6.1 Parent list

```http
GET /api/shipments
```

Required:

- Authenticate.
- Return Mother Vessel rows only.
- Search buyer, vessel, barge, shipment number, Forecast project, and child nomination fields.
- Return parent row when search matches a child.
- Return `childNominationCount`.
- Return aggregate child quantities.
- Return current issue summary.
- Restrict financial fields server-side.
- Support status, region, year, search, pagination.

### 6.2 Parent workspace

```http
GET /api/shipments/:id/workspace
```

Response contract:

```json
{
  "data": {
    "shipment": {},
    "summary": {
      "buyerQtyPlan": 55000,
      "allocatedQty": 55000,
      "actualLoadedQty": 48263,
      "remainingQty": 0,
      "bargeCompleted": 5,
      "bargeTotal": 7,
      "overallStatus": "on_track",
      "openIssueCount": 1,
      "criticalIssueCount": 1,
      "pendingDocumentCount": 2,
      "overduePaymentCount": 0,
      "qualityStatus": "pass"
    },
    "progress": [],
    "issues": [],
    "children": []
  }
}
```

### 6.3 Child list/create

```http
GET  /api/shipments/:id/child-nominations
POST /api/shipments/:id/child-nominations
```

POST validation:

- Parent exists and is `mother_vessel`.
- Nomination number is unique.
- Barge name required.
- Planned quantity is non-negative/positive according to business rule.
- New allocation does not exceed MV plan unless explicit approved override exists.
- Role permitted.
- Audit is written.
- Parent/workspace/list/dashboard caches invalidate.

### 6.4 Child update/delete

```http
PATCH  /api/shipments/:id/child-nominations/:childId
DELETE /api/shipments/:id/child-nominations/:childId
```

Required:

- Verify child belongs to URL parent.
- Validate updated allocation against siblings.
- Validate status/stage transition.
- Prevent negative quantities.
- Record changed fields.
- Require reason for cancellation/delete if business rule applies.
- Audit actor, role, parent ID, child ID, changed fields.
- Invalidate relevant caches.

### 6.5 Child detail

Recommended future endpoint:

```http
GET /api/shipments/:id/child-nominations/:childId/workspace
```

It should aggregate child operation, quantity, contract, documents, invoice, freight, quality, commercial, and issues only after those relations exist.

### 6.6 Error contract

```json
{
  "error": "Child planned quantity exceeds Mother Vessel plan",
  "code": "CHILD_ALLOCATION_EXCEEDS_PARENT",
  "details": {
    "parentQtyPlan": 55000,
    "allocatedQty": 50000,
    "requestedQty": 10000,
    "remainingQty": 5000
  }
}
```

Use status codes:

| Code | Meaning |
|---:|---|
| 401 | Not authenticated |
| 403 | Role not permitted |
| 404 | Parent/child not found |
| 409 | State/conflict/allocation violation |
| 422 | Invalid input |
| 500 | Unexpected server failure |

---

## 7. State and Calculation Rules

### 7.1 Allocation

```text
allocatedQty = sum(child.plannedQty)
remainingQty = parent.qtyPlan - allocatedQty
```

Rules:

- `remainingQty < 0` is invalid without approved override.
- Allocation may be incomplete and therefore positive remaining quantity is valid.
- Zero child records means allocation status `unallocated`.
- Total child plan must be visible and auditable.

### 7.2 Loading

```text
actualLoadedQty = sum(child.loadedQty)
```

Fallback to parent `Shipment.qtyLoaded` only when no child loaded data exists and the UI labels the source clearly.

### 7.3 Barge progress

```text
bargeProgress = completedChildCount / childCount * 100
```

No child records:

0 / 0, status: not_started
```

### 7.4 Overall status

Suggested precedence:

1. `critical_issue` if any critical unresolved issue.
2. `delayed` if overdue stage/document/payment exists.
3. `at_risk` if allocation, quality, or stage warning exists.
4. `on_track` if required progress is within expected timing.
5. `not_started` if no child/progress exists.

The exact SLA thresholds must be approved before production alerting.

### 7.5 Child stage transitions

Suggested valid order:

```text
allocation
→ contract
→ nomination
→ standby_loading_port
→ loading
→ sailing_to_loading_port
→ documents
→ invoice
→ settlement
```

Allowed exceptions require a reason and audit entry. Do not let arbitrary authenticated PATCH requests set any stage.

---

## 8. RBAC

### 8.1 Parent workspace

- Shipment readers can read MV and child operational data.
- Financial/commercial fields remain executive-only.
- Critical-document visibility remains restricted.

### 8.2 Child operations

| Action | Suggested roles |
|---|---|
| View child | Authenticated shipment readers |
| Add allocation | Commercial/Traffic/Operations authorized roles |
| Edit allocation | Commercial/Traffic/Operations authorized roles |
| Update loading stage | Traffic/Operations authorized roles |
| Update quantity | Traffic/Operations/authorized data owner |
| Cancel child | Authorized role + reason |
| Approve exception | CEO/approved executive role |
| View commercial | Executive roles |

These role lists must use one shared helper. Do not duplicate role arrays across routes.

### 8.3 Server enforcement

UI hiding is not security. Every mutation route must independently check:

- Session.
- Role.
- Parent ownership/context.
- Current state.
- Input validity.
- Required reason/evidence.

---

## 9. Audit and Cache

### 9.1 Audit events

Required child audit actions:

```text
child_nomination_created
child_nomination_updated
child_nomination_stage_changed
child_nomination_quantity_changed
child_nomination_cancelled
child_nomination_deleted
child_nomination_exception_approved
```

Minimum details:

```json
{
  "motherShipmentId": "...",
  "childNominationId": "...",
  "changedFields": ["loadedQty", "currentStage"],
  "before": {},
  "after": {},
  "reason": "..."
}
```

### 9.2 Cache keys

Recommended keys:

```text
shipments:list:<filter>
shipments:detail:<mvId>
shipments:workspace:<mvId>
shipments:children:<mvId>
shipments:child:<mvId>:<childId>
dashboard:shipments-active
dashboard:metrics:<filter>
```

Child mutation invalidates:

- Parent workspace.
- Parent detail.
- Parent shipment list.
- Dashboard active shipment data.
- Any Supplier Side child detail query.

### 9.3 Loading/error/empty states

Every workspace section requires:

- Loading skeleton.
- Error message with retry.
- Empty state with next action.
- Mutation pending state.
- Mutation failure message preserving user input.

Examples:

- No children: `No source/barge allocations yet` + `Add Source / Barge Allocation`.
- No issues: `No active critical issues`.
- No documents: `No document checklist data` + link to Documents.
- No quality data: `Quality result not available`.

---

## 10. Migration and Legacy Data Plan

### 10.1 Pre-migration inventory

Run read-only queries to identify:

- Total shipments.
- Records with vessel only.
- Records with barge only.
- Records with vessel and barge.
- Records with names matching MV/TB/BG patterns.
- Existing project/Forecast links.
- Shared buyer/laycan/source relationships.
- Existing transshipment references.

Output a reviewed mapping:

```text
legacyShipmentId | motherShipmentId | childNominationNumber | confidence | reviewer
```

### 10.2 Safe migration rules

- Add schema before data conversion.
- Default existing `Shipment.shipmentClass` to `mother_vessel` only if that is accepted as the compatibility interpretation.
- Do not transform `bargeName` into child data automatically when parent identity is uncertain.
- Preserve original fields.
- Record all converted IDs.
- Make migration idempotent.
- Back up DB before applying.
- Test on disposable DB and staging first.

### 10.3 Rollback

- Schema migration rollback procedure documented.
- Data conversion script must produce a reverse mapping.
- Never delete legacy `bargeName` during initial rollout.
- Disable child write UI if reconciliation fails.

---

## 11. Implementation Phases

### Phase 1 — Standardize parent/child read model

- Verify `ShipmentClass` migration.
- Verify parent-only list.
- Add child count and aggregate quantities.
- Add parent workspace response contract.
- Add mapping report for legacy data.

Exit criteria:

- No ambiguous data is auto-converted.
- List returns parent records only under agreed rule.
- Aggregates reconcile with DB.

### Phase 2 — Implement client page shell

- Dedicated MV route.
- Header/breadcrumb/metadata.
- Seven top-level tabs.
- Legacy drawer compatibility.
- Responsive layout.

Exit criteria:

- Row opens page.
- Deep links work.
- No primary workflow depends on popup.

### Phase 3 — Implement Overview

- Four summary cards.
- Real progress calculation.
- Critical issues panel.
- Child allocation summary.
- Loading/error/empty states.

Exit criteria:

- No hardcoded progress.
- Counts match source APIs.
- Financial fields remain restricted.

### Phase 4 — Implement Supplier Side table

- Summary strip.
- Allocation table.
- Search/filter/columns/pagination.
- Add allocation.
- View child detail.

Exit criteria:

- Child rows never appear as top-level shipment rows.
- Totals reconcile.
- Quantity ceiling enforced.

### Phase 5 — Implement child detail

- Seven-stage progress.
- Overview.
- Operation.
- Quantity.
- Contract.
- Documents.
- Invoice.
- Freight/Laytime.
- Quality.
- Commercial.
- Remarks/Issues.

Only build each section after its data source and mutation contract exist.

### Phase 6 — Harden security and operations

- Shared RBAC helpers.
- State transition matrix.
- Audit before/after diff.
- Cache invalidation.
- Protected document access.
- Rate/size/input boundaries.

### Phase 7 — Verify and release

- Clean migration.
- Staging migration.
- Legacy reconciliation.
- E2E tests.
- Browser QA at desktop/tablet/mobile.
- Production backup and deployment.

---

## 12. Acceptance Criteria

### Parent-child

- `AC-SMW-001`: MV can own multiple child nominations.
- `AC-SMW-002`: Child cannot exist without MV.
- `AC-SMW-003`: Child cannot be accessed through a different MV URL.
- `AC-SMW-004`: Top-level list excludes records classified as child.
- `AC-SMW-005`: Search by TB returns parent MV row.

### Page/workspace

- `AC-SMW-006`: MV opens at `/shipment-monitor/[id]`.
- `AC-SMW-007`: Primary workflow is page-based, not popup-based.
- `AC-SMW-008`: Header displays MV identity/status/metadata.
- `AC-SMW-009`: Seven client tabs are visible and usable.
- `AC-SMW-010`: Legacy deep link remains compatible during rollout.

### Overview

- `AC-SMW-011`: Buyer Qty Plan is sourced from parent MV.
- `AC-SMW-012`: Supplier Allocation equals child planned sum.
- `AC-SMW-013`: Actual Loaded uses agreed child/parent source and is labelled.
- `AC-SMW-014`: Current Issue is data-driven.
- `AC-SMW-015`: Progress is data-driven.
- `AC-SMW-016`: Critical Issues displays severity and navigation.

### Supplier Side

- `AC-SMW-017`: Allocation table contains required client columns.
- `AC-SMW-018`: Table totals reconcile to summary cards.
- `AC-SMW-019`: Add allocation validates parent quantity.
- `AC-SMW-020`: Edit allocation validates siblings plus parent quantity.
- `AC-SMW-021`: Child View remains inside MV context.
- `AC-SMW-022`: Child status/stage is visible and not arbitrary.

### Child detail

- `AC-SMW-023`: Child detail displays seven operational stages.
- `AC-SMW-024`: Quantity variance is calculated and labelled.
- `AC-SMW-025`: Contract/document/invoice/quality sections show truthful empty states when data is absent.
- `AC-SMW-026`: Commercial data is restricted server-side.
- `AC-SMW-027`: Remarks/issues preserve attachments and history.

### Security/operations

- `AC-SMW-028`: Unauthorized parent mutation returns 403.
- `AC-SMW-029`: Unauthorized child mutation returns 403.
- `AC-SMW-030`: Every child mutation writes an audit event.
- `AC-SMW-031`: Audit includes parent/child IDs and changed fields.
- `AC-SMW-032`: Parent/child/dashboard caches invalidate after mutation.
- `AC-SMW-033`: Internal/critical documents cannot be opened through an unprotected direct URL.

### Production

- `AC-SMW-034`: Migration applies on clean staging DB.
- `AC-SMW-035`: Migration applies after existing production migration history.
- `AC-SMW-036`: Legacy row mapping is reviewed.
- `AC-SMW-037`: Backup restore is verified.
- `AC-SMW-038`: MV → child → quantity update → issue → workspace → close validation passes E2E.

---

## 13. Verification Plan

### Static

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
git diff --check
```

### API

- Unauthenticated GET/POST/PATCH/DELETE.
- Read-only role GET.
- Unauthorized mutation role.
- Invalid parent ID.
- Wrong child-parent combination.
- Duplicate nomination number.
- Allocation over parent plan.
- Same-date quantity update.
- Valid transition.
- Invalid transition.

### Browser

- Desktop page layout.
- Tablet wrapping.
- Mobile horizontal tables/tabs.
- Row opens workspace.
- Back navigation.
- Deep-link route.
- Add/edit/delete child.
- Loading/error/empty states.
- Financial/commercial redaction.
- Critical issue link.

### Data

- Parent plan equals expected source.
- Child planned sum.
- Child loaded sum.
- Remaining quantity.
- Barge progress.
- Issue count/severity.
- Pending documents.
- Payment overdue count.
- Quality state.

### Production

- Run backup first.
- Confirm migration status.
- Apply migrations.
- Build.
- Reload PM2 only after migration/build success.
- Check health endpoint.
- Review PM2 logs.
- Verify one real MV workspace.

---

## 14. Non-Goals

- No standalone TB/BG Shipment Monitor page.
- No automatic conversion of ambiguous legacy barge records.
- No duplicate shipment model for TB.
- No AI Risk Analysis claim in this module.
- No fake invoice/quality/contract data.
- No direct database production mutation without backup and migration status.
- No removal of legacy drawer until page parity and deep-link compatibility are verified.

---

## 15. Final Decision

The target is not a cosmetic tab rename. It is a change from:

```text
Flat Shipment list + popup detail
```

to:

```text
MV-centric Shipment Monitor
└── Dedicated Mother Vessel Workspace
    ├── Overview
    ├── Buyer Side
    ├── Supplier Side
    │   ├── Allocation summary
    │   ├── Source/Barge table
    │   └── Nested supplier/barge detail
    ├── Quality
    ├── Documents
    ├── Payment
    └── Commercial
```

Current code has the parent/child foundation and a first workspace page, but this document defines the remaining standard required for full client parity.

*End of document.*

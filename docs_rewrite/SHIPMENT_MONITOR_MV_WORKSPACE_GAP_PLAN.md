# Shipment Monitor: MV Workspace & Child Nomination

**Dokumen:** Audit Gap, Planning, dan Implementation Plan  
**Tanggal:** 2026-09-01  
**Status:** Phase 1-3 implemented; remaining production data reconciliation and expanded workspace tabs pending

> **Latest Supplier Side references (2026-09-01) supersede earlier visual assumptions:** MV Supplier Side uses six summary cards and a Source/Barge Allocation table. `View` opens a Barge Line/Supplier Detail workspace with its own seven-step progress and operational submenu. See `SHIPMENT_MONITOR_CLIENT_WORKSPACE_SRS.md` section 4.0.

## Audit Coverage Rule

This plan covers the complete product surface, not only Buyer Side. For every module and submenu, execution must close all of these dimensions:

1. UI information architecture and component ownership.
2. Desktop/tablet/mobile layout and overlap prevention.
3. Navigation and interaction behavior.
4. Real data source, Prisma relation, and aggregation.
5. API validation and error contract.
6. Workflow/state transition rules.
7. Server-side RBAC and sensitive-field redaction.
8. Audit log and revision history.
9. React Query cache key/invalidation behavior.
10. Loading, error, empty, disabled, and retry states.
11. Browser verification at 1440px, 1024px, and 390px.
12. Migration, E2E, and production smoke evidence.

The implementation is not complete when only a page, tab, endpoint, model, or screenshot exists. The full chain must be proven:

```text
UI → interaction → hook/query → API → validation → Prisma/relation → RBAC → audit → cache → responsive output
```

Required audit surfaces:

```text
MV Monitor List
MV Header
Overview
Buyer Side
  ├── Overview
  ├── Vessel & Nomination
  ├── Docs & Bank
  ├── POD Result
  ├── Quality
  └── Communication
Supplier Side
  ├── Allocation/Barge List
  └── Barge Line Detail
Quality
Documents
Payment
Commercial
Legacy deep links
Header actions/export
Mobile/tablet variants
```
**Scope:** Shipment Monitor, Mother Vessel, Child Nomination/TB/BG

---

## 1. Executive Summary

Aturan bisnis yang harus menjadi source of truth:

- Shipment Monitor menampilkan **Mother Vessel (MV)** sebagai record utama.
- Child Nomination berupa TB/BG/tongkang tidak tampil sebagai shipment mandiri.
- Satu MV dapat memiliki banyak child nomination.
- Child nomination selalu berada di dalam konteks MV parent.
- Detail MV menjadi workspace operasional untuk buyer, supplier, quality, documents, payment, commercial, timeline, SI, issue, dan child nominations.

Implementasi saat ini belum memenuhi aturan tersebut. Model `Shipment` masih datar dan hanya memiliki satu `bargeName`. Detail shipment masih fixed drawer, bukan page workspace.

**Keputusan:** lakukan perubahan bertahap. Jangan menghapus `Shipment.bargeName` atau mengubah seluruh workflow dalam satu migration besar sebelum data lama dipetakan.

---

## 2. Current Code Evidence

### 2.1 Current route and UI

```text
/shipment-monitor
  → ShipmentMonitorPage
  → ShipmentClient
  → ShipmentTable
  → ShipmentDetailDrawer
  → TabInfo / Documents / SourceBarge / Timeline / Issues / Domestic / Financial / SI
```

Evidence:

- `src/app/(dashboard)/shipment-monitor/page.tsx`
- `src/modules/shipment-monitor/components/shipment-client.tsx`
- `src/modules/shipment-monitor/components/shipment-table.tsx`
- `src/modules/shipment-monitor/components/shipment-detail-drawer.tsx`
- `src/modules/shipment-monitor/components/tabs/tab-info.tsx`

### 2.2 Current data model

`prisma/schema.prisma:model Shipment` currently contains:

```prisma
vesselName String?
bargeName  String?
```

There is no explicit:

- `shipmentClass` or `transportClass`.
- `parentShipmentId` / `motherVesselId`.
- `ChildNomination` model.
- child nomination quantity allocation.
- child nomination status/stage relation.
- parent MV aggregate quantity.
- nomination-level issue/document ownership.

Existing related models:

- `BargeChangeLog` records barge changes, not child nominations.
- `Transshipment` has vessel/barge-related fields, but represents transshipment operations, not the MV-to-child ownership hierarchy.
- `ShippingInstruction` is shipment-owned and is not a child nomination registry.

### 2.3 Current list behavior

`src/app/api/shipments/route.ts` returns every `Shipment` record. No parent-MV filter exists.

Current table:

- `src/modules/shipment-monitor/components/shipment-table.tsx`
- Displays every returned shipment.
- Combines MV and barge in one `Vessel / Barge` column.
- Does not identify whether a row is MV or TB/BG.

### 2.4 Current detail behavior

`src/modules/shipment-monitor/components/shipment-detail-drawer.tsx`:

- Uses fixed overlay drawer.
- Maximum width: `max-w-3xl`.
- Detail is not a dedicated route/page.
- `TabInfo` displays one vessel and one barge field.
- `TabSourceBarge` shows a single “Child Barge Details” derived from `shipment.bargeName`.

### 2.5 Current create/conversion behavior

- `ShipmentFormModal` accepts `vesselName` and `bargeName` in the same Shipment record.
- Forecast conversion accepts `vesselName` and `bargeName` in one request.
- `/api/forecasts/[id]/convert-shipment` creates one Shipment and stores the barge as a scalar field.

---

## 3. Reference Target

### 3.1 Shipment Monitor list

The main list must be MV-centric:

- One row per Mother Vessel.
- TB/BG rows excluded from the main list.
- Parent MV quantity shown as planned/allocated/loaded/final.
- Child count shown.
- Current issue summary shown.
- Status and stage shown at MV level.
- Search may match MV fields or nested child nomination fields, but result remains the parent MV row.

Suggested columns:

| Column | Meaning |
|---|---|
| MV / Shipment No | Parent shipment identity |
| Buyer | Buyer linked to MV |
| Entity / Market | Commercial context |
| Qty Plan | Parent planned quantity |
| Child Nominations | Number of TB/BG children |
| Actual Loaded | Aggregate loaded quantity |
| Status | MV status |
| Current Stage | Current operational stage |
| Issue | Highest-priority active issue |
| Action | Open workspace |

### 3.2 Mother Vessel workspace page

Target route:

```text
/shipment-monitor/[id]
```

Workspace structure:

```text
Breadcrumb: Shipment Monitor / MV Number
Header: MV Number + status + actions
Metadata: buyer, entity, market, qty plan, laycan, POL, POD, term, FCO
Tabs: Overview | Buyer Side | Supplier Side | Quality | Documents | Payment | Commercial
```

Overview target:

- Buyer Qty (Plan).
- Supplier Allocation.
- Actual Loaded.
- Current Issue.
- Shipment Progress.
- Critical Issues.
- Child Nominations / TB-BG allocation table.

### 3.3 Child nomination section

Each child record should show:

- TB/BG name.
- Parent MV.
- Nomination number.
- Planned quantity.
- Loaded quantity.
- Source/supplier.
- Status.
- Current stage.
- ETA or schedule.
- Issue/note.
- Documents if nomination-specific.
- Change history.

Child records must never be rendered as unrelated top-level shipments.

---

## 4. Gap Matrix

| Area | Current state | Target state | Severity | Decision |
|---|---|---|---|---|
| Parent-child model | No explicit hierarchy | MV parent with many child nominations | P0 | Add new relation/model |
| Main list | All Shipment rows | MV only | P0 | Filter by class/parent |
| Barge storage | Scalar `bargeName` | Child nomination records | P0 | Preserve legacy field during migration |
| Detail UI | Fixed drawer | Dedicated MV workspace page | P0 | Add route, retain deep-link compatibility |
| Overview | Technical shipment detail | Executive operational workspace | P1 | Add summary/progress/issue composition |
| Child visibility | One inferred barge | Expandable/listed children | P0 | Add child table in workspace |
| Quantity | Parent and child not allocated | Plan/allocated/loaded/final reconciliation | P0 | Add validation and aggregate calculation |
| Status | Shipment-only status | MV and child status/stage | P1 | Define transition rules |
| Issue | Shipment issue only | Parent and child issue context | P1 | Add ownership reference if required |
| Documents | Shipment-owned | MV plus optional nomination-specific docs | P1 | Define document ownership first |
| SI | Shipment-owned | MV SI with child nominations where required | P1 | Keep SI parent-owned initially |
| Search | Flat fields | Parent + nested child search | P1 | Return parent rows |
| RBAC | Session checks plus partial role gates | Server-side action-level authorization | P0 | Fix before production claim |
| Audit | Shipment actions audited | Parent/child mutation audit | P0 | Include parent and child IDs |
| Cache | Shipment keys only | Invalidate MV and child queries | P1 | Add explicit query keys |
| Migration | No migration | Add hierarchy safely | P0 | Backup, migrate, verify |

---

## 5. Proposed Data Model

### 5.1 Recommended model

Use a dedicated model instead of overloading `Shipment`:

```prisma
model ChildNomination {
  id              String   @id @default(uuid())
  motherShipmentId String
  motherShipment  Shipment @relation(fields: [motherShipmentId], references: [id], onDelete: Cascade)
  nominationNumber String   @unique
  bargeName        String
  plannedQty       Decimal? @db.Decimal(12, 2)
  loadedQty        Decimal? @db.Decimal(12, 2)
  finalQty         Decimal? @db.Decimal(12, 2)
  source           String?
  supplier         String?
  status           String   @default("planned")
  currentStage     String?
  eta              DateTime?
  notes            String?
  createdById      String
  createdBy        User     @relation(fields: [createdById], references: [id])
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([motherShipmentId])
  @@index([status])
  @@map("child_nominations")
}
```

The exact field names require implementation review before migration. `currentStage`, status enum, nomination number format, and document ownership must be finalized first.

### 5.2 Parent classification

Recommended initial rule:

- Existing Shipment records remain parent records by default.
- New child nominations use `ChildNomination`.
- `Shipment.bargeName` remains read-compatible legacy data.
- Do not infer a child solely from a barge string without an explicit migration mapping.

Optional future field:

```prisma
shipmentClass ShipmentClass @default(mother_vessel)
```

Do not add this field unless existing data requires both parent and child rows in the `Shipment` table. Dedicated `ChildNomination` is the safer minimum model.

---

## 6. Migration Strategy

### Phase 0 — Data discovery

1. Count all Shipment records.
2. Identify records with `vesselName`, `bargeName`, or both.
3. Identify records whose shipment number/name indicates TB/BG.
4. Identify records with shared buyer/laycan/parent references.
5. Produce a mapping file: `legacy shipment → mother MV → child nomination`.
6. Stop if parent identity is ambiguous.

### Phase 1 — Add child model

1. Add `ChildNomination` schema and migration.
2. Add indexes and foreign key.
3. Run `prisma migrate deploy` on disposable/staging DB.
4. Verify row counts and rollback plan.

### Phase 2 — Read path

1. Add child nomination GET endpoint under MV:
   ```text
   GET /api/shipments/[id]/child-nominations
   ```
2. Change main Shipment list to return MV parent rows only.
3. Include child count and aggregate quantities.
4. Keep old `bargeName` display as legacy fallback only.

### Phase 3 — Dedicated workspace

1. Add `/shipment-monitor/[id]` page.
2. Move detail composition from drawer into page components.
3. Keep `?open=<id>` compatibility by redirecting or opening the page route.
4. Preserve existing tabs while adding reference tabs incrementally.
5. Add Overview cards, progress, critical issue summary, and child nomination table.

### Phase 4 — Write path

1. Add child nomination create/update endpoints.
2. Restrict child mutation by server-side RBAC.
3. Require parent MV ID for every child mutation.
4. Add audit event with `motherShipmentId` and `childNominationId`.
5. Validate allocation totals against MV plan quantity.

### Phase 5 — Workflow integration

1. Forecast conversion creates the MV parent first.
2. Child nominations are created explicitly after MV creation.
3. SI remains MV-owned unless business rules require nomination-level SI.
4. Documents remain MV-owned initially; add child ownership only with confirmed requirements.
5. Dashboard active shipments uses MV rows and child issue aggregates.

---

## 7. API Contract Plan

### Parent list

```text
GET /api/shipments
```

Required behavior:

- Exclude child records if child records are ever stored in `Shipment`.
- Return `childNominationCount`.
- Return aggregate planned/loaded/final quantities.
- Return highest severity active issue.
- Search nested child names but return parent MV.

### Parent detail

```text
GET /api/shipments/[id]
```

Required response additions:

```json
{
  "data": {
    "id": "mv-id",
    "shipmentClass": "mother_vessel",
    "childNominationCount": 3,
    "childNominationSummary": {
      "plannedQty": 55000,
      "loadedQty": 48263,
      "allocatedQty": 55000
    }
  }
}
```

### Child list

```text
GET /api/shipments/[id]/child-nominations
```

### Child mutation

```text
POST  /api/shipments/[id]/child-nominations
PATCH /api/shipments/[id]/child-nominations/[childId]
DELETE /api/shipments/[id]/child-nominations/[childId]
```

All routes must:

- Authenticate.
- Authorize role server-side.
- Verify child belongs to parent MV.
- Validate quantities and status transitions.
- Write audit log.
- Invalidate parent/child/dashboard caches.

---

## 8. RBAC and Audit Requirements

### Read

- Authorized shipment readers may view MV and nested child nominations.
- Financial fields remain executive-only.
- Child nomination visibility follows parent MV access.

### Write

- Create/edit child nomination: authorized Commercial/Traffic roles.
- Change child status/stage: authorized Traffic/Operations roles.
- Close parent MV: existing close RBAC must be enforced server-side.
- Delete/cancel child: explicit role and reason required.

### Audit payload

Every child mutation should include:

```json
{
  "motherShipmentId": "...",
  "childNominationId": "...",
  "action": "created|updated|cancelled|deleted",
  "changedFields": ["loadedQty", "status"]
}
```

---

## 9. UI Implementation Plan

### Main list

- Rename table context to `Mother Vessels` where appropriate.
- Remove standalone TB rows.
- Show child count.
- Show aggregate quantities.
- Show highest active issue.
- Row action: `Open Workspace`.

### Workspace header

- Breadcrumb.
- MV number and vessel name.
- Status badge.
- Share action.
- More action.
- Edit MV action.
- Commercial reference metadata.

### Overview

- Buyer Qty Plan.
- Supplier Allocation.
- Actual Loaded.
- Current Issue.
- Progress timeline.
- Critical issue list.
- Child nomination table.

### Child nomination interaction

- Expand/collapse children inside MV workspace.
- Never open a child as an independent top-level Shipment Monitor record.
- Child detail may use inline expansion or nested page only if required.
- Show allocation reconciliation:
  ```text
  MV Qty Plan = sum(child planned quantities) + unallocated quantity
  ```

### Responsive behavior

- Desktop: workspace header + summary grid + two-column overview.
- Tablet: summary cards wrap.
- Mobile: horizontal tab scroll; child table horizontal scroll or stacked rows.
- No fixed drawer dependency for primary workflow.

---

## 10. Acceptance Criteria

### Data model

- `AC-MV-001`: One MV can own multiple child nominations.
- `AC-MV-002`: Child nomination cannot exist without a valid MV parent.
- `AC-MV-003`: Child nomination cannot belong to another MV after creation.
- `AC-MV-004`: Legacy Shipment records remain readable after migration.

### Main list

- `AC-MV-005`: Main Shipment Monitor shows MV parent rows only.
- `AC-MV-006`: TB/BG does not appear as an unrelated top-level row.
- `AC-MV-007`: MV row shows child count and aggregate quantity.
- `AC-MV-008`: Search by child barge returns the parent MV row.

### Workspace

- `AC-MV-009`: Opening an MV uses a dedicated page route.
- `AC-MV-010`: Overview shows Buyer Qty, Supplier Allocation, Actual Loaded, Current Issue.
- `AC-MV-011`: Overview shows shipment progress and critical issues.
- `AC-MV-012`: Child nominations are visible inside the MV workspace.
- `AC-MV-013`: No primary workflow requires a modal/drawer.

### Integrity and security

- `AC-MV-014`: Allocation total cannot exceed MV plan without explicit override/approval.
- `AC-MV-015`: Unauthorized child mutation returns HTTP 403.
- `AC-MV-016`: Child mutation writes audit log.
- `AC-MV-017`: Parent and child caches invalidate after mutation.
- `AC-MV-018`: Financial fields remain hidden server-side for non-executives.

### Production

- `AC-MV-019`: Migration succeeds on clean staging DB.
- `AC-MV-020`: Existing production shipment count remains reconciled.
- `AC-MV-021`: Backup and restore procedure is verified.
- `AC-MV-022`: E2E flow passes: MV create → child create → update loaded → issue → workspace display → close validation.

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Ambiguous legacy parent mapping | Wrong MV-child ownership | Manual mapping review; do not auto-infer uncertain rows |
| Existing code assumes `Shipment` is every operational unit | Broken links and reports | Introduce parent query helper and compatibility IDs |
| Child quantity exceeds MV quantity | Incorrect allocation/reporting | Server-side transaction validation |
| SI/document ownership unclear | Duplicate or missing documents | Keep parent-owned initially |
| Drawer deep links break | Users lose existing navigation | Redirect `?open=` to workspace page |
| Migration partially applied | Schema drift | Backup, staging deploy, `migrate status`, recovery runbook |
| Broad cache invalidation | Slow dashboard | Add explicit MV/child query keys |
| Unauthorized child edits | Operational data corruption | Server-side role/action matrix |

---

## 12. Implementation Order

1. Confirm business definitions: MV, child nomination, TB/BG, stage, ownership.
2. Inspect and map existing production shipment data.
3. Add schema/migration for child nominations.
4. Add read APIs and MV-only list filtering.
5. Add MV workspace page.
6. Add child nomination table and aggregate cards.
7. Add child create/update flow with RBAC/audit.
8. Integrate Forecast conversion and dashboard aggregates.
9. Add compatibility redirect from old drawer links.
10. Run migration, integration, RBAC, and E2E verification.
11. Update SRS and execution log with evidence.

---

## 13. Explicit Non-Goals

- Do not create a separate top-level TB page in Shipment Monitor.
- Do not overload `Shipment.bargeName` to represent multiple barges.
- Do not silently convert ambiguous legacy rows.
- Do not claim AI Risk Analysis as part of this change.
- Do not change SI/document ownership without an approved requirement.
- Do not delete the legacy drawer/deep-link path before compatibility verification.

---

*End of Shipment Monitor MV Workspace & Child Nomination Gap Plan*

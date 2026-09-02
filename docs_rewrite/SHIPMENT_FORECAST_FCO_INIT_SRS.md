# Shipment Initialization from Forecast/FCO

## Audit and SRS

**Product:** CoalTrade OS Rewrite  
**Module:** Shipment Monitor + Forecast Sales  
**Revision:** 2026-09-02  
**Status:** Proposed implementation baseline  
**Authority:** Latest business rule and approved Forecast/FCO workflow

---

## 1. Business Rule

Shipment Monitor tidak membuat shipment dari input manual bebas.

Shipment hanya dapat diinisialisasi dari `Forecast/Project` yang telah:

1. Disetujui melalui approval flow.
2. Memiliki FCO/offer yang valid dan approved sesuai workflow.
3. Memiliki buyer feedback `deal`.
4. Belum memiliki linked shipment aktif.

Flow resmi:

```text
New Forecast
→ Input Offer Data
→ Calculation
→ Save Draft
→ Submit for Approval
→ CEO Approval
→ Generate FCO
→ Preview / Download Word or PDF
→ Buyer Feedback
→ Deal
→ Initialize Shipment
→ Shipment Workspace
```

`+ Add Shipment` manual di Shipment Monitor harus dihapus dari UI. Endpoint manual tidak boleh menjadi public business flow.

---

## 2. Source of Truth

Forecast/Project approved menjadi sumber data komersial dan contractual. Shipment menerima snapshot saat initialization.

Shipment tidak boleh mengubah nilai inherited secara langsung jika perubahan tersebut mengubah isi approved offer. Perubahan harus kembali melalui Forecast revision/re-approval atau mekanisme revision resmi.

Operational data yang belum tersedia pada Forecast diisi setelah shipment dibuat melalui Workspace.

### 2.1 Forecast fields inherited

13 kelompok field berikut wajib tersedia atau memiliki status `Not available` yang eksplisit:

| No. | Kelompok | Data |
|---|---|---|
| 1 | Identity | Entity, Offer No., Forecast/Project ID, FCO number/version |
| 2 | Market | Market section, segment, export/domestic |
| 3 | Buyer | Buyer, buyer country, attention, buyer code/abbreviation |
| 4 | Commodity | Commodity/product |
| 5 | Quantity | Quantity, unit, tolerance |
| 6 | Delivery | Laycan start/end, validity |
| 7 | Route | Port of loading, port of discharge |
| 8 | Base price | Price basis, base price method, reference, average period, base value |
| 9 | Price adjustment | Enabled flag, formula, basis GAR, rejection GAR, premium/discount |
| 10 | Shipping | Shipping term, loading port clause, loading rate |
| 11 | Payment | Payment terms, payment clause |
| 12 | Surveyor | Independent surveyor |
| 13 | Quality and terms | Coal standard/specification, GAR/NAR, TS, ASH, TM, IM, VM, HGI, size, origin, other terms |

The source record and approved revision/version must be visible in the initialization review.

### 2.2 Operational fields

Only operational values not already inherited may be entered during initialization:

| Field | Rule |
|---|---|
| Shipment Number | Required, unique, system-valid format |
| Mother Vessel | Optional until nominated; editable by authorized operations role |
| Operational PIC | Optional/required according to role policy |
| Initial operational note | Optional, audit logged |

`Source`, `Supplier`, `Barge`, and `TB/BG` belong to Supplier Side allocation. They must not be required parent fields when the Forecast does not define a fixed allocation.

If a Forecast contains an approved fixed supplier/source, it is displayed as inherited context. Changing it requires the source-change workflow, not silent overwrite.

---

## 3. Initialization UI

Primary experience is a dedicated workspace-style initialization page or full-height workspace panel, not a long undifferentiated form.

### 3.1 Header

```text
Initialize Shipment
Forecast Sales > [Offer No.] > [Project Name]
```

Header displays:

- Offer number and FCO version.
- Project/Forecast name.
- Buyer.
- Approval status.
- Buyer feedback status.
- Source reference.

### 3.2 Sections or tabs

```text
Overview | Buyer Side | Supplier Side | Operation | Quality | Review
```

Inherited sections are read-only and marked:

```text
Inherited from approved Forecast/FCO
```

Operational fields use normal input controls and clear ownership labels.

### 3.3 Section content

**Overview**

- Project/Forecast name.
- Entity.
- Offer number.
- FCO number/version.
- Market section.
- Product.
- Shipment number input.

**Buyer Side**

- Buyer.
- Buyer country.
- Quantity and tolerance.
- Shipping term.
- Payment term.
- Validity.

All inherited and read-only.

**Supplier Side**

- Approved source/supplier context, if present.
- Message: allocation is managed after initialization in Supplier Side.
- No manual barge requirement.

**Operation**

- Mother Vessel.
- Operational PIC.
- POL/POD inherited from approved Forecast.
- Laycan inherited from approved Forecast.

**Quality**

- Coal standard.
- Quality specification.
- Price-adjustment quality basis.
- Independent surveyor.

All inherited and read-only.

**Review**

- Complete inherited-data summary.
- Operational values to be created.
- Explicit source Forecast/FCO.
- Warning if inherited data is missing.
- Confirmation:

```text
I confirm this Shipment will be initialized from the approved Forecast/FCO above.
```

Create action:

```text
Initialize Shipment
```

After success, redirect to `/shipment-monitor/[shipmentId]`.

---

## 4. Validation and Gates

The API must enforce all gates. UI visibility is not authorization.

Initialization fails with `409` when:

- Forecast does not exist.
- Forecast status is not approved/deal according to canonical state policy.
- Buyer feedback is not `deal`.
- FCO approval/validity is missing where required.
- Forecast already has a linked shipment.
- Shipment number already exists.
- Required inherited field is missing and policy marks it mandatory.
- User lacks initialization permission.

Validation errors must identify the exact field or gate.

Creation must be idempotent. Double-click, retry, or concurrent requests must not create two shipments for one Forecast/FCO.

---

## 5. Persistence Contract

Shipment creation must persist:

- `projectId` as the Forecast/Project UUID.
- Canonical FCO number and version, preferably through explicit Shipment reference fields or an immutable snapshot relation.
- All 13 inherited field groups required by the approved offer.
- Operational initialization fields.
- `status = upcoming`.
- Document checklist A-K.
- Audit event with source Forecast ID, FCO version, inherited fields, and operational values.

The approved source values must remain reconstructable after later Forecast revisions.

Preferred implementation:

```text
Shipment.forecastSnapshot Json
Shipment.forecastRevisionId String?
Shipment.fcoNumber String?
Shipment.fcoVersion Int?
```

Use existing schema fields where possible. Add schema only when the current model cannot preserve the approved snapshot.

Creation, checklist initialization, Forecast link update, and audit event should be transactional or have a recoverable failure path.

`ForecastProject.linkedShipmentId` should store the Shipment UUID, not the shipment display number.

---

## 6. Edit Rules After Initialization

### 6.1 Allowed operational edits

Authorized operations roles may edit:

- Mother Vessel.
- Operational PIC.
- ETA/ETD and execution milestones.
- Loaded/final quantity through the relevant operational workflow.
- Operational status transitions.
- Operational remarks.

### 6.2 Restricted inherited edits

The following are not ordinary Shipment form edits:

- Buyer.
- Quantity/tolerance.
- Laycan.
- POL/POD.
- Sales/base/buying price.
- Price adjustment.
- Payment terms.
- Coal specification.
- Approved supplier/source.

Changes require Forecast revision/re-approval, contract/FCO revision, or dedicated append-only source/barge change workflow.

Every revision records old value, new value, actor, role, timestamp, reason, approval reference, and source revision.

---

## 7. RBAC

At minimum:

| Action | Required policy |
|---|---|
| View approved Forecast | Existing Forecast read permission |
| Approve Forecast/FCO | CEO/authorized approval role |
| Initialize Shipment | Sales/Traffic/authorized operations role |
| Edit operations | Authorized operations role |
| Edit inherited commercial data | Forecast revision + approval role |
| Add source/barge allocation | Authorized Supplier/Operations role |
| Change source/barge | Dedicated change workflow and approval |

The server must reject unauthorized initialization and mutation with `403`.

---

## 8. Current Code Audit

### Implemented

- Forecast conversion endpoint exists at `src/app/api/forecasts/[id]/convert-shipment/route.ts`.
- Conversion checks Forecast status and `buyerFeedbackStatus = deal`.
- Conversion carries buyer, quantity, price estimates, route, laycan, shipping term, coal spec, vessel, source, supplier, and PIC.
- Conversion initializes the 11-item document checklist.
- MV workspace and nested ChildNomination workspace exist.

### Gaps

- Manual `+ Add Shipment` remains visible in `src/modules/shipment-monitor/components/shipment-client.tsx`.
- Manual `POST /api/shipments` remains active in `src/app/api/shipments/route.ts`.
- Convert UI is still a small form, not workspace-style initialization.
- Convert UI allows Barge, Source, and Supplier input even though these belong to nested Supplier Side allocation.
- Conversion does not snapshot all 13 field groups.
- Surveyor, loading rate, quantity tolerance, price basis/formula/adjustment, other terms, and FCO version are not fully carried.
- `linkedShipmentId` stores shipment number instead of Shipment UUID.
- Duplicate conversion protection is incomplete.
- Forecast status/feedback checks are not sufficient as a complete FCO approval/version gate.
- Manual and conversion checklist creation are not fully in one transaction with audit.
- Shipment update audit does not capture before/after fields.
- Existing Shipment form was grouped into Workspace-like sections, but remains a modal and permits manual inherited-field entry.

---

## 9. Acceptance Criteria

- `AC-FSI-001`: Shipment Monitor has no manual Add Shipment business flow.
- `AC-FSI-002`: Only an approved eligible Forecast/FCO can initialize a Shipment.
- `AC-FSI-003`: Buyer feedback must be `deal`.
- `AC-FSI-004`: One Forecast/FCO cannot create duplicate active shipments.
- `AC-FSI-005`: Initialization UI shows source Forecast, Offer, FCO number, and version.
- `AC-FSI-006`: All 13 inherited field groups are displayed from the approved source.
- `AC-FSI-007`: Inherited fields are read-only in Shipment initialization.
- `AC-FSI-008`: Only operational initialization fields are editable.
- `AC-FSI-009`: Barge/source/supplier allocation is handled in Supplier Side after parent creation.
- `AC-FSI-010`: Review step clearly shows inherited versus new values.
- `AC-FSI-011`: Successful initialization redirects to the MV workspace.
- `AC-FSI-012`: Shipment stores Forecast UUID and approved FCO/revision snapshot.
- `AC-FSI-013`: Forecast link stores Shipment UUID.
- `AC-FSI-014`: Checklist, link, shipment, and audit are consistent after success/failure.
- `AC-FSI-015`: Unauthorized initialization returns `403`.
- `AC-FSI-016`: Invalid gate returns `409` with actionable reason.
- `AC-FSI-017`: Post-init edit cannot silently overwrite approved inherited data.
- `AC-FSI-018`: Source/barge changes preserve append-only history and approval state.
- `AC-FSI-019`: Desktop, tablet, and mobile initialization layouts remain usable.
- `AC-FSI-020`: Double-submit and concurrent conversion are idempotent.

---

## 10. Verification Plan

```bash
npx prisma validate
npx tsc --noEmit
npm run build
git diff --check
```

API checks:

- Unauthenticated initialization.
- Unauthorized initialization.
- Draft Forecast.
- Approved Forecast without buyer deal.
- Approved Forecast with buyer deal but missing required FCO state.
- Successful initialization.
- Duplicate initialization.
- Duplicate shipment number.
- Missing inherited field.
- Concurrent initialization.
- Forecast revision after Shipment initialization.

Browser checks:

- Source/Forecast context visible.
- Inherited fields visibly read-only.
- Only operational fields editable.
- Review summary accurate.
- Error messages actionable.
- Redirect to MV workspace.
- Mobile layout at 390x844.

---

## 11. Non-goals

- Rebuilding the FCO generator in this document.
- Editing Forecast calculation formulas here.
- Creating standalone TB/BG Shipment records.
- Adding shipment-level AI risk analysis.
- Replacing the existing document, payment, quality, or source-of-truth modules.

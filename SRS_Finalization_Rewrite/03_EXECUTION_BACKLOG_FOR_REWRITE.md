# Execution Backlog for Rewrite Finalization

**Date:** 2026-07-24  
**Purpose:** daftar kerja prioritas agar `C:\CoalTrade-Production` mengejar parity dan production grade.

## 1. Priority 0 - Documentation and Guardrails

### P0-01 Reconcile SRS Status Labels

**Problem:** `docs_rewrite/SRS_*.md` banyak menandai `Done` padahal code belum end-to-end.

**Action:**

- Audit setiap FR terhadap code.
- Ubah status menjadi `Done`, `Partial`, atau `Pending`.
- Tambahkan evidence path untuk setiap `Done`.

**Acceptance:**

- Tidak ada FR `Done` tanpa evidence code.
- Stub AI/scrape diberi label `Pending - integration stub` atau `Partial - stub`.

### P0-02 Add Execution Log Rule

**Action:**

- Setiap implementasi harus update `docs_rewrite/EXECUTION_LOG.md`.
- Setiap perubahan SRS harus mencatat alasan.

**Acceptance:**

- Log menyebut file changed, decision, and known issue.

## 2. Priority 1 - Database, Migration, RBAC

### P1-01 Prisma Migrations

**Problem:** Rewrite does not have formal migration history for all claimed schema changes.

**Action:**

- Create migrations for current schema.
- Ensure clean DB can run from zero.
- Add missing fields: MarketPrice MGO/FX if not already in schema; Forecast fields; DocumentFile model.

**Acceptance:**

- `prisma migrate deploy` works on clean Supabase/Postgres.
- No runtime route performs `ALTER TABLE`.

### P1-02 Central RBAC

**Action:**

- Create centralized permission map, for example `src/lib/rbac.ts`.
- Wrap mutating routes with role checks.
- Define public-read exception for Document Drive only.

**Acceptance:**

- Non-executive cannot approve/reject.
- Public cannot access other modules.
- Public cannot see/download critical docs.
- Unauthorized POST/PATCH/DELETE returns 403.

## 3. Priority 2 - Market Price Finalization

### P2-01 Manual Input Price

**User issue:** history exists, but input price is not available/working.

**Action:**

- Verify `price-input-form.tsx` visibility and role gate.
- Ensure API POST accepts ICI 1-5, Newcastle, HBA/HBA I/II/III, MGO, USD/IDR.
- Save as new history entry.
- Show success toast/status.
- Invalidate list/latest/chart/warnings.

**Acceptance:**

- Authorized user sees Input Price below chart/table area as requested before.
- Submit adds new history row.
- Cards/chart update without full refresh.
- History shows updated by and exact time.

### P2-02 Auto Scrape Label

**Action:**

- Replace `Unknown` actor with `Auto Scrape`.
- If real integration absent, UI must say pending/stub.

**Acceptance:**

- No `by Unknown` for scrape/system entries.

## 4. Priority 3 - Document Management Foundation

### P3-01 DocumentFile Model

**Action:**

Add one-to-many file model:

```text
DocumentRequirement
  id
  shipmentId
  code
  label
  group
  required
  status
  owner
  aging fields

DocumentFile
  id
  requirementId
  sourceModule
  sourceEntityId
  title
  originalName
  mimeType
  size
  provider
  bucket
  objectKey
  publicUrl/null
  visibility
  version
  isDeleted
  uploadedBy
  uploadedAt
```

**Acceptance:**

- More than one file can be uploaded per document type.
- Existing single-file records migrated or read via compatibility adapter.

### P3-02 Drag/Drop + Choose File Upload

**Action:**

- Build reusable upload zone.
- Validate PDF, DOCX, image formats.
- Show upload progress and disabled state.

**Acceptance:**

- Drag/drop and choose file both work.
- Invalid file types rejected before upload.
- Upload notifies success/failure.

### P3-03 Download Single / Selected / All ZIP

**Action:**

- Add route for file proxy/download.
- Add selected/all ZIP endpoint.
- Unique names inside ZIP.

**Acceptance:**

- Download all button shows loading until browser receives blob.
- ZIP entries are readable and not duplicate named.

## 5. Priority 4 - Forecast Sales Core Parity

### P4-01 Forecast Field Completeness

**Action:**

- Add missing fields: forecastMonth, commodity, priceBasis, paymentTerm, surveyor, NAR, IM, VM, HGI, size, marketSnapshot.
- Update form with responsive layout.
- Add strict submit validation.

**Acceptance:**

- Draft can save incomplete.
- Submit blocks incomplete mandatory fields and lists missing fields.

### P4-02 Supplier Candidates

**Action:**

- Add structured supplier candidate model.
- Pull candidate data from Source.
- Add fit score and below-spec warning.

**Acceptance:**

- Multiple candidates per Forecast.
- User can select one supplier.
- Below-spec selected candidate requires reason.

### P4-03 Embedded Blending

**Action:**

- Embed blending scenario in Forecast drawer/form.
- Save selected scenario.
- Feed average cost to rough P&L.

**Acceptance:**

- Blending output persists after page reload.
- Rough P&L updates from selected scenario.

### P4-04 Rough P&L

**Action:**

- Compute revenue/cost/margin.
- Restrict view.
- Audit recalculation inputs.

**Acceptance:**

- Trader cannot see restricted amounts.
- CEO/DIRUT/ASS_DIRUT can see.

### P4-05 FCO Server-Owned Generation

**Action:**

- Enforce approved-only on server.
- Generate/save FCO number/version.
- Persist PDF/object key.
- Add FCO sent date/by.

**Acceptance:**

- FCO button disabled before approved.
- Direct API call before approved returns 403/409.
- Document Drive lists generated FCO.

### P4-06 Buyer Feedback

**Action:**

- Add statuses: FCO Sent, Waiting Buyer Feedback, Negotiation/Pending, Deal, Failed.
- Failed reason required.
- Deal convert to shipment.

**Acceptance:**

- Failed without reason rejected.
- Deal creates linked shipment and carries fields.

### P4-07 Forecast Dashboard Drilldown

**User requirement:** card summary has dropdown per estimate/status, not stretching all cards.

**Action:**

- Make each dashboard card independent height or overlay dropdown.
- Show project names and `offered by`.

**Acceptance:**

- Opening one card dropdown does not stretch all summary cards.
- Rows readable, not too compressed.

## 6. Priority 5 - SI and Summary Report

### P5-01 SI Lifecycle

**Action:**

- Fix H-10 calculation.
- Require early reason.
- Add revision/cancellation versioning.
- Persist PDF.
- Include Forecast Sales/Project name.
- Include required doc upload status.

**Acceptance:**

- SI can be downloaded from Shipment and Document Drive.
- Old versions remain accessible.

### P5-02 Summary Report Per Project

**Action:**

- Generate summary PDF per Forecast/Project based on sample `Summary Report - Borneo Pasifik Global.pdf`.
- Separate button from SI.
- Include project/shipment/source/quality/commercial/P&L summary sections.

**Acceptance:**

- Forecast Sales page has separate Summary download.
- Output has parity with sample structure.

## 7. Priority 6 - Public Document Drive

### P6-01 Public Isolated Route

**Action:**

- Allow `/document-drive` without session.
- For unauthenticated state, render document-only nav/shell.
- Lock other routes.

**Acceptance:**

- Incognito can open Document Drive.
- Incognito cannot open Forecast/Sipment/etc.

### P6-02 Include Generated Docs

**Action:**

- Include SI/FCO/Summary records.
- Do not depend on client-only generated blob.

**Acceptance:**

- SI generated in Shipment appears in Document Drive search.

### P6-03 Search Naming

**Action:**

- Display titles with entity context.
- Search over buyer, shipment, forecast, SI/FCO number, document label, original file.

**Acceptance:**

- Searching only `TB`, buyer, SI number, or document type finds correct files.

## 8. Priority 7 - Performance and UX

### P7-01 React Query Cache

**Action:**

- Set module query staleTime.
- Keep previous data where useful.
- Avoid invalidating broad root keys after small CRUD.

**Acceptance:**

- After first load, module switching is fast.
- CRUD shows immediate feedback.

### P7-02 Skeleton Correctness

**Action:**

- Audit every main module.
- Skeleton while first data load.
- Empty state only after success.

**Acceptance:**

- No page shows zero/empty cards while request still pending.

### P7-03 ZIP/PDF Loading Buttons

**Action:**

- Add pending state to download buttons.
- Disable until blob response begins/finishes.

**Acceptance:**

- User sees loading on long ZIP generation.

## 9. Priority 8 - Tests and Production Gate

### P8-01 Smoke/E2E Core Tests

Test flows:

- login,
- Market Price manual input,
- Forecast draft -> submit -> approve -> FCO,
- FCO -> deal -> shipment,
- SI generate -> Document Drive,
- upload multiple docs -> download all ZIP,
- public Document Drive access,
- critical doc hidden,
- closing blocked by missing docs.

### P8-02 Production Readiness Truthfulness

**Acceptance:**

- Fresh DB migration passes.
- Storage upload/download passes.
- RBAC denial passes.
- Public route leak test passes.
- Health check fails if required env missing.


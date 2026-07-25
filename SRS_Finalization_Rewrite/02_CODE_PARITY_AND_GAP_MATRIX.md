# Code Parity and Gap Matrix - Current System vs Rewrite

**Date:** 2026-07-24  
**Current system:** `C:\Users\Glooms\Downloads\11GAWE`  
**Rewrite:** `C:\CoalTrade-Production`

## 1. Executive Summary

Rewrite is a better architecture foundation, but it is not yet feature parity with current system. Current system contains more complete business workflows, especially document management, generated SI/FCO/Summary, public Document Drive, and revision/audit behavior.

Estimated parity:

| Area | Rewrite parity estimate |
|---|---:|
| UI/module availability | 79% |
| Architecture/maintainability | 78% |
| Supporting business modules | 68% |
| Core Forecast-to-Shipment workflow | 52% |
| RBAC/security | 45% |
| Production readiness | 43% |
| **Overall feature parity** | **~59%** |

Interpretation: rewrite should not replace current production until the critical gaps below are closed.

## 2. Documentation Parity

### 2.1 Identical Shared Docs

Both systems have the shared `docs/*.md` module docs. These are useful as baseline module descriptions.

### 2.2 Missing Authoritative Revision Docs in Rewrite

Current system has:

- `SRS_CoalTrade_OS_Revisi`
- `Revisi_Execution`

Rewrite did not originally have equivalent authoritative execution folders. This new folder fills that role, but implementation should eventually reconcile these docs into `docs_rewrite`.

### 2.3 Rewrite SRS Status Is Overstated

Many `docs_rewrite/SRS_*.md` files say `Done`, while code evidence shows features are partial/stub. Do not trust status labels without code verification.

Examples:

- `SRS_04_Market_Price.md` says manual input is done, but user reports input price is not available/working.
- `SRS_06_Forecast_Sales.md` says all FR done, but code lacks full mandatory field validation, structured supplier candidates, persisted FCO PDF, and complete buyer feedback.
- `SRS_13_Document_Drive.md` says public access is done, but code/API must be verified because middleware/API session gating previously blocked public behavior.

## 3. Architecture Comparison

| Category | Current system `11GAWE` | Rewrite `CoalTrade-Production` | Decision |
|---|---|---|---|
| Frontend structure | Larger pages, more monolithic | `src/modules`, smaller components | Keep rewrite architecture |
| Server state | Zustand/memory-heavy patterns | React Query hooks | Keep rewrite, fix cache/invalidation |
| Forms | Mixed/manual | Zod + RHF in many modules | Keep rewrite |
| DB model | More iterative, current behavior exists | Prisma normalized direction but incomplete migrations | Keep Prisma direction, add migrations |
| Document storage | Has `src/lib/document-storage.ts` and DB/object-storage direction | Mostly URLs/single file fields in several places | Port current behavior into rewrite |
| RBAC | More custom role helpers | Many mutating routes only session-check | Build centralized RBAC |
| Generated docs | Current more complete | Rewrite often client-side PDF only | Move generation/persistence server-owned |

## 4. Critical Feature Gaps

### 4.1 Forecast Sales

**Rewrite code evidence:**

- `src/modules/forecast-sales/*`
- `src/app/api/forecasts/*`
- `prisma/schema.prisma` model `ForecastProject`

**Main gaps:**

| Requirement | Rewrite status | Required fix |
|---|---|---|
| Forecast month | Missing/weak in schema/UI | Add field and validation |
| Commodity | Missing/weak | Add field and carry to Shipment/FCO |
| Price basis | Missing/weak | Add enum/text and market reference |
| Payment term | Partial | Ensure mandatory before submit |
| Surveyor | Partial | Include in form/FCO/shipment |
| Full coal spec: NAR, IM, VM, HGI, size | Missing | Add fields/schema/UI/output |
| Market snapshot | Missing/partial | Persist snapshot at submit/generate |
| Historical selling price | Missing | Query similar prior sales/shipments |
| Supplier candidates | Mostly not structured | Add one-to-many candidate model |
| Below-spec acknowledgement | Missing | Add validation and reason |
| Embedded blending | Partial/disconnected | Embed in Forecast workflow |
| Rough P&L | Partial JSON | Compute consistently and restrict |
| Submit validation | Weak | Block submit when mandatory missing |
| FCO approved-only | Weak | Enforce server-side and UI |
| FCO PDF persistence | Weak/client-side | Store FCORecord pdfUrl/objectKey |
| Buyer feedback | Partial | Add proper feedback statuses/history |
| Summary Report | Missing/partial | Add Project summary PDF parity |
| Dashboard drill-down | Partial | Dropdown per status card with project + offered by |

**Known code risk:**

- `src/app/api/forecasts/[id]/submit/route.ts` updates status without full mandatory validation.
- `src/modules/forecast-sales/components/fco-button.tsx` allows statuses beyond approved in `ALLOWED`.
- `src/modules/forecast-sales/hooks/use-fco.ts` records generation then generates client PDF, so persisted `pdfUrl` may remain null.

### 4.2 Shipment Documents

**Rewrite code evidence:**

- `prisma/schema.prisma` model `ShipmentDocument`
- `@@unique([shipmentId, requirementCode])`
- `src/app/api/shipments/[id]/documents/route.ts`
- `src/modules/shipment-monitor/components/tabs/tab-documents.tsx`

**Gap:**

Current schema permits only one document row per requirement code. User requirement says each document type can have more than one uploaded file. Current system supports richer behavior.

Required model:

- Requirement/checklist table.
- File attachment table one-to-many.
- Critical/additional/required group.
- Soft delete/versioning.
- Storage provider metadata.
- Download single, selected, all ZIP.

### 4.3 Document Drive

**Rewrite code evidence:**

- `src/app/(dashboard)/document-drive/page.tsx`
- `src/app/api/document-drive/route.ts`

**Required behavior:**

- Public read-only access without login.
- Navbar locked to only Document Drive for public mode.
- Critical docs hidden for public.
- SI/FCO/Summary included.
- Search naming must be operationally clear.
- Listing must be metadata-only and fast.

**Gap:**

Rewrite currently aggregates only limited fields and depends on `pdfUrl` that is often null because generated PDFs are not persisted. Summary also risks being calculated from limited results rather than global totals.

### 4.4 Shipping Instruction

**Rewrite code evidence:**

- `src/app/api/shipments/[id]/si/route.ts`
- `src/modules/shipment-monitor/components/tabs/tab-si.tsx`

**Gaps:**

- H-10 rule must be verified; previous audit found reversed/incorrect risk.
- `earlyReason` must be required server-side for early SI.
- Normal revisions must not become approved if business says revision needs approval.
- PDF must be persisted and included in Document Drive.
- Required-doc upload status must appear in SI output.
- Kop surat should be blank with space.
- SI number must be generated unique by system.
- Output must include Forecast Sales / Project reference.

### 4.5 Market Price

**Rewrite code evidence:**

- `src/app/(dashboard)/market-price/page.tsx`
- `src/modules/market-price/components/price-input-form.tsx`
- `src/modules/market-price/hooks/use-market-price.ts`
- `src/app/api/market-price/route.ts`
- `prisma/schema.prisma` model `MarketPrice`

**User update:**

History price already exists, but input price is not available/working.

**Required fix:**

- Make manual input visible for authorized roles.
- POST must accept all required fields.
- Add MGO and FX fields to Prisma schema, not only raw SQL.
- Save append history, never overwrite.
- Show updated by and updated time.
- Invalidate latest/list/chart/warnings.
- Show success/error toast.
- If auto scrape is stub, label `Auto Scrape`, not `Unknown`.

### 4.6 RBAC

**Gap:**

Many mutating routes in rewrite only check session, not business role. This is not production grade.

Required:

- Central permission helper.
- Server-side role check on every POST/PATCH/PUT/DELETE.
- Public read-only exception only for non-critical Document Drive routes.
- Strict roles for approvals: CEO, DIRUT, ASS_DIRUT.

### 4.7 Production Readiness

**Rewrite code evidence:**

- `src/app/api/production-readiness/*`
- `docs_rewrite/SRS_20_Production_Readiness.md`

**Gap:**

Production readiness must check real prerequisites, not just route presence:

- migrations,
- schema matches Prisma,
- object storage writable,
- DB pooler,
- NextAuth secrets,
- public document drive leak test,
- upload/download test,
- generated SI/FCO test,
- RBAC denial test.

## 5. What To Keep From Rewrite

- `src/modules` architecture.
- React Query hooks and query key conventions, after fixing stale time and invalidation.
- Zod/RHF form pattern.
- Prisma normalized schema direction.
- Pagination and selective query.
- Component decomposition.
- `Approval Center` as centralized UX concept.

## 6. What Must Be Replaced or Rebuilt

| Area | Replace/rebuild reason |
|---|---|
| ShipmentDocument single-row model | Cannot support multiple files per requirement |
| Forecast checklist-in-remarks workaround | Fragile and overwrites semantic remarks |
| Client-only PDF generation for FCO/SI | Document Drive cannot reliably list/download generated docs |
| Raw SQL columns not in Prisma schema | Fresh DB/migration failure risk |
| Stub integrations labelled Done | Misleads user and release gate |
| Broad session-only mutation APIs | Security risk |
| Public Document Drive under dashboard shell only | Public user needs isolated access |

## 7. What Must Be Added

- `DocumentFile` table and object storage abstraction.
- `ForecastSupplierCandidate` table.
- `ForecastBlendingScenario` or structured JSON with versioning.
- `ForecastBuyerFeedback` table.
- `GeneratedDocument` or dedicated PDF record abstraction for SI/FCO/Summary.
- Market Price manual input completion and MGO/FX schema fields.
- Central RBAC policy and server enforcement.
- Test suite for core flows.
- Cache strategy for module navigation and CRUD.


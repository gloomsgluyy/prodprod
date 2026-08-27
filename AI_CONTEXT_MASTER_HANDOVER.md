# CoalTrade OS Rewrite - Master AI Handover Context

**Document type:** AI-maintainer context and decision guide  
**Repository:** `C:\CoalTrade-Production`  
**Reference system:** `C:\Users\Glooms\Downloads\11GAWE`  
**Last audited:** 2026-08-26  
**Current branch:** `main`  
**Current HEAD at audit:** `71b8a04`  

This file is the first context document that a new AI agent must read before investigating or changing the CoalTrade OS Rewrite. It is deliberately operational: it explains what the system is, which documents are authoritative, how to inspect the project, how to make decisions, and how to avoid repeating or overwriting completed work.

This file does not replace the detailed SRS documents. It tells the agent which SRS documents to read and how to interpret them.

---

## 1. Mission

CoalTrade OS is an internal operating system for a coal-trading business. The rewrite must become a production-grade workflow system, not merely a collection of CRUD pages.

The central business chain is:

```text
Market Price Reference
  -> Forecast Sales / Offer
  -> Supplier Candidate and Quality Comparison
  -> Blending / Rough P&L
  -> Executive Approval
  -> FCO Generation and Buyer Feedback
  -> Deal Confirmation
  -> Shipment Creation
  -> Shipment Execution
  -> Shipping Instruction
  -> Required / Additional / Critical Documents
  -> Quality / Payment / Freight / P&L
  -> Closing
```

The most important product principle is traceability. A user should not need to re-enter the same commercial data in every module. A change to a core record must either flow to dependent records or create a visible revision/history record.

---

## 2. Repository and Scope

### 2.1 Rewrite

Primary workspace:

```text
C:\CoalTrade-Production
```

Technology:

- Next.js App Router, currently Next 15.x in `package.json`.
- React and TypeScript.
- Prisma ORM with PostgreSQL.
- TanStack React Query for server state and caching.
- Zustand for local/UI state.
- React Hook Form and Zod for forms and validation.
- Recharts for charts.
- `pdf-lib` for server-side PDF generation.
- `archiver` for ZIP generation.
- NextAuth JWT sessions and bcrypt password hashing.
- Local file storage abstraction in `src/lib/storage.ts`.

### 2.2 Reference system

Legacy/current reference:

```text
C:\Users\Glooms\Downloads\11GAWE
```

Use it when the request says “compare with current system”, when rewrite behavior is unclear, or when validating business logic that may have been lost during the rewrite. Never modify the reference system unless the user explicitly asks for that.

### 2.3 Current working tree warning

At the last audit, the following local changes existed and were not created by the auditing agent:

- `scripts/enrich-from-excel.ts` modified.
- `error.txt` untracked.
- `revisi2_coaltrade` untracked.

Preserve these files. Read them when relevant, but do not revert, reset, clean, or delete them without explicit user instruction.

---

## 3. Authority Hierarchy

When sources disagree, use this order:

1. Explicit latest user instruction.
2. Current code behavior and server-side enforcement.
3. Latest relevant entry in `docs_rewrite/EXECUTION_LOG.md`.
4. `SRS_Finalization_Rewrite/` documents.
5. Current module SRS in `docs_rewrite/SRS_*.md`.
6. `docs_rewrite/00_PROJECT_CONTEXT.md` and `01_PRD.md`.
7. Baseline `docs/*.md`.
8. Old audit summaries, handover claims, or percentage claims.

The reason is practical: some older documents say a feature is `Done` even when the implementation is only an endpoint, a UI stub, a placeholder, or a local-storage prototype. A feature is not complete merely because a route, model, or button exists.

### 3.1 Definition of complete

Treat a requirement as `Done` only when all relevant layers work:

1. UI entry point exists and is reachable.
2. Client validation is present.
3. API validation is present.
4. Server-side RBAC is enforced.
5. Database persistence is correct.
6. History/audit/revision behavior is correct where required.
7. Loading, success, empty, and error states are handled.
8. Related query caches are invalidated or updated.
9. Download/output behavior works if required.
10. The flow is verified by typecheck/build and, where possible, browser/API QA.

If one of these layers is missing, label the requirement `Partial` and describe the exact missing layer.

---

## 4. Mandatory Reading Order for a New Agent

Do not begin by editing the first file that matches a user phrase. Read in this order.

### Phase A - Context and safety

1. This file: `AI_CONTEXT_MASTER_HANDOVER.md`.
2. `AI_HANDOVER_CONTEXT.md`.
3. `git status --short` and recent `git log`.
4. `package.json`, `next.config.ts`, `tsconfig.json`, `.gitignore`.
5. `prisma/schema.prisma` and the latest migrations.

### Phase B - Product and requirements

6. `docs_rewrite/00_PROJECT_CONTEXT.md`.
7. `docs_rewrite/01_PRD.md`.
8. `coal_os_revision_matrix.md`.
9. `SRS_Finalization_Rewrite/00_README.md`.
10. `SRS_Finalization_Rewrite/01_MASTER_SRS_REWRITE_FINALIZATION.md`.
11. `SRS_Finalization_Rewrite/02_CODE_PARITY_AND_GAP_MATRIX.md`.
12. `SRS_Finalization_Rewrite/03_EXECUTION_BACKLOG_FOR_REWRITE.md`.
13. `SRS_Finalization_Rewrite/04_MARKET_PRICE_FINALIZATION_SRS.md`.
14. `SRS_Finalization_Rewrite/05_PRODUCTION_GRADE_ACCEPTANCE_GATE.md`.
15. `SRS_Finalization_Rewrite/06_MODULE_REQUIREMENT_DEEP_DIVE.md`.
16. `SRS_Finalization_Rewrite/07_REWRITE_IMPLEMENTATION_BLUEPRINT.md`.

### Phase C - Recent implementation history

17. Read the newest entries first in `docs_rewrite/EXECUTION_LOG.md`.
18. Then read `docs_rewrite/FINAL_GAP_AUDIT_AFTER_EXECUTION.md`.
19. Then read `docs_rewrite/CODEBASE_PARITY_GAP_AUDIT_11GAWE_vs_REWRITE.md`.
20. Use `docs_rewrite/UX_COMPARISON_SUMMARY.md` only as historical UX context; verify its claims against code.
21. Read `MASTER_QA_TESTING_GUIDE.md` and `QA_TESTING_CHECKLIST.md` for acceptance scenarios.

### Phase D - Module-specific investigation

Only after the above, read the relevant module SRS and then trace the code using this pattern:

```text
page.tsx
  -> main *-client.tsx
  -> hooks / React Query keys
  -> API route(s)
  -> Prisma schema and migration
  -> shared auth/RBAC/cache/storage helpers
  -> related output, audit, and downstream modules
```

---

## 5. How to Investigate Any New Request

Before changing code, write down the request as a small requirement with:

- User role.
- Owning module.
- Source record and dependent records.
- Required state transition.
- Required fields and validation.
- Whether the change is append-only or editable.
- Visibility level: public, internal, or critical.
- Expected output/download.
- Cache/query keys affected.
- Acceptance test.

Then perform this sequence:

1. Search all relevant docs with `rg`.
2. Search the current codebase with `rg`.
3. Inspect the main page and client component.
4. Inspect the hooks and query keys.
5. Inspect every API route used by the UI.
6. Inspect Prisma models and migrations.
7. Inspect roles and middleware.
8. Inspect audit and cache invalidation.
9. Compare the same flow in `11GAWE` when parity matters.
10. Decide whether the feature is missing, partial, broken, or already complete.
11. Only then choose the smallest implementation that closes the actual gap.

Do not infer completion from a component name. Trace the request to persistence and back to the UI.

---

## 6. Decision-Making Rules

### 6.1 Prefer existing patterns

Use existing local helpers and conventions:

- `src/lib/prisma.ts` for Prisma client.
- `src/lib/auth.ts` and `src/lib/roles.ts` for authentication and permissions.
- `src/lib/api-client.ts` for client requests.
- `src/lib/cache.ts` for server cache invalidation.
- `src/lib/audit.ts` for audit records.
- `src/lib/storage.ts` for file storage.
- Existing React Query hooks for server state.
- Existing module components and design-system classes for UI.

Do not introduce a second state-management or storage pattern without a clear migration reason.

### 6.2 Server is the security boundary

Hiding a button is not authorization. Every sensitive API route must validate the session and role server-side.

Critical examples:

- Executive financial data.
- Forecast approval.
- SI early/revision approval.
- Source change approval.
- Critical document access.
- Market price mutation.
- User role changes.
- Shipment closing.

### 6.3 No overwrite for business history

Append a revision or history record for:

- Market price entries.
- Forecast price, laycan, supplier, and commercial changes.
- FCO versions.
- SI versions.
- Source changes.
- Barge/MV/TB/BG changes.
- Critical document replacements.

History must retain old value, new value, actor, timestamp, and reason where relevant.

### 6.4 Generated documents are system-owned

SI, FCO, and Summary Report must be generated from persisted data. They must not depend on a user manually uploading the primary generated PDF.

Required behavior:

- Generate from current source data.
- Persist metadata and generated file reference.
- Use versioning where applicable.
- Make the document searchable in Document Drive.
- Make download available from the owning module and Document Drive.
- Regeneration after source changes must create a new current output or version according to the SRS.

### 6.5 Loading and cache are part of correctness

Do not render zeros, empty cards, or “no data” while the first request is still loading.

- First request: skeleton.
- Cached data plus refetch: keep data visible and show subtle refresh state.
- Error: explicit error state and retry.
- Successful empty result: empty state.

Use stable query keys, appropriate stale times, targeted invalidation, pagination, and selective Prisma queries. Avoid refetching an entire module after every small mutation.

### 6.6 Do not claim production grade prematurely

Build passing is necessary, not sufficient. Production grade requires real storage, real database migration readiness, real RBAC, no critical document leak, end-to-end workflow verification, and truthful readiness checks.

---

## 7. Business Model and Ownership

### 7.1 Forecast Sales

Forecast Sales is the renamed replacement for the old “Project” concept. It represents a sales opportunity/offer plan, not an executed shipment.

Trader inputs:

- Forecast month.
- Offer/project name.
- Buyer and country.
- Commodity.
- Quantity.
- Laycan.
- POL/POD or relevant delivery terms.
- Sales term.
- Target selling price.
- Price basis.
- Payment term.
- Surveyor.
- Requested coal specification.
- Supplier candidates.
- Notes and market reference.

Draft may be incomplete. Submit must validate mandatory fields server-side.

### 7.2 Supplier and blending

Supplier candidates are one-to-many under a forecast. Candidate quality and cost must be comparable with requested quality. Below-spec candidates require acknowledgement/reason before proceeding.

Blending must provide weighted output such as GAR/NAR, TM/IM, TS, ash, VM, cost, and pass/warning status. A simulation without persisted or visible output is not sufficient for the embedded workflow.

### 7.3 Approval

Core state flow:

```text
draft
 -> waiting_approval
 -> approved | rejected | revision_requested
 -> FCO generated
 -> FCO sent / waiting buyer
 -> negotiation / pending
 -> deal | failed
 -> shipment
```

Approval UI for strict users should remain simple. `CEO`, `DIRUT`, and `ASS_DIRUT` are the strict approval roles. Reject requires a comment/reason. Approve may omit a comment unless explicitly required.

### 7.4 Shipment Monitor

Shipment Monitor owns execution data. It is the owner of SI creation and shipment document uploads.

Expected sections include:

- Info/header.
- Commercial reference.
- Source and barge.
- Quality.
- SI.
- Documents.
- Domestic handover.
- POL/POD timeline.
- Payment.
- Issues.
- Closing.

Shipment can only close when required closing checks pass. Completeness score is a monitoring aid, not a substitute for hard blockers.

### 7.5 Documents

Document categories:

- Required shipment documents.
- Additional documents.
- Critical documents.
- Generated SI.
- Generated FCO.
- Summary Report.
- Quality documents.
- Domestic handover evidence.
- Payment documents.

Shipment requirements are one-to-one checklist records, but each requirement can have multiple `DocumentFile` attachments. Upload supports drag/drop and file chooser. Allowed binary types are PDF, DOCX, JPG, JPEG, PNG, and WEBP, with server-side size/MIME checks.

Public Document Drive is read-only and isolated. Public users may see only non-critical documents and must not get access to the rest of the application navigation. Critical documents require executive access.

### 7.6 Market Price

Market Price is a reference engine, not only a dashboard. It covers coal indices, MGO, and USD/IDR. Manual input appends a new entry, records source/action/actor/time, invalidates latest/list/chart/warning caches, and supports history.

Auto scraping must be labelled as a stub until a real integration is implemented and verified. Never display fake scrape data as if it came from Argus or another real provider.

---

## 8. Current Code Map

### App routes

Pages are under `src/app/(dashboard)/`, including:

- `/` dashboard.
- `/forecast-sales`.
- `/sales-monitor`.
- `/shipment-monitor`.
- `/market-price`.
- `/sources`.
- `/quality`.
- `/blending`.
- `/document-drive`.
- `/approval-center`.
- `/outstanding-payment`.
- `/transshipment`.
- `/profit-loss`.
- `/purchase-requests`.
- `/meetings`.
- `/directory`.
- `/all-tasks` and `/my-tasks`.
- `/ai-agent`.
- `/production-readiness`.
- `/audit-logs`.
- `/users`.
- `/operations`, `/compliance`, `/ai-optimization`, and `/sales-orders` exist as additional routes; verify their depth before calling them production-complete.

### Core API groups

Important API areas:

- `/api/forecasts/*`.
- `/api/shipments/*`.
- `/api/market-price/*` and `/api/market-scrape`.
- `/api/document-drive/*` and `/api/files/*`.
- `/api/approval-center/*`.
- `/api/dashboard/*`.
- `/api/sources/*`.
- `/api/quality/*`.
- `/api/transshipment/*`.
- `/api/profit-loss/*`.
- `/api/outstanding-payments/*`.
- `/api/meetings/*`.
- `/api/directory/*`.
- `/api/tasks/*`.
- `/api/ai-agent/*`.

### Shared libraries

- `src/lib/auth.ts`: NextAuth configuration and auth helpers.
- `src/lib/roles.ts`: role constants and permission helpers.
- `src/lib/prisma.ts`: database client.
- `src/lib/react-query.ts`: global React Query defaults.
- `src/lib/cache.ts`: Redis/in-memory cache abstraction.
- `src/lib/audit.ts`: audit logging.
- `src/lib/storage.ts`: local upload storage abstraction.
- `src/lib/pdf-generator.ts`: server-side SI/FCO/Summary PDF generation.
- `src/lib/si-generator.ts`: SI-related generation logic.
- `src/modules/forecast-sales/utils/fco-generator.ts`: client-side/format-specific FCO helper.

---

## 9. Current Implementation Truth at Last Audit

The following facts were verified against code and recent execution entries.

### Implemented or substantially implemented

- Modular dashboard and business modules.
- Forecast Sales CRUD and core fields.
- Forecast submit validation and strict approval role gate.
- Forecast supplier candidate schema/API.
- Forecast revision and approval history endpoints.
- FCO generation restricted to approved/deal statuses.
- Buyer feedback and deal conversion workflow.
- Shipment CRUD and detail tabs.
- Shipment completeness score.
- Source/barge change records.
- Shipment issue records and closing checks.
- SI generation with H-10 logic and early-reason validation.
- Multiple document attachments per shipment requirement.
- Binary shipment document upload with server-side MIME and size validation.
- ZIP download all shipment documents.
- Server-side PDF generation for SI/FCO/Summary.
- Generated document entries for Document Drive.
- Public Document Drive route and public shell.
- Critical document filtering and executive-only file access paths.
- Market Price manual input, history, MGO, FX, warnings, and cache invalidation.
- Approval Center queue and history endpoints/UI.
- Audit log routes and mutation logging in critical areas.
- Production Readiness page and checks.

### Partial, stub, or must be verified before claiming production grade

- Object storage is not durable cloud storage; current implementation uses local `./uploads`.
- Auto Scrape is a labelled stub/pending real provider integration.
- Several AI features are stubs until real provider integration and keys are verified.
- Summary Report button was recorded as created and must be checked for complete integration into the forecast detail UI.
- Public Document Drive has code paths that need browser-level verification for generated document URLs, download behavior, and non-critical filtering.
- Document Drive listing and direct generated PDF links should be checked for consistent access controls.
- Source RKAB/COB/issue UI may lag behind schema/API support.
- P&L detailed cost breakdown and some financial drilldowns may be partial.
- Blending composition percentages and embedded Forecast Sales blending UX may be partial.
- Transshipment report/revenue presentation may be partial.
- Quality document-link UI may be partial.
- Meeting video/MOM processing is scaffolded unless Flask integration is actually running.
- Shipment-level AI risk analysis is not equivalent to the Transshipment risk stub.
- Performance claims require real browser/network measurement; React Query staleTime alone does not prove fast navigation.

Never copy a percentage such as 90%, 95%, or 98% into a new report without recalculating the relevant scope from current code and acceptance evidence.

---

## 10. Known Documentation Contradictions

These are known and must be handled explicitly:

1. `AI_HANDOVER_CONTEXT.md` and older UX summaries may say AI Agent or Document Drive frontend is missing. Current `src/app/(dashboard)/ai-agent/page.tsx` and `src/app/(dashboard)/document-drive/page.tsx` exist. Verify depth, but do not report them as completely absent.
2. `SRS_04_Market_Price.md` header says all done while its correction says Auto Scrape is partial. Use the correction and code.
3. Several module SRS headers say all FR done while individual FR labels or execution logs list stubs/partial work. Use the most specific status.
4. `docs_rewrite/PRODUCTION_DEPLOYMENT_CONTEXT.md` describes a live VPS deployment, but local code and deployment state still require verification before any deploy claim.
5. Execution log entries can describe a feature as done after typecheck/build only. This proves compilation, not complete user-flow acceptance.

When discovering a contradiction:

- Do not silently edit historical claims.
- Record the contradiction in the current task documentation or execution log.
- Update only the authoritative status document if the user asked for documentation maintenance.
- Explain the evidence and the chosen source of truth.

---

## 11. Safety and Change Policy

Before modifying files:

1. Check `git status --short`.
2. Identify whether relevant files contain user changes.
3. Read those changes and work with them.
4. Do not use `git reset --hard`, `git checkout --`, `git clean`, or broad deletion.
5. Do not expose secrets from `.env` in output, commits, or documentation.
6. Do not commit or push unless the user explicitly requests it.
7. Do not deploy unless the user explicitly requests it.
8. Use `apply_patch` for manual edits.
9. Keep changes scoped to the requirement.
10. Update the relevant SRS and execution record after implementation if requested or if the project workflow requires it.

If a feature already exists, fix or complete it instead of creating a duplicate route, model, hook, or parallel abstraction.

---

## 12. Verification Protocol

At minimum after a code change:

```powershell
cd C:\CoalTrade-Production
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

For database changes:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

Use migration files for production schema changes. Do not rely on `prisma db push` as the production migration strategy.

For a user-flow change, also perform targeted checks:

- Request payload and response status.
- Unauthorized and wrong-role behavior.
- Database record and audit record.
- Cache invalidation.
- Loading/error/empty UI state.
- Download/open behavior.
- Related downstream module behavior.

Never report “tested” when only typecheck/build was run. State exactly what was verified.

---

## 13. Recommended First Analysis Output

When a new task starts, the agent should report a short diagnostic before editing:

```text
Scope: [module / workflow]
Current code path: [page -> client -> hook -> API -> Prisma]
Requirement source: [SRS / user instruction / reference system]
Current state: [Done / Partial / Broken / Missing]
Evidence: [files, routes, schema, execution entry]
Gap: [exact missing behavior]
Decision: [smallest safe change]
Affected downstreams: [modules/cache/docs/RBAC]
Verification plan: [commands and user-flow checks]
```

This diagnostic is required for ambiguous or high-risk work. It prevents the agent from blindly changing a component based on its name.

---

## 14. Priority Order for Remaining Work

Unless the user specifies another priority, use this order:

### P0 - Data and security safety

- Critical document leakage.
- Broken server-side RBAC.
- Data loss or overwrite of revision history.
- Incorrect shipment closing.
- Migration failure or incompatible schema.

### P1 - Core commercial workflow

- Forecast Sales mandatory data and approval.
- FCO generation and buyer feedback.
- Deal-to-shipment conversion.
- Shipment Monitor and SI.
- Required document management.
- P&L data integrity.

### P2 - Production durability and performance

- Durable object storage.
- Query performance and cache correctness.
- Loading state correctness.
- ZIP/PDF reliability and large-file behavior.
- Observability, retries, and error recovery.

### P3 - Supporting workflow completeness

- Supplier/source UI depth.
- Quality document links and comparison UX.
- Blending embedded output.
- Transshipment reports.
- Payment/P&L drilldowns.

### P4 - Optional intelligence

- Real AI providers.
- Auto scraping.
- Flask video MOM.
- Advanced alerts and external integrations.

Do not spend P4 effort while P0/P1 defects remain.

---

## 15. Closing Checklist for Every Agent

Before handing work back:

- [ ] Current user request was identified as the active scope.
- [ ] Existing docs and code were read before editing.
- [ ] Existing local changes were preserved.
- [ ] No duplicate implementation was created.
- [ ] Server-side auth/RBAC was checked.
- [ ] Validation and error handling were checked.
- [ ] Cache invalidation/loading states were checked.
- [ ] Audit/revision behavior was checked.
- [ ] Generated files and storage behavior were checked if relevant.
- [ ] Typecheck/build were run when code changed.
- [ ] Documentation status was updated only with evidence.
- [ ] Remaining gaps were stated honestly.
- [ ] No commit/push/deploy happened without explicit instruction.

---

## 16. Useful Search Commands

```powershell
# Find a requirement or feature
rg -n "market price|document drive|shipping instruction|FCO|approval" docs docs_rewrite SRS_Finalization_Rewrite src

# Find all API routes
rg --files src/app/api -g 'route.ts' | Sort-Object

# Find all pages
rg --files 'src/app' -g 'page.tsx' | Sort-Object

# Find loading and cache behavior
rg -n "isLoading|isFetching|placeholderData|staleTime|invalidateQueries|invalidate\(" src

# Find authorization gates
rg -n "getServerSession|getToken|isExecutive|canEdit|Forbidden|Unauthorized|role" src/app/api src/lib

# Find generated documents and storage
rg -n "GeneratedDocument|saveFile|readFile|DocumentFile|pdfUrl|download-all" src prisma

# Compare with legacy system
rg -n "feature phrase" C:\Users\Glooms\Downloads\11GAWE C:\CoalTrade-Production
```

---

## 17. Final Operating Principle

Be decisive only after becoming evidence-based.

The correct agent behavior is:

```text
Read context
  -> identify authority
  -> trace current implementation
  -> compare requirement to behavior
  -> state the gap and risk
  -> implement the smallest coherent change
  -> verify the complete flow
  -> update living documentation
  -> report what is proven and what remains uncertain
```

The goal is not to produce the most code. The goal is to preserve business truth, make every change traceable, and steadily move CoalTrade OS toward a reliable production workflow.


# Hard Codebase Review - 2026-09-01

## Scope

Full `src`, Prisma schema/migrations, deployment scripts, importer, API routes, UI hooks/components, RBAC, audit, cache, documents, Forecast, Market Price, Shipment Monitor, Finance, Meetings, and dependencies.

## Findings Fixed

| Severity | Finding | Fix |
|---|---|---|
| Critical | Auto Scrape persisted hardcoded fallback market values when provider was absent/failed | Return 503/502; write no synthetic market data |
| High | Timeline mutation lacked shipment write RBAC and atomicity | Added shipment write role gate, parent existence check, transactional POL write/status update |
| High | Shipment issue/barge/source mutation endpoints accepted any authenticated user | Added server-side shipment mutation RBAC and parent existence checks |
| High | Storage read/delete paths lacked canonical path containment | Added resolved-root containment guard; reject traversal segments |
| High | Document Drive proxy could redirect to absolute stored URL | Reject absolute URLs; allow only local proxy paths |
| High | Forecast importer misread MV/TB workbook row hierarchy | Parent `MV./PROJECT NAME` forward-fill; `NOMINATION` remains child; TB-only excluded |
| Medium | Shipment conversion linked Forecast with shipment number in an ID-named field | Preserved existing schema contract pending canonical ID migration; flag remains in backlog |

## Additional Hard Review Findings

| Severity | Location | Finding | Decision |
|---|---|---|---|
| High | `src/app/api/shipments/[id]/issues/route.ts` | Issue create only authenticated; route could attach issue to missing shipment | Fixed: shipment mutation RBAC + parent existence |
| High | `src/app/api/shipments/[id]/barge-changes/route.ts` | Barge log and Shipment update were separate writes | Fixed: transaction + parent check |
| High | `src/app/api/shipments/[id]/source-changes/route.ts` | Source change create only authenticated; missing parent guard | Fixed: shipment mutation RBAC + parent existence |
| High | `src/app/api/shipments/[id]/timelines/route.ts` | Timeline mutation only authenticated and multi-write POL update was non-atomic | Fixed: RBAC + parent check + POL transaction |
| High | `src/lib/storage.ts`, `src/app/api/files/[...path]/route.ts` | Local file paths lacked canonical containment protection | Fixed: resolved-root guard and rejected traversal segments |
| High | `src/app/api/document-drive/files/[fileId]/route.ts` | Stored absolute URL could be used as redirect target | Fixed: absolute URLs rejected |

### Security hardening follow-up

- Added finance/commercial/task mutation role guards.
- Updated production readiness to report code-inspection security checks as warnings until runtime denial tests exist.
- Added deploy guard refusing tracked local server changes and stopping when migrations are not fully applied.
- Upgraded direct `next`, `next-auth`, `jspdf`, and `jspdf-autotable` packages where compatible.
- Added source issue ownership checks and role gates.
- Added meeting extraction role/parent checks and transactional task creation.
- Added Deal/Expense/Payment/Task entity existence checks for parameterized mutations.
- Added source, partner, transshipment, and meeting mutation role guards while preserving read access.
- Added source-issue ownership validation and transactional meeting task creation.
- Added local ZIP-only document reads to prevent server-side requests to arbitrary URLs.
- Added deployment preflight for tracked server changes and unapplied migrations.
- Upgraded compatible direct dependencies; remaining advisory requires a planned major framework upgrade.

## Findings Not Silently Fixed

- `production-readiness` still reports code-inspection passes for some gates; it is not an evidence substitute for runtime tests.
- Many routes have authentication but require a full role matrix review; broad bulk authorization changes would risk breaking legitimate roles.
- Multi-write workflows beyond the fixed timeline/barge paths need route-specific transaction design.
- Local storage is path-safe but not durable across deployment/restart.
- Dependency audit reports critical/high advisories; upgrade requires compatibility testing.
- AI/meeting fallbacks remain explicitly non-production behavior.

## Static Evidence

```text
npx prisma generate  PASS
npx prisma validate  PASS
npx tsc --noEmit     PASS
npm run build        PASS
npm run verify:shipment PASS
```

## High-Risk Residual Findings

### 1. Authorization coverage is not centrally enforced

Most routes do check authentication. Role enforcement remains route-specific. A full authorization matrix is still required for Deals, Tasks, Meetings, Directory, Expenses, Transshipment, Quality, and all shipment mutations.

### 2. Audit is non-blocking

`src/lib/audit.ts` catches and logs audit failures. This prevents user-facing operation failure but means a successful mutation may lack audit evidence. Critical financial/approval operations need transactional audit or an outbox/retry policy.

### 3. Multi-write operations are not universally transactional

Approval Center, meeting task extraction, document workflows, and several legacy JSON-backed flows perform multiple writes. Each needs transaction/idempotency review before production-grade claim.

### 4. Local filesystem storage remains deployment risk

`src/lib/storage.ts` stores under local `uploads`. The containment issue is fixed, but durability across deploy/restart is not. Object storage migration remains required.

### 5. Dependency vulnerabilities

`npm audit --omit=dev` reported 10 vulnerabilities, including critical advisories affecting `jspdf` and `next-auth`, plus high advisories affecting `next`, `jspdf-autotable`, `sharp`, and transitive packages. Upgrade requires compatibility testing and must be treated as a release blocker for internet-facing production.

### 6. Runtime proof is absent

Static build does not prove RBAC denial, IDOR resistance, protected document access, migration success, cache freshness, or browser layout. These require test environment execution.

### 7. Importer apply remains intentionally blocked

Dry-run output is generated with provenance. `--apply` must require reviewed mapping, backup, staging migration, and reconciliation. It must not run automatically during deployment.

## Workflow Review

### Forecast

- Draft/submit paths exist.
- Buyer feedback and Deal Gate exist.
- FCO/SI generated documents exist.
- Remaining concern: linked shipment identifier semantics and broad route authorization coverage.

### Market Price

- Partial input and last-known field lookup exist.
- Auto Scrape no longer writes fake fallback values.
- Remaining concern: per-field query volume and provider/runtime verification.

### Shipment Monitor

- MV/child model, workspace, child route, allocation validation, progress aggregation, and document/payment/quality composition exist.
- Remaining concern: legacy mapping, child domain transaction ownership, and E2E proof.

### Documents

- Visibility checks and path traversal containment exist.
- Remaining concern: local storage durability, MIME/content validation, ZIP failure transparency, and protected direct URLs across every consumer.

### Finance/P&L

- Executive API/page gates exist.
- Remaining concern: approval status versus expense status consistency and complete financial field audit.

### Meetings/AI

- Provider fallback is labelled/stubbed.
- Remaining concern: fallback action extraction creates plausible tasks from fixed examples; must remain visibly stubbed and not be treated as extracted facts.

## Release Decision

### Approved update branch review

- `origin/update` was merged as approved feature code, not blindly copied over local hardening.
- Calculator UI/store/API and Forecast calculator snapshot linkage are integrated.
- Local intraday Last Known Value logic is preserved.
- Added migration `20260901150000_add_calculator_snapshot_fields` for the expanded Prisma fields.
- Shipment Monitor, security hardening, dashboard revisions, and deploy guards remain preserved.

```text
Compile-safe: yes
High-confidence defects fixed: yes
Full security review clean: no
Production-grade: no
Release testing required: yes
```

## Required Next Tests

1. Route-by-route unauthenticated and unauthorized role matrix.
2. IDOR tests for every `[id]` route.
3. Transaction rollback tests for multi-write workflows.
4. Protected document URL and traversal tests.
5. Clean/staging/production migration tests.
6. Excel dry-run review and apply reconciliation.
7. Shipment MV → child → update → issue → document → close E2E.
8. Forecast → approval → buyer deal → shipment E2E.
9. Browser viewport QA at 1440x900, 1024x768, 390x844.
10. Dependency upgrade/security regression test.

*End of hard review.*

# Production Grade Acceptance Gate

**Date:** 2026-07-24  
**Purpose:** define release checks before `C:\CoalTrade-Production` can be considered production grade.

## 1. Release Rule

Rewrite cannot be called production grade until all critical gates below pass. A module route existing is not enough.

## 2. Gate A - Database and Migration

| Check | Required result |
|---|---|
| Clean database migration | `prisma migrate deploy` succeeds |
| Prisma schema matches DB | no missing columns used by API |
| Runtime connection | uses pooler for serverless production |
| Direct connection | available only for migration |
| No schema mutation on request | no `ALTER TABLE` inside API routes |
| Seed/demo data | optional but reproducible |

## 3. Gate B - Authentication and RBAC

| Check | Required result |
|---|---|
| Login works | valid user can login |
| Protected modules | unauthenticated user redirected/blocked |
| Public document drive | unauthenticated user can open only `/document-drive` |
| Mutating routes | role checked server-side |
| Approval routes | only CEO/DIRUT/ASS_DIRUT |
| Market price input | only authorized roles |
| Critical docs | hidden and download-blocked for public/non-executive |

## 4. Gate C - Object Storage and Documents

| Check | Required result |
|---|---|
| Upload | PDF/DOCX/image upload succeeds |
| Multiple files | more than one file per requirement works |
| Metadata | original name, size, mime, uploader, date saved |
| Download single | file proxy works |
| Download all ZIP | works with loading state and unique names |
| Delete | soft delete or safe delete works |
| Critical versioning | replacement does not overwrite history |
| Public drive | listing metadata only, no critical leak |

## 5. Gate D - Generated Documents

| Document | Required result |
|---|---|
| FCO | approved-only, generated number unique, PDF persisted |
| SI | H-10 rule, early reason, version history, PDF persisted |
| Summary Report | per Forecast/Project, sample structure covered |
| Document Drive | SI/FCO/Summary searchable and downloadable |

## 6. Gate E - Core Workflow

### Forecast to Shipment

Must pass:

1. Create Forecast draft incomplete.
2. Submit blocked until mandatory fields complete.
3. Add supplier candidates.
4. Run/select blending scenario.
5. Rough P&L generated and restricted.
6. CEO approves via simple approval UI/dropdown.
7. Generate FCO.
8. Mark FCO sent.
9. Record buyer feedback.
10. Mark Deal.
11. Convert to Shipment.
12. Shipment receives buyer, quantity, spec, laycan, price, payment, supplier, and FCO reference.

### Shipment to Closing

Must pass:

1. Generate SI.
2. Upload multiple required docs.
3. Upload additional docs.
4. Upload critical docs as executive.
5. Public drive sees non-critical docs and generated SI.
6. Public drive does not see critical docs.
7. Closing is blocked when mandatory requirement missing.
8. Closing succeeds after requirements clear.

## 7. Gate F - Market Price

Must pass:

1. Authorized user sees input price.
2. Unauthorized user does not see input and API returns 403.
3. Save manual price.
4. History row appears with date, time, updater.
5. Cards/chart update.
6. Auto scrape/system entry shows `Auto Scrape`, not `Unknown`.
7. Forecast Sales price warning uses latest market reference.

## 8. Gate G - Performance and UX

| Check | Target |
|---|---|
| First load main modules | under 3 seconds normal dataset |
| Second navigation after cached | under 1 second perceived |
| CRUD feedback | immediate pending/success state |
| Skeleton | visible until first data success |
| Empty state | only after data loaded |
| ZIP/PDF download | button loading until blob response |
| No broad refetch | CRUD invalidates affected query only |

## 9. Gate H - Audit and Revision

Audit required for:

- Forecast submit/approve/reject/revision.
- FCO generate/send/revision.
- Market price manual update.
- Shipment create/update critical fields.
- SI generate/revision/cancel/approval.
- Source change.
- Barge change.
- Document upload/delete/critical replacement.
- User role change.

Each audit log should contain:

- user,
- role,
- action,
- entity,
- entity id,
- old/new values where relevant,
- reason/comment if required,
- timestamp.

## 10. Minimum Test Suite

Required before production:

- TypeScript check.
- Lint or equivalent static check.
- API tests for auth/RBAC on mutating routes.
- Integration test for Market Price input.
- Integration test for Forecast -> FCO -> Deal -> Shipment.
- Integration test for document upload/download/ZIP.
- E2E smoke for public Document Drive.
- E2E smoke for critical doc hidden.

## 11. Final Acceptance Statement

Rewrite can be accepted as production grade only if:

- all Gate A-H pass,
- no critical SRS gap remains,
- known stubs are explicitly labelled as stubs,
- user-facing docs and SRS do not claim `Done` for incomplete features,
- deployment environment passes production readiness check against real DB/storage.


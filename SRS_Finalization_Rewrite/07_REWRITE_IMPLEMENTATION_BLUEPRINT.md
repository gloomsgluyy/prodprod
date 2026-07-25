# Rewrite Implementation Blueprint

**Date:** 2026-07-24  
**Target:** `C:\CoalTrade-Production`  
**Purpose:** practical implementation guide with code areas, sequencing, and safeguards.

## 1. Implementation Strategy

Do not try to make all modules production grade at once. The safest route is:

1. Fix foundations: migrations, RBAC, storage.
2. Fix Market Price because user explicitly reported input gap.
3. Rebuild document model because SI/FCO/Document Drive depend on it.
4. Complete Forecast Sales -> FCO -> Deal -> Shipment.
5. Complete SI/Summary generated docs.
6. Wire public Document Drive.
7. Fix performance and skeleton behavior across main modules.
8. Add production gate tests.

## 2. Code Areas by Priority

### P1 Foundation

Inspect:

- `prisma/schema.prisma`
- `prisma/migrations/`
- `src/lib/auth.ts`
- `src/lib/roles.ts`
- `src/middleware.ts`
- all `src/app/api/**/route.ts`

Build:

- central `requireRole()` or `authorize()` helper,
- route-level permission table,
- migration files,
- no runtime schema mutation.

### P2 Market Price

Inspect:

- `src/app/(dashboard)/market-price/page.tsx`
- `src/modules/market-price/components/market-price-client.tsx`
- `src/modules/market-price/components/price-input-form.tsx`
- `src/modules/market-price/components/price-history.tsx`
- `src/modules/market-price/hooks/use-market-price.ts`
- `src/app/api/market-price/route.ts`
- `src/app/api/market-price/latest/route.ts`
- `src/app/api/market-price/chart/route.ts`
- `src/app/api/market-price/fx-rate/route.ts`
- `src/app/api/market-scrape/route.ts`
- `prisma/schema.prisma`

Fix:

- make input visible for authorized roles,
- add schema fields if missing,
- save manual entry,
- show updated by/time,
- invalidate cache,
- show clear toast,
- label scrape actor.

### P3 Documents

Inspect:

- `src/app/api/shipments/[id]/documents/route.ts`
- `src/modules/shipment-monitor/components/tabs/tab-documents.tsx`
- `src/app/api/document-drive/route.ts`
- `src/app/(dashboard)/document-drive/page.tsx`
- `src/modules/shipment-monitor/hooks/use-shipments.ts`
- current system reference: `C:\Users\Glooms\Downloads\11GAWE\src\lib\document-storage.ts`

Build:

- storage abstraction,
- document requirement/file model,
- upload endpoint,
- file proxy endpoint,
- ZIP endpoint,
- migration/backward compatibility.

### P4 Forecast Sales

Inspect:

- `src/modules/forecast-sales/components/forecast-client.tsx`
- `src/modules/forecast-sales/components/forecast-form-modal.tsx`
- `src/modules/forecast-sales/components/forecast-table.tsx`
- `src/modules/forecast-sales/components/forecast-detail-drawer.tsx`
- `src/modules/forecast-sales/components/fco-button.tsx`
- `src/modules/forecast-sales/hooks/use-forecasts.ts`
- `src/modules/forecast-sales/hooks/use-fco.ts`
- `src/modules/forecast-sales/utils/fco-generator.ts`
- `src/app/api/forecasts/route.ts`
- `src/app/api/forecasts/[id]/**/route.ts`
- `prisma/schema.prisma`

Fix:

- missing fields,
- submit validation,
- supplier candidates,
- embedded blending,
- rough P&L,
- approved-only FCO,
- FCO persistence,
- buyer feedback,
- deal conversion,
- summary report.

### P5 Shipment and SI

Inspect:

- `src/modules/shipment-monitor/components/shipment-detail-drawer.tsx`
- `src/modules/shipment-monitor/components/tabs/tab-si.tsx`
- `src/modules/shipment-monitor/components/tabs/tab-info.tsx`
- `src/modules/shipment-monitor/components/tabs/tab-commercial-ref.tsx`
- `src/modules/shipment-monitor/hooks/use-shipments.ts`
- `src/app/api/shipments/[id]/si/route.ts`
- `src/app/api/shipments/[id]/close/route.ts`
- `src/app/api/shipments/[id]/completeness/route.ts`

Fix:

- H-10,
- early reason,
- revision versioning,
- generated PDF persistence,
- document required upload status in SI,
- project/Forecast reference in SI,
- closing blockers.

### P6 Public Document Drive

Inspect:

- `src/middleware.ts`
- `src/app/(dashboard)/document-drive/page.tsx`
- `src/app/api/document-drive/route.ts`
- layout shell files under `src/shared/components/layout`

Build:

- public route exception,
- public shell with document-only nav,
- secure metadata list,
- secure file proxy,
- critical filtering.

## 3. Data Model Blueprint

### MarketPrice

Add if missing:

- `mgoUsd`
- `usdIdr`
- `notes`
- optional nullable `updatedBy`

Never depend on raw SQL columns not represented in Prisma schema.

### ForecastSupplierCandidate

Suggested fields:

```text
id
forecastProjectId
sourceId nullable
supplierName
origin
stockMt
priceUsd
readinessStatus
legalStatus
gar
nar
tm
im
ts
ash
vm
hgi
size
fitScore
belowSpecFlags json
belowSpecAcknowledged boolean
belowSpecReason nullable
selected boolean
notes
createdById
createdAt
updatedAt
```

### Document Models

Suggested tables:

```text
DocumentRequirement
DocumentFile
GeneratedDocument
```

`GeneratedDocument` can store SI/FCO/Summary uniformly:

```text
id
type: si | fco | summary
sourceModule
sourceEntityId
shipmentId nullable
forecastProjectId nullable
number nullable
version
title
pdfUrl nullable
storageProvider
objectKey
visibility
generatedById
generatedAt
status
metadata json
```

## 4. Cache Blueprint

### Query Keys

Use stable keys:

```text
["market-price", "latest"]
["market-price", "history", filters]
["market-price", "chart", range]
["forecasts", "list", filters]
["forecasts", "detail", id]
["shipments", "list", filters]
["shipments", "detail", id]
["shipment-documents", shipmentId]
["document-drive", filters]
```

### Mutation Invalidation

Do not invalidate broad app data.

Examples:

- Market input invalidates only market latest/history/chart/warnings.
- Upload doc invalidates shipment-documents for that shipment and document-drive.
- Forecast update invalidates forecast detail/list and linked dashboard summary.
- SI generate invalidates shipment detail/SI/doc-drive.

## 5. UI Blueprint

### Loading

Use three states:

- first load: skeleton,
- cached refetch: subtle spinner/badge,
- loaded empty: empty state.

Do not show zeros as real summary while initial request is pending.

### Approval UI

For CEO/DIRUT/ASS_DIRUT:

- show compact dropdown: `Set Approval`,
- options: Approve, Reject, Request Revision if relevant,
- comment appears only for reject/revision,
- success popup: `Status changed`.

For regular users:

- show current status and history only,
- no approval controls.

### Forecast Dashboard Cards

Each card must have independent dropdown. Use overlay/popover or independent height container so opening one card does not stretch the whole grid row.

## 6. Backward Compatibility

Keep legacy naming internally where needed:

- `Project` technical references may remain temporarily.
- User-facing label must be `Forecast Sales`.
- `/projects` may redirect/alias to `/forecast-sales`.
- Existing data must remain readable.

## 7. Implementation Rules for AI

Before changing code:

1. Read this folder.
2. Read relevant `docs_rewrite/SRS_*.md`.
3. Inspect actual code and schema.
4. Check current system implementation if parity is unclear.
5. Update execution log.
6. Implement narrowly.
7. Run TypeScript/lint or targeted tests.
8. Update SRS status labels only after verification.

## 8. First Recommended Task

Start with Market Price manual input because:

- user explicitly reported it,
- it is smaller than document model rewrite,
- it validates the correct workflow style: role-gated form, POST, cache invalidation, history, toast, and SRS update.

Definition of done for first task:

- authorized user can input price,
- history updates,
- latest cards/chart update,
- unauthorized user blocked server-side,
- `Auto Scrape` actor is displayed correctly,
- SRS status updated with evidence path.


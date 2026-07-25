# Market Price Finalization SRS

**Module:** Market Price  
**Route:** `/market-price`  
**Date:** 2026-07-24  
**User update:** history price sudah ada, tetapi input price belum bisa/harus dibuat benar-benar berfungsi.

## 1. Purpose

Market Price adalah reference engine untuk CoalTrade OS. Modul ini bukan hanya chart harga. Data market price dipakai untuk:

- Forecast Sales pricing reference.
- Warning jika target selling price terlalu rendah.
- Historical selling comparison.
- Sales Monitor deal warning.
- P&L market deviation.
- Freight/transshipment cost reference via MGO.
- Outstanding Payment/P&L conversion via FX USD/IDR.

## 2. Required Price Indices

| Field | Label | Unit | Required for manual input |
|---|---|---|---|
| `ici1` | ICI 1 6500 GAR | USD/MT | optional but supported |
| `ici2` | ICI 2 5800 GAR | USD/MT | optional but supported |
| `ici3` | ICI 3 5000 GAR | USD/MT | optional but supported |
| `ici4` | ICI 4 4200 GAR | USD/MT | optional but supported |
| `ici5` | ICI 5 3400 GAR | USD/MT | optional but supported |
| `newcastle` | Newcastle / NEWC | USD/MT | optional but supported |
| `hba` | HBA | USD/MT | optional but supported |
| `hba1` | HBA I | USD/MT | optional but supported |
| `hba2` | HBA II | USD/MT | optional but supported |
| `hba3` | HBA III | USD/MT | optional but supported |
| `mgoUsd` | Marine Gas Oil | USD/MT | optional but supported |
| `usdIdr` | USD/IDR FX Rate | IDR/USD | optional but supported |

At least one price field must be filled when submitting.

## 3. Functional Requirements

### FR-MKT-FIN-001 Manual Input Price

Authorized user can manually input price from UI.

UI requirements:

- Button/section label: `Input Price`.
- Location: below Price Trend Graphic and near/history table as requested by user.
- Form supports all fields listed above.
- Form supports date. Default date = today.
- Source defaults to `Manual`.
- Submit button shows pending/loading.
- Success notification is clear and readable.
- Error notification is clear and not blurred.

Business rules:

- Manual update creates a new history entry.
- No destructive overwrite.
- If same date has multiple updates, latest entry powers latest cards, while all entries remain visible in history.
- User must be captured from session.

Acceptance:

- User enters ICI/HBA price and saves.
- New row appears in Price History with exact timestamp and updated by.
- Cards and trend chart update after save without manual refresh.

### FR-MKT-FIN-002 Price History With Time and Actor

History table must show:

- date,
- update time,
- updated by,
- source,
- action: Manual / Auto Scrape / Import,
- changed values,
- optional notes.

Business rules:

- If updated by system/scraper, display actor as `Auto Scrape`, not `Unknown`.
- History dropdown per day must show all updates on that date.
- Daily row can show latest value, with expandable history for intraday updates.

Acceptance:

- Multiple updates on the same day can be expanded.
- Unknown actor is not shown for system scrape.

### FR-MKT-FIN-003 Role Access

View:

- all authenticated roles,
- optionally public no, unless business later requests public market page.

Edit:

- `ADMIN_MARKETING`,
- optional fallback: `CEO`, `DIRUT`, `ASS_DIRUT`.

Server enforcement:

- API `POST /api/market-price` must return 403 for unauthorized role.
- UI hidden button is not enough.

### FR-MKT-FIN-004 Latest Price Cards

Cards show latest value and delta vs previous relevant entry.

Requirements:

- No zero/default display while loading.
- Skeleton while first load.
- If no data, show empty state after success.
- Delta green/red based on increase/decrease.

### FR-MKT-FIN-005 Trend Chart

Trend chart must:

- use actual historical entries,
- support range filter,
- update after manual input,
- show loading state only for chart area if other data cached.

### FR-MKT-FIN-006 Market Reference Integration

Forecast Sales must consume latest market price snapshot:

- based on chosen price basis,
- based on GAR tier where applicable,
- stored at submit/generate time to preserve historical context.

Warning:

- if target selling price is materially below market reference, show warning before submit.
- threshold configurable, default 5%.

### FR-MKT-FIN-007 Auto Scrape

If real scraping is not implemented:

- UI must label as pending/stub.
- It may create sample entries only in dev/testing if clearly labelled.

If real scraping is implemented:

- source target captured, e.g. Argus, GlobalCoal, ICE.
- result logs saved.
- actor display `Auto Scrape`.

### FR-MKT-FIN-008 Cache and Performance

After input:

- invalidate `market-price latest`,
- invalidate `market-price list/history`,
- invalidate `market-price chart`,
- invalidate warnings/reference queries,
- do not refetch unrelated heavy modules.

Target perceived behavior:

- save feedback immediate,
- UI updates within 1-2 seconds for normal DB latency.

## 4. Data Model

Recommended Prisma model:

```prisma
model MarketPrice {
  id        String            @id @default(uuid())
  date      DateTime          @db.Date
  ici1      Decimal?          @db.Decimal(10, 4)
  ici2      Decimal?          @db.Decimal(10, 4)
  ici3      Decimal?          @db.Decimal(10, 4)
  ici4      Decimal?          @db.Decimal(10, 4)
  ici5      Decimal?          @db.Decimal(10, 4)
  newcastle Decimal?          @db.Decimal(10, 4)
  hba       Decimal?          @db.Decimal(10, 4)
  hba1      Decimal?          @db.Decimal(10, 4)
  hba2      Decimal?          @db.Decimal(10, 4)
  hba3      Decimal?          @db.Decimal(10, 4)
  mgoUsd    Decimal?          @db.Decimal(10, 4)
  usdIdr    Decimal?          @db.Decimal(15, 4)
  source    String            @default("Manual")
  action    MarketPriceAction @default(manual)
  updatedBy String?
  user      User?             @relation(fields: [updatedBy], references: [id])
  notes     String?
  createdAt DateTime          @default(now())

  @@index([date(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@map("market_prices")
}
```

Note: current schema may not include `mgoUsd` and `usdIdr`. Add migration, do not rely on raw query/ALTER on request.

## 5. API Requirements

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/market-price` | paginated history, supports date/source/action filters |
| POST | `/api/market-price` | manual input, authorized role only |
| GET | `/api/market-price/latest` | latest entry and previous entry for delta |
| GET | `/api/market-price/chart` | trend points by range |
| GET | `/api/market-price/fx-rate` | latest USD/IDR and MGO |
| GET | `/api/market-price/warnings` | active pricing warnings |
| POST | `/api/market-scrape` | trigger scrape or return clear stub status |

## 6. Code Areas To Inspect

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
- `src/lib/auth.ts`
- `src/lib/roles.ts`
- `prisma/schema.prisma`

## 7. Definition of Done

Market Price is done only when:

- manual input is visible to authorized user,
- unauthorized API call is rejected,
- save creates history row,
- cards/chart update,
- history shows time and actor,
- Auto Scrape actor is not Unknown,
- MGO and FX are real schema fields,
- Forecast Sales can consume market snapshot,
- tests or manual QA prove the flow.


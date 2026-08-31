# Audit Progres Implementasi

Audit dilakukan secara read-only terhadap codebase aktual di `C:\prodprod`. Tidak ada kode yang diubah selama audit.

## 1. Market Price: Partial Update dan Last Known Value

### Form input Market Price menerima partial update

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `src/modules/market-price/components/price-input-form.tsx:16-22` menggunakan `optionalPositiveNumber` yang mengubah input kosong menjadi `undefined` dan memakai `z.number().positive().optional()`.
- `src/modules/market-price/components/price-input-form.tsx:24-39` menjadikan semua field index dan currency optional.
- `src/modules/market-price/components/price-input-form.tsx:40-48` hanya mewajibkan minimal satu field harga melalui `superRefine`.
- `src/modules/market-price/components/price-input-form.tsx:85-94` hanya memasukkan field yang memiliki nilai ke payload.
- Tidak ada atribut HTML `required` pada input harga di `price-input-form.tsx:155-169`.

**Gap:** Error minimal satu harga ditempelkan ke path `ici1`, sehingga secara UX terlihat seperti error khusus ICI 1. Belum ada automated test untuk submission partial.

### API menyimpan field kosong sebagai `null`

**Status Kode Aktual:** ⚠️ PARSIAL

**Bukti:**

- `src/app/api/market-price/route.ts:55-72` memakai `z.number().positive().nullable()` dan field optional.
- `src/app/api/market-price/route.ts:99-111` hanya memasukkan field non-null ke operasi Prisma; field yang tidak dikirim akan tersimpan sebagai database `NULL`.
- `prisma/schema.prisma:189-200` mendefinisikan semua index, MGO, dan FX sebagai `Decimal?`.

**Gap:** API tidak secara eksplisit memetakan semua field kosong menjadi `null`; field tersebut dihilangkan dari Prisma data object. Hasil database benar, tetapi kontrak request bukan literal null.

### Latest Market Price memakai Last Known Value per field

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `src/lib/market-price-last-known.ts:20-25` mencari row terbaru dengan field tertentu `not null` secara independen.
- `src/lib/market-price-last-known.ts:26-34` mencari previous row untuk field yang sama.
- `src/app/api/market-price/latest/route.ts:23-47` menggabungkan metadata absolute latest dengan value per-field.
- Shape frontend tetap `data.latest` dan `data.prev`.

**Gap:** Previous dibatasi dengan `date < latest.date`, sehingga update sebelumnya pada tanggal yang sama tidak dihitung sebagai previous. Helper juga menjalankan query terpisah per field dan perlu benchmark pada volume produksi.

### FX endpoint memakai Last Known Value

**Status Kode Aktual:** ✅ SELESAI

**Bukti:** `src/app/api/market-price/fx-rate/route.ts:12-26` mengambil `mgoUsd` dan `usdIdr` secara independen dan mengembalikan previous values.

**Gap:** Tanggal utama adalah tanggal field terbaru secara keseluruhan, bukan tanggal terpisah per field. Belum ditemukan consumer yang memakai `previous` untuk variance.

### Dashboard Market Mini memakai Last Known Value

**Status Kode Aktual:** ✅ SELESAI

**Bukti:** `src/app/api/dashboard/market-mini/route.ts:27-45` menggunakan `getLastKnownMarketPrices(PRICE_FIELDS)` untuk latest dan previous per field.

**Gap:** Metadata absolute latest masih diambil terpisah. Endpoint ini belum mencakup MGO/FX.

## 2. Forecast Sales: Form, Draft Validation, dan Prisma Schema

### Form Forecast terbagi menjadi 12 section

**Status Kode Aktual:** ✅ SELESAI

**Bukti:** `src/modules/forecast-sales/components/forecast-form-modal.tsx:210-251` memiliki section:

1. Entity & Market
2. Buyer Info
3. Commodity & Quantity
4. Laycan & Port
5. Base Price
6. Price Adjustment
7. Shipping Terms
8. Independent Surveyors
9. Document Template
10. Coal Spec Standard
11. Other Terms
12. Validity

Modal menggunakan `max-w-6xl` di `forecast-form-modal.tsx:200-202` dan helper `FormSection` di `:348-350`.

**Gap:** Beberapa field mockup masih UI-level dan disimpan dalam local `customFields`. Nilainya belum direhydrate dari database ketika edit Forecast existing.

### Draft Validation permissive

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `forecast-form-modal.tsx:18-69` menjadikan field utama optional.
- `forecast-form-modal.tsx:13-16` mengubah numeric input kosong menjadi `undefined`.
- `forecast-form-modal.tsx:156-163` menjalankan create/update untuk Save Draft.
- Tombol Save Draft menggunakan `handleSubmit(onSubmit)` di `forecast-form-modal.tsx:321-326`.
- Strict validation tetap berada pada `src/app/api/forecasts/[id]/submit/route.ts:15-57`.

**Gap:** Save & Submit membuat draft dahulu lalu submit terpisah. Jika submit gagal, draft tersimpan tetapi error submit tidak ditampilkan dengan baik karena `finally(closeCreateEdit)`.

### Prisma memiliki field baru Forecast

**Status Kode Aktual:** ✅ SELESAI

**Bukti:** `prisma/schema.prisma` memiliki field optional berikut pada `ForecastProject`:

- `entity`
- `offerDate`
- `attention`
- `buyerCode`
- `quantityTolerance`
- `basePriceMethod`
- `formula`
- `averagePeriod`
- `applyPriceAdjustment`
- `adjustmentFormula`
- `rejectionGar`
- `specStandard`
- `specificationSource`
- `validityDate`
- `validityTime`
- `timezone`
- `subjectToCargoUnsold`

Migration tersedia di `prisma/migrations/20260901090000_add_forecast_mockup_fields/migration.sql:1-18`.

**Gap:** Field baru belum lengkap dalam reset/re-hydration detail edit. Tidak ada field persisted khusus untuk multi-select surveyor.

### API POST Forecast menyimpan field baru

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `src/app/api/forecasts/route.ts:71-110` menerima field baru.
- `route.ts:124-126` mengonversi `offerDate` dan `validityDate` menjadi Date.
- `route.ts:123-129` meneruskan field ke create dan menambahkan `createdById`.

**Gap:** Validasi domain untuk entity, timezone, validity time, dan base price method masih longgar. Tidak ada field trader khusus.

### API PATCH Forecast menyimpan field baru

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `src/app/api/forecasts/[id]/route.ts:49-92` menerima field baru.
- `route.ts:111-113` mengonversi field tanggal.
- `route.ts:109-117` meneruskan payload ke update.
- `src/modules/forecast-sales/hooks/use-forecasts.ts:6-63` mengenali type field baru.

**Gap:** PATCH mengembalikan object Forecast secara langsung, audit belum menyimpan old/new diff, dan authenticated user masih dapat mengubah financial fields tanpa restriction yang memadai.

### Filter dan kolom list Forecast

**Status Kode Aktual:** ⚠️ PARSIAL

**Bukti:**

- `forecast-table.tsx:96-110` menampilkan Offer No, Entity, Buyer, Market Section, Qty, Laycan, Status, Rev, Margin Est., dan Actions.
- Search/status/segment diproses oleh `forecast-client.tsx:98-118`, `use-forecasts.ts:110-123`, dan API `forecasts/route.ts:15-30`.
- Segment ditampilkan sebagai Export/Domestic di `forecast-table.tsx:128-131`.

**Gap:**

- Entity filter di `forecast-client.tsx:107-112` hanya UI placeholder, tidak masuk store atau API.
- API belum menerima parameter entity.
- Entity column masih menampilkan `—`.
- Offer No memakai `fcoNumber ?? projectName`, bukan canonical offer number.
- Revision default `V1` walaupun belum tentu ada revision.

## 3. Shipment Workflow: Deal Gate

### API conversion menolak jika buyer feedback bukan `deal`

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `src/app/api/forecasts/[id]/convert-shipment/route.ts:38-42` membatasi Forecast pada status `approved` atau `deal`.
- `route.ts:44-46` mewajibkan `project.buyerFeedbackStatus === "deal"`.
- Nilai null/missing dan status lain menghasilkan HTTP `409`.

**Gap:** Route tidak memeriksa keberadaan `Deal` record. Conversion masih tidak membuat record `Deal`, dan `linkedShipmentId` menyimpan shipment number, bukan database ID, di `route.ts:85-88`.

### UI Create Shipment dikunci sebelum acceptance

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `forecast-detail-drawer.tsx:97-100` hanya menampilkan tombol jika Forecast berstatus `approved`/`deal` dan feedback `deal`.
- `forecast-detail-drawer.tsx:101-105` menampilkan `Awaiting Buyer Acceptance to create shipment` jika belum deal.
- `forecast-table.tsx:49-53` hanya menampilkan action Shipment jika status approved dan feedback deal.

**Gap:** Table hanya mengizinkan action pada status `approved`, sedangkan drawer juga mendukung `deal`. Ini inkonsisten setelah buyer feedback mengubah canonical status menjadi `deal`.

### Buyer Feedback mengunci canonical state

**Status Kode Aktual:** ✅ SELESAI

**Bukti:**

- `buyer-feedback/route.ts:49-57` menyimpan feedback status, reason, timestamp, dan history.
- Jika status `deal`, route juga menyimpan `status: "deal"`.
- `buyer-feedback/route.ts:38-47` menyimpan actor dan timestamp pada history.
- Audit dibuat di `buyer-feedback/route.ts:59-64`.

**Gap:** Buyer feedback belum membuat atau memvalidasi Deal record, belum memiliki role gate dan transition validation, masih menggunakan `String?`, dan belum menyediakan status `pending`.

## Ringkasan Status

| Modul | Status Keseluruhan |
|---|---|
| Market Price Partial Update | ✅ Selesai secara fungsional |
| Market Price Last Known Value | ✅ Selesai, dengan gap intraday/performance |
| Forecast Form 12 Sections | ✅ Selesai secara UI |
| Forecast Draft Validation | ✅ Selesai untuk Save Draft |
| Forecast New Fields Persistence | ✅ Selesai secara POST/PATCH dasar |
| Forecast List Mockup Alignment | ⚠️ Parsial |
| Shipment Deal Gate API | ✅ Selesai |
| Shipment Deal Gate UI | ✅ Selesai, dengan table/drawer inconsistency |
| Buyer Feedback Canonical State | ✅ Selesai secara string status |
| End-to-End Production Readiness | ⚠️ Belum terbukti |

## Gap Paling Penting

1. Entity filter dan Entity column belum benar-benar terhubung ke data.
2. Offer No belum memiliki field atau generator canonical.
3. Custom Forecast fields belum direhydrate ke form saat edit.
4. Buyer feedback belum menggunakan `Deal` record canonical.
5. Table conversion action tidak konsisten dengan drawer pada status `deal`.
6. Buyer feedback mutation belum memiliki role/state-transition gate.
7. Draft-to-submit flow masih membuat draft dahulu lalu submit terpisah dengan error handling lemah.
8. Market Price previous variance belum mendukung previous intraday row pada tanggal yang sama.
9. Belum ada automated tests yang membuktikan partial update, last-known lookup, draft save, atau Deal conversion rejection.
10. Belum ada bukti runtime/E2E karena audit ini dilakukan read-only.

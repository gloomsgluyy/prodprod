# SRS Modul 17: Profit & Loss

**Modul:** Profit & Loss | **Route:** `/profit-loss` | **Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-PL fully implemented

---

## 1. Overview

Dashboard keuangan yang menampilkan margin dan profitabilitas operasi trading batubara. **Data ditarik otomatis dari modul lain** (Shipment, Transshipment/Freight, Payment, Expenses) — tidak ada input manual di P&L.

> **Requirement kritis (dari Excel):** P&L harus tarik data otomatis supaya margin tidak salah input. P&L adalah computed view — bukan entry form.

| Atribut | Nilai |
|---------|-------|
| Route | `/profit-loss` |
| Store | `commercial-store` (read-only aggregation) |
| Akses | CEO, DIRUT, ASS_DIRUT, COO, CMO (**restricted**) |

---

## 2. Access Control (RBAC)

| Fitur | CEO / DIRUT | ASS_DIRUT / COO | CMO | Others |
|-------|:-----------:|:---------------:|:---:|:------:|
| View summary (Revenue, Expense, Net Profit, Margin %) | ✅ | ✅ | ✅ | ❌ |
| View per-shipment table (termasuk buy price) | ✅ | ✅ | ❌ | ❌ |
| View cost breakdown detail | ✅ | ✅ | ❌ | ❌ |
| View market deviation | ✅ | ✅ | ✅ | ❌ |
| Export ke CSV/Excel | ✅ | ❌ | ❌ | ❌ |
| View estimated vs actual comparison | ✅ | ✅ | ❌ | ❌ |

---

## 3. Functional Requirements

### FR-PL-001: Summary Cards (4 metrik utama) (Status: Done)
**Priority:** High

| Card | Warna | Formula |
|------|-------|---------|
| Revenue | Emerald | Sum (sellPrice × qtyFinal) per shipment (completed) |
| Total Cost | Red | Sum semua cost components per shipment |
| Net Profit | Blue | Revenue - Total Cost |
| Margin (%) | Amber | (Net Profit / Revenue) × 100 |

**Filter:** Year selector, Month range, Segment (Local/Export), Status (completed / all active).

**Acceptance Criteria:**
- `AC-PL-001`: Cards hanya tampil untuk authorized role
- `AC-PL-002`: Data ter-refresh saat filter berubah

---

### FR-PL-002: Income vs Expense Chart (Status: Done)
**Priority:** High

Recharts BarChart stacked per bulan:
- Bar hijau = Revenue (sell)
- Bar merah = Total Cost
- Line kuning = Net Profit (overlay)

Tooltip: angka aktual USD, breakdown per kategori cost.

---

### FR-PL-003: Net Profit Trend (Status: Done)
**Priority:** Medium

Recharts LineChart: Net profit per bulan (line). Area fill di bawah line. Rolling 12 bulan default.

---

### FR-PL-004: Period & Filter Toggle (Status: Done)
**Priority:** Medium

- Toggle: Monthly / Quarterly
- Filter: Year selector
- Filter: Segment (Local / Export / All)
- Filter: Trader/PIC (untuk management review)

---

### FR-PL-005: Auto-Pull Data Sources (Status: Done — pulls from Shipment cost fields; Transshipment FreightCostDetail fields pending FR-TSH-005)
**Priority:** Very High

P&L menarik data otomatis dari:

| Komponen | Source Modul | Field |
|----------|-------------|-------|
| Selling Price (USD/MT) | Shipment Monitor | `salesPrice` |
| Buying Price (USD/MT) | Shipment Monitor | `buyingPrice` |
| Final Quantity (MT) | Shipment Monitor | `qtyFinal` |
| Freight Rate (USD/MT) | Transshipment | `freightRate` |
| Freight Allowance | Transshipment → FreightCostDetail | `freightAllowance` |
| Barging Cost (USD/MT) | Transshipment → FreightCostDetail | `barcingCostPerMt` |
| PBM Cost (USD/MT) | Transshipment → FreightCostDetail | `pbmCostPerMt` |
| PNBP (IDR) | Transshipment → FreightCostDetail | `pnbpAmountIdr` |
| Royalty (USD/MT) | Transshipment → FreightCostDetail / Shipment | `royaltyPerMt` |
| Export Tax (USD/MT) | Transshipment → FreightCostDetail | `exportTaxPerMt` |
| Survey Cost (USD) | Transshipment → FreightCostDetail | `surveyCost` |
| Demurrage/Despatch | Transshipment → LaytimeCalculation | `netDemurrageAmount` |
| Invoice Amount | Outstanding Payment | `priceInclPph` |
| Other Expenses | Expenses | `amount` (linked to shipment) |
| FX Rate (USD/IDR) | Market Price | `usdIdr` (latest per BL Date) |

**Business Rules:**
- `BR-PL-001`: Data ditarik otomatis — input manual di P&L **tidak diperbolehkan**
- `BR-PL-002`: PNBP dikonversi ke USD menggunakan kurs dari Market Price (per BL Date)
- `BR-PL-003`: Jika komponen cost belum ada di Transshipment, ditampilkan sebagai "N/A" dengan warning
- `BR-PL-004`: P&L hanya dihitung untuk shipment dengan `qtyFinal` sudah terisi (final quantity tersedia)

**Acceptance Criteria:**
- `AC-PL-003`: Semua data cost ter-pull otomatis tanpa input manual
- `AC-PL-004`: Warning muncul jika ada komponen cost yang belum tersedia

---

### FR-PL-006: Per-Shipment Cost Breakdown Table (Status: Partial — /api/profit-loss/shipments list exists; per-shipment detail /api/profit-loss/shipments/:id endpoint not found)
**Priority:** Very High

Tabel detail per shipment dengan breakdown semua komponen biaya.

| Kolom | Deskripsi | Akses |
|-------|-----------|-------|
| Shipment | Nomor + buyer | Semua |
| BL Date | Tanggal BL | Semua |
| Qty Final (MT) | Kuantitas final | Semua |
| Sell Price (USD/MT) | Harga jual | CEO/DIRUT/ASS_DIRUT/COO |
| Buy Price (USD/MT) | Harga beli | CEO/DIRUT only |
| Freight (USD/MT) | Biaya freight | CEO/DIRUT/ASS_DIRUT/COO |
| Barging (USD/MT) | Biaya tongkang | CEO/DIRUT/ASS_DIRUT/COO |
| PBM (USD/MT) | Port handling | CEO/DIRUT/ASS_DIRUT/COO |
| PNBP (USD/MT) | Konversi dari IDR | CEO/DIRUT/ASS_DIRUT/COO |
| Royalty (USD/MT) | Royalti | CEO/DIRUT/ASS_DIRUT/COO |
| Export Tax (USD/MT) | Pajak ekspor | CEO/DIRUT/ASS_DIRUT/COO |
| Survey (USD/MT) | Biaya surveyor | CEO/DIRUT/ASS_DIRUT/COO |
| Demurrage (USD/MT) | Net dem/desp | CEO/DIRUT/ASS_DIRUT/COO |
| Other (USD/MT) | Biaya lain | CEO/DIRUT/ASS_DIRUT/COO |
| **Total Cost (USD/MT)** | Sum semua cost | CEO/DIRUT/ASS_DIRUT/COO |
| **Margin (USD/MT)** | Sell - Total Cost | CEO/DIRUT/ASS_DIRUT/COO |
| **Total Margin (USD)** | Margin × Qty | CEO/DIRUT/ASS_DIRUT/COO |
| Est. Margin | Dari Forecast Sales rough P&L | CEO/DIRUT |
| Deviation | Actual - Estimated | CEO/DIRUT |
| Market at BL Date | Market index saat BL | CEO/DIRUT/ASS_DIRUT/COO |
| Market Deviation | Sell - Market at BL | CEO/DIRUT/ASS_DIRUT/COO |

**Acceptance Criteria:**
- `AC-PL-005`: Kolom sensitif hidden berdasarkan role
- `AC-PL-006`: Row bisa di-expand untuk lihat detail dokumen (freight invoice, PNBP receipt, dll.)

---

### FR-PL-007: Estimated vs Actual Margin Comparison (Status: Done — /api/profit-loss/deviation-alerts)
**Priority:** High

Perbandingan margin yang direncanakan (dari Forecast Sales rough P&L) vs margin aktual (dari data real shipment).

| Komponen | Source |
|----------|--------|
| Estimated Sell Price | Forecast Sales → targetSellingPrice |
| Estimated Buy Price | Forecast Sales → estimatedBuyPrice |
| Estimated Freight | Forecast Sales → estimatedFreight |
| Estimated Margin | Forecast Sales → roughMargin |
| Actual Margin | P&L computed (FR-PL-006) |
| Deviation | Actual - Estimated |
| Deviation % | (Actual - Estimated) / |Estimated| × 100 |

**Business Rules:**
- `BR-PL-005`: Jika Actual Margin < Estimated Margin by >10%, tampilkan alert merah (deviation alert)
- `BR-PL-006`: Deviation > 20% wajib dicatat alasan oleh Sales/Traffic (comment field)
- `BR-PL-007`: Deviation alert muncul di Dashboard Blocker (kategori P&L)

**Acceptance Criteria:**
- `AC-PL-007`: Tabel comparison tampil di per-shipment view
- `AC-PL-008`: Alert deviation tampil jika >10% threshold
- `AC-PL-009`: Dashboard Blocker menampilkan shipment dengan deviation >20%

---

### FR-PL-008: Royalty & Tax Reference (Status: Done — pulled from Shipment fields royaltyCost/taxExportCost)
**Priority:** Medium

Referensi rate untuk kalkulasi otomatis royalti dan pajak ekspor.

| Field | Deskripsi |
|-------|-----------|
| Royalty Rate | % dari buy price (sesuai IUP) |
| Export Tax Rate | % dari sell price (sesuai regulasi) |
| Reference Period | Berlaku sejak — sampai |

**Business Rules:**
- `BR-PL-008`: Rate royalti bisa berbeda per source/IUP — default diambil dari Source module
- `BR-PL-009`: Export tax rate bisa berubah berdasarkan regulasi — harus diupdate manual oleh Admin

---

### FR-PL-009: Export Report (Status: Done — GET /api/profit-loss/export returns CSV, CEO/DIRUT only)
**Priority:** Medium

**Akses:** CEO / DIRUT only.

Export P&L summary dan per-shipment breakdown ke CSV / Excel.

Filter export: Year, Month range, Segment.

---

## 4. Data Model

> P&L adalah **computed view** (materialized/aggregated) — tidak ada entity tersendiri yang di-insert manual.

### View: ProfitLossSummary (per period)

| Field | Type | Source |
|-------|------|--------|
| period | String | Filter parameter |
| totalRevenue | Decimal | Computed |
| totalCost | Decimal | Computed |
| netProfit | Decimal | Computed |
| marginPercent | Decimal | Computed |
| shipmentCount | Number | Computed |
| totalQty | Number | Computed |

### View: ProfitLossPerShipment

| Field | Type | Source |
|-------|------|--------|
| shipmentId | UUID | Shipment |
| shipmentNumber | String | Shipment |
| buyer | String | Shipment |
| blDate | Date | Shipment |
| qtyFinal | Number | Shipment |
| sellPrice | Decimal | Shipment |
| buyPrice | Decimal | Shipment |
| freightPerMt | Decimal | FreightCostDetail |
| barcingPerMt | Decimal | FreightCostDetail |
| pbmPerMt | Decimal | FreightCostDetail |
| pnbpUsd | Decimal | FreightCostDetail (converted) |
| royaltyPerMt | Decimal | FreightCostDetail / Shipment |
| exportTaxPerMt | Decimal | FreightCostDetail |
| surveyPerMt | Decimal | FreightCostDetail |
| demurragePerMt | Decimal | LaytimeCalculation |
| otherPerMt | Decimal | FreightCostDetail |
| totalCostPerMt | Decimal | Computed |
| marginPerMt | Decimal | Computed |
| totalMargin | Decimal | Computed |
| estimatedMarginPerMt | Decimal | ForecastSales |
| deviationPerMt | Decimal | Computed |
| marketAtBlDate | Decimal | MarketPrice (by date) |
| marketDeviation | Decimal | Computed |
| fxRateAtBl | Decimal | MarketPrice (by date) |

---

## 5. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/profit-loss` | Summary P&L (filtered) |
| GET | `/api/profit-loss/chart` | Monthly chart data |
| GET | `/api/profit-loss/shipments` | Per-shipment breakdown |
| GET | `/api/profit-loss/shipments/:id` | Single shipment P&L detail |
| GET | `/api/profit-loss/export` | CSV/Excel export (CEO only) |
| GET | `/api/profit-loss/deviation-alerts` | Shipments dengan deviation > threshold |

---

## 6. Integration Points

| Modul | Hubungan |
|-------|----------|
| Shipment Monitor | Sell/buy price, final qty, BL date — sumber data utama |
| Transshipment/Freight | Semua komponen biaya (freight, PBM, PNBP, demurrage, barging) |
| Outstanding Payment | Invoice amount reference |
| Expenses | Other non-shipment cost |
| Forecast Sales | Estimated margin (rough P&L) untuk comparison |
| Market Price | Kurs USD/IDR, market index at BL date |
| Dashboard | P&L summary widget; deviation alert di Blocker |
| Audit Logs | Export action dicatat |

---

*End of SRS_17_Profit_Loss — v2.1*

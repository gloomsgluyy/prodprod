# SRS Modul 04: Market Price Index

**Modul:** Market Price Index
**Route:** `/market-price`
**Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done — All FR-MKT fully implemented

---

**Correction (EXEC-049):** the old implementation status above is overstated. Current status is Partial because Auto Scrape is still a labelled stub/pending integration; manual input, MGO, and FX schema were finalized in EXEC-049.

## 1. Overview

### 1.1 Deskripsi
Modul tracking harga batubara global secara real-time. Menampilkan 10 index harga (ICI 1-5, Newcastle, HBA, HBA I-III), harga MGO, kurs USD/IDR, kalkulator harga otomatis, perbandingan harga pasar vs deal aktual, price warning ke Sales/P&L, dan auto-scraping menggunakan AI (Groq).

### 1.2 Route & Dependencies
| Atribut | Nilai |
|---------|-------|
| Route | `/market-price` |
| Store | `commercial-store` |
| Dependencies | Recharts, Groq AI |
| Akses | Semua role (edit: `market_price_edit` permission) |

---

## 2. Functional Requirements

> EXEC-049 audit note: Manual input, MGO, and FX schema are finalized with evidence paths. Auto Scrape is intentionally labelled as stub/pending integration until real source integration exists.

### FR-MKT-001: Price Cards (10 Index) (Status: Done)
**Priority:** High

10 kartu harga per index batubara:

| Card | Base Index | Color |
|------|-----------|-------|
| ICI 1 (6500) | ici_1 | `#ef4444` |
| ICI 2 (5800) | ici_2 | `#f59e0b` |
| ICI 3 (5000) | ici_3 | `#3b82f6` |
| ICI 4 (4200) | ici_4 | `#8b5cf6` |
| ICI 5 (3400) | ici_5 | `#6366f1` |
| Newcastle | newcastle | `#ec4899` |
| HBA | hba | `#10b981` |
| HBA I (5300) | hba_1 | `#14b8a6` |
| HBA II (4100) | hba_2 | `#06b6d4` |
| HBA III (3400) | hba_3 | `#0ea5e9` |

Per card: nama index, harga USD (bold, colored), delta (↑ hijau / ↓ merah)

**AC-MKT-001**: Delta dihitung dari selisih entry terbaru vs sebelumnya

### FR-MKT-002: Standard Index Calculator (Status: Done)
**Priority:** High

Calculator menentukan buying/selling price berdasarkan index real-time.

| Input | Type | Detail |
|-------|------|--------|
| Base Index | Dropdown | ICI 1-5, Newcastle, HBA, HBA I-III (dengan harga terbaru) |
| Premium/Discount | Number | USD adjustment (+ = premium, - = discount) |

**Output:** `Final Price = BaseIndex + Adjustment`

**AC-MKT-002**: Kalkulasi real-time saat input berubah

### FR-MKT-003: HPB Estimation Calculator (Status: Done)
**Priority:** High

Estimasi Harga Patokan Batubara berdasarkan spec aktual.

| Input | Default | |
|-------|---------|---|
| GAR | 4200 | |
| TM (%) | 35 | |
| TS (%) | 0.2 | |
| ASH (%) | 8 | |

**Algoritma:**
1. Pilih tier HBA terdekat berdasarkan GAR: HBA (6322), HBA I (5300), HBA II (4100), HBA III (3400)
2. Base price = `(GAR / closestTier.GAR) × closestTier.HBA`
3. TM adjustment: `(tmDiff × -0.01) × basePrice`
4. ASH adjustment: `(ashDiff × -0.005) × basePrice`
5. TS adjustment: `(tsDiff × 10 × -0.01) × basePrice`
6. Final HPB = `max(0, basePrice + tmAdj + ashAdj + tsAdj)`

**AC-MKT-003**: HPB calculator menampilkan breakdown per adjustment

### FR-MKT-004: Market vs Sales/Purchase Comparison (Status: Done)
**Priority:** High

Perbandingan harga pasar vs harga deal aktual.

| Source Data | Type |
|-------------|------|
| Deals (sales-monitor) | "Sales" |
| Shipments | "Purchase" / "Shipment Sale" |
| Sources | "Supplier FOB" |
| PL Forecasts | "PL Sell" / "PL Buy" |

**Comparison Table Columns:** Type, Name, Qty, Price, Spread (Price - SelectedMarketIndex), Note

Sorted by absolute spread terbesar, max 20 rows.

**AC-MKT-004**: Spread positif (sell) = hijau, spread negatif = merah

### FR-MKT-005: Price Trend Chart (Status: Done)
**Priority:** Medium

Recharts ComposedChart: 6 line (ICI 1-5, Newcastle) + 1 bar (HBA)
Range Selector: `2 Minggu | 4 Minggu | Semua`

**AC-MKT-005**: Chart responsive terhadap range selector

### FR-MKT-006: Manual Price Input (Status: Done - fixed in EXEC-049)
**Priority:** High

Form input 12 field number (ICI 1-5, Newcastle, HBA, HBA I-III, MGO, USD/IDR). Save via `addMarketPrice()` dengan source default = "Manual".

- `BR-MKT-001`: Hanya user dengan permission `market_price_edit` bisa input
- `BR-MKT-002`: Update per hari menyimpan history (append, no overwrite)

**AC-MKT-006**: Setelah save, price cards dan chart auto-update

### FR-MKT-007: Price History (Status: Done)
**Priority:** Medium

Riwayat update per entry (expandable). Per entry: waktu, user/auto, source (Manual/Argus/GlobalCoal), action, harga per index.

### FR-MKT-008: Auto Scraping (Groq AI) (Status: Done — stub endpoint exists, Groq key needed)
**Priority:** Medium

EXEC-049 status note: this requirement is Partial. The UI and endpoint are deliberately labelled as `Auto Scrape stub/pending integration`; real source/Groq integration is not complete.

Scraping Settings Modal:
- Global status indicator (pulse green)
- Interval: 3s (test), 1min, 5min, 1h, **6h (default)**, 12h, Daily
- Target Sources: GlobalCoal API, Argus Media, McCloskey, ICE Futures (checkbox)
- Manual Fetch Logs (terminal-like, mono font)
- "Fetch Now" button → POST `/api/market-scrape`

**AC-MKT-007**: Scraping settings hanya accessible oleh authorized role

---

### FR-MKT-009: MGO Price Tracking (Status: Done — /api/market-price/fx-rate returns mgoUsd; DB column added EXEC-033)
**Priority:** Medium

EXEC-049 status note: MGO is now represented by Prisma field `mgoUsd`, migration `20260724170000_market_price_manual_input`, input form, latest API, cards, history, chart payload, and FX/MGO endpoint.

Marine Gas Oil (MGO) price digunakan sebagai referensi biaya bunkering vessel dalam kalkulasi freight dan P&L.

| Komponen | Deskripsi |
|----------|-----------|
| MGO Card | Kartu harga terpisah di halaman Market Price |
| Unit | USD/MT |
| Delta | Perubahan vs entry sebelumnya (↑ hijau / ↓ merah) |
| Source | Manual input (auto-scraping opsional) |

**Business Rules:**
- `BR-MKT-003`: MGO price otomatis muncul sebagai referensi di Transshipment/Freight module
- `BR-MKT-004`: MGO history disimpan per entry (append, no overwrite)

**AC-MKT-008**: MGO card tampil bersama index batubara di halaman Market Price
**AC-MKT-009**: MGO value tersedia di dropdown referensi di Freight Cost module

---

### FR-MKT-010: FX Rate (Kurs USD/IDR) (Status: Done — /api/market-price/fx-rate returns usdIdr)
**Priority:** High

EXEC-049 status note: FX is now represented by Prisma field `usdIdr`, migration `20260724170000_market_price_manual_input`, input form, latest API, cards, history, chart payload, and FX/MGO endpoint.

Tracking kurs tukar USD/IDR harian. Digunakan untuk konversi otomatis di modul Payment dan P&L.

| Komponen | Deskripsi |
|----------|-----------|
| FX Rate Card | Kartu kurs di halaman Market Price |
| Unit | IDR per USD |
| Delta | Perubahan vs hari sebelumnya |
| Source | Manual input / BI Rate reference |
| History | Disimpan per hari (append) |

**Business Rules:**
- `BR-MKT-005`: Kurs terbaru otomatis digunakan di Outstanding Payment saat konversi USD → IDR
- `BR-MKT-006`: Kurs terbaru otomatis digunakan di P&L untuk konversi cost/revenue
- `BR-MKT-007`: Jika kurs hari ini belum diupdate (>24 jam), Dashboard menampilkan warning "Kurs belum diperbarui"
- `BR-MKT-008`: Hanya user dengan permission `market_price_edit` bisa input kurs

**AC-MKT-010**: Kurs terbaru tampil di header/widget yang relevan di modul Payment dan P&L
**AC-MKT-011**: History kurs bisa dilihat di tab riwayat Market Price

---

### FR-MKT-011: Price Warning ke Sales & P&L (Status: Done — /api/market-price/warnings returns deals below market threshold)
**Priority:** High

Sistem secara otomatis mendeteksi deviasi harga deal terhadap market dan menampilkan peringatan.

**Warning Triggers:**

| Kondisi | Threshold | Target Warning |
|---------|-----------|----------------|
| Harga deal aktif turun >5% dari market index terkait | >5% di bawah market | Sales Monitor + Dashboard Blocker |
| Harga deal >10% di atas market (potensi sulit deal) | >10% di atas market | Sales Monitor (info, bukan block) |
| Market price belum diupdate >2 hari kerja | Stale data | Dashboard + Market Price page |
| Kurs belum diupdate >1 hari kerja | Stale data | Dashboard + Market Price page |

**Business Rules:**
- `BR-MKT-009`: Warning dihitung otomatis saat market price diupdate — tidak perlu trigger manual
- `BR-MKT-010`: Warning ditampilkan di Deal Detail Modal (Sales Monitor) sebagai banner kuning/merah
- `BR-MKT-011`: Warning ditampilkan di Dashboard Blocker sebagai kategori "Market" (jika lebih dari 3 deal terdampak)
- `BR-MKT-012`: P&L module menampilkan kolom "Market Deviation" per shipment (actual sell price vs market at BL date)

**AC-MKT-012**: Warning banner otomatis muncul di Deal Detail tanpa action user
**AC-MKT-013**: User dapat dismiss warning per deal (warning disimpan dismissed_at)
**AC-MKT-014**: Dashboard Blocker kategori Market menampilkan jumlah deal yang terdampak

---

## 3. Data Model

### Entity: MarketPrice

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| id | UUID | Yes | Primary key |
| date | Date | Yes | Tanggal entry |
| ici_1 | Decimal | Optional | ICI 1 (6500 GAR) |
| ici_2 | Decimal | Optional | ICI 2 (5800 GAR) |
| ici_3 | Decimal | Optional | ICI 3 (5000 GAR) |
| ici_4 | Decimal | Optional | ICI 4 (4200 GAR) |
| ici_5 | Decimal | Optional | ICI 5 (3400 GAR) |
| newcastle | Decimal | Optional | Newcastle (NEWC) |
| hba | Decimal | Optional | HBA (6322 GAR) |
| hba_1 | Decimal | Optional | HBA I (5300 GAR) |
| hba_2 | Decimal | Optional | HBA II (4100 GAR) |
| hba_3 | Decimal | Optional | HBA III (3400 GAR) |
| mgo | Decimal | Optional | Marine Gas Oil (USD/MT) |
| usdIdr | Decimal | Optional | Kurs USD/IDR (IDR per 1 USD) |
| source | String | Yes | Manual / Argus / GlobalCoal |
| updatedBy | FK (User) | Yes | User yang update |
| action | Enum | Yes | manual / auto_scrape |
| createdAt | DateTime | Yes | Auto |

---

## 4. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/market-price` | List market prices (paginated) |
| GET | `/api/market-price/latest` | Latest entry (termasuk MGO dan kurs) |
| POST | `/api/market-price` | Add new price entry |
| POST | `/api/market-scrape` | Trigger AI scraping |
| GET | `/api/market-price/chart` | Chart data (filtered by range) |
| GET | `/api/market-price/fx-rate` | Latest FX rate (kurs USD/IDR) |
| GET | `/api/market-price/warnings` | Active price warnings per deal |

---

## 5. Role & Permission

| Action | CEO | C-Level | Trader | Admin Mkt | Others |
|--------|-----|---------|--------|-----------|--------|
| View prices | ✅ | ✅ | ✅ | ✅ | ✅ |
| Input price | ❌ | ❌ | ❌ | ✅ | ❌ |
| Scraping settings | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 6. Integration Points

| Modul | Hubungan |
|-------|----------|
| Dashboard | Market mini widget; Price Warning di Blocker jika banyak deal terdampak |
| Shipment Monitor | Harga referensi pricing per BL Date |
| Sales Monitor | Price Warning otomatis ke deal aktif; harga referensi |
| Forecast Sales | Market/historical reference untuk rough P&L |
| P&L | Market Deviation kolom (actual vs market at BL date); FX rate untuk konversi |
| Sources | FOB Barge Price comparison |
| Outstanding Payment | FX rate (kurs) untuk konversi USD ↔ IDR |
| Transshipment/Freight | MGO price sebagai referensi biaya bunkering |

---

*End of SRS_04_Market_Price — v2.1*
